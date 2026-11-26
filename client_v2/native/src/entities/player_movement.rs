use super::components::{
    AnimState, DinoGroundShadow, DinoModelHolder, DinoSlopePivot, DinoVisual, LocalInputState,
    LocalPlayer, OrbitCameraState,
};
use crate::core::config::GameConfig;
use crate::core::math_terrain::{
    calc_growth_visual_scale, get_entity_ground_height, get_terrain_slope, is_near_water,
    WorldObstacles,
};
use crate::core::states::RuntimeSettings;
use crate::network::bridge::NetworkBridge;
use crate::network::sync::WorldNetState;
use bevy::pbr::NotShadowCaster;
use bevy::prelude::*;
use std::f32::consts::FRAC_PI_2;

pub fn spawn_dino_rig(
    commands: &mut Commands,
    cfg: &GameConfig,
    asset_server: &AssetServer,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    species_id: &str,
    spawn_pos: Vec3,
    yaw: f32,
    growth: f32,
) -> (Entity, DinoVisual) {
    let spec = cfg.get_species(species_id);
    let scene_handle: Handle<Scene> = asset_server.load(spec.asset_path());

    let shadow_mesh = meshes.add(Circle::new(1.35));
    let shadow_mat = materials.add(StandardMaterial {
        base_color: Color::srgba(0.0, 0.0, 0.0, 0.34),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });

    let holder_entity = commands
        .spawn((
            Name::new(format!("DinoHolder_{}", spec.id)),
            DinoModelHolder {
                species_id: spec.id.clone(),
                target_size: spec.client.target_size,
                explicit_yaw: spec.client.rotation_offset,
                base_scale: 1.0,
                base_offset_y: 0.0,
                calibrated: false,
                calibrate_frames: 0,
                anim_attached: false,
                active_anim: None,
                anim_player_entity: None,
            },
            SceneRoot(scene_handle),
            Transform::from_rotation(Quat::from_rotation_y(spec.client.rotation_offset)),
        ))
        .id();

    let shadow_entity = commands
        .spawn((
            Name::new("DinoShadow"),
            DinoGroundShadow,
            Mesh3d(shadow_mesh),
            MeshMaterial3d(shadow_mat),
            Transform::from_xyz(0.0, 0.06, 0.0).with_rotation(Quat::from_rotation_x(-FRAC_PI_2)),
            NotShadowCaster,
        ))
        .id();

    let slope_entity = commands
        .spawn((Name::new("DinoSlope"), DinoSlopePivot, Transform::IDENTITY))
        .add_children(&[holder_entity, shadow_entity])
        .id();

    let root_entity = commands
        .spawn((
            Name::new(format!("DinoRoot_{}", spec.id)),
            Transform::from_translation(spawn_pos).with_rotation(Quat::from_rotation_y(yaw)),
            Visibility::Visible,
        ))
        .add_child(slope_entity)
        .id();

    let visual = DinoVisual {
        species_id: spec.id.clone(),
        growth,
        rest_blend: 0.0,
        crouch_blend: 0.0,
        desired_anim: AnimState::Idle,
        one_shot_left: 0.0,
        anim_speed: 1.0,
        slope_entity,
        holder_entity,
        shadow_entity,
    };

    (root_entity, visual)
}

pub fn spawn_local_player(
    mut commands: Commands,
    cfg: Res<GameConfig>,
    asset_server: Res<AssetServer>,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    mut net: ResMut<WorldNetState>,
    mut cam_state: ResMut<OrbitCameraState>,
) {
    let spec = cfg.get_species(&net.my_model);
    let y = get_entity_ground_height(0.0, 0.0, &cfg.world) as f32;
    let spawn_pos = Vec3::new(0.0, y, 0.0);
    net.local_pos = spawn_pos;
    net.local_rot = 0.0;
    net.local_stamina = 100.0;
    cam_state.zoom_dist = spec.client.cam_distance;

    let (root, visual) = spawn_dino_rig(
        &mut commands,
        &cfg,
        &asset_server,
        &mut meshes,
        &mut materials,
        &net.my_model,
        spawn_pos,
        0.0,
        0.45,
    );

    commands.entity(root).insert((
        visual,
        LocalPlayer {
            move_sync_accum: 0.0,
            hint_check_accum: 0.0,
        },
    ));
}

