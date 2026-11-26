import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  getMeshTerrainHeight,
  HIGHLAND_LAKE_RADIUS,
  HIGHLAND_LAKE_X,
  HIGHLAND_LAKE_Z,
  isNearWater,
  OASIS_RADIUS,
  OASIS_X,
  OASIS_Z,
  WORLD_ROCKS,
  type WorldRock,
} from '../../../constants/terrain';
import { useGameStore } from '../../../store/useGameStore';
import { setupMeshoptLoader } from '../../../core/meshopt';

const discoveredEnvGlbs = Object.keys(import.meta.glob('/public/models/env/*.glb')).map((p) =>
  p.replace(/^\/public/, '')
);

function findEnvModel(keywords: string[]): string | null {
  for (const kw of keywords) {
    const found = discoveredEnvGlbs.find((p) => p.toLowerCase().includes(kw));
    if (found) return found;
  }
  return null;
}

interface InstanceTransform {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotY: number;
  tiltX?: number;
  tiltZ?: number;
}

interface BakedPart {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  isLeaf: boolean;
}

// Chuyển cỏ, dương xỉ, bụi rậm & lá sang MeshLambertMaterial:
// giữ nguyên ảnh texture thật 100% nhưng giảm ~70% tải Fragment Shader trên GPU
function buildFastMaterial(
  src: THREE.Material,
  forceLambert: boolean
): { material: THREE.Material; isLeaf: boolean } {
  const std = src as THREE.MeshStandardMaterial;
  const matName = (src.name || '').toLowerCase();
  const isLeaf = Boolean(
    std.transparent ||
      std.alphaMap ||
      (std.alphaTest && std.alphaTest > 0) ||
      matName.includes('leaf') ||
      matName.includes('leaves') ||
      matName.includes('frond') ||
      matName.includes('branch') ||
      matName.includes('needle') ||
      matName.includes('foliage')
  );

  if (forceLambert || isLeaf) {
    const lambert = new THREE.MeshLambertMaterial({
      color: std.color ? std.color.clone() : new THREE.Color('#ffffff'),
      map: std.map || null,
      alphaMap: std.alphaMap || null,
      alphaTest: isLeaf ? Math.max(std.alphaTest || 0, 0.48) : 0,
      transparent: false,
      side: isLeaf ? THREE.DoubleSide : THREE.FrontSide,
    });
    return { material: lambert, isLeaf };
  }

  const cloned = std.clone();
  cloned.roughness = Math.max(cloned.roughness ?? 0.85, 0.8);
  cloned.metalness = 0.02;
  // Tắt envMapIntensity nặng trên thân cây & đá xa
  cloned.envMapIntensity = 0.45;
  return { material: cloned, isLeaf: false };
}

