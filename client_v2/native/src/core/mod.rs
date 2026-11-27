pub mod config;
pub mod math_terrain;
pub mod states;

use bevy::prelude::*;
use config::GameConfig;
use math_terrain::WorldObstacles;
use states::{AppState, GraphicsQuality, RuntimeSettings};

pub struct CorePlugin;

impl Plugin for CorePlugin {
    fn build(&self, app: &mut App) {
        let game_cfg = GameConfig::load();
        let obstacles = WorldObstacles::build(&game_cfg.world);

        app.init_state::<AppState>()
            .insert_resource(game_cfg)
            .insert_resource(obstacles)
            .insert_resource(RuntimeSettings {
                quality: GraphicsQuality::Medium, // Cân bằng đồ họa đẹp (đổ bóng + tán cây dày) ở 60+ FPS
                brightness: 1.25,
                dino_scale_multiplier: 1.0,
                night_vision: false,
                ..default()
            });
    }
}