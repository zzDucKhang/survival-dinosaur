use super::components::{AnimState, DinoModelHolder, DinoVisual};
use crate::core::config::GameConfig;
use bevy::gltf::Gltf;
use bevy::prelude::*;
use bevy::render::primitives::Aabb;
use std::collections::HashMap;
use std::time::Duration;

pub struct SpeciesAnimRig {
    pub graph: Handle<AnimationGraph>,
    pub nodes: HashMap<AnimState, AnimationNodeIndex>,
}

#[derive(Resource, Default)]
pub struct DinoAnimationRegistry {
    pub gltf_handles: HashMap<String, Handle<Gltf>>,
    pub rigs: HashMap<String, SpeciesAnimRig>,
}

pub fn preload_species_gltfs(
    cfg: Res<GameConfig>,
    asset_server: Res<AssetServer>,
    mut registry: ResMut<DinoAnimationRegistry>,
) {
    for (id, spec) in &cfg.species {
        let handle: Handle<Gltf> = asset_server.load(spec.gltf_path());
        registry.gltf_handles.insert(id.clone(), handle);
    }
}

/// Dựng sẵn 1 AnimationGraph dùng chung cho mỗi loài ngay khi file .glb tải xong.
pub fn build_species_anim_graphs(
    gltf_assets: Res<Assets<Gltf>>,
    mut graphs: ResMut<Assets<AnimationGraph>>,
    mut registry: ResMut<DinoAnimationRegistry>,
) {
    let pending: Vec<(String, Handle<Gltf>)> = registry
        .gltf_handles
        .iter()
        .filter(|(id, _)| !registry.rigs.contains_key(*id))
        .map(|(id, h)| (id.clone(), h.clone()))
        .collect();

    for (species_id, handle) in pending {
        let Some(gltf) = gltf_assets.get(&handle) else {
            continue;
        };

        let mut graph = AnimationGraph::new();
        let mut nodes = HashMap::new();

        if !gltf.animations.is_empty() {
            let mut named: Vec<(String, Handle<AnimationClip>)> = gltf
                .named_animations
                .iter()
                .map(|(k, v)| (k.to_lowercase(), v.clone()))
                .collect();
            named.sort_by(|a, b| a.0.cmp(&b.0));

            let fallback_first = gltf.animations[0].clone();
            let fallback_second = gltf
                .animations
                .get(1)
                .cloned()
                .unwrap_or_else(|| fallback_first.clone());

            let all_states = [
                AnimState::Idle,
                AnimState::Walk,
                AnimState::Run,
                AnimState::Bite,
                AnimState::Roar,
                AnimState::Tail,
                AnimState::Rest,
            ];

            for st in all_states {
                let clip = match_clip_for_state(st, &named, &fallback_first, &fallback_second);
                let idx = graph.add_clip(clip, 1.0, graph.root);
                nodes.insert(st, idx);
            }
        }

        let graph_handle = graphs.add(graph);
        registry.rigs.insert(
            species_id,
            SpeciesAnimRig {
                graph: graph_handle,
                nodes,
            },
        );
    }
}

fn is_excluded_anim_name(name: &str) -> bool {
    const EXCLUDED: &[&str] = &[
        "human", "death", "die", "dead", "fall", "wounded", "hit", "stun", "shake", "sneeze",
        "climb",
    ];
    EXCLUDED.iter().any(|bad| name.contains(bad))
}

fn match_clip_for_state(
    state: AnimState,
    named: &[(String, Handle<AnimationClip>)],
    fallback_first: &Handle<AnimationClip>,
    fallback_second: &Handle<AnimationClip>,
) -> Handle<AnimationClip> {
    let exact_names: &[&str] = match state {
        AnimState::Idle => &["idle", "idle2", "idle investigate"],
        AnimState::Walk => &["walk", "walk loop", "slowwalk", "walk slow loop"],
        AnimState::Run => &["run", "sprint loop", "run head loop"],
        AnimState::Bite => &["bite", "attack", "chase bite", "sideswipe"],
        AnimState::Roar => &["roar", "bellow", "attack2"],
        AnimState::Tail => &["attack_tail", "tailwhip", "bite 90 left", "attack3"],
        AnimState::Rest => &["sleep", "rest", "idle", "idle2"],
    };

    for exact in exact_names {
        if let Some((_, clip)) = named.iter().find(|(n, _)| n == exact) {
            return clip.clone();
        }
    }

    let keywords: &[&str] = match state {
        AnimState::Idle => &["idle", "stand", "wait", "breathe", "look forward", "rest"],
        AnimState::Walk => &["walk", "trot", "step", "move", "locomotion"],
        AnimState::Run => &["sprint", "run", "gallop", "chase", "walk"],
        AnimState::Bite => &["bite", "attack", "horn", "headbutt", "chomp", "strike", "eat"],
        AnimState::Roar => &["roar", "bellow", "screech", "call", "scream", "alert"],
        AnimState::Tail => &["tail", "whip", "swipe", "stomp", "attack2", "attack"],
        AnimState::Rest => &["sleep", "rest", "sit", "lie", "crouch", "idle", "stand"],
    };

    // Ưu tiên tên hợp lệ không dính các clip tử vong/lắc/con người/stop
    for kw in keywords {
        if let Some((_, clip)) = named.iter().find(|(n, _)| {
            n.contains(kw)
                && !is_excluded_anim_name(n)
                && !matches!(state, AnimState::Walk | AnimState::Run if n.contains("stop") || n.contains("back") || n.contains("bite") || n.contains("butt"))
                && !matches!(state, AnimState::Idle | AnimState::Rest if n.contains("attack") || n.contains("alert"))
        }) {
            return clip.clone();
        }
    }

    if let Some((_, clip)) = named.iter().find(|(n, _)| !is_excluded_anim_name(n)) {
        return clip.clone();
    }

    match state {
        AnimState::Walk | AnimState::Run => fallback_second.clone(),
        _ => fallback_first.clone(),
    }
}

