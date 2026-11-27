pub mod animation;
pub mod camera;
pub mod components;
pub mod player_input;
pub mod player_movement;
pub mod remote_sync;
pub mod world_items;

use animation::{
    build_species_anim_graphs, calibrate_dino_models, drive_dino_animations,
    preload_species_gltfs, DinoAnimationRegistry,
};
use bevy::prelude::*;
use camera::{spawn_main_camera, update_orbit_camera};
use components::{LocalInputState, OrbitCameraState};
use player_input::{handle_lobby_quick_join, handle_player_input};
use player_movement::{
    despawn_local_player, init_dino_shared_assets, spawn_local_player, update_local_player_movement,
};
use remote_sync::{sync_remote_entities, RemoteEntityRegistry};
use world_items::{init_world_item_assets, sync_world_items, WorldItemRegistry};

use crate::core::states::AppState;

pub struct EntitiesPlugin;

impl Plugin for EntitiesPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<DinoAnimationRegistry>()
            .init_resource::<LocalInputState>()
            .init_resource::<OrbitCameraState>()
            .init_resource::<RemoteEntityRegistry>()
            .init_resource::<WorldItemRegistry>()
            .add_systems(
                Startup,
                (
                    preload_species_gltfs,
                    spawn_main_camera,
                    init_dino_shared_assets,
                    init_world_item_assets,
                ),
            )
            .add_systems(OnEnter(AppState::InGame), spawn_local_player)
            .add_systems(OnExit(AppState::InGame), despawn_local_player)
            .add_systems(
                Update,
                handle_lobby_quick_join.run_if(in_state(AppState::Lobby)),
            )
            .add_systems(
                Update,
                (handle_player_input, update_local_player_movement)
                    .chain()
                    .run_if(in_state(AppState::InGame)),
            )
            .add_systems(
                Update,
                (
                    build_species_anim_graphs,
                    calibrate_dino_models,
                    drive_dino_animations,
                    sync_remote_entities,
                    sync_world_items,
                    update_orbit_camera,
                ),
            );
    }
}