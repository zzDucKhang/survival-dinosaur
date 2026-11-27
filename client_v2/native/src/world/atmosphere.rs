use crate::core::config::GameConfig;
use crate::core::states::{GraphicsQuality, RuntimeSettings};
use crate::network::sync::WorldNetState;
use bevy::pbr::{CascadeShadowConfigBuilder, DistanceFog, FogFalloff, NotShadowCaster, NotShadowReceiver};
use bevy::prelude::*;
use bevy::render::camera::Exposure;
use bevy::render::mesh::{Indices, PrimitiveTopology, VertexAttributeValues};
use bevy::render::render_asset::RenderAssetUsages;

#[derive(Clone, Copy)]
struct WeatherProfile {
    fog_weight: f32,
    storm_weight: f32,
}

fn weather_profile(weather: &str) -> WeatherProfile {
    match weather {
        "fog" => WeatherProfile {
            fog_weight: 1.0,
            storm_weight: 0.15,
        },
        "rain" => WeatherProfile {
            fog_weight: 0.55,
            storm_weight: 0.55,
        },
        "storm" => WeatherProfile {
            fog_weight: 0.85,
            storm_weight: 1.0,
        },
        _ => WeatherProfile {
            fog_weight: 0.0,
            storm_weight: 0.0,
        },
    }
}

#[derive(Resource)]
pub struct AtmosphereState {
    pub day_factor: f32,
    pub night_factor: f32,
    pub nv_strength: f32,
    pub fog_blend: f32,
    pub storm_blend: f32,
    pub lightning_flash: f32,
    pub effective_fog_end: f32,
    next_lightning_sec: f32,
}

impl Default for AtmosphereState {
    fn default() -> Self {
        Self {
            day_factor: 1.0,
            night_factor: 0.0,
            nv_strength: 0.0,
            fog_blend: 0.0,
            storm_blend: 0.0,
            lightning_flash: 0.0,
            effective_fog_end: 420.0,
            next_lightning_sec: 8.0,
        }
    }
}

#[derive(Component)]
pub struct SunMoonLight;

#[derive(Component)]
pub struct SunOrb;

#[derive(Component)]
pub struct MoonOrb;

#[derive(Component)]
pub struct NightVisionLight;

#[derive(Component)]
pub struct SkyDome {
    pub mesh_handle: Handle<Mesh>,
    pub vertex_heights: Vec<f32>,
}

#[derive(Component)]
pub struct StarfieldDome {
    pub mat_handle: Handle<StandardMaterial>,
}

fn build_sky_dome_mesh(radius: f32, rings: usize, sectors: usize) -> (Mesh, Vec<f32>) {
    let mut positions = Vec::with_capacity((rings + 1) * (sectors + 1));
    let mut normals = Vec::with_capacity((rings + 1) * (sectors + 1));
    let mut colors = Vec::with_capacity((rings + 1) * (sectors + 1));
    let mut vertex_heights = Vec::with_capacity((rings + 1) * (sectors + 1));
    let mut indices = Vec::with_capacity(rings * sectors * 6);

    for r in 0..=rings {
        let v = r as f32 / rings as f32;
        let phi = -0.20 + v * (std::f32::consts::FRAC_PI_2 + 0.20);
        let y = phi.sin() * radius;
        let ring_r = phi.cos() * radius;
        let h_t = (y / 380.0).clamp(0.0, 1.0).powf(0.65);
        for s in 0..=sectors {
            let u = s as f32 / sectors as f32;
            let theta = u * std::f32::consts::TAU;
            let x = theta.cos() * ring_r;
            let z = theta.sin() * ring_r;
            positions.push([x, y, z]);
            normals.push([0.0, -1.0, 0.0]);
            colors.push([0.45, 0.61, 0.70, 1.0]);
            vertex_heights.push(h_t);
        }
    }

    let stride = sectors + 1;
    for r in 0..rings {
        for s in 0..sectors {
            let a = (r * stride + s) as u32;
            let b = ((r + 1) * stride + s) as u32;
            let c = ((r + 1) * stride + s + 1) as u32;
            let d = (r * stride + s + 1) as u32;
            indices.extend_from_slice(&[a, d, b, b, d, c]);
        }
    }

    let mut mesh = Mesh::new(
        PrimitiveTopology::TriangleList,
        RenderAssetUsages::MAIN_WORLD | RenderAssetUsages::RENDER_WORLD,
    );
    mesh.insert_attribute(Mesh::ATTRIBUTE_POSITION, positions);
    mesh.insert_attribute(Mesh::ATTRIBUTE_NORMAL, normals);
    mesh.insert_attribute(Mesh::ATTRIBUTE_COLOR, colors);
    mesh.insert_indices(Indices::U32(indices));
    (mesh, vertex_heights)
}