/// Gắn AnimationGraphHandle + AnimationTransitions vào AnimationPlayer con và chuyển clip mượt.
pub fn drive_dino_animations(
    mut commands: Commands,
    registry: Res<DinoAnimationRegistry>,
    children_q: Query<&Children>,
    dinos_q: Query<(&DinoVisual, Option<&Visibility>)>,
    mut holders_q: Query<(Entity, &mut DinoModelHolder)>,
    mut players_q: Query<(&mut AnimationPlayer, Option<&mut AnimationTransitions>)>,
) {
    // 1. Gắn rig vào các model vừa spawn xong SceneInstance
    for (holder_entity, mut holder) in &mut holders_q {
        if holder.anim_attached {
            continue;
        }
        let Some(rig) = registry.rigs.get(&holder.species_id) else {
            continue;
        };

        let mut found_player = None;
        for desc in children_q.iter_descendants(holder_entity) {
            if players_q.get(desc).is_ok() {
                found_player = Some(desc);
                break;
            }
        }

        if let Some(player_entity) = found_player {
            commands.entity(player_entity).insert((
                AnimationGraphHandle(rig.graph.clone()),
                AnimationTransitions::new(),
            ));
            holder.anim_player_entity = Some(player_entity);
            holder.anim_attached = true;
        }
    }

    // 2. Điều khiển chuyển clip theo DinoVisual.desired_anim (đóng băng tốc độ khi bị distance-cull)
    for (dino, vis_opt) in &dinos_q {
        let Ok((_, mut holder)) = holders_q.get_mut(dino.holder_entity) else {
            continue;
        };
        let Some(player_entity) = holder.anim_player_entity else {
            continue;
        };
        let Some(rig) = registry.rigs.get(&holder.species_id) else {
            continue;
        };
        let Some(&node_idx) = rig.nodes.get(&dino.desired_anim) else {
            continue;
        };
        let Ok((mut player, Some(mut transitions))) = players_q.get_mut(player_entity) else {
            continue;
        };

        let is_hidden = matches!(vis_opt, Some(Visibility::Hidden));

        if holder.active_anim != Some(dino.desired_anim) && !is_hidden {
            holder.active_anim = Some(dino.desired_anim);
            let active = transitions.play(&mut player, node_idx, Duration::from_millis(140));
            if dino.desired_anim.is_one_shot() {
                active.set_speed(dino.anim_speed);
            } else {
                active.repeat().set_speed(dino.anim_speed);
            }
        } else if let Some(active) = player.animation_mut(node_idx) {
            if is_hidden {
                if !active.is_paused() {
                    active.pause();
                }
            } else {
                if active.is_paused() {
                    active.resume();
                }
                if (active.speed() - dino.anim_speed).abs() > 0.001 {
                    active.set_speed(dino.anim_speed);
                }
            }
        }
    }
}

/// Tự động đo kích thước AABB thực tế của model GLB để chuẩn hóa đúng `target_size` và đặt chân chạm Y=0.
pub fn calibrate_dino_models(
    children_q: Query<&Children>,
    aabb_q: Query<(&GlobalTransform, &Aabb)>,
    mut holders_q: Query<(Entity, &GlobalTransform, &mut DinoModelHolder)>,
) {
    for (holder_entity, holder_gtf, mut holder) in &mut holders_q {
        if holder.calibrated {
            continue;
        }
        // Chờ SceneInstance tải xong và sinh entity con trước khi đếm frame
        if children_q.get(holder_entity).is_err() {
            continue;
        }
        holder.calibrate_frames = holder.calibrate_frames.saturating_add(1);
        if holder.calibrate_frames < 3 {
            continue;
        }

        let holder_inv = holder_gtf.affine().inverse();
        let mut min_pt = Vec3::splat(f32::INFINITY);
        let mut max_pt = Vec3::splat(f32::NEG_INFINITY);
        let mut mesh_count = 0usize;

        for desc in children_q.iter_descendants(holder_entity) {
            let Ok((child_gtf, aabb)) = aabb_q.get(desc) else {
                continue;
            };
            let rel = holder_inv * child_gtf.affine();
            let lo = Vec3::from(aabb.min());
            let hi = Vec3::from(aabb.max());

            let corners = [
                Vec3::new(lo.x, lo.y, lo.z),
                Vec3::new(hi.x, lo.y, lo.z),
                Vec3::new(lo.x, hi.y, lo.z),
                Vec3::new(hi.x, hi.y, lo.z),
                Vec3::new(lo.x, lo.y, hi.z),
                Vec3::new(hi.x, lo.y, hi.z),
                Vec3::new(lo.x, hi.y, hi.z),
                Vec3::new(hi.x, hi.y, hi.z),
            ];

            for c in corners {
                let p = rel.transform_point3(c);
                if p.is_finite() {
                    min_pt = min_pt.min(p);
                    max_pt = max_pt.max(p);
                }
            }
            mesh_count += 1;
        }

        if mesh_count == 0 {
            if holder.calibrate_frames >= 120 {
                holder.calibrated = true;
            }
            continue;
        }

        let size = max_pt - min_pt;
        let max_dim = size.x.max(size.y).max(size.z);
        if max_dim.is_finite() && max_dim > 0.05 {
            let scale = (holder.target_size / max_dim).clamp(0.005, 50.0);
            holder.base_scale = scale;
            holder.base_offset_y = if min_pt.y.is_finite() {
                -min_pt.y * scale
            } else {
                0.0
            };
            holder.calibrated = true;
        }
    }
}