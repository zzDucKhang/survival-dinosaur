use super::components::{AnimState, LocalInputState, LocalPlayer};
use crate::core::config::GameConfig;
use crate::core::math_terrain::get_entity_ground_height;
use crate::core::states::{AppState, RuntimeSettings};
use crate::network::bridge::NetworkBridge;
use crate::network::sync::{HudSpecialRequestEvent, WorldNetState};
use bevy::prelude::*;
use std::f32::consts::FRAC_PI_2;

/// Cho phép nhấn Enter khi chưa mở React HUD để vào chơi thử nhanh trên bản Native.
pub fn handle_lobby_quick_join(
    keys: Res<ButtonInput<KeyCode>>,
    bridge: Res<NetworkBridge>,
    mut net: ResMut<WorldNetState>,
    mut next_state: ResMut<NextState<AppState>>,
) {
    if keys.just_pressed(KeyCode::Enter) {
        net.my_id = None;
        net.last_respawn_seq = 0;
        net.telemetry_dirty = true;
        bridge.send_join(&net.my_name, &net.my_model);
        next_state.set(AppState::InGame);
    }
}

#[allow(clippy::too_many_arguments)]
pub fn handle_player_input(
    keys: Res<ButtonInput<KeyCode>>,
    mouse: Res<ButtonInput<MouseButton>>,
    cfg: Res<GameConfig>,
    bridge: Res<NetworkBridge>,
    mut net: ResMut<WorldNetState>,
    mut settings: ResMut<RuntimeSettings>,
    mut input: ResMut<LocalInputState>,
    mut special_evts: EventReader<HudSpecialRequestEvent>,
    mut local_tf_q: Query<&mut Transform, With<LocalPlayer>>,
) {
    input.right_mouse_held = mouse.pressed(MouseButton::Right);

    if settings.input_blocked_by_ui {
        input.clear_movement();
        special_evts.clear();
        return;
    }

    let me = net.local_player().cloned();
    let is_resting = me.as_ref().is_some_and(|p| p.is_resting);
    let rest_unlock_left = me.as_ref().map_or(0.0, |p| p.rest_unlock_left);
    let is_crouching = me.as_ref().is_some_and(|p| p.is_crouching);
    let special_cd = me.as_ref().map_or(0.0, |p| p.special_cd);

    // 1. Các phím tiện ích dùng được cả khi đang nghỉ ngơi
    if keys.just_pressed(KeyCode::KeyH) {
        if !is_resting {
            input.clear_movement();
            bridge.send_toggle_rest();
        } else if rest_unlock_left <= 0.0 {
            bridge.send_toggle_rest();
        }
    }
    if keys.just_pressed(KeyCode::KeyN) {
        settings.night_vision = !settings.night_vision;
        net.telemetry_dirty = true;
    }
    if keys.just_pressed(KeyCode::KeyT) {
        let key = net.my_model.to_lowercase();
        let cur = settings.model_yaw_offsets.get(&key).copied().unwrap_or(0.0);
        let next = (cur + FRAC_PI_2) % std::f32::consts::TAU;
        settings.model_yaw_offsets.insert(key, next);
    }
    if keys.just_pressed(KeyCode::BracketLeft) {
        settings.dino_scale_multiplier = (settings.dino_scale_multiplier - 0.1).clamp(0.3, 2.5);
        net.telemetry_dirty = true;
    }
    if keys.just_pressed(KeyCode::BracketRight) {
        settings.dino_scale_multiplier = (settings.dino_scale_multiplier + 0.1).clamp(0.3, 2.5);
        net.telemetry_dirty = true;
    }

    // 2. Khi đang nghỉ ngơi -> khóa toàn bộ di chuyển & chiến đấu
    if is_resting {
        input.clear_movement();
        special_evts.clear();
        return;
    }

    // 3. Di chuyển WASD / Phím mũi tên + Shift chạy nhanh
    input.forward = keys.pressed(KeyCode::KeyW) || keys.pressed(KeyCode::ArrowUp);
    input.backward = keys.pressed(KeyCode::KeyS) || keys.pressed(KeyCode::ArrowDown);
    input.left = keys.pressed(KeyCode::KeyA) || keys.pressed(KeyCode::ArrowLeft);
    input.right = keys.pressed(KeyCode::KeyD) || keys.pressed(KeyCode::ArrowRight);
    input.sprint = keys.pressed(KeyCode::ShiftLeft) || keys.pressed(KeyCode::ShiftRight);

    // 4. Tấn công cơ bản (Cắn: Space / F / Chuột trái | Quất đuôi: E)
    if keys.just_pressed(KeyCode::Space)
        || keys.just_pressed(KeyCode::KeyF)
        || mouse.just_pressed(MouseButton::Left)
    {
        input.pending_one_shot = Some((AnimState::Bite, 0.55));
        bridge.send_attack("bite");
    }
    if keys.just_pressed(KeyCode::KeyE) {
        input.pending_one_shot = Some((AnimState::Tail, 0.70));
        bridge.send_attack("tail");
    }

    // 5. Kỹ năng đặc trưng [V] (từ phím V hoặc nút HUD)
    let hud_special = special_evts.read().count() > 0;
    if (keys.just_pressed(KeyCode::KeyV) || hud_special) && special_cd <= 0.0 {
        let spec = cfg.get_species(&net.my_model);
        let anim = AnimState::from_str_name(&spec.special.anim);
        input.pending_one_shot = Some((anim, 0.65));
        bridge.send_special();

        // Lướt tiến tức thì cho các loài sát thủ nhanh (khớp dashDist từ species.json)
        if spec.special.dash_dist > 0.0 {
            if let Ok(mut tf) = local_tf_q.get_single_mut() {
                let fx = net.local_rot.sin();
                let fz = net.local_rot.cos();
                let limit = cfg.world.island_limit as f32;
                let nx = (tf.translation.x + fx * spec.special.dash_dist).clamp(-limit, limit);
                let nz = (tf.translation.z + fz * spec.special.dash_dist).clamp(-limit, limit);
                let ny = get_entity_ground_height(nx as f64, nz as f64, &cfg.world) as f32;
                tf.translation = Vec3::new(nx, ny, nz);
                net.local_pos = tf.translation;
            }
        }
    }

    // 6. Tương tác (Ăn/Uống [G]), Rón rén [C], Đánh hơi [Q], 4 kiểu gầm [R / 1-4]
    if keys.just_pressed(KeyCode::KeyG) {
        input.pending_one_shot = Some((AnimState::Bite, 0.50));
        bridge.send_interact();
    }
    if keys.just_pressed(KeyCode::KeyC) {
        bridge.send_crouch(!is_crouching);
    }
    if keys.just_pressed(KeyCode::KeyQ) {
        settings.scent_remaining_sec = 6.5;
        net.telemetry_dirty = true;
    }

    if keys.just_pressed(KeyCode::KeyR) || keys.just_pressed(KeyCode::Digit1) {
        input.pending_one_shot = Some((AnimState::Roar, 0.90));
        bridge.send_roar(1);
    } else if keys.just_pressed(KeyCode::Digit2) {
        input.pending_one_shot = Some((AnimState::Roar, 0.80));
        bridge.send_roar(2);
    } else if keys.just_pressed(KeyCode::Digit3) {
        input.pending_one_shot = Some((AnimState::Roar, 0.90));
        bridge.send_roar(3);
    } else if keys.just_pressed(KeyCode::Digit4) {
        input.pending_one_shot = Some((AnimState::Roar, 0.80));
        bridge.send_roar(4);
    }
}