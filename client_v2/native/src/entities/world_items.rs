use crate::core::config::GameConfig;
use crate::core::math_terrain::get_mesh_terrain_height;
use crate::core::states::RuntimeSettings;
use crate::network::sync::WorldNetState;
use crate::world::foliage::{CullTier, DistanceCulled};
use crate::world::material_fix::SceneMaterialPolicy;
use bevy::pbr::NotShadowCaster;
use bevy::prelude::*;
use std::collections::{HashMap, HashSet};
use std::f32::consts::FRAC_PI_2;

#[derive(Resource)]
pub struct WorldItemAssets {
    pub meat_mesh: Handle<Mesh>,
    pub meat_mat: Handle<StandardMaterial>,
    pub bone_mesh: Handle<Mesh>,
    pub bone_mat: Handle<StandardMaterial>,
    pub plant_fern_scene: Handle<Scene>,
    pub berry_mesh: Handle<Mesh>,
    pub berry_mat: Handle<StandardMaterial>,
    pub blood_mesh: Handle<Mesh>,
    pub blood_mat: Handle<StandardMaterial>,
    pub waypoint_pillar_mesh: Handle<Mesh>,
    pub waypoint_pillar_mat: Handle<StandardMaterial>,
    pub waypoint_ring_mesh: Handle<Mesh>,
    pub waypoint_ring_mat: Handle<StandardMaterial>,
}

#[derive(Resource, Default)]
pub struct WorldItemRegistry {
    pub foods: HashMap<String, Entity>,
    pub bloods: HashMap<String, Entity>,
    pub waypoint_root: Option<Entity>,
}

#[derive(Component)]
pub struct WaypointRing;

pub fn init_world_item_assets(
    mut commands: Commands,
    cfg: Res<GameConfig>,
    asset_server: Res<AssetServer>,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    commands.insert_resource(WorldItemAssets {
        meat_mesh: meshes.add(Sphere::new(0.78)),
        meat_mat: materials.add(StandardMaterial {
            base_color: Color::srgb(0.68, 0.10, 0.11),
            perceptual_roughness: 0.55,
            reflectance: 0.35,
            ..default()
        }),
        bone_mesh: meshes.add(Cylinder::new(0.14, 1.85)),
        bone_mat: materials.add(StandardMaterial {
            base_color: Color::srgb(0.92, 0.89, 0.81),
            perceptual_roughness: 0.78,
            ..default()
        }),
        plant_fern_scene: asset_server.load(format!("{}#Scene0", cfg.env.fern)),
        berry_mesh: meshes.add(Sphere::new(0.18)),
        berry_mat: materials.add(StandardMaterial {
            base_color: Color::srgb(0.92, 0.22, 0.28),
            emissive: LinearRgba::rgb(0.28, 0.04, 0.05),
            perceptual_roughness: 0.32,
            ..default()
        }),
        blood_mesh: meshes.add(Circle::new(0.72)),
        blood_mat: materials.add(StandardMaterial {
            base_color: Color::srgba(0.60, 0.08, 0.08, 0.80),
            unlit: true,
            alpha_mode: AlphaMode::Blend,
            ..default()
        }),
        waypoint_pillar_mesh: meshes.add(Cylinder::new(0.65, 84.0)),
        waypoint_pillar_mat: materials.add(StandardMaterial {
            base_color: Color::srgba(0.98, 0.80, 0.08, 0.34),
            emissive: LinearRgba::rgb(0.9, 0.7, 0.1),
            unlit: true,
            alpha_mode: AlphaMode::Blend,
            ..default()
        }),
        waypoint_ring_mesh: meshes.add(Annulus::new(2.1, 2.9)),
        waypoint_ring_mat: materials.add(StandardMaterial {
            base_color: Color::srgba(0.99, 0.88, 0.28, 0.88),
            emissive: LinearRgba::rgb(1.0, 0.85, 0.2),
            unlit: true,
            alpha_mode: AlphaMode::Blend,
            double_sided: true,
            cull_mode: None,
            ..default()
        }),
    });
}

