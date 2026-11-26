use crate::core::config::GameConfig;
use crate::core::math_terrain::get_mesh_terrain_height;
use crate::core::states::RuntimeSettings;
use crate::network::sync::WorldNetState;
use bevy::pbr::NotShadowCaster;
use bevy::prelude::*;
use std::f32::consts::FRAC_PI_2;

const SCENT_DURATION: f32 = 6.5;

#[derive(Component)]
pub struct ScentPulseRing;

#[derive(Component)]
pub struct ScentWaterBeacons;

#[derive(Component)]
pub struct DynamicScentBeacon;

#[derive(Resource)]
pub struct ScentAssets {
    pub meat_mesh: Handle<Mesh>,
    pub meat_mat: Handle<StandardMaterial>,
    pub plant_mesh: Handle<Mesh>,
    pub plant_mat: Handle<StandardMaterial>,
    pub blood_mesh: Handle<Mesh>,
    pub blood_mat: Handle<StandardMaterial>,
}

pub fn spawn_scent_fx(
    mut commands: Commands,
    cfg: Res<GameConfig>,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    // 1. Vòng sóng quét radar quanh khủng long
    let ring_mesh = meshes.add(Annulus::new(0.92, 1.0));
    let ring_mat = materials.add(StandardMaterial {
        base_color: Color::srgba(0.22, 0.74, 0.97, 0.52),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        double_sided: true,
        cull_mode: None,
        ..default()
    });
    commands.spawn((
        Name::new("ScentPulseRing"),
        ScentPulseRing,
        Mesh3d(ring_mesh),
        MeshMaterial3d(ring_mat),
        Transform::from_rotation(Quat::from_rotation_x(-FRAC_PI_2)),
        Visibility::Hidden,
        NotShadowCaster,
    ));

    // 2. 2 cột mùi nước cố định tại Hồ Oasis & Hồ Cao Nguyên
    let water_pillar_mesh = meshes.add(Cylinder::new(1.2, 48.0));
    let water_pillar_mat = materials.add(StandardMaterial {
        base_color: Color::srgba(0.22, 0.74, 0.97, 0.42),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });

    let oasis_beacon = commands
        .spawn((
            Mesh3d(water_pillar_mesh.clone()),
            MeshMaterial3d(water_pillar_mat.clone()),
            Transform::from_xyz(cfg.world.oasis_x as f32, 24.0, cfg.world.oasis_z as f32),
            NotShadowCaster,
        ))
        .id();
    let highland_beacon = commands
        .spawn((
            Mesh3d(water_pillar_mesh),
            MeshMaterial3d(water_pillar_mat),
            Transform::from_xyz(
                cfg.world.highland_lake_x as f32,
                24.0,
                cfg.world.highland_lake_z as f32,
            ),
            NotShadowCaster,
        ))
        .id();

    commands
        .spawn((
            Name::new("ScentWaterBeacons"),
            ScentWaterBeacons,
            Transform::IDENTITY,
            Visibility::Hidden,
        ))
        .add_children(&[oasis_beacon, highland_beacon]);

    // 3. Asset dùng chung cho cột mùi động (Thịt / Bụi quả / Vệt máu)
    commands.insert_resource(ScentAssets {
        meat_mesh: meshes.add(Cylinder::new(0.55, 32.0)),
        meat_mat: materials.add(StandardMaterial {
            base_color: Color::srgba(0.94, 0.27, 0.27, 0.46),
            unlit: true,
            alpha_mode: AlphaMode::Blend,
            ..default()
        }),
        plant_mesh: meshes.add(Cylinder::new(0.55, 32.0)),
        plant_mat: materials.add(StandardMaterial {
            base_color: Color::srgba(0.29, 0.87, 0.50, 0.44),
            unlit: true,
            alpha_mode: AlphaMode::Blend,
            ..default()
        }),
        blood_mesh: meshes.add(Cylinder::new(0.25, 6.8)),
        blood_mat: materials.add(StandardMaterial {
            base_color: Color::srgba(0.94, 0.18, 0.18, 0.52),
            unlit: true,
            alpha_mode: AlphaMode::Blend,
            ..default()
        }),
    });
}

#[allow(clippy::too_many_arguments)]
pub fn update_scent_fx(
    mut commands: Commands,
    time: Res<Time>,
    cfg: Res<GameConfig>,
    net: Res<WorldNetState>,
    settings: Res<RuntimeSettings>,
    assets: Res<ScentAssets>,
    mut ring_q: Query<(&mut Transform, &mut Visibility), (With<ScentPulseRing>, Without<ScentWaterBeacons>)>,
    mut water_q: Query<&mut Visibility, (With<ScentWaterBeacons>, Without<ScentPulseRing>)>,
    dyn_beacons: Query<Entity, With<DynamicScentBeacon>>,
    mut refresh_timer: Local<f32>,
    mut was_active: Local<bool>,
) {
    let active = settings.scent_remaining_sec > 0.0;

    if let Ok((mut ring_tf, mut ring_vis)) = ring_q.get_single_mut() {
        *ring_vis = if active {
            Visibility::Visible
        } else {
            Visibility::Hidden
        };
        if active {
            let progress = (1.0 - settings.scent_remaining_sec / SCENT_DURATION).clamp(0.0, 1.0);
            let radius = 3.0 + ((progress * 2.5) % 1.0) * 75.0;
            ring_tf.translation =
                Vec3::new(net.local_pos.x, net.local_pos.y + 0.35, net.local_pos.z);
            ring_tf.scale = Vec3::new(radius, radius, 1.0);
        }
    }

    if let Ok(mut w_vis) = water_q.get_single_mut() {
        *w_vis = if active {
            Visibility::Visible
        } else {
            Visibility::Hidden
        };
    }

    if !active {
        if *was_active {
            for e in &dyn_beacons {
                commands.entity(e).despawn_recursive();
            }
            *was_active = false;
            *refresh_timer = 0.0;
        }
        return;
    }

    *refresh_timer -= time.delta_secs();
    if *was_active && *refresh_timer > 0.0 {
        return;
    }
    *was_active = true;
    *refresh_timer = 0.5;

    for e in &dyn_beacons {
        commands.entity(e).despawn_recursive();
    }

    // Cột mùi thức ăn
    for f in net.foods.values() {
        if f.amount <= 0 {
            continue;
        }
        let y = get_mesh_terrain_height(f.x, f.z, &cfg.world) as f32;
        let (mesh, mat) = if f.food_type == "meat" {
            (assets.meat_mesh.clone(), assets.meat_mat.clone())
        } else {
            (assets.plant_mesh.clone(), assets.plant_mat.clone())
        };
        commands.spawn((
            DynamicScentBeacon,
            Mesh3d(mesh),
            MeshMaterial3d(mat),
            Transform::from_xyz(f.x as f32, y + 16.0, f.z as f32),
            NotShadowCaster,
        ));
    }

    // Cột mùi vệt máu truy dấu
    for bt in &net.blood_trails {
        let y = get_mesh_terrain_height(bt.x, bt.z, &cfg.world) as f32;
        commands.spawn((
            DynamicScentBeacon,
            Mesh3d(assets.blood_mesh.clone()),
            MeshMaterial3d(assets.blood_mat.clone()),
            Transform::from_xyz(bt.x as f32, y + 3.4, bt.z as f32),
            NotShadowCaster,
        ));
    }
}