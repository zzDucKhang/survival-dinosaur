use crate::core::states::GraphicsQuality;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PlayerDto {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub model: String,
    #[serde(default)]
    pub diet: String,
    #[serde(default)]
    pub x: f64,
    #[serde(default)]
    pub y: f64,
    #[serde(default)]
    pub z: f64,
    #[serde(default)]
    pub rot: f64,
    #[serde(default)]
    pub anim: String,
    #[serde(default)]
    pub hp: i32,
    #[serde(default)]
    pub max_hp: i32,
    #[serde(default)]
    pub hunger: f64,
    #[serde(default)]
    pub thirst: f64,
    #[serde(default)]
    pub growth: f64,
    #[serde(default)]
    pub bleed: f64,
    #[serde(default)]
    pub bone_break: f64,
    #[serde(default)]
    pub special_cd: f64,
    #[serde(default)]
    pub kills: i32,
    #[serde(default)]
    pub is_resting: bool,
    #[serde(default)]
    pub rest_unlock_left: f64,
    #[serde(default)]
    pub combat_timer_left: f64,
    #[serde(default)]
    pub regen_rate: i32,
    #[serde(default)]
    pub is_crouching: bool,
    #[serde(default)]
    pub pack_id: String,
    #[serde(default)]
    pub pack_invite_from: String,
    #[serde(default)]
    pub pack_invite_name: String,
    #[serde(default)]
    pub respawn_seq: i32,
    #[serde(default)]
    pub last_killed_by: String,
    #[serde(default)]
    pub is_ai: bool,
    #[serde(default)]
    pub ai_state: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorldFoodDto {
    pub id: String,
    #[serde(rename = "type")]
    pub food_type: String,
    pub x: f64,
    pub z: f64,
    pub amount: i32,
    pub max_amount: i32,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct BloodTrailDto {
    pub id: String,
    pub x: f64,
    pub z: f64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CombatEventDto {
    pub id: String,
    pub attacker_id: String,
    pub target_id: String,
    pub damage: i32,
    pub target_hp: i32,
    pub is_kill: bool,
    pub attack_type: String,
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessageDto {
    pub id: String,
    pub sender: String,
    pub text: String,
    #[serde(default)]
    pub is_system: bool,
    #[serde(default)]
    pub ts: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerMessage {
    #[serde(rename = "type")]
    pub msg_type: String,
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    pub players: Option<HashMap<String, PlayerDto>>,
    #[serde(default)]
    pub foods: Option<HashMap<String, WorldFoodDto>>,
    #[serde(default)]
    pub blood_trails: Option<Vec<BloodTrailDto>>,
    #[serde(default)]
    pub events: Option<Vec<CombatEventDto>>,
    #[serde(default)]
    pub chats: Option<Vec<ChatMessageDto>>,
    #[serde(default)]
    pub world_time: Option<f64>,
    #[serde(default)]
    pub weather: Option<String>,
}

/// Lệnh từ React HUD gửi sang lõi Rust qua IPC ws://127.0.0.1:9001
#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum HudCommand {
    #[serde(rename = "JOIN")]
    Join { name: String, model: String },
    #[serde(rename = "LEAVE")]
    Leave,
    #[serde(rename = "CHAT")]
    Chat { text: String },
    #[serde(rename = "REST")]
    Rest,
    #[serde(rename = "SPECIAL")]
    Special,
    #[serde(rename = "PACK_INVITE")]
    PackInvite {
        #[serde(rename = "targetId")]
        target_id: String,
    },
    #[serde(rename = "PACK_ACCEPT")]
    PackAccept,
    #[serde(rename = "PACK_LEAVE")]
    PackLeave,
    #[serde(rename = "SET_QUALITY")]
    SetQuality { quality: GraphicsQuality },
    #[serde(rename = "SET_BRIGHTNESS")]
    SetBrightness { value: f32 },
    #[serde(rename = "SET_DINO_SCALE")]
    SetDinoScale { value: f32 },
    #[serde(rename = "ROTATE_MODEL_90")]
    RotateModel90,
    #[serde(rename = "TOGGLE_NIGHT_VISION")]
    ToggleNightVision,
    #[serde(rename = "TRIGGER_SCENT")]
    TriggerScent,
    #[serde(rename = "SET_WAYPOINT")]
    SetWaypoint { x: f32, z: f32 },
    #[serde(rename = "CLEAR_WAYPOINT")]
    ClearWaypoint,
    #[serde(rename = "SET_UI_FOCUS")]
    SetUiFocus { blocked: bool },
}

/// Gói tin nội bộ Rust đẩy sang HUD (~15Hz) để vẽ Radar, Bản đồ, Stamina, FPS.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalTelemetryMsg {
    #[serde(rename = "type")]
    pub msg_type: &'static str,
    pub server_connected: bool,
    pub is_joined: bool,
    pub my_id: Option<String>,
    pub my_name: String,
    pub my_model: String,
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub rot: f32,
    pub stamina: f32,
    pub fps: u32,
    pub night_vision: bool,
    pub scent_remaining: f32,
    pub quality: GraphicsQuality,
    pub brightness: f32,
    pub dino_scale: f32,
    pub action_hint: Option<String>,
    pub waypoint: Option<[f32; 2]>,
}

pub fn build_outbound_json<T: Serialize>(msg_type: &str, payload: T) -> String {
    serde_json::json!({
        "type": msg_type,
        "payload": payload,
    })
    .to_string()
}