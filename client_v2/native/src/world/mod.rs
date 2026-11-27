pub mod atmosphere;
pub mod foliage;
pub mod material_fix;
pub mod terrain;
pub mod water;

use atmosphere::{setup_atmosphere, update_atmosphere, update_sky_and_celestials, AtmosphereState};
use bevy::prelude::*;
use foliage::{cull_world_props, spawn_foliage_and_rocks};
use material_fix::{apply_scene_material_policy, PatchedMaterialCache};
use terrain::spawn_terrain;
use water::{animate_water_surfaces, spawn_water_bodies};

pub struct WorldPlugin;

impl Plugin for WorldPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<PatchedMaterialCache>()
            .init_resource::<AtmosphereState>()
            .add_observer(apply_scene_material_policy)
            .add_systems(
                Startup,
                (
                    spawn_terrain,
                    spawn_water_bodies,
                    spawn_foliage_and_rocks,
                    setup_atmosphere,
                ),
            )
            .add_systems(
                Update,
                (
                    update_atmosphere,
                    update_sky_and_celestials,
                    animate_water_surfaces,
                    cull_world_props,
                )
                    .chain(),
            );
    }
}