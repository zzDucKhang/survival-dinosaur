use crate::core::states::{AppState, RuntimeSettings};
use crate::network::bridge::NetworkBridge;
use crate::network::sync::WorldNetState;
use bevy::prelude::*;

#[derive(Component)]
pub struct DebugHudRoot;

#[derive(Component)]
pub struct DebugHudText;

pub fn spawn_debug_hud(mut commands: Commands) {
    commands
        .spawn((
            Name::new("DebugHudRoot"),
            DebugHudRoot,
            Node {
                position_type: PositionType::Absolute,
                left: Val::Px(12.0),
                top: Val::Px(12.0),
                padding: UiRect::axes(Val::Px(12.0), Val::Px(8.0)),
                ..default()
            },
            BackgroundColor(Color::srgba(0.04, 0.08, 0.14, 0.78)),
            BorderRadius::all(Val::Px(8.0)),
        ))
        .with_children(|parent| {
            parent.spawn((
                DebugHudText,
                Text::new("DINO ISLE NATIVE - Initializing..."),
                TextFont {
                    font_size: 13.0,
                    ..default()
                },
                TextColor(Color::srgb(0.84, 0.96, 0.88)),
            ));
        });
}

#[allow(clippy::too_many_arguments)]
pub fn update_debug_hud(
    time: Res<Time>,
    keys: Res<ButtonInput<KeyCode>>,
    app_state: Res<State<AppState>>,
    bridge: Res<NetworkBridge>,
    net: Res<WorldNetState>,
    settings: Res<RuntimeSettings>,
    mut root_q: Query<&mut Visibility, With<DebugHudRoot>>,
    mut text_q: Query<&mut Text, With<DebugHudText>>,
    mut accum: Local<f32>,
    mut smooth_fps: Local<f32>,
) {
    if keys.just_pressed(KeyCode::F3) {
        if let Ok(mut vis) = root_q.get_single_mut() {
            *vis = if *vis == Visibility::Hidden {
                Visibility::Visible
            } else {
                Visibility::Hidden
            };
        }
    }

    let dt = time.delta_secs();
    if dt > 0.0001 {
        let inst = (1.0 / dt).clamp(1.0, 240.0);
        *smooth_fps = if *smooth_fps <= 1.0 {
            inst
        } else {
            *smooth_fps * 0.9 + inst * 0.1
        };
    }

    *accum += dt;
    if *accum < 0.2 {
        return;
    }
    *accum = 0.0;

    let Ok(mut text) = text_q.get_single_mut() else {
        return;
    };

    let conn = if net.server_connected { "ONLINE" } else { "OFFLINE" };
    let hud_cnt = bridge.hud_client_count();
    let total_mins = (net.world_time * 24.0 * 60.0) as u32;
    let hh = (total_mins / 60) % 24;
    let mm = total_mins % 60;

    if *app_state.get() == AppState::Lobby {
        text.0 = format!(
            "DINO ISLE NATIVE | {:.0} FPS | Go :8080 [{}] | HUD :9001 [{}]\n\
             Trang thai: LOBBY | Gio {:02}:{:02} | Thoi tiet: {}\n\
             Nhan [Enter] de vao test nhanh (hoac mo React HUD :5173) | [F3] An/Hien",
            *smooth_fps, conn, hud_cnt, hh, mm, net.weather
        );
        return;
    }

    let (hp, max_hp, hunger, thirst, growth, resting) = match net.local_player() {
        Some(p) => (
            p.hp,
            p.max_hp,
            p.hunger.round() as i32,
            p.thirst.round() as i32,
            (p.growth * 100.0).round() as i32,
            p.is_resting,
        ),
        None => (100, 100, 90, 90, 45, false),
    };

    let nv_tag = if settings.night_vision { " | NV: ON" } else { "" };
    let rest_tag = if resting { " | RESTING" } else { "" };
    let hint_line = net
        .action_hint
        .as_deref()
        .unwrap_or("WASD Di chuyen | Chuot Phai xoay 360 | Space/E/V Chien dau | G An/Uong | H Nghi | Q Danh hoi | N Nhin dem");

    text.0 = format!(
        "DINO ISLE NATIVE | {:.0} FPS | Go [{}] | {} ({}%){}{}\n\
         HP: {}/{} | Stamina: {:.0}% | Doi: {}% | Khat: {}% | {:02}:{:02} [{}]\n\
         Pos: ({:.0}, {:.0}) | Entities: {} | [F3] An/Hien\n\
         {}",
        *smooth_fps,
        conn,
        net.my_model.to_uppercase(),
        growth,
        nv_tag,
        rest_tag,
        hp,
        max_hp,
        net.local_stamina,
        hunger,
        thirst,
        hh,
        mm,
        net.weather,
        net.local_pos.x,
        net.local_pos.z,
        net.players.len(),
        hint_line
    );
}