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
}

#[derive(Component)]
pub struct WaterSurface {
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
        base_color: Color::srgba(0.06, 0.36, 0.48, 0.84),
        perceptual_roughness: 0.14,
        metallic: 0.08,
        reflectance: 0.65,
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
    }

    commands.insert_resource(WaterRegistry {
        bodies,
        shared_material,
    });
}

pub fn animate_water_surfaces(
    time: Res<Time>,
    atmo: Res<AtmosphereState>,
    water_reg: Option<Res<WaterRegistry>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    mut surfaces: Query<(&WaterSurface, &mut Transform)>,
) {
    let Some(reg) = water_reg else {
        return;
    };
    let t = time.elapsed_secs();
    let wave_amp = 0.035 + atmo.storm_blend * 0.055;

    for (surf, mut tf) in &mut surfaces {
        tf.translation.y = surf.base_y + (t * 1.5 + surf.phase).sin() * wave_amp;
    }

    if let Some(mat) = materials.get_mut(&reg.shared_material) {
        let day_col = [
            0.06 * (1.0 - atmo.storm_blend * 0.45),
            0.38 * (1.0 - atmo.storm_blend * 0.42),
            0.50 * (1.0 - atmo.storm_blend * 0.38),
        ];
        let night_col = [0.02, 0.07, 0.15];
        let mut r = night_col[0] + (day_col[0] - night_col[0]) * atmo.day_factor;
        let mut g = night_col[1] + (day_col[1] - night_col[1]) * atmo.day_factor;
        let mut b = night_col[2] + (day_col[2] - night_col[2]) * atmo.day_factor;

        if atmo.nv_strength > 0.01 {
            let nv = atmo.nv_strength * 0.5;
            r = r * (1.0 - nv) + 0.08 * nv;
            g = g * (1.0 - nv) + 0.38 * nv;
            b = b * (1.0 - nv) + 0.28 * nv;
        }

        mat.base_color = Color::srgba(r, g, b, 0.84);
        mat.perceptual_roughness = 0.14 + atmo.storm_blend * 0.22;
    }
}