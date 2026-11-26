use super::components::{DinoVisual, LocalInputState, LocalPlayer, OrbitCameraState};
use crate::core::config::GameConfig;
use crate::core::math_terrain::{calc_growth_visual_scale, get_mesh_terrain_height};
use crate::core::states::{AppState, RuntimeSettings};
use crate::network::sync::WorldNetState;
use bevy::input::mouse::{MouseMotion, MouseWheel};
use bevy::pbr::{DistanceFog, FogFalloff};
use bevy::prelude::*;
use bevy::render::camera::Exposure;

#[derive(Component)]
pub struct MainCamera;

pub fn spawn_main_camera(mut commands: Commands) {
    commands.spawn((
        Name::new("MainCamera"),
        MainCamera,
        Camera3d::default(),
        Exposure::default(),
        DistanceFog {
            color: Color::srgb(0.45, 0.61, 0.70),
            falloff: FogFalloff::Linear {
                start: 115.0,
                end: 420.0,
            },
            ..default()
        },
        Transform::from_xyz(0.0, 26.0, -45.0).looking_at(Vec3::new(0.0, 2.0, 0.0), Vec3::Y),
    ));
}

#[allow(clippy::too_many_arguments)]
pub fn update_orbit_camera(
    time: Res<Time>,
    app_state: Res<State<AppState>>,
    cfg: Res<GameConfig>,
    net: Res<WorldNetState>,
    settings: Res<RuntimeSettings>,
    input: Res<LocalInputState>,
    mut cam_state: ResMut<OrbitCameraState>,
    mut mouse_motion: EventReader<MouseMotion>,
    mut mouse_wheel: EventReader<MouseWheel>,
    local_q: Query<(&Transform, &DinoVisual), (With<LocalPlayer>, Without<MainCamera>)>,
    mut cam_q: Query<&mut Transform, (With<MainCamera>, Without<LocalPlayer>)>,
) {
    let dt = time.delta_secs().min(0.1);
    let Ok(mut cam_tf) = cam_q.get_single_mut() else {
        return;
    };

    // Chế độ Lobby: Camera xoay toàn cảnh quanh bãi cỏ trung tâm & hồ Oasis
    if *app_state.get() == AppState::Lobby {
        mouse_motion.clear();
        mouse_wheel.clear();
        cam_state.lobby_angle += dt * 0.08;
        let r = 68.0;
        let cx = cam_state.lobby_angle.cos() * r;
        let cz = cam_state.lobby_angle.sin() * r;
        let cy = get_mesh_terrain_height(cx as f64, cz as f64, &cfg.world) as f32 + 24.0;
        *cam_tf = Transform::from_xyz(cx, cy, cz).looking_at(Vec3::new(15.0, 2.0, -15.0), Vec3::Y);
        return;
    }

    if !settings.input_blocked_by_ui {
        if input.right_mouse_held {
            let mut delta = Vec2::ZERO;
            for ev in mouse_motion.read() {
                delta += ev.delta;
            }
            const SENS: f32 = 0.0055;
            cam_state.yaw -= delta.x * SENS;
            cam_state.pitch = (cam_state.pitch + delta.y * SENS).clamp(-1.35, 1.32);
        } else {
            mouse_motion.clear();
        }

        for wheel in mouse_wheel.read() {
            cam_state.zoom_dist = (cam_state.zoom_dist - wheel.y * 1.1).clamp(4.0, 34.0);
        }
    } else {
        mouse_motion.clear();
        mouse_wheel.clear();
    }

    let Ok((player_tf, visual)) = local_q.get_single() else {
        return;
    };

    // Tự căn camera về sau lưng khi chạy thẳng và không giữ chuột phải
    let moving_fwd = input.forward && !input.backward && !input.left && !input.right;
    if moving_fwd && !input.right_mouse_held {
        let mut diff = (net.local_rot - cam_state.yaw) % std::f32::consts::TAU;
        if diff > std::f32::consts::PI {
            diff -= std::f32::consts::TAU;
        }
        if diff < -std::f32::consts::PI {
            diff += std::f32::consts::TAU;
        }
        cam_state.yaw += diff * (dt * 1.8).min(1.0);
    }

    let spec = cfg.get_species(&net.my_model);
    let total_mult = calc_growth_visual_scale(visual.growth) * settings.dino_scale_multiplier;
    let pivot_y =
        player_tf.translation.y + spec.client.look_at_y * total_mult * (1.0 - visual.rest_blend * 0.3) + 0.6;
    let dist = cam_state.zoom_dist * (0.70 + 0.35 * total_mult);
    let horiz = cam_state.pitch.cos() * dist;

    let cam_x = player_tf.translation.x - cam_state.yaw.sin() * horiz;
    let cam_z = player_tf.translation.z - cam_state.yaw.cos() * horiz;
    let desired_y = pivot_y + cam_state.pitch.sin() * dist;
    let min_y = get_mesh_terrain_height(cam_x as f64, cam_z as f64, &cfg.world) as f32 + 0.9;
    let actual_y = desired_y.max(min_y);
    let sky_tilt = (actual_y - desired_y).max(0.0);

    let target_pos = Vec3::new(cam_x, actual_y, cam_z);
    cam_tf.translation = cam_tf.translation.lerp(target_pos, (dt * 12.0).min(1.0));
    let look_at = Vec3::new(player_tf.translation.x, pivot_y + sky_tilt, player_tf.translation.z);
    cam_tf.look_at(look_at, Vec3::Y);
}