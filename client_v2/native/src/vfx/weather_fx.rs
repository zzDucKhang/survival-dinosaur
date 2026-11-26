use crate::core::states::{GraphicsQuality, RuntimeSettings};
use crate::network::sync::WorldNetState;
use bevy::pbr::NotShadowCaster;
use bevy::prelude::*;
use bevy::render::mesh::{PrimitiveTopology, VertexAttributeValues};
use bevy::render::render_asset::RenderAssetUsages;

const MAX_RAIN_DROPS: usize = 420;
const RAIN_AREA: f32 = 64.0;
const RAIN_HEIGHT: f32 = 30.0;

#[derive(Component)]
pub struct RainSheetMesh {
    pub mesh_handle: Handle<Mesh>,
    pub mat_handle: Handle<StandardMaterial>,
}

#[derive(Resource)]
pub struct RainDropPool {
    pub offsets: Vec<Vec3>,
    pub speeds: Vec<f32>,
}

impl Default for RainDropPool {
    fn default() -> Self {
        let mut offsets = Vec::with_capacity(MAX_RAIN_DROPS);
        let mut speeds = Vec::with_capacity(MAX_RAIN_DROPS);

        for i in 0..MAX_RAIN_DROPS {
            let fi = i as f32;
            let rx = hash01(fi * 12.9898 + 1.0) - 0.5;
            let ry = hash01(fi * 78.233 + 2.0);
            let rz = hash01(fi * 37.719 + 3.0) - 0.5;
            offsets.push(Vec3::new(rx * RAIN_AREA, ry * RAIN_HEIGHT, rz * RAIN_AREA));
            speeds.push(26.0 + hash01(fi * 93.989 + 4.0) * 14.0);
        }

        Self { offsets, speeds }
    }
}

pub fn spawn_weather_fx(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    let vert_count = MAX_RAIN_DROPS * 3;
    let positions = vec![[0.0_f32, -9999.0, 0.0]; vert_count];
    let normals = vec![[0.0_f32, 0.0, 1.0]; vert_count];
    let uvs = vec![[0.0_f32, 0.0]; vert_count];

    let mut mesh = Mesh::new(
        PrimitiveTopology::TriangleList,
        RenderAssetUsages::MAIN_WORLD | RenderAssetUsages::RENDER_WORLD,
    );
    mesh.insert_attribute(Mesh::ATTRIBUTE_POSITION, positions);
    mesh.insert_attribute(Mesh::ATTRIBUTE_NORMAL, normals);
    mesh.insert_attribute(Mesh::ATTRIBUTE_UV_0, uvs);

    let mesh_handle = meshes.add(mesh);
    let mat_handle = materials.add(StandardMaterial {
        base_color: Color::srgba(0.80, 0.86, 0.94, 0.34),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        double_sided: true,
        cull_mode: None,
        ..default()
    });

    commands.spawn((
        Name::new("WeatherRainSheet"),
        RainSheetMesh {
            mesh_handle: mesh_handle.clone(),
            mat_handle: mat_handle.clone(),
        },
        Mesh3d(mesh_handle),
        MeshMaterial3d(mat_handle),
        Transform::IDENTITY,
        Visibility::Hidden,
        NotShadowCaster,
    ));
}

pub fn update_weather_fx(
    time: Res<Time>,
    net: Res<WorldNetState>,
    settings: Res<RuntimeSettings>,
    mut pool: ResMut<RainDropPool>,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    mut rain_q: Query<(&RainSheetMesh, &mut Visibility)>,
) {
    let Ok((sheet, mut vis)) = rain_q.get_single_mut() else {
        return;
    };

    let is_storm = net.weather == "storm";
    let is_raining = is_storm || net.weather == "rain";
    if !is_raining {
        if *vis != Visibility::Hidden {
            *vis = Visibility::Hidden;
        }
        return;
    }

    if *vis != Visibility::Visible {
        *vis = Visibility::Visible;
    }

    let dt = time.delta_secs().min(0.08);
    let active_drops = match settings.quality {
        GraphicsQuality::Low => if is_storm { 180 } else { 120 },
        GraphicsQuality::Medium => if is_storm { 300 } else { 200 },
        GraphicsQuality::High => if is_storm { 420 } else { 290 },
    };

    let wind_x = if is_storm { 5.2 } else { 1.6 };
    let streak_len = if is_storm { 1.45 } else { 1.0 };
    let fall_mult = if is_storm { 1.35 } else { 1.0 };
    let half_w = 0.035;
    let p = net.local_pos;

    if let Some(mat) = materials.get_mut(&sheet.mat_handle) {
        let alpha = if is_storm { 0.44 } else { 0.30 };
        mat.base_color = Color::srgba(0.80, 0.86, 0.94, alpha);
    }

    let Some(mesh) = meshes.get_mut(&sheet.mesh_handle) else {
        return;
    };
    let Some(VertexAttributeValues::Float32x3(positions)) =
        mesh.attribute_mut(Mesh::ATTRIBUTE_POSITION)
    else {
        return;
    };

    let t_seed = time.elapsed_secs();
    for i in 0..MAX_RAIN_DROPS {
        let vi = i * 3;
        if i >= active_drops {
            positions[vi] = [0.0, -9999.0, 0.0];
            positions[vi + 1] = [0.0, -9999.0, 0.0];
            positions[vi + 2] = [0.0, -9999.0, 0.0];
            continue;
        }

        let off = &mut pool.offsets[i];
        off.y -= pool.speeds[i] * fall_mult * dt;
        off.x += wind_x * dt;

        if off.y < -2.0 {
            let s = (i as f32) * 1.37 + t_seed;
            off.y = RAIN_HEIGHT;
            off.x = (hash01(s * 12.9898) - 0.5) * RAIN_AREA;
            off.z = (hash01(s * 78.233) - 0.5) * RAIN_AREA;
        }

        let wx = p.x + off.x;
        let wy = p.y + off.y;
        let wz = p.z + off.z;
        let tx = wx - wind_x * 0.05;
        let ty = wy + streak_len;

        positions[vi] = [wx, wy, wz];
        positions[vi + 1] = [tx - half_w, ty, wz];
        positions[vi + 2] = [tx + half_w, ty, wz + half_w];
    }
}

fn hash01(v: f32) -> f32 {
    (v.sin() * 43758.545).fract().abs()
}