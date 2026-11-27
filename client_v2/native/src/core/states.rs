use bevy::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(States, Default, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum AppState {
    #[default]
    Lobby,
    InGame,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum GraphicsQuality {
    Low,
    #[default]
    Medium,
    High,
}

impl GraphicsQuality {
    pub fn foliage_density(self) -> f32 {
        match self {
            Self::Low => 0.55,
            Self::Medium => 0.85,
            Self::High => 1.20,
        }
    }

    pub fn tree_cull_dist(self) -> f32 {
        match self {
            Self::Low => 145.0,
            Self::Medium => 195.0,
            Self::High => 260.0,
        }
    }

    pub fn detail_cull_dist(self) -> f32 {
        match self {
            Self::Low => 55.0,
            Self::Medium => 82.0,
            Self::High => 115.0,
        }
    }
}

#[derive(Resource, Default, Clone)]
pub struct RuntimeSettings {
    pub quality: GraphicsQuality,
    pub brightness: f32,
    pub dino_scale_multiplier: f32,
    pub night_vision: bool,
    pub input_blocked_by_ui: bool,
    pub scent_remaining_sec: f32,
    pub map_waypoint: Option<Vec2>, // (x, z)
    pub model_yaw_offsets: HashMap<String, f32>,
}