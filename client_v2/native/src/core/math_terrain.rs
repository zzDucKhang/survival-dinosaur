use super::config::WorldConfig;
use bevy::prelude::*;

#[derive(Debug, Clone)]
pub struct RockObstacle {
    pub x: f64,
    pub z: f64,
    pub scale: Vec3,
    pub rot: f32,
    pub radius: f64,
}

#[derive(Resource, Clone)]
pub struct WorldObstacles {
    pub rocks: Vec<RockObstacle>,
}

impl WorldObstacles {
    pub fn build(cfg: &WorldConfig) -> Self {
        let count = cfg.rock_count.max(1);
        let mut rocks = Vec::with_capacity(count);

        for i in 0..count {
            let fi = i as f64;
            let angle = fi * 2.3999632 + (i % 5) as f64 * 0.11;
            let dist = 30.0 + (fi * 19.37) % 360.0;
            let x = angle.cos() * dist;
            let z = angle.sin() * dist;

            if (x - cfg.oasis_x).hypot(z - cfg.oasis_z) < cfg.oasis_radius + 10.0 {
                continue;
            }
            if (x - cfg.highland_lake_x).hypot(z - cfg.highland_lake_z)
                < cfg.highland_lake_radius + 10.0
            {
                continue;
            }
            if get_terrain_height(x, z, cfg) > 24.0 {
                continue;
            }

            let sx = 1.6 + (i % 4) as f64 * 1.35;
            let sy = 1.6 + (i % 5) as f64 * 1.15;
            let sz = 1.6 + (i % 3) as f64 * 1.45;
            let radius = sx.max(sz) * 1.15;

            rocks.push(RockObstacle {
                x,
                z,
                scale: Vec3::new(sx as f32, sy as f32, sz as f32),
                rot: (i as f32) * 0.9,
                radius,
            });
        }

        Self { rocks }
    }

    pub fn resolve_collision(
        &self,
        mut x: f64,
        mut z: f64,
        entity_radius: f64,
        island_limit: f64,
    ) -> (f64, f64) {
        for rock in &self.rocks {
            let dx = x - rock.x;
            let dz = z - rock.z;
            let min_dist = rock.radius + entity_radius;
            let dist_sq = dx * dx + dz * dz;
            if dist_sq < min_dist * min_dist {
                if dist_sq < 0.000001 {
                    x += min_dist;
                } else {
                    let dist = dist_sq.sqrt();
                    let push = min_dist - dist;
                    x += (dx / dist) * push;
                    z += (dz / dist) * push;
                }
            }
        }
        x = x.clamp(-island_limit, island_limit);
        z = z.clamp(-island_limit, island_limit);
        (x, z)
    }
}

pub fn get_terrain_height(x: f64, z: f64, cfg: &WorldConfig) -> f64 {
    let dist_origin = x.hypot(z);
    let mut hills = (x * 0.011).sin() * (z * 0.011).cos() * 11.0
        + (x * 0.024 + z * 0.017).sin() * 4.5
        + (x * 0.0055 - z * 0.0065).cos() * 9.0;

    let d_peak1 = (x - 210.0).hypot(z - 170.0);
    if d_peak1 < 120.0 {
        let t = 1.0 - d_peak1 / 120.0;
        hills += t * t * 34.0;
    }

    let d_peak2 = (x + 220.0).hypot(z + 160.0);
    if d_peak2 < 130.0 {
        let t = 1.0 - d_peak2 / 130.0;
        hills += t * t * 38.0;
    }

    let d_valley = (x + 140.0).hypot(z - 20.0);
    if d_valley < 110.0 {
        let t = 1.0 - d_valley / 110.0;
        hills -= t * t * 8.0;
    }

    let spawn_weight = ((dist_origin - 32.0) / 55.0).clamp(0.0, 1.0);
    let mut h = 0.8 + hills * spawn_weight;

    let d_oasis = (x - cfg.oasis_x).hypot(z - cfg.oasis_z);
    if d_oasis < cfg.oasis_radius + 18.0 {
        let mut t = ((d_oasis - cfg.oasis_radius) / 18.0).clamp(0.0, 1.0);
        t = t * t * (3.0 - 2.0 * t);
        h = -2.2 * (1.0 - t) + h * t;
    }

    let d_lake2 = (x - cfg.highland_lake_x).hypot(z - cfg.highland_lake_z);
    if d_lake2 < cfg.highland_lake_radius + 22.0 {
        let mut t = ((d_lake2 - cfg.highland_lake_radius) / 22.0).clamp(0.0, 1.0);
        t = t * t * (3.0 - 2.0 * t);
        h = -2.2 * (1.0 - t) + h * t;
    }

    if dist_origin > 370.0 {
        let angle = z.atan2(x);
        let edge_t = (dist_origin - 370.0) / 140.0;
        let ridge = 0.72 + 0.28 * (angle * 7.0).sin() + 0.14 * (angle * 13.0).cos();
        h += edge_t * edge_t * 62.0 * ridge;
    }

    h
}

