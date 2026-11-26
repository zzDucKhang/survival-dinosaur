pub mod scent_fx;
pub mod weather_fx;

use bevy::prelude::*;
use scent_fx::{spawn_scent_fx, update_scent_fx};
use weather_fx::{spawn_weather_fx, update_weather_fx, RainDropPool};

pub struct VfxPlugin;

impl Plugin for VfxPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<RainDropPool>()
            .add_systems(Startup, (spawn_weather_fx, spawn_scent_fx))
            .add_systems(Update, (update_weather_fx, update_scent_fx));
    }
}