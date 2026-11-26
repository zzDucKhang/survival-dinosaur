use crate::core::config::GameConfig;
use crate::core::states::{GraphicsQuality, RuntimeSettings};
use crate::network::sync::WorldNetState;
use bevy::pbr::{CascadeShadowConfigBuilder, DistanceFog, FogFalloff, NotShadowCaster};
use bevy::prelude::*;
use bevy::render::camera::Exposure;

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
pub struct MoonOrb;

#[derive(Component)]
pub struct NightVisionLight;

pub fn setup_atmosphere(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    // 1. Nguồn sáng chính (Mặt trời ban ngày / Ánh trăng ban đêm), shadow cascade gọn nhẹ cho Intel HD 520
    let cascades = CascadeShadowConfigBuilder {
        num_cascades: 2,
        first_cascade_far_bound: 28.0,
        maximum_distance: 95.0,
        ..default()
    }
    .build();

    commands.spawn((
        Name::new("SunMoonLight"),
        SunMoonLight,
        DirectionalLight {
            illuminance: 14_000.0,
            shadows_enabled: false, // Tự bật khi quality != Low
            color: Color::srgb(1.0, 0.94, 0.86),
            ..default()
        },
        cascades,
        Transform::from_xyz(60.0, 90.0, 40.0).looking_at(Vec3::ZERO, Vec3::Y),
    ));

    // 2. Mặt trăng trên bầu trời đêm
    let moon_mesh = meshes.add(Sphere::new(18.0));
    let moon_mat = materials.add(StandardMaterial {
        base_color: Color::srgb(0.95, 0.98, 1.0),
        unlit: true,
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

    // 3. Đèn Night Vision [N] bám theo nhân vật (tắt bóng để không tốn GPU)
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
    mut sun_q: Query<(&mut DirectionalLight, &mut Transform), (With<SunMoonLight>, Without<MoonOrb>, Without<NightVisionLight>)>,
    mut moon_q: Query<(&mut Transform, &mut Visibility), (With<MoonOrb>, Without<SunMoonLight>, Without<NightVisionLight>)>,
    mut nv_q: Query<(&mut PointLight, &mut Transform, &mut Visibility), (With<NightVisionLight>, Without<SunMoonLight>, Without<MoonOrb>)>,
    mut cam_q: Query<(&mut DistanceFog, Option<&mut Exposure>), With<Camera3d>>,
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

    // 1. Màu bầu trời & sương mù
    let mut sky = lerp3([0.035, 0.075, 0.15], [0.45, 0.61, 0.70], day);
    if twilight > 0.08 {
        sky = lerp3(sky, [0.71, 0.43, 0.32], twilight * 0.42);
    }
    if storm > 0.01 {
        sky = lerp3(sky, [0.11, 0.15, 0.20], storm * (0.4 + day * 0.5));
    }
    if nv_strength > 0.01 {
        sky = lerp3(sky, [0.016, 0.055, 0.04], nv_strength * 0.85);
    }
    if flash > 0.01 {
        sky = lerp3(sky, [0.88, 0.94, 1.0], flash * 0.55);
    }
    clear_color.0 = Color::srgb(sky[0], sky[1], sky[2]);

    // 2. Khoảng cách sương mù & Exposure trên Camera
    let normal_start = (42.0 + (115.0 - 42.0) * day) * (1.0 - fog_w * 0.70);
    let normal_end = (180.0 + (420.0 - 180.0) * day) * (1.0 - fog_w * 0.66);
    let fog_start = normal_start + (nv_radius * 0.45 - normal_start) * nv_strength;
    let fog_end = normal_end + (nv_radius * 1.15 - normal_end) * nv_strength;
    atmo.effective_fog_end = fog_end;

    for (mut fog, exposure_opt) in &mut cam_q {
        fog.color = Color::srgb(sky[0], sky[1], sky[2]);
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
        (95.0 + 380.0 * day) * (1.0 - storm * 0.28) + nv_strength * 140.0 + flash * 450.0;
    ambient.brightness = amb_lux;
    ambient.color = if nv_strength > 0.25 {
        Color::srgb(0.65, 0.95, 0.82)
    } else {
        let c = lerp3([0.32, 0.45, 0.68], [0.85, 0.91, 0.95], day);
        Color::srgb(c[0], c[1], c[2])
    };

    // 4. Đèn định hướng Mặt trời / Mặt trăng bám theo người chơi
    let p = net.local_pos;
    if let Ok((mut light, mut tf)) = sun_q.get_single_mut() {
        light.shadows_enabled = settings.quality != GraphicsQuality::Low;
        if day >= 0.22 {
            let pos = Vec3::new(p.x + sun_dir.x * 0.5, p.y + sun_dir.y.max(36.0), p.z + sun_dir.z * 0.5);
            *tf = Transform::from_translation(pos).looking_at(p, Vec3::Y);
            light.illuminance =
                (5_000.0 + day * 11_000.0) * (1.0 - storm * 0.55) + flash * 18_000.0;
            light.color = if flash > 0.2 {
                Color::srgb(0.88, 0.95, 1.0)
            } else {
                Color::srgb(1.0, 0.93, 0.84)
            };
        } else {
            let pos = Vec3::new(
                p.x + moon_dir.x * 0.5,
                p.y + moon_dir.y.abs().max(42.0),
                p.z + moon_dir.z * 0.5,
            );
            *tf = Transform::from_translation(pos).looking_at(p, Vec3::Y);
            light.illuminance =
                (1_500.0 * (0.75 + night * 0.25) * (1.0 - nv_strength * 0.35) * (1.0 - storm * 0.4))
                    + flash * 20_000.0;
            light.color = if flash > 0.2 {
                Color::srgb(0.88, 0.95, 1.0)
            } else {
                Color::srgb(0.72, 0.83, 1.0)
            };
        }
    }

    // 5. Vị trí mặt trăng
    if let Ok((mut tf, mut vis)) = moon_q.get_single_mut() {
        let show_moon = moon_dir.y > -18.0 && storm < 0.65;
        *vis = if show_moon {
            Visibility::Visible
        } else {
            Visibility::Hidden
        };
        if show_moon {
            tf.translation = Vec3::new(
                p.x + moon_dir.x * 2.8,
                (moon_dir.y * 2.8).max(48.0),
                p.z + moon_dir.z * 2.8,
            );
        }
    }

    // 6. Đèn Night Vision [N]
    if let Ok((mut pt, mut tf, mut vis)) = nv_q.get_single_mut() {
        let active = nv_strength > 0.02;
        *vis = if active {
            Visibility::Visible
        } else {
            Visibility::Hidden
        };
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