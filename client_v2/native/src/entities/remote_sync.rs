use super::components::{
    AnimState, DinoGroundShadow, DinoModelHolder, DinoSlopePivot, DinoVisual, LocalPlayer,
    RemotePlayer,
};
use super::player_movement::{spawn_dino_rig, DinoSharedAssets};
use crate::core::config::GameConfig;
use crate::core::math_terrain::{calc_growth_visual_scale, get_entity_ground_height};
use crate::core::states::RuntimeSettings;
use crate::network::sync::WorldNetState;
use bevy::prelude::*;
use std::collections::HashMap;

#[derive(Resource, Default)]
pub struct RemoteEntityRegistry {
    /// network_id -> (root_entity, species_id)
    pub entries: HashMap<String, (Entity, String)>,
}

#[allow(clippy::too_many_arguments)]
pub fn sync_remote_entities(
    mut commands: Commands,
    time: Res<Time>,
    cfg: Res<GameConfig>,
    mut net: ResMut<WorldNetState>,
    settings: Res<RuntimeSettings>,
    asset_server: Res<AssetServer>,
    shared_assets: Res<DinoSharedAssets>,
    mut registry: ResMut<RemoteEntityRegistry>,
    mut remote_q: Query<
        (&mut Transform, &mut Visibility, &mut DinoVisual, &mut RemotePlayer),
        (Without<LocalPlayer>, Without<DinoSlopePivot>, Without<DinoModelHolder>, Without<DinoGroundShadow>),
    >,
    mut slope_q: Query<
        &mut Transform,
        (With<DinoSlopePivot>, Without<RemotePlayer>, Without<LocalPlayer>, Without<DinoModelHolder>, Without<DinoGroundShadow>),
    >,
    mut holder_q: Query<
        (&mut Transform, &DinoModelHolder),
        (Without<RemotePlayer>, Without<LocalPlayer>, Without<DinoSlopePivot>, Without<DinoGroundShadow>),
    >,
    mut shadow_q: Query<
        &mut Transform,
        (With<DinoGroundShadow>, Without<RemotePlayer>, Without<LocalPlayer>, Without<DinoSlopePivot>, Without<DinoModelHolder>),
    >,
) {
    let dt = time.delta_secs().min(0.1);

    if net.players_dirty {
        net.players_dirty = false;
        let my_id = net.my_id.as_deref();

        // 1. Gỡ các entity đã rời phòng hoặc đổi loài
        let stale_ids: Vec<String> = registry
            .entries
            .iter()
            .filter(|(id, (_, model))| {
                if Some(id.as_str()) == my_id {
                    return true;
                }
                match net.players.get(*id) {
                    None => true,
                    Some(p) => !p.model.eq_ignore_ascii_case(model),
                }
            })
            .map(|(id, _)| id.clone())
            .collect();

        for id in stale_ids {
            if let Some((entity, _)) = registry.entries.remove(&id) {
                commands.entity(entity).despawn_recursive();
            }
        }

        // 2. Spawn các người chơi khác & AI Bot mới xuất hiện
        for (id, p) in &net.players {
            if Some(id.as_str()) == my_id || registry.entries.contains_key(id) {
                continue;
            }
            let y = get_entity_ground_height(p.x, p.z, &cfg.world) as f32;
            let growth = if p.growth > 0.0 { p.growth as f32 } else { 0.9 };
            let (root, visual) = spawn_dino_rig(
                &mut commands,
                &cfg,
                &asset_server,
                &shared_assets,
                &p.model,
                Vec3::new(p.x as f32, y, p.z as f32),
                p.rot as f32,
                growth,
            );
            commands.entity(root).insert((
                visual,
                RemotePlayer {
                    network_id: id.clone(),
                    was_culled: false,
                },
            ));
            registry.entries.insert(id.clone(), (root, p.model.clone()));
        }
    }

    // 3. Nội suy chuyển động + Distance Culling (> 150m, đồng đội > 280m)
    let my_pack = net.local_player().map(|p| p.pack_id.as_str()).unwrap_or("");
    let me_xz = Vec2::new(net.local_pos.x, net.local_pos.z);

    for (mut root_tf, mut vis, mut visual, mut remote) in &mut remote_q {
        let Some(p) = net.players.get(&remote.network_id) else {
            continue;
        };

        let target_xz = Vec2::new(p.x as f32, p.z as f32);
        let dist_sq = target_xz.distance_squared(me_xz);
        let is_packmate = !p.is_ai && !my_pack.is_empty() && p.pack_id == my_pack;
        let cull_dist = if is_packmate { 280.0 } else { 150.0 };

        if dist_sq > cull_dist * cull_dist {
            if *vis != Visibility::Hidden {
                *vis = Visibility::Hidden;
            }
            remote.was_culled = true;
            continue;
        }
        if *vis != Visibility::Visible {
            *vis = Visibility::Visible;
        }

        let (nx, nz) = if remote.was_culled {
            remote.was_culled = false;
            (p.x as f32, p.z as f32)
        } else {
            let t = (dt * 12.0).min(1.0);
            (
                root_tf.translation.x + (p.x as f32 - root_tf.translation.x) * t,
                root_tf.translation.z + (p.z as f32 - root_tf.translation.z) * t,
            )
        };
        let ny = get_entity_ground_height(nx as f64, nz as f64, &cfg.world) as f32;
        root_tf.translation = Vec3::new(nx, ny, nz);

        let target_rot = Quat::from_rotation_y(p.rot as f32);
        root_tf.rotation = root_tf.rotation.slerp(target_rot, (dt * 10.0).min(1.0));

        let growth = if p.growth > 0.0 { p.growth as f32 } else { 0.9 };
        visual.growth = growth;
        let visual_mult = calc_growth_visual_scale(growth) * settings.dino_scale_multiplier;

        visual.rest_blend +=
            ((if p.is_resting { 1.0 } else { 0.0 }) - visual.rest_blend) * (dt * 7.0).min(1.0);
        visual.crouch_blend += ((if !p.is_resting && p.is_crouching { 1.0 } else { 0.0 })
            - visual.crouch_blend)
            * (dt * 9.0).min(1.0);

        if dist_sq < 95.0 * 95.0 {
            if let Ok(mut slope_tf) = slope_q.get_mut(visual.slope_entity) {
                let target_slope =
                    Quat::from_rotation_x(visual.crouch_blend * 0.09 + visual.rest_blend * 0.05);
                slope_tf.rotation = slope_tf.rotation.slerp(target_slope, (dt * 10.0).min(1.0));
            }
        }

        let extra_yaw = settings
            .model_yaw_offsets
            .get(&visual.species_id.to_lowercase())
            .copied()
            .unwrap_or(0.0);
        let scale_y_mult = 1.0 - visual.rest_blend * 0.24 - visual.crouch_blend * 0.12;
        let drop_y = (visual.rest_blend * 0.36 + visual.crouch_blend * 0.16) * visual_mult;

        if let Ok((mut h_tf, holder)) = holder_q.get_mut(visual.holder_entity) {
            let s = holder.base_scale * visual_mult;
            h_tf.scale = Vec3::new(s, s * scale_y_mult, s);
            h_tf.translation.y = holder.base_offset_y * visual_mult * scale_y_mult - drop_y;
            h_tf.rotation = Quat::from_rotation_y(holder.explicit_yaw + extra_yaw);
        }

        if let Ok(mut sh_tf) = shadow_q.get_mut(visual.shadow_entity) {
            if (sh_tf.scale.x - visual_mult).abs() > 0.002 {
                sh_tf.scale = Vec3::new(visual_mult, visual_mult, 1.0);
            }
        }

        visual.desired_anim = if p.is_resting {
            AnimState::Rest
        } else {
            AnimState::from_str_name(&p.anim)
        };
        visual.anim_speed = if p.is_resting { 0.4 } else { 1.0 };
    }
}