// Layer InstancedMesh kèm Per-Instance Frustum + Distance Culling
const GlbInstancedLayer: React.FC<{
  path: string;
  transforms: InstanceTransform[];
  targetHeight: number;
  maxDistance: number;
  boundingRadius: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  forceLambert?: boolean;
  sinkY?: number;
}> = React.memo(
  ({
    path,
    transforms,
    targetHeight,
    maxDistance,
    boundingRadius,
    castShadow = false,
    receiveShadow = false,
    forceLambert = true,
    sinkY = 0.06,
  }) => {
    const { scene } = useGLTF(path, false, false, setupMeshoptLoader);
    const meshRefs = useRef<Array<THREE.InstancedMesh | null>>([]);

    const parts = useMemo<BakedPart[]>(() => {
      scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const height = Math.max(size.y, 0.05);
      const scaleFactor = targetHeight / height;

      const normMatrix = new THREE.Matrix4()
        .makeScale(scaleFactor, scaleFactor, scaleFactor)
        .multiply(new THREE.Matrix4().makeTranslation(-center.x, -box.min.y, -center.z));

      const result: BakedPart[] = [];
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (!mesh.geometry) return;
          const bakedGeo = mesh.geometry.clone();
          bakedGeo.applyMatrix4(mesh.matrixWorld);
          bakedGeo.applyMatrix4(normMatrix);
          if (sinkY !== 0) {
            bakedGeo.translate(0, -sinkY, 0);
          }
          const rawMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          if (!rawMat) {
            bakedGeo.dispose();
            return;
          }
          const { material, isLeaf } = buildFastMaterial(rawMat, forceLambert);
          result.push({ geometry: bakedGeo, material, isLeaf });
        }
      });
      return result;
    }, [scene, targetHeight, forceLambert, sinkY]);

    // Tính sẵn toàn bộ Matrix4 1 lần duy nhất (không tạo rác RAM trong useFrame)
    const precomputed = useMemo(() => {
      const matrices: THREE.Matrix4[] = new Array(transforms.length);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < transforms.length; i++) {
        const t = transforms[i];
        dummy.position.set(t.x, t.y, t.z);
        dummy.rotation.set(t.tiltX || 0, t.rotY, t.tiltZ || 0);
        dummy.scale.setScalar(t.scale);
        dummy.updateMatrix();
        matrices[i] = dummy.matrix.clone();
      }
      return matrices;
    }, [transforms]);

    useEffect(() => {
      return () => {
        parts.forEach((p) => {
          p.geometry.dispose();
          p.material.dispose();
        });
      };
    }, [parts]);

    const frustum = useMemo(() => new THREE.Frustum(), []);
    const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);
    const testSphere = useMemo(() => new THREE.Sphere(), []);
    const lastCamPos = useRef(new THREE.Vector3(99999, 99999, 99999));
    const lastCamQuat = useRef(new THREE.Quaternion());
    const lastCullTime = useRef(0);

    // Chỉ cập nhật danh sách hiển thị khi camera dịch > 3.5m hoặc xoay > 0.08 rad
    useFrame(({ camera, scene: threeScene }) => {
      if (transforms.length === 0 || parts.length === 0) return;
      const now = performance.now();
      const movedSq = camera.position.distanceToSquared(lastCamPos.current);
      const rotated = 1 - Math.abs(camera.quaternion.dot(lastCamQuat.current));

      if (movedSq < 12.25 && rotated < 0.004 && now - lastCullTime.current < 450) {
        return;
      }
      if (now - lastCullTime.current < 85 && movedSq < 25) {
        return;
      }

      lastCullTime.current = now;
      lastCamPos.current.copy(camera.position);
      lastCamQuat.current.copy(camera.quaternion);

      projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projScreenMatrix);

      // Tự động giới hạn tầm vẽ theo sương mù / Night Vision hiện tại
      let effectiveMaxDist = maxDistance;
      if (threeScene.fog && 'far' in threeScene.fog) {
        const fogFar = (threeScene.fog as THREE.Fog).far;
        if (fogFar > 0) {
          effectiveMaxDist = Math.min(maxDistance, fogFar + 18);
        }
      }
      const maxDistSq = effectiveMaxDist * effectiveMaxDist;
      const cx = camera.position.x;
      const cz = camera.position.z;

      for (let pIdx = 0; pIdx < parts.length; pIdx++) {
        const inst = meshRefs.current[pIdx];
        if (!inst) continue;

        let visibleCount = 0;
        for (let i = 0; i < transforms.length; i++) {
          const t = transforms[i];
          const dx = t.x - cx;
          const dz = t.z - cz;
          if (dx * dx + dz * dz > maxDistSq) continue;

          testSphere.center.set(t.x, t.y + boundingRadius * 0.45 * t.scale, t.z);
          testSphere.radius = boundingRadius * t.scale;
          if (!frustum.intersectsSphere(testSphere)) continue;

          inst.setMatrixAt(visibleCount, precomputed[i]);
          visibleCount++;
        }

        inst.count = visibleCount;
        inst.instanceMatrix.needsUpdate = true;
      }
    });

    if (transforms.length === 0 || parts.length === 0) return null;

    return (
      <group>
        {parts.map((part, idx) => (
          <instancedMesh
            key={idx}
            ref={(el) => {
              meshRefs.current[idx] = el;
            }}
            args={[part.geometry, part.material, transforms.length]}
            // Không đổ bóng cho tán lá alphaTest để cắt giảm 50% gánh nặng Shadow Map
            castShadow={castShadow && !part.isLeaf}
            receiveShadow={receiveShadow && !part.isLeaf}
            frustumCulled={false}
          />
        ))}
      </group>
    );
  }
);