fn spawn_meat_carcass(
    commands: &mut Commands,
    assets: &WorldItemAssets,
    id: &str,
    x: f32,
    y: f32,
    z: f32,
    ratio: f32,
) -> Entity {
    let chunk_main = commands
        .spawn((
            Mesh3d(assets.meat_mesh.clone()),
            MeshMaterial3d(assets.meat_mat.clone()),
            Transform::from_xyz(0.0, 0.35, 0.0).with_scale(Vec3::new(1.25, 0.65, 0.95)),
            NotShadowCaster,
        ))
        .id();
    let chunk_side = commands
        .spawn((
            Mesh3d(assets.meat_mesh.clone()),
            MeshMaterial3d(assets.meat_mat.clone()),
            Transform::from_xyz(0.55, 0.24, 0.28).with_scale(Vec3::new(0.75, 0.50, 0.65)),
            NotShadowCaster,
        ))
        .id();
    let bone = commands
        .spawn((
            Mesh3d(assets.bone_mesh.clone()),
            MeshMaterial3d(assets.bone_mat.clone()),
            Transform::from_xyz(-0.15, 0.42, 0.0)
                .with_rotation(Quat::from_euler(EulerRot::XYZ, 0.3, 0.4, FRAC_PI_2)),
            NotShadowCaster,
        ))
        .id();

    commands
        .spawn((
            Name::new(format!("Food_{id}")),
            DistanceCulled {
                world_xz: Vec2::new(x, z),
                tier: CullTier::Item,
                extra_radius: 8.0,
                density_rank: 0.0,
            },
            Transform::from_xyz(x, y, z).with_scale(Vec3::splat(ratio)),
            Visibility::Visible,
        ))
        .add_children(&[chunk_main, chunk_side, bone])
        .id()
}

fn spawn_berry_bush(
    commands: &mut Commands,
    assets: &WorldItemAssets,
    id: &str,
    x: f32,
    y: f32,
    z: f32,
    ratio: f32,
) -> Entity {
    let fern = commands
        .spawn((
            SceneRoot(assets.plant_fern_scene.clone()),
            SceneMaterialPolicy::foliage_ground(),
            Transform::from_xyz(0.0, -0.05, 0.0).with_scale(Vec3::splat(2.1)),
        ))
        .id();

    let berry_offsets = [
        Vec3::new(0.32, 0.72, 0.18),
        Vec3::new(-0.28, 0.68, 0.25),
        Vec3::new(0.08, 0.85, -0.24),
        Vec3::new(-0.18, 0.62, -0.32),
    ];
    let mut children = Vec::with_capacity(5);
    children.push(fern);
    for off in berry_offsets {
        let b = commands
            .spawn((
                Mesh3d(assets.berry_mesh.clone()),
                MeshMaterial3d(assets.berry_mat.clone()),
                Transform::from_translation(off),
                NotShadowCaster,
            ))
            .id();
        children.push(b);
    }

    commands
        .spawn((
            Name::new(format!("Food_{id}")),
            DistanceCulled {
                world_xz: Vec2::new(x, z),
                tier: CullTier::Item,
                extra_radius: 8.0,
                density_rank: 0.0,
            },
            Transform::from_xyz(x, y, z).with_scale(Vec3::splat(ratio)),
            Visibility::Visible,
        ))
        .add_children(&children)
        .id()
}

