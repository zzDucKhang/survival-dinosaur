use crate::network::sync::CombatEventMsg;
use bevy::pbr::NotShadowCaster;
use bevy::prelude::*;
use std::f32::consts::FRAC_PI_2;

#[derive(Resource)]
pub struct CombatFxAssets {
    pub spark_mesh: Handle<Mesh>,
    pub blood_mat: Handle<StandardMaterial>,
    pub heal_mat: Handle<StandardMaterial>,
    pub ring_mesh: Handle<Mesh>,
    pub roar_mat: Handle<StandardMaterial>,
    pub special_mat: Handle<StandardMaterial>,
}

#[derive(Component)]
pub struct FxParticle {
    pub velocity: Vec3,
    pub gravity: f32,
    pub life: f32,
    pub max_life: f32,
}

#[derive(Component)]
pub struct FxExpandingRing {
    pub life: f32,
    pub max_life: f32,
    pub start_scale: f32,
    pub end_scale: f32,
}

pub fn init_combat_fx_assets(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    commands.insert_resource(CombatFxAssets {
        spark_mesh: meshes.add(Sphere::new(0.22)),
        blood_mat: materials.add(StandardMaterial {
            base_color: Color::srgba(0.88, 0.12, 0.14, 0.92),
            emissive: LinearRgba::rgb(0.45, 0.04, 0.04),
            unlit: true,
            ..default()
        }),
        heal_mat: materials.add(StandardMaterial {
            base_color: Color::srgba(0.24, 0.92, 0.52, 0.88),
            emissive: LinearRgba::rgb(0.15, 0.8, 0.35),
            unlit: true,
            ..default()
        }),
        ring_mesh: meshes.add(Annulus::new(0.78, 1.0)),
        roar_mat: materials.add(StandardMaterial {
            base_color: Color::srgba(0.98, 0.78, 0.24, 0.58),
            emissive: LinearRgba::rgb(0.9, 0.65, 0.15),
            unlit: true,
            alpha_mode: AlphaMode::Blend,
            double_sided: true,
            cull_mode: None,
            ..default()
        }),
        special_mat: materials.add(StandardMaterial {
            base_color: Color::srgba(0.98, 0.38, 0.18, 0.65),
            emissive: LinearRgba::rgb(1.0, 0.35, 0.12),
            unlit: true,
            alpha_mode: AlphaMode::Blend,
            double_sided: true,
            cull_mode: None,
            ..default()
        }),
    });
}

pub fn spawn_combat_fx(
    mut commands: Commands,
    assets: Res<CombatFxAssets>,
    mut events: EventReader<CombatEventMsg>,
) {
    for CombatEventMsg(ev) in events.read() {
        let origin = Vec3::new(ev.x as f32, ev.y as f32, ev.z as f32);

        if ev.attack_type == "roar" {
            commands.spawn((
                Name::new("RoarWaveRing"),
                FxExpandingRing {
                    life: 0.75,
                    max_life: 0.75,
                    start_scale: 1.8,
                    end_scale: 18.0,
                },
                Mesh3d(assets.ring_mesh.clone()),
                MeshMaterial3d(assets.roar_mat.clone()),
                Transform::from_xyz(origin.x, (origin.y - 2.0).max(0.2), origin.z)
                    .with_rotation(Quat::from_rotation_x(-FRAC_PI_2))
                    .with_scale(Vec3::splat(1.8)),
                NotShadowCaster,
            ));
            continue;
        }

        if ev.attack_type == "heal" {
            for i in 0..3 {
                let ang = (i as f32) * 2.1;
                commands.spawn((
                    FxParticle {
                        velocity: Vec3::new(ang.cos() * 0.8, 3.2 + (i as f32) * 0.4, ang.sin() * 0.8),
                        gravity: -1.5,
                        life: 0.55,
                        max_life: 0.55,
                    },
                    Mesh3d(assets.spark_mesh.clone()),
                    MeshMaterial3d(assets.heal_mat.clone()),
                    Transform::from_translation(origin).with_scale(Vec3::splat(0.75)),
                    NotShadowCaster,
                ));
            }
            continue;
        }

        let is_special = ev.attack_type == "special" || ev.attack_type == "bonebreak";
        let count = if is_special { 7 } else { 4 };
        for i in 0..count {
            let ang = (i as f32 / count as f32) * std::f32::consts::TAU + (origin.x * 0.37);
            let spd = if is_special { 5.4 } else { 3.6 };
            commands.spawn((
                FxParticle {
                    velocity: Vec3::new(ang.cos() * spd, 3.6 + (i % 3) as f32 * 1.1, ang.sin() * spd),
                    gravity: 14.0,
                    life: 0.45,
                    max_life: 0.45,
                },
                Mesh3d(assets.spark_mesh.clone()),
                MeshMaterial3d(assets.blood_mat.clone()),
                Transform::from_translation(origin).with_scale(Vec3::splat(if is_special { 1.1 } else { 0.85 })),
                NotShadowCaster,
            ));
        }

        if is_special {
            commands.spawn((
                Name::new("SpecialShockwave"),
                FxExpandingRing {
                    life: 0.45,
                    max_life: 0.45,
                    start_scale: 1.5,
                    end_scale: 10.5,
                },
                Mesh3d(assets.ring_mesh.clone()),
                MeshMaterial3d(assets.special_mat.clone()),
                Transform::from_xyz(origin.x, (origin.y - 2.4).max(0.2), origin.z)
                    .with_rotation(Quat::from_rotation_x(-FRAC_PI_2))
                    .with_scale(Vec3::splat(1.5)),
                NotShadowCaster,
            ));
        }
    }
}

pub fn update_combat_fx(
    mut commands: Commands,
    time: Res<Time>,
    mut particles_q: Query<(Entity, &mut FxParticle, &mut Transform), Without<FxExpandingRing>>,
    mut rings_q: Query<(Entity, &mut FxExpandingRing, &mut Transform), Without<FxParticle>>,
) {
    let dt = time.delta_secs().min(0.08);

    for (entity, mut p, mut tf) in &mut particles_q {
        p.life -= dt;
        if p.life <= 0.0 {
            commands.entity(entity).despawn();
            continue;
        }
        p.velocity.y -= p.gravity * dt;
        tf.translation += p.velocity * dt;
        let t = (p.life / p.max_life).clamp(0.0, 1.0);
        tf.scale = Vec3::splat(0.35 + 0.65 * t);
    }

    for (entity, mut r, mut tf) in &mut rings_q {
        r.life -= dt;
        if r.life <= 0.0 {
            commands.entity(entity).despawn();
            continue;
        }
        let progress = 1.0 - (r.life / r.max_life).clamp(0.0, 1.0);
        let s = r.start_scale + (r.end_scale - r.start_scale) * progress;
        tf.scale = Vec3::new(s, s, 1.0);
    }
}
