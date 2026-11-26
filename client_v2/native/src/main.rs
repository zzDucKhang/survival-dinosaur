mod core;
mod entities;
mod network;
mod ui_fallback;
mod vfx;
mod world;

use bevy::asset::AssetMetaCheck;
use bevy::pbr::DirectionalLightShadowMap;
use bevy::prelude::*;
use bevy::window::{PresentMode, WindowResolution};
use std::path::Path;

use core::CorePlugin;
use entities::EntitiesPlugin;
use network::NetworkPlugin;
use ui_fallback::UiFallbackPlugin;
use vfx::VfxPlugin;
use world::WorldPlugin;

fn resolve_assets_dir() -> String {
    if let Ok(custom) = std::env::var("DINO_ASSETS_DIR") {
        if Path::new(&custom).is_dir() {
            return custom;
        }
    }
    let candidates = [
        "client/public",
        "../../client/public",
        "../client/public",
        "public",
    ];
    for c in candidates {
        if Path::new(c).is_dir() {
            return c.to_string();
        }
    }
    "../../client/public".to_string()
}

fn main() {
    let assets_dir = resolve_assets_dir();

    App::new()
        .insert_resource(ClearColor(Color::srgb(0.45, 0.61, 0.70)))
        .insert_resource(DirectionalLightShadowMap { size: 1024 })
        .add_plugins(
            DefaultPlugins
                .set(AssetPlugin {
                    file_path: assets_dir,
                    meta_check: AssetMetaCheck::Never,
                    ..default()
                })
                .set(WindowPlugin {
                    primary_window: Some(Window {
                        title: "Dino Isle — Native 3D Engine (Bevy 0.15)".to_string(),
                        resolution: WindowResolution::new(1280.0, 720.0),
                        present_mode: PresentMode::AutoVsync,
                        ..default()
                    }),
                    ..default()
                }),
        )
        .add_plugins((
            CorePlugin,
            NetworkPlugin,
            WorldPlugin,
            EntitiesPlugin,
            VfxPlugin,
            UiFallbackPlugin,
        ))
        .run();
}