#[allow(clippy::too_many_arguments)]
pub fn sync_world_items(
    mut commands: Commands,
    time: Res<Time>,
    cfg: Res<GameConfig>,
    mut net: ResMut<WorldNetState>,
    settings: Res<RuntimeSettings>,
    assets: Res<WorldItemAssets>,
    mut registry: ResMut<WorldItemRegistry>,
    mut tf_q: Query<&mut Transform, Without<WaypointRing>>,
    mut ring_q: Query<&mut Transform, With<WaypointRing>>,
) {
    // 1. Thức ăn (chỉ diff khi server vừa gửi foods mới)
    if net.foods_dirty {
        net.foods_dirty = false;
        let dead_foods: Vec<String> = registry
            .foods
            .keys()
            .filter(|id| !net.foods.contains_key(*id))
            .cloned()
            .collect();
        for id in dead_foods {
            if let Some(e) = registry.foods.remove(&id) {
                commands.entity(e).despawn_recursive();
            }
        }

        for (id, f) in &net.foods {
            let ratio = (f.amount as f32 / f.max_amount.max(1) as f32).max(0.25);
            if let Some(&entity) = registry.foods.get(id) {
                if let Ok(mut tf) = tf_q.get_mut(entity) {
                    if (tf.scale.x - ratio).abs() > 0.01 {
                        tf.scale = Vec3::splat(ratio);
                    }
                }
            } else {
                let y = get_mesh_terrain_height(f.x, f.z, &cfg.world) as f32;
                let entity = if f.food_type == "meat" {
                    spawn_meat_carcass(&mut commands, &assets, id, f.x as f32, y, f.z as f32, ratio)
                } else {
                    spawn_berry_bush(&mut commands, &assets, id, f.x as f32, y, f.z as f32, ratio)
                };
                registry.foods.insert(id.clone(), entity);
            }
        }
    }

    // 2. Vệt máu truy dấu dưới đất (chỉ diff khi có cập nhật từ server)
    if net.blood_dirty {
        net.blood_dirty = false;
        let active_blood: HashSet<&str> = net.blood_trails.iter().map(|b| b.id.as_str()).collect();
        let dead_blood: Vec<String> = registry
            .bloods
            .keys()
            .filter(|id| !active_blood.contains(id.as_str()))
            .cloned()
            .collect();
        for id in dead_blood {
            if let Some(e) = registry.bloods.remove(&id) {
                commands.entity(e).despawn_recursive();
            }
        }

        for bt in &net.blood_trails {
            if registry.bloods.contains_key(&bt.id) {
                continue;
            }
            let y = get_mesh_terrain_height(bt.x, bt.z, &cfg.world) as f32 + 0.08;
            let entity = commands
                .spawn((
                    Name::new("BloodDecal"),
                    Mesh3d(assets.blood_mesh.clone()),
                    MeshMaterial3d(assets.blood_mat.clone()),
                    DistanceCulled {
                        world_xz: Vec2::new(bt.x as f32, bt.z as f32),
                        tier: CullTier::Item,
                        extra_radius: 4.0,
                        density_rank: 0.0,
                    },
                    Transform::from_xyz(bt.x as f32, y, bt.z as f32)
                        .with_rotation(Quat::from_rotation_x(-FRAC_PI_2)),
                    NotShadowCaster,
                ))
                .id();
            registry.bloods.insert(bt.id.clone(), entity);
        }
    }

    // 3. Cột sáng điểm ghim Bản đồ toàn đảo (Waypoint)
    match settings.map_waypoint {
        Some(wp) => {
            let y = get_mesh_terrain_height(wp.x as f64, wp.y as f64, &cfg.world) as f32;
            if let Some(root) = registry.waypoint_root {
                if let Ok(mut tf) = tf_q.get_mut(root) {
                    if (tf.translation.x - wp.x).abs() > 0.05 || (tf.translation.z - wp.y).abs() > 0.05 {
                        tf.translation = Vec3::new(wp.x, y, wp.y);
                    }
                }
            } else {
                let pillar = commands
                    .spawn((
                        Mesh3d(assets.waypoint_pillar_mesh.clone()),
                        MeshMaterial3d(assets.waypoint_pillar_mat.clone()),
                        Transform::from_xyz(0.0, 42.0, 0.0),
                        NotShadowCaster,
                    ))
                    .id();
                let ring = commands
                    .spawn((
                        WaypointRing,
                        Mesh3d(assets.waypoint_ring_mesh.clone()),
                        MeshMaterial3d(assets.waypoint_ring_mat.clone()),
                        Transform::from_xyz(0.0, 0.45, 0.0)
                            .with_rotation(Quat::from_rotation_x(-FRAC_PI_2)),
                        NotShadowCaster,
                    ))
                    .id();
                let root = commands
                    .spawn((
                        Name::new("MapWaypointBeacon"),
                        Transform::from_xyz(wp.x, y, wp.y),
                        Visibility::Visible,
                    ))
                    .add_children(&[pillar, ring])
                    .id();
                registry.waypoint_root = Some(root);
            }
            for mut r_tf in &mut ring_q {
                r_tf.rotate_y(time.delta_secs() * 1.8);
            }
        }
        None => {
            if let Some(root) = registry.waypoint_root.take() {
                commands.entity(root).despawn_recursive();
            }
        }
    }
}
