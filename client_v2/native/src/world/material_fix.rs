use bevy::pbr::{NotShadowCaster, NotShadowReceiver};
use bevy::prelude::*;
use bevy::scene::SceneInstanceReady;
use std::collections::HashMap;

/// Chính sách chuẩn hóa vật liệu gắn lên mỗi `SceneRoot` môi trường.
/// Dễ mở rộng cho các loại tài nguyên mới (lá cây, đá, nước, công trình...).
#[derive(Component, Clone, Copy, Debug)]
pub struct SceneMaterialPolicy {
    pub force_alpha_mask: bool,
    pub alpha_cutoff: f32,
    pub roughness_floor: f32,
    pub cast_shadows: bool,
    pub receive_shadows: bool,
}

impl SceneMaterialPolicy {
    pub fn foliage_tree(cast_shadows: bool) -> Self {
        Self {
            force_alpha_mask: true,
            alpha_cutoff: 0.42,
            roughness_floor: 0.85,
            cast_shadows,
            receive_shadows: false,
        }
    }

    pub fn foliage_ground() -> Self {
        Self {
            force_alpha_mask: true,
            alpha_cutoff: 0.44,
            roughness_floor: 0.90,
            cast_shadows: false,
            receive_shadows: false,
        }
    }

    pub fn rock() -> Self {
        Self {
            force_alpha_mask: false,
            alpha_cutoff: 0.0,
            roughness_floor: 0.88,
            cast_shadows: true,
            receive_shadows: true,
        }
    }

    fn cache_key(self) -> u8 {
        let mut k = 0u8;
        if self.force_alpha_mask {
            k |= 1;
        }
        if self.cast_shadows {
            k |= 2;
        }
        if self.receive_shadows {
            k |= 4;
        }
        k
    }
}

/// Lưu cache material đã vá để các bản sao cùng 1 model GLB dùng chung Handle (tiết kiệm VRAM & giữ GPU batching).
#[derive(Resource, Default)]
pub struct PatchedMaterialCache {
    pub entries: HashMap<(AssetId<StandardMaterial>, u8), Handle<StandardMaterial>>,
}

pub fn apply_scene_material_policy(
    trigger: Trigger<SceneInstanceReady>,
    mut commands: Commands,
    policies: Query<&SceneMaterialPolicy>,
    children_q: Query<&Children>,
    mesh_mats: Query<&MeshMaterial3d<StandardMaterial>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    mut cache: ResMut<PatchedMaterialCache>,
) {
    let root = trigger.entity();
    let Ok(policy) = policies.get(root).copied() else {
        return;
    };

    let key_tag = policy.cache_key();

    for entity in children_q.iter_descendants(root) {
        let Ok(mat_handle) = mesh_mats.get(entity) else {
            continue;
        };

        let cache_key = (mat_handle.0.id(), key_tag);
        let patched_handle = if let Some(existing) = cache.entries.get(&cache_key) {
            existing.clone()
        } else if let Some(mut mat) = materials.get(&mat_handle.0).cloned() {
            if policy.force_alpha_mask && mat.base_color_texture.is_some() {
                mat.alpha_mode = AlphaMode::Mask(policy.alpha_cutoff);
                mat.double_sided = true;
                mat.cull_mode = None;
            }
            mat.perceptual_roughness = mat.perceptual_roughness.max(policy.roughness_floor);
            mat.metallic = mat.metallic.min(0.05);

            let new_handle = materials.add(mat);
            cache.entries.insert(cache_key, new_handle.clone());
            new_handle
        } else {
            continue;
        };

        let mut ec = commands.entity(entity);
        ec.insert(MeshMaterial3d(patched_handle));

        if !policy.cast_shadows {
            ec.insert(NotShadowCaster);
        }
        if !policy.receive_shadows {
            ec.insert(NotShadowReceiver);
        }
    }
}