use bevy::prelude::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub enum AnimState {
    #[default]
    Idle,
    Walk,
    Run,
    Bite,
    Roar,
    Tail,
    Rest,
}

impl AnimState {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Idle => "idle",
            Self::Walk => "walk",
            Self::Run => "run",
            Self::Bite => "bite",
            Self::Roar => "roar",
            Self::Tail => "tail",
            Self::Rest => "rest",
        }
    }

    pub fn from_str_name(s: &str) -> Self {
        match s.to_ascii_lowercase().as_str() {
            "walk" => Self::Walk,
            "run" => Self::Run,
            "bite" => Self::Bite,
            "roar" => Self::Roar,
            "tail" => Self::Tail,
            "rest" => Self::Rest,
            _ => Self::Idle,
        }
    }

    pub fn is_one_shot(self) -> bool {
        matches!(self, Self::Bite | Self::Roar | Self::Tail)
    }
}

/// Thành phần gốc gắn trên mọi thực thể khủng long (cả người chơi lẫn AI/Remote).
#[derive(Component)]
pub struct DinoVisual {
    pub species_id: String,
    pub growth: f32,
    pub rest_blend: f32,
    pub crouch_blend: f32,
    pub desired_anim: AnimState,
    pub one_shot_left: f32,
    pub anim_speed: f32,
    pub slope_entity: Entity,
    pub holder_entity: Entity,
    pub shadow_entity: Entity,
}

#[derive(Component)]
pub struct DinoSlopePivot;

#[derive(Component)]
pub struct DinoGroundShadow;

/// Node bọc trực tiếp `SceneRoot` của khủng long để chuẩn hóa kích thước, hướng đầu & AnimationPlayer.
#[derive(Component)]
pub struct DinoModelHolder {
    pub species_id: String,
    pub target_size: f32,
    pub explicit_yaw: f32,
    pub base_scale: f32,
    pub base_offset_y: f32,
    pub calibrated: bool,
    pub calibrate_frames: u8,
    pub anim_attached: bool,
    pub active_anim: Option<AnimState>,
    pub anim_player_entity: Option<Entity>,
}

#[derive(Component)]
pub struct LocalPlayer {
    pub move_sync_accum: f32,
    pub hint_check_accum: f32,
}

#[derive(Component)]
pub struct RemotePlayer {
    pub network_id: String,
    pub was_culled: bool,
}

#[derive(Resource, Default)]
pub struct LocalInputState {
    pub forward: bool,
    pub backward: bool,
    pub left: bool,
    pub right: bool,
    pub sprint: bool,
    pub right_mouse_held: bool,
    pub pending_one_shot: Option<(AnimState, f32)>,
}

impl LocalInputState {
    pub fn clear_movement(&mut self) {
        self.forward = false;
        self.backward = false;
        self.left = false;
        self.right = false;
        self.sprint = false;
    }
}

#[derive(Resource)]
pub struct OrbitCameraState {
    pub yaw: f32,
    pub pitch: f32,
    pub zoom_dist: f32,
    pub lobby_angle: f32,
}

impl Default for OrbitCameraState {
    fn default() -> Self {
        Self {
            yaw: 0.0,
            pitch: 0.28,
            zoom_dist: 10.5,
            lobby_angle: 0.0,
        }
    }
}