fn build_starfield_mesh(radius: f32, count: usize) -> Mesh {
    let mut positions = Vec::with_capacity(count * 3);
    let mut normals = Vec::with_capacity(count * 3);

    for i in 0..count {
        let fi = i as f32;
        let h1 = ((fi * 12.9898 + 1.7).sin() * 43758.545).fract().abs();
        let h2 = ((fi * 78.233 + 3.1).sin() * 29731.123).fract().abs();
        let theta = h1 * std::f32::consts::TAU;
        let phi = 0.16 + h2 * 1.25;
        let dir = Vec3::new(
            phi.cos() * theta.cos(),
            phi.sin(),
            phi.cos() * theta.sin(),
        )
        .normalize();

        let center = dir * radius;
        let tangent = dir.cross(Vec3::Y).normalize_or_zero();
        let bitangent = dir.cross(tangent).normalize_or_zero();
        let size = 1.1 + (i % 3) as f32 * 0.55;

        let p0 = center + bitangent * size;
        let p1 = center - tangent * size - bitangent * (size * 0.6);
        let p2 = center + tangent * size - bitangent * (size * 0.6);

        positions.push(p0.to_array());
        positions.push(p1.to_array());
        positions.push(p2.to_array());
        let n = (-dir).to_array();
        normals.push(n);
        normals.push(n);
        normals.push(n);
    }

    let mut mesh = Mesh::new(
        PrimitiveTopology::TriangleList,
        RenderAssetUsages::RENDER_WORLD,
    );
    mesh.insert_attribute(Mesh::ATTRIBUTE_POSITION, positions);
    mesh.insert_attribute(Mesh::ATTRIBUTE_NORMAL, normals);
    mesh
}

