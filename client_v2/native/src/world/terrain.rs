use crate::core::config::GameConfig;
use crate::core::math_terrain::get_terrain_height;
use bevy::image::{ImageAddressMode, ImageLoaderSettings, ImageSampler, ImageSamplerDescriptor};
use bevy::math::Affine2;
use bevy::prelude::*;
use bevy::render::mesh::{Indices, PrimitiveTopology};
use bevy::render::render_asset::RenderAssetUsages;

#[derive(Component)]
pub struct TerrainChunk {
    pub chunk_id: IVec2,
}

pub fn spawn_terrain(
    mut commands: Commands,
    cfg: Res<GameConfig>,
    asset_server: Res<AssetServer>,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    let mesh = build_terrain_mesh(&cfg.world);
    let mesh_handle = meshes.add(mesh);

    let ground_tex: Handle<Image> = asset_server.load_with_settings(
        cfg.env.ground_diffuse.clone(),
        |settings: &mut ImageLoaderSettings| {
            settings.sampler = ImageSampler::Descriptor(ImageSamplerDescriptor {
                address_mode_u: ImageAddressMode::Repeat,
                address_mode_v: ImageAddressMode::Repeat,
                ..default()
            });
        },
    );

    let material_handle = materials.add(StandardMaterial {
        base_color: Color::WHITE,
        base_color_texture: Some(ground_tex),
        uv_transform: Affine2::from_scale(Vec2::splat(68.0)),
        perceptual_roughness: 0.94,
        metallic: 0.02,
        ..default()
    });

    commands.spawn((
        Name::new("IslandTerrain_0_0"),
        TerrainChunk {
            chunk_id: IVec2::ZERO,
        },
        Mesh3d(mesh_handle),
        MeshMaterial3d(material_handle),
        Transform::IDENTITY,
    ));
}

fn build_terrain_mesh(wcfg: &crate::core::config::WorldConfig) -> Mesh {
    let segs = wcfg.terrain_segments.max(8);
    let size = wcfg.terrain_size;
    let half = size * 0.5;
    let step = size / (segs as f64);
    let verts_per_row = segs + 1;
    let total_verts = verts_per_row * verts_per_row;

    let mut positions = Vec::with_capacity(total_verts);
    let mut normals = Vec::with_capacity(total_verts);
    let mut uvs = Vec::with_capacity(total_verts);
    let mut colors = Vec::with_capacity(total_verts);

    let eps = step * 0.5;

    for iz in 0..=segs {
        let z = (iz as f64) * step - half;
        let v = (iz as f32) / (segs as f32);
        for ix in 0..=segs {
            let x = (ix as f64) * step - half;
            let u = (ix as f32) / (segs as f32);
            let y = get_terrain_height(x, z, wcfg);

            positions.push([x as f32, y as f32, z as f32]);
            uvs.push([u, v]);

            // Tính pháp tuyến giải tích bằng sai phân trung tâm (mượt & không lỗi biên)
            let h_l = get_terrain_height(x - eps, z, wcfg);
            let h_r = get_terrain_height(x + eps, z, wcfg);
            let h_d = get_terrain_height(x, z - eps, wcfg);
            let h_u = get_terrain_height(x, z + eps, wcfg);
            let n = Vec3::new(
                (h_l - h_r) as f32,
                (2.0 * eps) as f32,
                (h_d - h_u) as f32,
            )
            .normalize_or_zero();
            normals.push(n.to_array());

            colors.push(sample_biome_vertex_color(x, y, z));
        }
    }

    let mut indices = Vec::with_capacity(segs * segs * 6);
    for iz in 0..segs {
        for ix in 0..segs {
            let a = (iz * verts_per_row + ix) as u32;
            let b = ((iz + 1) * verts_per_row + ix) as u32;
            let c = ((iz + 1) * verts_per_row + ix + 1) as u32;
            let d = (iz * verts_per_row + ix + 1) as u32;

            // Khớp chính xác đường chéo tam giác với get_mesh_terrain_height (u + v <= 1)
            indices.extend_from_slice(&[a, b, d]);
            indices.extend_from_slice(&[b, c, d]);
        }
    }

    let mut mesh = Mesh::new(
        PrimitiveTopology::TriangleList,
        RenderAssetUsages::RENDER_WORLD,
    );
    mesh.insert_attribute(Mesh::ATTRIBUTE_POSITION, positions);
    mesh.insert_attribute(Mesh::ATTRIBUTE_NORMAL, normals);
    mesh.insert_attribute(Mesh::ATTRIBUTE_UV_0, uvs);
    mesh.insert_attribute(Mesh::ATTRIBUTE_COLOR, colors);
    mesh.insert_indices(Indices::U32(indices));
    mesh
}

fn sample_biome_vertex_color(x: f64, y: f64, z: f64) -> [f32; 4] {
    let variation = ((x * 0.045).sin() * (z * 0.045).cos() * 0.05) as f32;
    let y32 = y as f32;

    let base = if y32 < -0.5 {
        [0.44, 0.48, 0.36]
    } else if y32 < 0.5 {
        let t = (y32 + 0.5).clamp(0.0, 1.0);
        lerp_rgb([0.68, 0.62, 0.48], [0.56, 0.68, 0.48], t)
    } else if y32 < 9.0 {
        let t = ((y32 - 0.5) / 8.5).clamp(0.0, 1.0);
        lerp_rgb([0.55, 0.67, 0.46], [0.44, 0.58, 0.41], t)
    } else if y32 < 18.0 {
        let t = ((y32 - 9.0) / 9.0).clamp(0.0, 1.0);
        lerp_rgb([0.44, 0.58, 0.41], [0.52, 0.55, 0.58], t)
    } else if y32 < 29.0 {
        let t = ((y32 - 18.0) / 11.0).clamp(0.0, 1.0);
        lerp_rgb([0.52, 0.55, 0.58], [0.68, 0.72, 0.76], t)
    } else {
        [0.76, 0.80, 0.84]
    };

    [
        (base[0] + variation).clamp(0.05, 1.0),
        (base[1] + variation).clamp(0.05, 1.0),
        (base[2] + variation).clamp(0.05, 1.0),
        1.0,
    ]
}

fn lerp_rgb(a: [f32; 3], b: [f32; 3], t: f32) -> [f32; 3] {
    [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    ]
}