/// Nội suy chính xác trên mặt tam giác của lưới địa hình để chân thú bám đất không lơ lửng.
pub fn get_mesh_terrain_height(x: f64, z: f64, cfg: &WorldConfig) -> f64 {
    let segs = cfg.terrain_segments.max(1) as f64;
    let half = cfg.terrain_size * 0.5;
    let cell = cfg.terrain_size / segs;

    let gx = ((x + half) / cell).clamp(0.0, segs - 0.0001);
    let gz = ((z + half) / cell).clamp(0.0, segs - 0.0001);
    let ix = gx.floor();
    let iz = gz.floor();
    let u = gx - ix;
    let v = gz - iz;

    let x0 = ix * cell - half;
    let x1 = x0 + cell;
    let z0 = iz * cell - half;
    let z1 = z0 + cell;

    let h_d = get_terrain_height(x1, z0, cfg);
    let h_b = get_terrain_height(x0, z1, cfg);
    if u + v <= 1.0 {
        let h_a = get_terrain_height(x0, z0, cfg);
        h_a + u * (h_d - h_a) + v * (h_b - h_a)
    } else {
        let h_c = get_terrain_height(x1, z1, cfg);
        h_c + (1.0 - u) * (h_b - h_c) + (1.0 - v) * (h_d - h_c)
    }
}

pub fn is_inside_lake(x: f64, z: f64, cfg: &WorldConfig) -> bool {
    let r1 = cfg.oasis_radius + 4.0;
    let d1 = (x - cfg.oasis_x).powi(2) + (z - cfg.oasis_z).powi(2);
    if d1 <= r1 * r1 {
        return true;
    }
    let r2 = cfg.highland_lake_radius + 5.0;
    let d2 = (x - cfg.highland_lake_x).powi(2) + (z - cfg.highland_lake_z).powi(2);
    d2 <= r2 * r2
}

pub fn is_near_water(x: f64, z: f64, cfg: &WorldConfig) -> bool {
    let r1 = cfg.oasis_radius + 6.0;
    let d1 = (x - cfg.oasis_x).powi(2) + (z - cfg.oasis_z).powi(2);
    if d1 <= r1 * r1 {
        return true;
    }
    let r2 = cfg.highland_lake_radius + 6.0;
    let d2 = (x - cfg.highland_lake_x).powi(2) + (z - cfg.highland_lake_z).powi(2);
    d2 <= r2 * r2
}

pub fn get_entity_ground_height(x: f64, z: f64, cfg: &WorldConfig) -> f64 {
    let ground_y = get_mesh_terrain_height(x, z, cfg);
    if is_inside_lake(x, z, cfg) {
        ground_y.max(cfg.water_level - 0.85)
    } else {
        ground_y
    }
}

#[allow(dead_code)]
pub fn get_terrain_slope(
    x: f64,
    z: f64,
    yaw: f32,
    sample_dist: f64,
    cfg: &WorldConfig,
) -> (f32, f32) {
    let y = yaw as f64;
    let fx = y.sin();
    let fz = y.cos();
    let rx = y.cos();
    let rz = -y.sin();

    let h_front = get_entity_ground_height(x + fx * sample_dist, z + fz * sample_dist, cfg);
    let h_back = get_entity_ground_height(x - fx * sample_dist, z - fz * sample_dist, cfg);
    let h_right = get_entity_ground_height(x + rx * sample_dist, z + rz * sample_dist, cfg);
    let h_left = get_entity_ground_height(x - rx * sample_dist, z - rz * sample_dist, cfg);

    let pitch = (-(h_front - h_back).atan2(sample_dist * 2.0)).clamp(-0.38, 0.38) as f32;
    let roll = ((h_right - h_left).atan2(sample_dist * 2.0)).clamp(-0.32, 0.32) as f32;
    (pitch, roll)
}

pub fn calc_growth_visual_scale(growth: f32) -> f32 {
    let g = growth.clamp(0.3, 1.35);
    0.17 + 1.15 * g
}