pub fn setup_atmosphere(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    // 1. Nguồn sáng chính (Mặt trời ban ngày / Ánh trăng ban đêm), shadow cascade gọn nhẹ cho GPU tích hợp
    let cascades = CascadeShadowConfigBuilder {
        num_cascades: 2,
        first_cascade_far_bound: 32.0,
        maximum_distance: 105.0,
        ..default()
    }
    .build();

    commands.spawn((
        Name::new("SunMoonLight"),
        SunMoonLight,
        DirectionalLight {
            illuminance: 15_500.0,
            shadows_enabled: true,
            color: Color::srgb(1.0, 0.94, 0.86),
            ..default()
        },
        cascades,
        Transform::from_xyz(60.0, 90.0, 40.0).looking_at(Vec3::ZERO, Vec3::Y),
    ));

    // 2. Vòm bầu trời gradient (zenith -> đường chân trời, không bị distance fog che)
    let (sky_mesh, vertex_heights) = build_sky_dome_mesh(435.0, 12, 20);
    let sky_mesh_handle = meshes.add(sky_mesh);
    let sky_mat = materials.add(StandardMaterial {
        base_color: Color::WHITE,
        unlit: true,
        fog_enabled: false,
        double_sided: true,
        cull_mode: None,
        ..default()
    });
    commands.spawn((
        Name::new("SkyDome"),
        SkyDome {
            mesh_handle: sky_mesh_handle.clone(),
            vertex_heights,
        },
        Mesh3d(sky_mesh_handle),
        MeshMaterial3d(sky_mat),
        Transform::IDENTITY,
        NotShadowCaster,
        NotShadowReceiver,
    ));

    // 3. Mặt trời ban ngày + hào quang
    let sun_mesh = meshes.add(Sphere::new(16.0));
    let sun_mat = materials.add(StandardMaterial {
        base_color: Color::srgb(1.0, 0.96, 0.82),
        emissive: LinearRgba::rgb(2.2, 1.8, 1.1),
        unlit: true,
        fog_enabled: false,
        ..default()
    });
    let sun_halo_mesh = meshes.add(Sphere::new(28.0));
    let sun_halo_mat = materials.add(StandardMaterial {
        base_color: Color::srgba(1.0, 0.86, 0.56, 0.24),
        unlit: true,
        fog_enabled: false,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });
    let sun_halo = commands
        .spawn((
            Mesh3d(sun_halo_mesh),
            MeshMaterial3d(sun_halo_mat),
            Transform::IDENTITY,
            NotShadowCaster,
        ))
        .id();
    commands
        .spawn((
            Name::new("SunOrb"),
            SunOrb,
            Mesh3d(sun_mesh),
            MeshMaterial3d(sun_mat),
            Transform::from_xyz(240.0, 220.0, 120.0),
            NotShadowCaster,
        ))
        .add_child(sun_halo);

    // 4. Mặt trăng + bầu trời sao ban đêm (fog_enabled: false để không bị sương mù xóa mất)
    let moon_mesh = meshes.add(Sphere::new(16.0));
    let moon_mat = materials.add(StandardMaterial {
        base_color: Color::srgb(0.95, 0.98, 1.0),
        emissive: LinearRgba::rgb(0.8, 0.9, 1.2),
        unlit: true,
        fog_enabled: false,
        ..default()
    });
    commands.spawn((
        Name::new("MoonOrb"),
        MoonOrb,
        Mesh3d(moon_mesh),
        MeshMaterial3d(moon_mat),
        Transform::from_xyz(-260.0, 220.0, -140.0),
        Visibility::Hidden,
        NotShadowCaster,
    ));

    let star_mesh = meshes.add(build_starfield_mesh(415.0, 96));
    let star_mat = materials.add(StandardMaterial {
        base_color: Color::srgba(0.92, 0.96, 1.0, 0.0),
        unlit: true,
        fog_enabled: false,
        alpha_mode: AlphaMode::Blend,
        double_sided: true,
        cull_mode: None,
        ..default()
    });
    commands.spawn((
        Name::new("StarfieldDome"),
        StarfieldDome {
            mat_handle: star_mat.clone(),
        },
        Mesh3d(star_mesh),
        MeshMaterial3d(star_mat),
        Transform::IDENTITY,
        Visibility::Hidden,
        NotShadowCaster,
    ));

    // 5. Đèn Night Vision [N] bám theo nhân vật (tắt bóng để không tốn GPU)
    commands.spawn((
        Name::new("NightVisionLight"),
        NightVisionLight,
        PointLight {
            color: Color::srgb(0.65, 0.96, 0.82),
            intensity: 0.0,
            range: 55.0,
            shadows_enabled: false,
            ..default()
        },
        Transform::from_xyz(0.0, 9.0, 0.0),
        Visibility::Hidden,
    ));
}

