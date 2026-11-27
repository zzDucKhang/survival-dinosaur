use super::bridge::{BridgeServerEvent, NetworkBridge};
use super::protocol::{
    BloodTrailDto, CombatEventDto, HudCommand, LocalTelemetryMsg, PlayerDto, WorldFoodDto,
};
use crate::core::states::{AppState, RuntimeSettings};
use crate::entities::components::LocalInputState;
use bevy::prelude::*;
use std::collections::HashMap;
use std::f32::consts::FRAC_PI_2;

#[derive(Event, Debug, Clone)]
pub struct CombatEventMsg(pub CombatEventDto);

#[derive(Event, Debug, Default)]
pub struct HudSpecialRequestEvent;

#[derive(Resource)]
pub struct WorldNetState {
    pub server_connected: bool,
    pub my_id: Option<String>,
    pub my_name: String,
    pub my_model: String,
    pub players: HashMap<String, PlayerDto>,
    pub foods: HashMap<String, WorldFoodDto>,
    pub blood_trails: Vec<BloodTrailDto>,
    pub world_time: f32,
    pub weather: String,
    pub local_pos: Vec3,
    pub local_rot: f32,
    pub local_stamina: f32,
    pub action_hint: Option<String>,
    pub last_respawn_seq: i32,
    pub last_damaged_elapsed: f32,
    pub players_dirty: bool,
    pub foods_dirty: bool,
    pub blood_dirty: bool,
    pub telemetry_dirty: bool,
}

impl Default for WorldNetState {
    fn default() -> Self {
        Self {
            server_connected: false,
            my_id: None,
            my_name: "Apex Predator".to_string(),
            my_model: "trex".to_string(),
            players: HashMap::new(),
            foods: HashMap::new(),
            blood_trails: Vec::new(),
            world_time: 0.36,
            weather: "clear".to_string(),
            local_pos: Vec3::ZERO,
            local_rot: 0.0,
            local_stamina: 100.0,
            action_hint: None,
            last_respawn_seq: 0,
            last_damaged_elapsed: -10.0,
            players_dirty: false,
            foods_dirty: false,
            blood_dirty: false,
            telemetry_dirty: true,
        }
    }
}

impl WorldNetState {
    pub fn local_player(&self) -> Option<&PlayerDto> {
        self.my_id.as_ref().and_then(|id| self.players.get(id))
    }
}

pub fn poll_server_messages(
    time: Res<Time>,
    bridge: Res<NetworkBridge>,
    mut net: ResMut<WorldNetState>,
    app_state: Res<State<AppState>>,
    mut combat_writer: EventWriter<CombatEventMsg>,
) {
    while let Ok(evt) = bridge.from_server_rx.try_recv() {
        match evt {
            BridgeServerEvent::Connected => {
                net.server_connected = true;
                net.telemetry_dirty = true;
                if *app_state.get() == AppState::InGame {
                    net.last_respawn_seq = 0;
                    bridge.send_join(&net.my_name, &net.my_model);
                }
            }
            BridgeServerEvent::Disconnected => {
                net.server_connected = false;
                net.telemetry_dirty = true;
            }
            BridgeServerEvent::Message(msg) => {
                if msg.msg_type == "INIT" {
                    net.last_respawn_seq = 0;
                    if let Some(id) = msg.id {
                        net.my_id = Some(id);
                    }
                    net.players_dirty = true;
                    net.foods_dirty = true;
                    net.blood_dirty = true;
                    net.telemetry_dirty = true;
                }
                if let Some(t) = msg.world_time {
                    net.world_time = t as f32;
                }
                if let Some(w) = msg.weather {
                    if !w.is_empty() {
                        net.weather = w;
                    }
                }
                if let Some(players) = msg.players {
                    net.players = players;
                    net.players_dirty = true;
                }
                if let Some(foods) = msg.foods {
                    net.foods = foods;
                    net.foods_dirty = true;
                }
                if let Some(trails) = msg.blood_trails {
                    net.blood_trails = trails;
                    net.blood_dirty = true;
                }
                if let Some(events) = msg.events {
                    for ev in events {
                        if net.my_id.as_deref() == Some(ev.target_id.as_str())
                            && ev.attack_type != "heal"
                            && ev.attack_type != "roar"
                        {
                            net.last_damaged_elapsed = time.elapsed_secs();
                        }
                        combat_writer.send(CombatEventMsg(ev));
                    }
                }
            }
        }
    }
}

