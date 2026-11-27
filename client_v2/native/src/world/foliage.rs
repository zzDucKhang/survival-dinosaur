use super::atmosphere::AtmosphereState;
use super::material_fix::SceneMaterialPolicy;
use crate::core::config::GameConfig;
use crate::core::math_terrain::{get_mesh_terrain_height, is_near_water, WorldObstacles};
use crate::core::states::RuntimeSettings;
use crate::network::sync::WorldNetState;
use bevy::prelude::*;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CullTier {
    Tree,
    Rock,
    Detail,
    Item,
}

/// Gắn lên bất kỳ vật thể môi trường nào (cây, đá, dương xỉ, bụi cỏ, tổ trứng...) để tự động culling 60 FPS.
#[derive(Component)]
pub struct DistanceCulled {
    pub world_xz: Vec2,
    pub tier: CullTier,
    pub extra_radius: f32,
    pub density_rank: f32,
}

struct FoliageLayerSpec {
    label: &'static str,
    asset_rel: String,
    count: usize,
    min_dist: f64,
    dist_span: f64,
    dist_step: f64,
    phase: f64,
    min_y: f64,
    max_y: f64,
    base_scale: f32,
    scale_step: f32,
    scale_mod: usize,
    sink_y: f32,
    tier: CullTier,
    policy: SceneMaterialPolicy,
}

pub fn spawn_foliage_and_rocks(
    mut commands: Commands,
    cfg: Res<GameConfig>,
    obstacles: Res<WorldObstacles>,
    asset_server: Res<AssetServer>,
) {
    let wcfg = &cfg.world;

    // 1. Sinh 140 tảng đá khớp chính xác tọa độ va chạm của Server Go (luân phiên 2 model đá thực tế)
    let rock_a: Handle<Scene> = asset_server.load(format!("{}#Scene0", cfg.env.rock_moss_set));
    let rock_b: Handle<Scene> = asset_server.load(format!("{}#Scene0", cfg.env.rock_pitted_mossy));
    let rock_policy = SceneMaterialPolicy::rock();

    for (idx, rock) in obstacles.rocks.iter().enumerate() {
        let ground_y = get_mesh_terrain_height(rock.x, rock.z, wcfg) as f32;
        let scene_handle = if idx % 3 == 0 {
            rock_b.clone()
        } else {
            rock_a.clone()
        };
        let scale = Vec3::new(rock.scale.x * 0.72, rock.scale.y * 0.62, rock.scale.z * 0.72);

        commands.spawn((
            Name::new("WorldRock"),
            SceneRoot(scene_handle),
            rock_policy,
            DistanceCulled {
                world_xz: Vec2::new(rock.x as f32, rock.z as f32),
                tier: CullTier::Rock,
                extra_radius: rock.radius as f32,
                density_rank: 0.0,
            },
            Transform::from_xyz(rock.x as f32, ground_y - 0.35, rock.z as f32)
                .with_rotation(Quat::from_rotation_y(rock.rot))
                .with_scale(scale),
        ));
    }

    // 2. Bảng cấu hình sinh thái thực vật — sau này thêm loài cây / biome mới chỉ cần thêm 1 phần tử
    let layers = vec![
        FoliageLayerSpec {
            label: "SpruceTree",
            asset_rel: cfg.env.spruce_tree.clone(),
            count: 135,
            min_dist: 34.0,
            dist_span: 355.0,
            dist_step: 27.3,
            phase: 0.0,
            min_y: -14.0,
            max_y: 23.0,
            base_scale: 1.05,
            scale_step: 0.16,
            scale_mod: 5,
            sink_y: 0.25,
            tier: CullTier::Tree,
            policy: SceneMaterialPolicy::foliage_tree(true),
        },
        FoliageLayerSpec {
            label: "PineSapling",
            asset_rel: cfg.env.pine_sapling.clone(),
            count: 95,
            min_dist: 28.0,
            dist_span: 345.0,
            dist_step: 23.7,
            phase: 0.85,
            min_y: -14.0,
            max_y: 22.0,
            base_scale: 1.45,
            scale_step: 0.28,
            scale_mod: 4,
            sink_y: 0.14,
            tier: CullTier::Tree,
            policy: SceneMaterialPolicy::foliage_tree(false),
        },
        FoliageLayerSpec {
            label: "ForestFern",
            asset_rel: cfg.env.fern.clone(),
            count: 180,
            min_dist: 16.0,
            dist_span: 335.0,
            dist_step: 17.9,
            phase: 0.55,
            min_y: -14.0,
            max_y: 18.0,
            base_scale: 1.35,
            scale_step: 0.32,
            scale_mod: 4,
            sink_y: 0.05,
            tier: CullTier::Detail,
            policy: SceneMaterialPolicy::foliage_ground(),
        },
        FoliageLayerSpec {
            label: "WildWeed",
            asset_rel: cfg.env.weed.clone(),
            count: 190,
            min_dist: 10.0,
            dist_span: 330.0,
            dist_step: 13.4,
            phase: 2.1,
            min_y: -14.0,
            max_y: 16.0,
            base_scale: 1.15,
            scale_step: 0.25,
            scale_mod: 5,
            sink_y: 0.04,
            tier: CullTier::Detail,
            policy: SceneMaterialPolicy::foliage_ground(),
        },
    ];

    for layer in layers {
        let scene_handle: Handle<Scene> = asset_server.load(format!("{}#Scene0", layer.asset_rel));
        for i in 0..layer.count {
            let fi = i as f64;
            let angle = fi * 2.3999632 + layer.phase + (i % 7) as f64 * 0.13;
            let dist = layer.min_dist + (fi * layer.dist_step) % layer.dist_span;
            let x = angle.cos() * dist;
            let z = angle.sin() * dist;

            if is_near_water(x, z, wcfg) {
                continue;
            }
            let y = get_mesh_terrain_height(x, z, wcfg);
            if y < layer.min_y || y > layer.max_y {
                continue;
            }

            let s = layer.base_scale + (i % layer.scale_mod) as f32 * layer.scale_step;
            let tilt_x = ((i % 5) as f32 - 2.0) * 0.015;
            let tilt_z = ((i % 3) as f32 - 1.0) * 0.015;
            let rot = Quat::from_euler(EulerRot::YXZ, (i as f32) * 1.43, tilt_x, tilt_z);

            commands.spawn((
                Name::new(layer.label),
                SceneRoot(scene_handle.clone()),
                layer.policy,
                DistanceCulled {
                    world_xz: Vec2::new(x as f32, z as f32),
                    tier: layer.tier,
                    extra_radius: if layer.tier == CullTier::Tree { 8.0 } else { 2.0 },
                    density_rank: ((i * 37) % 100) as f32 / 100.0,
                },
                Transform::from_xyz(x as f32, (y as f32) - layer.sink_y, z as f32)
                    .with_rotation(rot)
                    .with_scale(Vec3::splat(s)),
            ));
        }
    }

    // 3. Cỏ ven bờ 2 hồ nước Oasis & Highland Lake
    let weed_handle: Handle<Scene> = asset_server.load(format!("{}#Scene0", cfg.env.weed));
    let weed_policy = SceneMaterialPolicy::foliage_ground();
    spawn_shore_ring(
        &mut commands,
        &weed_handle,
        weed_policy,
        wcfg,
        wcfg.oasis_x,
        wcfg.oasis_z,
        wcfg.oasis_radius,
        28,
    );
    spawn_shore_ring(
        &mut commands,
        &weed_handle,
        weed_policy,
        wcfg,
        wcfg.highland_lake_x,
        wcfg.highland_lake_z,
        wcfg.highland_lake_radius,
        32,
    );
}