// Layer Đá rêu tách từ rock_moss_set_01_1k.glb kèm Frustum + Distance Culling
const GlbRockSetLayer: React.FC<{
  path: string;
  rocks: WorldRock[];
  maxDistance: number;
}> = React.memo(({ path, rocks, maxDistance }) => {
  const { scene } = useGLTF(path, false, false, setupMeshoptLoader);
  const meshRefs = useRef<Array<THREE.InstancedMesh | null>>([]);

  const variants = useMemo<BakedPart[]>(() => {
    scene.updateMatrixWorld(true);
    const list: BakedPart[] = [];

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (!mesh.geometry) return;

        const geo = mesh.geometry.clone();
        geo.applyMatrix4(mesh.matrixWorld);
        geo.computeBoundingBox();
        if (!geo.boundingBox) {
          geo.dispose();
          return;
        }

        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        geo.boundingBox.getSize(size);
        geo.boundingBox.getCenter(center);

        const horizMax = Math.max(size.x, size.z, 0.05);
        const normScale = 2.65 / horizMax;
        geo.translate(-center.x, -geo.boundingBox.min.y, -center.z);
        geo.scale(normScale, normScale, normScale);
        geo.translate(0, -0.28, 0);

        const rawMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        if (!rawMat) {
          geo.dispose();
          return;
        }
        const { material } = buildFastMaterial(rawMat, false);
        list.push({ geometry: geo, material, isLeaf: false });
      }
    });

    return list;
  }, [scene]);

  useEffect(() => {
    return () => {
      variants.forEach((v) => {
        v.geometry.dispose();
        v.material.dispose();
      });
    };
  }, [variants]);

  const buckets = useMemo(() => {
    const count = Math.max(1, variants.length);
    const groups: Array<{ rock: WorldRock; groundY: number; matrix: THREE.Matrix4 }[]> =
      Array.from({ length: count }, () => []);
    const dummy = new THREE.Object3D();

    rocks.forEach((rock, idx) => {
      const groundY = getMeshTerrainHeight(rock.pos[0], rock.pos[2]);
      dummy.position.set(rock.pos[0], groundY, rock.pos[2]);
      dummy.rotation.set(0, rock.rot, 0);
      dummy.scale.set(rock.scale[0], rock.scale[1] * 0.85, rock.scale[2]);
      dummy.updateMatrix();
      groups[idx % count].push({ rock, groundY, matrix: dummy.matrix.clone() });
    });

    return groups;
  }, [rocks, variants.length]);

  const frustum = useMemo(() => new THREE.Frustum(), []);
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);
  const testSphere = useMemo(() => new THREE.Sphere(), []);
  const lastCamPos = useRef(new THREE.Vector3(99999, 99999, 99999));
  const lastCamQuat = useRef(new THREE.Quaternion());
  const lastCullTime = useRef(0);

  useFrame(({ camera, scene: threeScene }) => {
    if (variants.length === 0) return;
    const now = performance.now();
    const movedSq = camera.position.distanceToSquared(lastCamPos.current);
    const rotated = 1 - Math.abs(camera.quaternion.dot(lastCamQuat.current));

    if (movedSq < 12.25 && rotated < 0.004 && now - lastCullTime.current < 450) {
      return;
    }
    if (now - lastCullTime.current < 85 && movedSq < 25) {
      return;
    }

    lastCullTime.current = now;
    lastCamPos.current.copy(camera.position);
    lastCamQuat.current.copy(camera.quaternion);

    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    let effectiveMaxDist = maxDistance;
    if (threeScene.fog && 'far' in threeScene.fog) {
      const fogFar = (threeScene.fog as THREE.Fog).far;
      if (fogFar > 0) {
        effectiveMaxDist = Math.min(maxDistance, fogFar + 20);
      }
    }
    const maxDistSq = effectiveMaxDist * effectiveMaxDist;
    const cx = camera.position.x;
    const cz = camera.position.z;

    for (let vIdx = 0; vIdx < buckets.length; vIdx++) {
      const inst = meshRefs.current[vIdx];
      const bucket = buckets[vIdx];
      if (!inst || !bucket) continue;

      let visibleCount = 0;
      for (let i = 0; i < bucket.length; i++) {
        const entry = bucket[i];
        const rx = entry.rock.pos[0];
        const rz = entry.rock.pos[2];
        const dx = rx - cx;
        const dz = rz - cz;
        if (dx * dx + dz * dz > maxDistSq) continue;

        testSphere.center.set(rx, entry.groundY + entry.rock.scale[1], rz);
        testSphere.radius = entry.rock.radius * 1.4;
        if (!frustum.intersectsSphere(testSphere)) continue;

        inst.setMatrixAt(visibleCount, entry.matrix);
        visibleCount++;
      }

      inst.count = visibleCount;
      inst.instanceMatrix.needsUpdate = true;
    }
  });

  if (variants.length === 0) return null;

  return (
    <group>
      {variants.map((variant, idx) => {
        const bucket = buckets[idx];
        if (!bucket || bucket.length === 0) return null;
        return (
          <instancedMesh
            key={idx}
            ref={(el) => {
              meshRefs.current[idx] = el;
            }}
            args={[variant.geometry, variant.material, bucket.length]}
            castShadow
            receiveShadow
            frustumCulled={false}
          />
        );
      })}
    </group>
  );
});