#[allow(clippy::too_many_arguments)]
pub fn poll_hud_commands(
    bridge: Res<NetworkBridge>,
    mut net: ResMut<WorldNetState>,
    mut settings: ResMut<RuntimeSettings>,
    mut input: ResMut<LocalInputState>,
    mut next_state: ResMut<NextState<AppState>>,
    mut special_writer: EventWriter<HudSpecialRequestEvent>,
) {
    while let Ok(cmd) = bridge.from_hud_rx.try_recv() {
        match cmd {
            HudCommand::Join { name, model } => {
                let clean_name = if name.trim().is_empty() {
                    "Wild Raptor".to_string()
                } else {
                    name.trim().to_string()
                };
                let clean_model = if model.trim().is_empty() {
                    "trex".to_string()
                } else {
                    model.trim().to_lowercase()
                };
                net.my_name = clean_name;
                net.my_model = clean_model;
                net.my_id = None;
                net.last_respawn_seq = 0;
                net.action_hint = None;
                net.players_dirty = true;
                net.telemetry_dirty = true;
                settings.input_blocked_by_ui = false;
                bridge.send_join(&net.my_name, &net.my_model);
                next_state.set(AppState::InGame);
            }
            HudCommand::Leave => {
                settings.input_blocked_by_ui = false;
                settings.map_waypoint = None;
                input.clear_movement();
                net.my_id = None;
                net.last_respawn_seq = 0;
                net.action_hint = None;
                net.players_dirty = true;
                net.telemetry_dirty = true;
                bridge.send_leave();
                bridge.reset_ipc_session();
                next_state.set(AppState::Lobby);
            }
            HudCommand::Chat { text } => bridge.send_chat(&text),
            HudCommand::Rest => bridge.send_toggle_rest(),
            HudCommand::Special => {
                special_writer.send(HudSpecialRequestEvent);
            }
            HudCommand::PackInvite { target_id } => bridge.send_pack_invite(&target_id),
            HudCommand::PackAccept => bridge.send_pack_accept(),
            HudCommand::PackLeave => bridge.send_pack_leave(),
            HudCommand::SetQuality { quality } => {
                settings.quality = quality;
                net.telemetry_dirty = true;
            }
            HudCommand::SetBrightness { value } => {
                settings.brightness = value.clamp(0.8, 2.2);
                net.telemetry_dirty = true;
            }
            HudCommand::SetDinoScale { value } => {
                settings.dino_scale_multiplier = value.clamp(0.3, 2.5);
                net.telemetry_dirty = true;
            }
            HudCommand::RotateModel90 => {
                let key = net.my_model.to_lowercase();
                let cur = settings.model_yaw_offsets.get(&key).copied().unwrap_or(0.0);
                let next = (cur + FRAC_PI_2) % std::f32::consts::TAU;
                settings.model_yaw_offsets.insert(key, next);
            }
            HudCommand::ToggleNightVision => {
                settings.night_vision = !settings.night_vision;
                net.telemetry_dirty = true;
            }
            HudCommand::TriggerScent => {
                settings.scent_remaining_sec = 6.5;
                net.telemetry_dirty = true;
            }
            HudCommand::SetWaypoint { x, z } => {
                settings.map_waypoint = Some(Vec2::new(x, z));
                net.telemetry_dirty = true;
            }
            HudCommand::ClearWaypoint => {
                settings.map_waypoint = None;
                net.telemetry_dirty = true;
            }
            HudCommand::SetUiFocus { blocked } => {
                settings.input_blocked_by_ui = blocked;
            }
        }
    }
}

pub fn push_telemetry_to_hud(
    time: Res<Time>,
    bridge: Res<NetworkBridge>,
    mut net: ResMut<WorldNetState>,
    settings: Res<RuntimeSettings>,
    app_state: Res<State<AppState>>,
    mut accum: Local<f32>,
    mut smooth_fps: Local<f32>,
    mut prev_hud_count: Local<usize>,
) {
    let dt = time.delta_secs();
    if dt > 0.0001 {
        let inst_fps = (1.0 / dt).clamp(1.0, 240.0);
        if *smooth_fps <= 1.0 {
            *smooth_fps = inst_fps;
        } else {
            *smooth_fps = *smooth_fps * 0.9 + inst_fps * 0.1;
        }
    }

    let hud_count = bridge.hud_client_count();
    let just_connected_hud = hud_count > *prev_hud_count;
    *prev_hud_count = hud_count;

    // Khi không có HUD nào mở, giảm tần suất serialize xuống 2Hz để giữ cache mới nhất mà không tốn CPU
    let interval = if hud_count > 0 { 0.066 } else { 0.50 };
    *accum += dt;
    if !net.telemetry_dirty && !just_connected_hud && *accum < interval {
        return;
    }
    *accum = 0.0;
    net.telemetry_dirty = false;

    let msg = LocalTelemetryMsg {
        msg_type: "LOCAL_TELEMETRY",
        server_connected: net.server_connected,
        is_joined: *app_state.get() == AppState::InGame,
        my_id: net.my_id.clone(),
        my_name: net.my_name.clone(),
        my_model: net.my_model.clone(),
        x: (net.local_pos.x * 100.0).round() / 100.0,
        y: (net.local_pos.y * 100.0).round() / 100.0,
        z: (net.local_pos.z * 100.0).round() / 100.0,
        rot: (net.local_rot * 1000.0).round() / 1000.0,
        stamina: net.local_stamina.round(),
        fps: smooth_fps.round() as u32,
        night_vision: settings.night_vision,
        scent_remaining: (settings.scent_remaining_sec * 10.0).round() / 10.0,
        quality: settings.quality,
        brightness: settings.brightness,
        dino_scale: settings.dino_scale_multiplier,
        action_hint: net.action_hint.clone(),
        waypoint: settings.map_waypoint.map(|v| [v.x, v.y]),
    };

    bridge.send_hud_telemetry(&msg);
}
