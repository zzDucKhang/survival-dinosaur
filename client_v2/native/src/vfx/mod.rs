pub mod combat_fx;
pub mod scent_fx;
pub mod weather_fx;

use bevy::prelude::*;
use combat_fx::{init_combat_fx_assets, spawn_combat_fx, update_combat_fx};
use scent_fx::{spawn_scent_fx, update_scent_fx, ScentBeaconRegistry};
use weather_fx::{spawn_weather_fx, update_weather_fx, RainDropPool};

pub struct VfxPlugin;

impl Plugin for VfxPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<RainDropPool>()
            .init_resource::<ScentBeaconRegistry>()
            .add_systems(
                Startup,
                (spawn_weather_fx, spawn_scent_fx, init_combat_fx_assets),
            )
            .add_systems(
                Update,
                (
                    update_weather_fx,
                    update_scent_fx,
                    spawn_combat_fx,
                    update_combat_fx,
                ),
            );
    }
}