#[allow(clippy::too_many_arguments)]
fn spawn_shore_ring(
    commands: &mut Commands,
    scene_handle: &Handle<Scene>,
    policy: SceneMaterialPolicy,
    wcfg: &crate::core::config::WorldConfig,
    lx: f64,
    lz: f64,
    radius: f64,
    count: usize,
) {
    for i in 0..count {
        let a = (i as f64 / count as f64) * std::f64::consts::TAU + (i % 3) as f64 * 0.05;
        let r = radius + 2.8 + (i % 4) as f64 * 1.3;
        let x = lx + a.cos() * r;
        let z = lz + a.sin() * r;
        let y = get_mesh_terrain_height(x, z, wcfg);
        if y > -0.7 && y < 2.6 {
            let s = 1.25 + (i % 3) as f32 * 0.3;
            commands.spawn((
                Name::new("ShoreWeed"),
                SceneRoot(scene_handle.clone()),
                policy,
                DistanceCulled {
                    world_xz: Vec2::new(x as f32, z as f32),
                    tier: CullTier::Detail,
                    extra_radius: 2.0,
                    density_rank: ((i * 37) % 100) as f32 / 100.0,
                },
                Transform::from_xyz(x as f32, (y as f32) - 0.04, z as f32)
                    .with_rotation(Quat::from_rotation_y(a as f32))
                    .with_scale(Vec3::splat(s)),
            ));
        }
    }
}

/// Hệ thống Distance + Density Culling có tiết lưu (chạy tối đa ~8Hz) + tự cắt tầm vẽ theo sương mù / Quality.
pub fn cull_world_props(
    time: Res<Time>,
    net: Res<WorldNetState>,
    settings: Res<RuntimeSettings>,
    atmo: Res<AtmosphereState>,
    mut last_pos: Local<Vec2>,
    mut timer: Local<f32>,
    mut props: Query<(&DistanceCulled, &mut Visibility)>,
) {
    let player_xz = Vec2::new(net.local_pos.x, net.local_pos.z);
    *timer += time.delta_secs();
    let moved_sq = player_xz.distance_squared(*last_pos);
    if *timer < 0.12 && moved_sq < 12.25 && !settings.is_changed() {
        return;
    }
    *timer = 0.0;
    *last_pos = player_xz;

    let fog_cap = (atmo.effective_fog_end + 18.0).max(58.0);
    let tree_max = settings.quality.tree_cull_dist().min(fog_cap);
    let rock_max = (tree_max * 0.85).min(fog_cap);
    let detail_max = settings.quality.detail_cull_dist().min(fog_cap * 0.85);
    let item_max = (tree_max * 0.95).min(fog_cap);
    let density_limit = settings.quality.foliage_density();

    for (prop, mut vis) in &mut props {
        let within_density = match prop.tier {
            CullTier::Tree | CullTier::Detail => prop.density_rank <= density_limit,
            CullTier::Rock | CullTier::Item => true,
        };
        let desired = if within_density {
            let max_d = match prop.tier {
                CullTier::Tree => tree_max,
                CullTier::Rock => rock_max,
                CullTier::Detail => detail_max,
                CullTier::Item => item_max,
            } + prop.extra_radius;
            if prop.world_xz.distance_squared(player_xz) <= max_d * max_d {
                Visibility::Inherited
            } else {
                Visibility::Hidden
            }
        } else {
            Visibility::Hidden
        };
        if *vis != desired {
            *vis = desired;
        }
    }
}