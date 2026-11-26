use bevy::prelude::*;
use serde::Deserialize;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

const EMBED_SPECIES: &str = include_str!("../../../shared/species.json");
const EMBED_WORLD: &str = include_str!("../../../shared/world_config.json");
const EMBED_ENV: &str = include_str!("../../../shared/env_manifest.json");

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorldConfig {
    pub oasis_x: f64,
    pub oasis_z: f64,
    pub oasis_radius: f64,
    pub highland_lake_x: f64,
    pub highland_lake_z: f64,
    pub highland_lake_radius: f64,
    pub island_limit: f64,
    pub water_level: f64,
    pub terrain_size: f64,
    pub terrain_segments: usize,
    pub rock_count: usize,
    pub initial_plant_count: usize,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvManifest {
    pub spruce_tree: String,
    pub pine_sapling: String,
    pub fern: String,
    pub weed: String,
    pub rock_moss_set: String,
    pub rock_pitted_mossy: String,
    pub ground_diffuse: String,
    pub rock_diffuse: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecialClientInfo {
    pub name: String,
    pub cooldown: f32,
    pub dash_dist: f32,
    pub anim: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientDinoParams {
    pub target_size: f32,
    pub rotation_offset: f32,
    pub nametag_height: f32,
    pub cam_distance: f32,
    pub cam_height: f32,
    pub look_at_y: f32,
    pub turn_speed: f32,
    pub walk_speed: f32,
    pub sprint_speed: f32,
    pub back_speed: f32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpeciesConfig {
    pub id: String,
    pub name: String,
    pub diet: String,
    pub file_name: String,
    pub special: SpecialClientInfo,
    pub client: ClientDinoParams,
}

impl SpeciesConfig {
    pub fn asset_path(&self) -> String {
        format!("models/dino/{}#Scene0", self.file_name)
    }

    pub fn gltf_path(&self) -> String {
        format!("models/dino/{}", self.file_name)
    }

    pub fn is_carnivore(&self) -> bool {
        self.diet.eq_ignore_ascii_case("carnivore")
    }
}

#[derive(Resource, Clone)]
pub struct GameConfig {
    pub world: WorldConfig,
    pub env: EnvManifest,
    pub species: HashMap<String, SpeciesConfig>,
    pub default_species: SpeciesConfig,
    pub server_url: String,
    pub ipc_bind_addr: String,
}

impl GameConfig {
    pub fn load() -> Self {
        let world_raw = read_override("world_config.json").unwrap_or_else(|| EMBED_WORLD.to_string());
        let species_raw = read_override("species.json").unwrap_or_else(|| EMBED_SPECIES.to_string());
        let env_raw = read_override("env_manifest.json").unwrap_or_else(|| EMBED_ENV.to_string());

        let world: WorldConfig =
            serde_json::from_str(&world_raw).expect("Invalid world_config.json");
        let env: EnvManifest =
            serde_json::from_str(&env_raw).expect("Invalid env_manifest.json");
        let list: Vec<SpeciesConfig> =
            serde_json::from_str(&species_raw).expect("Invalid species.json");

        let mut species = HashMap::with_capacity(list.len());
        for s in list {
            species.insert(s.id.to_lowercase(), s);
        }

        let default_species = species
            .get("trex")
            .cloned()
            .or_else(|| species.values().next().cloned())
            .expect("species.json must contain at least 1 species");

        let server_url = std::env::var("DINO_SERVER_URL")
            .unwrap_or_else(|_| "ws://127.0.0.1:8080/ws".to_string());
        let ipc_bind_addr = std::env::var("DINO_IPC_ADDR")
            .unwrap_or_else(|_| "127.0.0.1:9001".to_string());

        Self {
            world,
            env,
            species,
            default_species,
            server_url,
            ipc_bind_addr,
        }
    }

    pub fn get_species(&self, id: &str) -> &SpeciesConfig {
        self.species
            .get(&id.to_lowercase())
            .unwrap_or(&self.default_species)
    }
}

fn read_override(file_name: &str) -> Option<String> {
    let candidates = [
        format!("../shared/{file_name}"),
        format!("client_v2/shared/{file_name}"),
        format!("shared/{file_name}"),
    ];
    for c in candidates {
        if Path::new(&c).is_file() {
            if let Ok(text) = fs::read_to_string(&c) {
                return Some(text);
            }
        }
    }
    None
}