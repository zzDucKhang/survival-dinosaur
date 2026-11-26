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
    #[default]
    Low,
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
            Self::Low => 135.0,
            Self::Medium => 185.0,
            Self::High => 240.0,
        }
    }

    pub fn detail_cull_dist(self) -> f32 {
        match self {
            Self::Low => 52.0,
            Self::Medium => 75.0,
            Self::High => 105.0,
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