#[allow(clippy::too_many_arguments)]
pub fn update_atmosphere(
    time: Res<Time>,
    cfg: Res<GameConfig>,
    net: Res<WorldNetState>,
    settings: Res<RuntimeSettings>,
    mut atmo: ResMut<AtmosphereState>,
    mut clear_color: ResMut<ClearColor>,
    mut ambient: ResMut<AmbientLight>,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    mut sun_q: Query<(&mut DirectionalLight, &mut Transform), (With<SunMoonLight>, Without<MoonOrb>, Without<SunOrb>, Without<NightVisionLight>, Without<SkyDome>, Without<StarfieldDome>)>,
    mut sun_orb_q: Query<(&mut Transform, &mut Visibility), (With<SunOrb>, Without<SunMoonLight>, Without<MoonOrb>, Without<NightVisionLight>, Without<SkyDome>, Without<StarfieldDome>)>,
    mut moon_q: Query<(&mut Transform, &mut Visibility), (With<MoonOrb>, Without<SunMoonLight>, Without<SunOrb>, Without<NightVisionLight>, Without<SkyDome>, Without<StarfieldDome>)>,
    mut sky_q: Query<(&SkyDome, &mut Transform), (Without<SunMoonLight>, Without<SunOrb>, Without<MoonOrb>, Without<NightVisionLight>, Without<StarfieldDome>)>,
    mut star_q: Query<(&StarfieldDome, &mut Transform, &mut Visibility), (Without<SunMoonLight>, Without<SunOrb>, Without<MoonOrb>, Without<NightVisionLight>, Without<SkyDome>)>,
    mut nv_q: Query<(&mut PointLight, &mut Transform, &mut Visibility), (With<NightVisionLight>, Without<SunMoonLight>, Without<SunOrb>, Without<MoonOrb>, Without<SkyDome>, Without<StarfieldDome>)>,
    mut cam_q: Query<(&mut DistanceFog, Option<&mut Exposure>), With<Camera3d>>,
    mut sky_timer: Local<f32>,
    mut prev_star_alpha: Local<f32>,
) {
    let dt = time.delta_secs().min(0.1);
    let prof = weather_profile(&net.weather);

    let blend_speed = (dt * 0.7).min(1.0);
    atmo.fog_blend += (prof.fog_weight - atmo.fog_blend) * blend_speed;
    atmo.storm_blend += (prof.storm_weight - atmo.storm_blend) * blend_speed;

    // Sấm chớp khi bão giông
    if net.weather == "storm" {
        atmo.next_lightning_sec -= dt;
        if atmo.next_lightning_sec <= 0.0 {
            atmo.lightning_flash = 1.0;
            let pseudo = ((time.elapsed_secs() * 17.31).sin().abs()) * 11.0;
            atmo.next_lightning_sec = 8.0 + pseudo;
        }
    }
    if atmo.lightning_flash > 0.0 {
        atmo.lightning_flash = (atmo.lightning_flash - dt * 2.8).max(0.0);
    }

    let sun_angle = (net.world_time - 0.25) * std::f32::consts::TAU;
    let sun_height = sun_angle.sin();
    let sun_dir = Vec3::new(sun_angle.cos() * 140.0, sun_height * 140.0, 60.0);
    let moon_dir = Vec3::new(-sun_dir.x, -sun_dir.y, -55.0);

    let day = ((sun_height + 0.10) / 0.48).clamp(0.0, 1.0);
    let night = 1.0 - day;
    let twilight = 1.0 - (sun_height.abs() / 0.28).min(1.0);
    let nv_strength = if settings.night_vision {
        ((night - 0.12) / 0.45).clamp(0.0, 1.0)
    } else {
        0.0
    };

    atmo.day_factor = day;
    atmo.night_factor = night;
    atmo.nv_strength = nv_strength;

    let spec = cfg.get_species(&net.my_model);
    let nv_radius = if spec.is_carnivore() { 55.0 } else { 42.0 };
    let flash = atmo.lightning_flash;
    let storm = atmo.storm_blend;
    let fog_w = atmo.fog_blend;

    // 1. Màu đường chân trời & thiên đỉnh bầu trời
    let mut horizon = lerp3([0.045, 0.09, 0.18], [0.56, 0.72, 0.80], day);
    let mut zenith = lerp3([0.015, 0.035, 0.09], [0.18, 0.42, 0.72], day);
    if twilight > 0.08 {
        horizon = lerp3(horizon, [0.85, 0.46, 0.29], twilight * 0.56);
        zenith = lerp3(zenith, [0.24, 0.22, 0.44], twilight * 0.40);
    }
    if storm > 0.01 {
        horizon = lerp3(horizon, [0.14, 0.18, 0.24], storm * (0.45 + day * 0.45));
        zenith = lerp3(zenith, [0.06, 0.09, 0.13], storm * (0.5 + day * 0.4));
    }
    if nv_strength > 0.01 {
        horizon = lerp3(horizon, [0.02, 0.08, 0.05], nv_strength * 0.85);
        zenith = lerp3(zenith, [0.01, 0.04, 0.03], nv_strength * 0.85);
    }
    if flash > 0.01 {
        horizon = lerp3(horizon, [0.88, 0.94, 1.0], flash * 0.55);
        zenith = lerp3(zenith, [0.75, 0.86, 1.0], flash * 0.45);
    }
    clear_color.0 = Color::srgb(horizon[0], horizon[1], horizon[2]);

    // 2. Khoảng cách sương mù & Exposure trên Camera
    let normal_start = (45.0 + (125.0 - 45.0) * day) * (1.0 - fog_w * 0.70);
    let normal_end = (190.0 + (420.0 - 190.0) * day) * (1.0 - fog_w * 0.66);
    let fog_start = normal_start + (nv_radius * 0.45 - normal_start) * nv_strength;
    let fog_end = normal_end + (nv_radius * 1.15 - normal_end) * nv_strength;
    atmo.effective_fog_end = fog_end;

    for (mut fog, exposure_opt) in &mut cam_q {
        fog.color = Color::srgb(horizon[0], horizon[1], horizon[2]);
        fog.falloff = FogFalloff::Linear {
            start: fog_start.max(8.0),
            end: fog_end.max(38.0),
        };
        if let Some(mut exposure) = exposure_opt {
            let base_ev = 9.7 - (settings.brightness - 1.0).clamp(-0.4, 1.4) * 1.5;
            exposure.ev100 = (base_ev - nv_strength * 0.6 - flash * 1.2).clamp(6.8, 12.0);
        }
    }

    // 3. Ánh sáng môi trường (Ambient)
    let amb_lux =
        (110.0 + 410.0 * day) * (1.0 - storm * 0.28) + nv_strength * 150.0 + flash * 450.0;
    ambient.brightness = amb_lux;
    ambient.color = if nv_strength > 0.25 {
        Color::srgb(0.65, 0.95, 0.82)
    } else if twilight > 0.25 {
        let c = lerp3([0.85, 0.91, 0.95], [0.98, 0.76, 0.60], twilight * 0.55);
        Color::srgb(c[0], c[1], c[2])
    } else {
        let c = lerp3([0.32, 0.45, 0.68], [0.88, 0.93, 0.98], day);
        Color::srgb(c[0], c[1], c[2])
    };

    let p = net.local_pos;

    // 4. Bầu trời SkyDome + màu gradient đỉnh trời -> đường chân trời (~12Hz)
    *sky_timer -= dt;
    for (sky_dome, mut sky_tf) in &mut sky_q {
        sky_tf.translation = Vec3::new(p.x, 0.0, p.z);
        if *sky_timer <= 0.0 {
            if let Some(mesh) = meshes.get_mut(&sky_dome.mesh_handle) {
                if let Some(VertexAttributeValues::Float32x4(colors)) =
                    mesh.attribute_mut(Mesh::ATTRIBUTE_COLOR)
                {
                    for (idx, &grad) in sky_dome.vertex_heights.iter().enumerate() {
                        if idx < colors.len() {
                            let c = lerp3(horizon, zenith, grad);
                            colors[idx] = [c[0], c[1], c[2], 1.0];
                        }
                    }
                }
            }
        }
    }
    if *sky_timer <= 0.0 {
        *sky_timer = 0.08;
    }

    // 5. Đèn định hướng Mặt trời / Mặt trăng bám theo người chơi
    if let Ok((mut light, mut tf)) = sun_q.get_single_mut() {
        light.shadows_enabled = settings.quality != GraphicsQuality::Low;
        if day >= 0.22 {
            let pos = Vec3::new(p.x + sun_dir.x * 0.5, p.y + sun_dir.y.max(36.0), p.z + sun_dir.z * 0.5);
            *tf = Transform::from_translation(pos).looking_at(p, Vec3::Y);
            light.illuminance =
                (5_500.0 + day * 12_000.0) * (1.0 - storm * 0.55) + flash * 18_000.0;
            light.color = if flash > 0.2 {
                Color::srgb(0.88, 0.95, 1.0)
            } else if twilight > 0.18 {
                let c = lerp3([1.0, 0.94, 0.85], [1.0, 0.72, 0.48], twilight * 0.7);
                Color::srgb(c[0], c[1], c[2])
            } else {
                Color::srgb(1.0, 0.94, 0.85)
            };
        } else {
            let pos = Vec3::new(
                p.x + moon_dir.x * 0.5,
                p.y + moon_dir.y.abs().max(42.0),
                p.z + moon_dir.z * 0.5,
            );
            *tf = Transform::from_translation(pos).looking_at(p, Vec3::Y);
            light.illuminance =
                (1_800.0 * (0.75 + night * 0.25) * (1.0 - nv_strength * 0.35) * (1.0 - storm * 0.4))
                    + flash * 20_000.0;
            light.color = if flash > 0.2 {
                Color::srgb(0.88, 0.95, 1.0)
            } else {
                Color::srgb(0.72, 0.83, 1.0)
            };
        }
    }

    // 6. Mặt trời, Mặt trăng & Bầu trời sao
    if let Ok((mut tf, mut vis)) = sun_orb_q.get_single_mut() {
        let show_sun = sun_dir.y > -20.0 && storm < 0.7;
        let desired = if show_sun { Visibility::Visible } else { Visibility::Hidden };
        if *vis != desired {
            *vis = desired;
        }
        if show_sun {
            tf.translation = Vec3::new(
                p.x + sun_dir.x * 2.5,
                (sun_dir.y * 2.5).max(12.0),
                p.z + sun_dir.z * 2.5,
            );
        }
    }

    if let Ok((mut tf, mut vis)) = moon_q.get_single_mut() {
        let show_moon = moon_dir.y > -18.0 && storm < 0.65;
        let desired = if show_moon { Visibility::Visible } else { Visibility::Hidden };
        if *vis != desired {
            *vis = desired;
        }
        if show_moon {
            tf.translation = Vec3::new(
                p.x + moon_dir.x * 2.5,
                (moon_dir.y * 2.5).max(36.0),
                p.z + moon_dir.z * 2.5,
            );
        }
    }

    if let Ok((star_dome, mut star_tf, mut star_vis)) = star_q.get_single_mut() {
        let star_alpha = (night * 0.85 * (1.0 - storm * 0.9)).clamp(0.0, 0.85);
        let desired = if star_alpha > 0.05 { Visibility::Visible } else { Visibility::Hidden };
        if *star_vis != desired {
            *star_vis = desired;
        }
        if star_alpha > 0.05 {
            star_tf.translation = Vec3::new(p.x, 0.0, p.z);
            if (*prev_star_alpha - star_alpha).abs() > 0.02 {
                *prev_star_alpha = star_alpha;
                if let Some(mat) = materials.get_mut(&star_dome.mat_handle) {
                    mat.base_color = Color::srgba(0.92, 0.96, 1.0, star_alpha);
                }
            }
        }
    }

    // 7. Đèn Night Vision [N]
    if let Ok((mut pt, mut tf, mut vis)) = nv_q.get_single_mut() {
        let active = nv_strength > 0.02;
        let desired = if active { Visibility::Visible } else { Visibility::Hidden };
        if *vis != desired {
            *vis = desired;
        }
        if active {
            tf.translation = Vec3::new(p.x, p.y + 8.5, p.z);
            pt.range = nv_radius;
            pt.intensity = 2_400_000.0 * nv_strength;
        } else {
            pt.intensity = 0.0;
        }
    }
}

fn lerp3(a: [f32; 3], b: [f32; 3], t: f32) -> [f32; 3] {
    [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    ]
}
