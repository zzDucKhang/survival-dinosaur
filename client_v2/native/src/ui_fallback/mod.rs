pub mod debug_hud;

use bevy::prelude::*;
use debug_hud::{spawn_debug_hud, update_debug_hud};

pub struct UiFallbackPlugin;

impl Plugin for UiFallbackPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Startup, spawn_debug_hud)
            .add_systems(Update, update_debug_hud);
    }
}