export const Foliage: React.FC = React.memo(() => {
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);

  const modelPaths = useMemo(
    () => ({
      spruce: findEnvModel(['spruce']),
      islandTree: findEnvModel(['island_tree']),
      pine: findEnvModel(['pine_sapling', 'pine']),
      rockSet: findEnvModel(['rock_moss', 'rock']),
      fern: findEnvModel(['fern']),
      shrub: findEnvModel(['shrub']),
      weed: findEnvModel(['weed']),
    }),
    []
  );

  const drawDist = useMemo(() => {
    if (graphicsQuality === 'low') {
      return { tree: 145, rock: 120, pine: 100, shrub: 65, fern: 52, weed: 42 };
    }
    if (graphicsQuality === 'high') {
      return { tree: 250, rock: 200, pine: 165, shrub: 115, fern: 92, weed: 72 };
    }
    return { tree: 195, rock: 160, pine: 130, shrub: 90, fern: 72, weed: 56 };
  }, [graphicsQuality]);

  const layouts = useMemo(() => {
    const qMult = graphicsQuality === 'low' ? 0.5 : graphicsQuality === 'high' ? 1.25 : 0.85;

    const spruceList: InstanceTransform[] = [];
    const islandTreeList: InstanceTransform[] = [];
    const pineList: InstanceTransform[] = [];
    const fernList: InstanceTransform[] = [];
    const shrubList: InstanceTransform[] = [];
    const weedList: InstanceTransform[] = [];

    const totalTrees = Math.round(210 * qMult);
    for (let i = 0; i < totalTrees; i++) {
      const angle = i * 2.3999632 + (i % 7) * 0.21;
      const dist = 34 + ((i * 27.3) % 355);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (isNearWater(x, z)) continue;
      const y = getMeshTerrainHeight(x, z);
      if (y < -14 || y > 23) continue;

      const item: InstanceTransform = {
        x,
        y,
        z,
        scale: 0.85 + (i % 5) * 0.16,
        rotY: i * 1.43,
        tiltX: ((i % 5) - 2) * 0.015,
        tiltZ: ((i % 3) - 1) * 0.015,
      };

      const mod = i % 10;
      if (mod < 4 && modelPaths.spruce) {
        spruceList.push(item);
      } else if (mod < 7 && modelPaths.islandTree) {
        islandTreeList.push(item);
      } else if (modelPaths.pine) {
        pineList.push({ ...item, scale: 0.9 + (i % 4) * 0.22 });
      } else if (modelPaths.spruce) {
        spruceList.push(item);
      }
    }

    const fernCount = Math.round(240 * qMult);
    for (let i = 0; i < fernCount; i++) {
      const angle = i * 2.3999632 + 0.55;
      const dist = 16 + ((i * 17.9) % 335);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (isNearWater(x, z)) continue;
      const y = getMeshTerrainHeight(x, z);
      if (y < -14 || y > 18) continue;
      fernList.push({ x, y, z, scale: 0.8 + (i % 4) * 0.28, rotY: i * 0.91 });
    }

    const shrubCount = Math.round(145 * qMult);
    for (let i = 0; i < shrubCount; i++) {
      const angle = i * 2.3999632 + 1.25;
      const dist = 22 + ((i * 23.1) % 340);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (isNearWater(x, z)) continue;
      const y = getMeshTerrainHeight(x, z);
      if (y < -14 || y > 17) continue;
      shrubList.push({ x, y, z, scale: 0.85 + (i % 4) * 0.25, rotY: i * 1.17 });
    }

    const weedCount = Math.round(260 * qMult);
    for (let i = 0; i < weedCount; i++) {
      const angle = i * 2.3999632 + 2.1;
      const dist = 10 + ((i * 13.4) % 330);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (isNearWater(x, z)) continue;
      const y = getMeshTerrainHeight(x, z);
      if (y < -14 || y > 16) continue;
      weedList.push({ x, y, z, scale: 0.85 + (i % 5) * 0.24, rotY: i * 1.71 });
    }

    const addShoreWeeds = (lx: number, lz: number, r: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + (i % 3) * 0.05;
        const rad = r + 2.8 + (i % 4) * 1.3;
        const x = lx + Math.cos(a) * rad;
        const z = lz + Math.sin(a) * rad;
        const y = getMeshTerrainHeight(x, z);
        if (y > -0.7 && y < 2.6) {
          weedList.push({ x, y, z, scale: 1.15 + (i % 3) * 0.3, rotY: a });
        }
      }
    };
    const shoreCount = Math.round(42 * qMult);
    addShoreWeeds(OASIS_X, OASIS_Z, OASIS_RADIUS, shoreCount);
    addShoreWeeds(HIGHLAND_LAKE_X, HIGHLAND_LAKE_Z, HIGHLAND_LAKE_RADIUS, shoreCount);

    return { spruceList, islandTreeList, pineList, fernList, shrubList, weedList };
  }, [graphicsQuality, modelPaths]);

  return (
    <Suspense fallback={null}>
      <group>
        {modelPaths.rockSet && (
          <GlbRockSetLayer
            path={modelPaths.rockSet}
            rocks={WORLD_ROCKS}
            maxDistance={drawDist.rock}
          />
        )}
        {modelPaths.spruce && (
          <GlbInstancedLayer
            path={modelPaths.spruce}
            transforms={layouts.spruceList}
            targetHeight={14.5}
            maxDistance={drawDist.tree}
            boundingRadius={10.5}
            castShadow={graphicsQuality !== 'low'}
            receiveShadow={false}
            forceLambert={false}
            sinkY={0.22}
          />
        )}
        {modelPaths.islandTree && (
          <GlbInstancedLayer
            path={modelPaths.islandTree}
            transforms={layouts.islandTreeList}
            targetHeight={12.0}
            maxDistance={drawDist.tree}
            boundingRadius={9.0}
            castShadow={graphicsQuality !== 'low'}
            receiveShadow={false}
            forceLambert={false}
            sinkY={0.18}
          />
        )}
        {modelPaths.pine && (
          <GlbInstancedLayer
            path={modelPaths.pine}
            transforms={layouts.pineList}
            targetHeight={6.2}
            maxDistance={drawDist.pine}
            boundingRadius={4.5}
            castShadow={false}
            forceLambert
            sinkY={0.12}
          />
        )}
        {modelPaths.fern && (
          <GlbInstancedLayer
            path={modelPaths.fern}
            transforms={layouts.fernList}
            targetHeight={1.65}
            maxDistance={drawDist.fern}
            boundingRadius={1.8}
            castShadow={false}
            forceLambert
            sinkY={0.05}
          />
        )}
        {modelPaths.shrub && (
          <GlbInstancedLayer
            path={modelPaths.shrub}
            transforms={layouts.shrubList}
            targetHeight={2.35}
            maxDistance={drawDist.shrub}
            boundingRadius={2.4}
            castShadow={false}
            forceLambert
            sinkY={0.08}
          />
        )}
        {modelPaths.weed && (
          <GlbInstancedLayer
            path={modelPaths.weed}
            transforms={layouts.weedList}
            targetHeight={1.15}
            maxDistance={drawDist.weed}
            boundingRadius={1.5}
            castShadow={false}
            forceLambert
            sinkY={0.04}
          />
        )}
      </group>
    </Suspense>
  );
});