pub fn despawn_local_player(
    mut commands: Commands,
    q: Query<Entity, With<LocalPlayer>>,
) {
    for entity in &q {
        commands.entity(entity).despawn_recursive();
    }
}

#[allow(clippy::too_many_arguments)]
pub fn update_local_player_movement(
    time: Res<Time>,
    cfg: Res<GameConfig>,
    obstacles: Res<WorldObstacles>,
    bridge: Res<NetworkBridge>,
    mut net: ResMut<WorldNetState>,
    mut settings: ResMut<RuntimeSettings>,
    mut input: ResMut<LocalInputState>,
    mut player_q: Query<(&mut Transform, &mut DinoVisual, &mut LocalPlayer)>,
    mut slope_q: Query<&mut Transform, (With<DinoSlopePivot>, Without<LocalPlayer>, Without<DinoModelHolder>, Without<DinoGroundShadow>)>,
    mut holder_q: Query<(&mut Transform, &DinoModelHolder), (Without<LocalPlayer>, Without<DinoSlopePivot>, Without<DinoGroundShadow>)>,
    mut shadow_q: Query<&mut Transform, (With<DinoGroundShadow>, Without<LocalPlayer>, Without<DinoSlopePivot>, Without<DinoModelHolder>)>,
) {
    let dt = time.delta_secs().min(0.1);
    if settings.scent_remaining_sec > 0.0 {
        settings.scent_remaining_sec = (settings.scent_remaining_sec - dt).max(0.0);
    }

    let Ok((mut root_tf, mut visual, mut local)) = player_q.get_single_mut() else {
        return;
    };

    let spec = cfg.get_species(&net.my_model);
    let me = net.local_player().cloned();

    // 1. Đồng bộ hồi sinh & hiệu ứng húc văng từ server
    if let Some(ref srv) = me {
        let srv_xz = Vec2::new(srv.x as f32, srv.z as f32);
        let cur_xz = Vec2::new(root_tf.translation.x, root_tf.translation.z);
        let dist = srv_xz.distance(cur_xz);
        let recently_hit = (time.elapsed_secs() - net.last_damaged_elapsed) < 0.5;

        if srv.respawn_seq > net.last_respawn_seq || dist > 26.0 {
            net.last_respawn_seq = srv.respawn_seq;
            let gy = get_entity_ground_height(srv.x, srv.z, &cfg.world) as f32;
            root_tf.translation = Vec3::new(srv.x as f32, gy, srv.z as f32);
        } else if recently_hit && dist > 4.2 {
            let t = (dt * 14.0).min(1.0);
            root_tf.translation.x += (srv.x as f32 - root_tf.translation.x) * t;
            root_tf.translation.z += (srv.z as f32 - root_tf.translation.z) * t;
        }
    }

    let growth = me.as_ref().map_or(0.45, |p| p.growth.max(0.3) as f32);
    let is_resting = me.as_ref().is_some_and(|p| p.is_resting);
    let rest_unlock_left = me.as_ref().map_or(0.0, |p| p.rest_unlock_left);
    let is_crouching = me.as_ref().is_some_and(|p| p.is_crouching);
    let has_bone_break = me.as_ref().is_some_and(|p| p.bone_break > 0.0);

    visual.growth = growth;
    let total_mult = calc_growth_visual_scale(growth) * settings.dino_scale_multiplier;

    // 2. Tính thể lực (Stamina) & Di chuyển
    let moving_fwd = !is_resting && input.forward && !input.backward;
    let moving_back = !is_resting && input.backward && !input.forward;
    let turn_left = !is_resting && input.left && !input.right;
    let turn_right = !is_resting && input.right && !input.left;
    let is_turning = turn_left || turn_right;
    let is_moving = moving_fwd || moving_back;

    let is_sprinting = !is_resting
        && !is_crouching
        && !has_bone_break
        && input.sprint
        && (moving_fwd || is_turning)
        && net.local_stamina > 5.0;

    let near_water = is_near_water(
        root_tf.translation.x as f64,
        root_tf.translation.z as f64,
        &cfg.world,
    );
    let regen_rate = if is_resting {
        38.0
    } else if near_water {
        26.0
    } else {
        14.0
    };
    if is_sprinting {
        net.local_stamina = (net.local_stamina - dt * 20.0).max(0.0);
    } else {
        net.local_stamina = (net.local_stamina + dt * regen_rate).min(100.0);
    }

    if !is_resting {
        let bone_mult = if has_bone_break { 0.45 } else { 1.0 };
        let turn_speed = spec.client.turn_speed * if has_bone_break { 0.70 } else { 1.0 };
        let turn_dir = if moving_back { -1.0 } else { 1.0 };
        if turn_left {
            net.local_rot += turn_speed * dt * turn_dir;
        }
        if turn_right {
            net.local_rot -= turn_speed * dt * turn_dir;
        }

        let fx = net.local_rot.sin();
        let fz = net.local_rot.cos();
        let agility = 1.15 - 0.14 * growth.min(1.25);
        let crouch_mult = if is_crouching { 0.55 } else { 1.0 };

        if moving_fwd {
            let spd = if is_sprinting {
                spec.client.sprint_speed
            } else {
                spec.client.walk_speed
            } * agility
                * crouch_mult
                * bone_mult;
            root_tf.translation.x += fx * spd * dt;
            root_tf.translation.z += fz * spd * dt;
        } else if moving_back {
            let spd = spec.client.back_speed * crouch_mult * bone_mult;
            root_tf.translation.x -= fx * spd * dt;
            root_tf.translation.z -= fz * spd * dt;
        } else if is_turning {
            let spd = if is_sprinting {
                spec.client.sprint_speed
            } else {
                spec.client.walk_speed
            } * 0.65
                * crouch_mult
                * bone_mult;
            root_tf.translation.x += fx * spd * dt;
            root_tf.translation.z += fz * spd * dt;
        }
    }

    // 3. Va chạm 140 tảng đá + bám sát mặt địa hình
    let my_radius = (1.45 * total_mult) as f64;
    let (rx, rz) = obstacles.resolve_collision(
        root_tf.translation.x as f64,
        root_tf.translation.z as f64,
        my_radius,
        cfg.world.island_limit,
    );
    let ry = get_entity_ground_height(rx, rz, &cfg.world);
    root_tf.translation = Vec3::new(rx as f32, ry as f32, rz as f32);
    root_tf.rotation = Quat::from_rotation_y(net.local_rot);
    net.local_pos = root_tf.translation;

    // 4. Tư thế nằm nghỉ / rón rén / nghiêng theo sườn dốc
    visual.rest_blend += ((if is_resting { 1.0 } else { 0.0 }) - visual.rest_blend) * (dt * 7.0).min(1.0);
    visual.crouch_blend += ((if !is_resting && is_crouching { 1.0 } else { 0.0 }) - visual.crouch_blend)
        * (dt * 9.0).min(1.0);

    let (slope_pitch, slope_roll) =
        get_terrain_slope(rx, rz, net.local_rot, (1.5 * total_mult).max(1.2) as f64, &cfg.world);
    if let Ok(mut slope_tf) = slope_q.get_mut(visual.slope_entity) {
        let target_rot = Quat::from_euler(
            EulerRot::XYZ,
            slope_pitch + visual.crouch_blend * 0.10 + visual.rest_blend * 0.06,
            0.0,
            slope_roll,
        );
        slope_tf.rotation = slope_tf.rotation.slerp(target_rot, (dt * 10.0).min(1.0));
    }

    let user_extra_yaw = settings
        .model_yaw_offsets
        .get(&spec.id.to_lowercase())
        .copied()
        .unwrap_or(0.0);
    let scale_y_mult = 1.0 - visual.rest_blend * 0.24 - visual.crouch_blend * 0.12;
    let drop_y = (visual.rest_blend * 0.36 + visual.crouch_blend * 0.16) * total_mult;

    if let Ok((mut h_tf, holder)) = holder_q.get_mut(visual.holder_entity) {
        let s = holder.base_scale * total_mult;
        h_tf.scale = Vec3::new(s, s * scale_y_mult, s);
        h_tf.translation.y = holder.base_offset_y * total_mult * scale_y_mult - drop_y;
        h_tf.rotation = Quat::from_rotation_y(holder.explicit_yaw + user_extra_yaw);
    }

    if let Ok(mut sh_tf) = shadow_q.get_mut(visual.shadow_entity) {
        let sh = total_mult * (1.0 + visual.rest_blend * 0.18);
        sh_tf.scale = Vec3::new(sh, sh, 1.0);
    }

    // 5. Chọn Animation (One-shot > Rest > Locomotion > Idle)
    if let Some((one_shot, dur)) = input.pending_one_shot.take() {
        if !is_resting {
            visual.desired_anim = one_shot;
            visual.one_shot_left = dur;
            visual.anim_speed = 1.0;
        }
    }
    if is_resting {
        visual.one_shot_left = 0.0;
        visual.desired_anim = AnimState::Rest;
        visual.anim_speed = 0.4;
    } else if visual.one_shot_left > 0.0 {
        visual.one_shot_left = (visual.one_shot_left - dt).max(0.0);
    } else {
        visual.desired_anim = if is_moving || is_turning {
            if is_sprinting {
                AnimState::Run
            } else {
                AnimState::Walk
            }
        } else {
            AnimState::Idle
        };
        visual.anim_speed = match visual.desired_anim {
            AnimState::Walk | AnimState::Run => {
                if has_bone_break {
                    0.52
                } else if is_crouching {
                    0.65
                } else if moving_back {
                    0.80
                } else if is_sprinting {
                    1.25
                } else {
                    1.0
                }
            }
            _ => 1.0,
        };
    }

    // 6. Gợi ý hành động (4Hz) đẩy sang HUD
    local.hint_check_accum += dt;
    if local.hint_check_accum >= 0.25 {
        local.hint_check_accum = 0.0;
        net.action_hint = if is_resting {
            if rest_unlock_left > 0.0 {
                Some(format!(
                    "💤 Đang nghỉ ngơi (+20 HP/s) — Mở khóa đứng dậy sau {:.1}s",
                    rest_unlock_left
                ))
            } else {
                Some("💤 Đang nghỉ ngơi (+20 HP/s) — Bấm [H] để đứng dậy".to_string())
            }
        } else if near_water {
            Some("💧 Bấm [G] để Uống nước (+Khát & Cầm máu)".to_string())
        } else {
            let desired_food = if spec.is_carnivore() { "meat" } else { "plant" };
            let near_food = net.foods.values().any(|f| {
                f.food_type == desired_food
                    && f.amount > 0
                    && ((f.x - rx).hypot(f.z - rz) < 8.0)
            });
            if near_food {
                if desired_food == "meat" {
                    Some("🥩 Bấm [G] để Ăn thịt (+Máu & +11% Trưởng thành)".to_string())
                } else {
                    Some("🌿 Bấm [G] để Ăn bụi quả (+Máu & +11% Trưởng thành)".to_string())
                }
            } else {
                None
            }
        };
    }

    // 7. Tự gỡ điểm ghim bản đồ khi đã tới gần (< 6m)
    if let Some(wp) = settings.map_waypoint {
        let d_sq = Vec2::new(root_tf.translation.x, root_tf.translation.z).distance_squared(wp);
        if d_sq < 36.0 {
            settings.map_waypoint = None;
        }
    }

    // 8. Đồng bộ vị trí lên Server Go đúng 20Hz (50ms)
    local.move_sync_accum += dt;
    if !is_resting && local.move_sync_accum >= 0.05 {
        local.move_sync_accum = 0.0;
        bridge.send_move(
            rx,
            ry,
            rz,
            net.local_rot as f64,
            visual.desired_anim.as_str(),
        );
    }
}