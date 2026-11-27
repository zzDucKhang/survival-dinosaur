use super::atmosphere::AtmosphereState;
use crate::core::config::GameConfig;
use bevy::pbr::NotShadowCaster;
use bevy::prelude::*;
use std::f32::consts::FRAC_PI_2;

#[derive(Clone, Debug)]
pub struct WaterBodySpec {
    pub name: &'static str,
    pub center: Vec2,
    pub visual_radius: f32,
    pub water_level: f32,
}

#[derive(Resource)]
pub struct WaterRegistry {
    pub bodies: Vec<WaterBodySpec>,
    pub shared_material: Handle<StandardMaterial>,
    pub foam_material: Handle<StandardMaterial>,
}

#[derive(Component)]
pub struct WaterSurface {
    pub base_y: f32,
    pub phase: f32,
}

#[derive(Component)]
pub struct ShoreFoamRing {
    pub base_y: f32,
    pub phase: f32,
}

pub fn spawn_water_bodies(
    mut commands: Commands,
    cfg: Res<GameConfig>,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    let w = &cfg.world;
    let bodies = vec![
        WaterBodySpec {
            name: "OasisLake",
            center: Vec2::new(w.oasis_x as f32, w.oasis_z as f32),
            visual_radius: (w.oasis_radius + 5.5) as f32,
            water_level: w.water_level as f32,
        },
        WaterBodySpec {
            name: "HighlandLake",
            center: Vec2::new(w.highland_lake_x as f32, w.highland_lake_z as f32),
            visual_radius: (w.highland_lake_radius + 6.5) as f32,
            water_level: w.water_level as f32,
        },
    ];

    let shared_material = materials.add(StandardMaterial {
        base_color: Color::srgba(0.05, 0.42, 0.56, 0.82),
        perceptual_roughness: 0.08,
        metallic: 0.12,
        reflectance: 0.88,
        alpha_mode: AlphaMode::Blend,
        double_sided: true,
        cull_mode: None,
        ..default()
    });

    let foam_material = materials.add(StandardMaterial {
        base_color: Color::srgba(0.84, 0.96, 1.0, 0.30),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        double_sided: true,
        cull_mode: None,
        ..default()
    });

    for (idx, body) in bodies.iter().enumerate() {
        let mesh = meshes.add(Circle::new(body.visual_radius));
        commands.spawn((
            Name::new(body.name),
            WaterSurface {
                base_y: body.water_level,
                phase: idx as f32 * 1.7,
            },
            Mesh3d(mesh),
            MeshMaterial3d(shared_material.clone()),
            Transform::from_xyz(body.center.x, body.water_level, body.center.y)
                .with_rotation(Quat::from_rotation_x(-FRAC_PI_2)),
            NotShadowCaster,
        ));

        let foam_mesh = meshes.add(Annulus::new(
            (body.visual_radius - 1.5).max(1.0),
            body.visual_radius + 0.45,
        ));
        commands.spawn((
            Name::new(format!("{}_Foam", body.name)),
            ShoreFoamRing {
                base_y: body.water_level + 0.03,
                phase: idx as f32 * 1.7,
            },
            Mesh3d(foam_mesh),
            MeshMaterial3d(foam_material.clone()),
            Transform::from_xyz(body.center.x, body.water_level + 0.03, body.center.y)
                .with_rotation(Quat::from_rotation_x(-FRAC_PI_2)),
            NotShadowCaster,
        ));
    }

    commands.insert_resource(WaterRegistry {
        bodies,
        shared_material,
        foam_material,
    });
}

pub fn animate_water_surfaces(
    time: Res<Time>,
    atmo: Res<AtmosphereState>,
    water_reg: Option<Res<WaterRegistry>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    mut surfaces: Query<(&WaterSurface, &mut Transform), Without<ShoreFoamRing>>,
    mut foams: Query<(&ShoreFoamRing, &mut Transform), Without<WaterSurface>>,
    mut mat_timer: Local<f32>,
) {
    let Some(reg) = water_reg else {
        return;
    };
    let t = time.elapsed_secs();
    let wave_amp = 0.035 + atmo.storm_blend * 0.055;

    for (surf, mut tf) in &mut surfaces {
        tf.translation.y = surf.base_y + (t * 1.5 + surf.phase).sin() * wave_amp;
    }
    for (foam, mut tf) in &mut foams {
        let wave = (t * 1.5 + foam.phase).sin();
        tf.translation.y = foam.base_y + wave * wave_amp;
        let s = 1.0 + wave * 0.008;
        tf.scale = Vec3::new(s, s, 1.0);
    }

    *mat_timer -= time.delta_secs();
    if *mat_timer > 0.0 {
        return;
    }
    *mat_timer = 0.125;

    if let Some(mat) = materials.get_mut(&reg.shared_material) {
        let day_col = [
            0.05 * (1.0 - atmo.storm_blend * 0.45),
            0.42 * (1.0 - atmo.storm_blend * 0.42),
            0.56 * (1.0 - atmo.storm_blend * 0.38),
        ];
        let night_col = [0.02, 0.08, 0.17];
        let mut r = night_col[0] + (day_col[0] - night_col[0]) * atmo.day_factor;
        let mut g = night_col[1] + (day_col[1] - night_col[1]) * atmo.day_factor;
        let mut b = night_col[2] + (day_col[2] - night_col[2]) * atmo.day_factor;

        if atmo.nv_strength > 0.01 {
            let nv = atmo.nv_strength * 0.5;
            r = r * (1.0 - nv) + 0.08 * nv;
            g = g * (1.0 - nv) + 0.42 * nv;
            b = b * (1.0 - nv) + 0.30 * nv;
        }

        mat.base_color = Color::srgba(r, g, b, 0.82);
        mat.perceptual_roughness = 0.08 + atmo.storm_blend * 0.24;
    }

    if let Some(foam_mat) = materials.get_mut(&reg.foam_material) {
        let alpha = (0.12 + 0.20 * atmo.day_factor + 0.10 * atmo.storm_blend).clamp(0.08, 0.40);
        foam_mat.base_color = Color::srgba(0.84, 0.96, 1.0, alpha);
    }
}
