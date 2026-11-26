# Project Dump

**Root:** `C:\Programing\Game\KhungLong\client\src`

**Generated:** 2026-11-26 22:07:53.765778

**Files:** 39 | **Total size:** 272,013 bytes

---

### File: `App.css` | Size: 2891 bytes | Ext: `.css` | Mod: 2026-11-15 23:24:36
```css
.counter {
  font-size: 16px;
  padding: 5px 10px;
  border-radius: 5px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid transparent;
  transition: border-color 0.3s;
  margin-bottom: 24px;
  &:hover {
    border-color: var(--accent-border);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}
.hero {
  position: relative;
  .base,
  .framework,
  .vite {
    inset-inline: 0;
    margin: 0 auto;
  }
  .base {
    width: 170px;
    position: relative;
    z-index: 0;
  }
  .framework,
  .vite {
    position: absolute;
  }
  .framework {
    z-index: 1;
    top: 34px;
    height: 28px;
    transform: perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg)
      scale(1.4);
  }
  .vite {
    z-index: 0;
    top: 107px;
    height: 26px;
    width: auto;
    transform: perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg)
      scale(0.8);
  }
}
#center {
  display: flex;
  flex-direction: column;
  gap: 25px;
  place-content: center;
  place-items: center;
  flex-grow: 1;
  @media (max-width: 1024px) {
    padding: 32px 20px 24px;
    gap: 18px;
  }
}
#next-steps {
  display: flex;
  border-top: 1px solid var(--border);
  text-align: left;
  & > div {
    flex: 1 1 0;
    padding: 32px;
    @media (max-width: 1024px) {
      padding: 24px 20px;
    }
  }
  .icon {
    margin-bottom: 16px;
    width: 22px;
    height: 22px;
  }
  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
  }
}
#docs {
  border-right: 1px solid var(--border);
  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}
#next-steps ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 8px;
  margin: 32px 0 0;
  .logo {
    height: 18px;
  }
  a {
    color: var(--text-h);
    font-size: 16px;
    border-radius: 6px;
    background: var(--social-bg);
    display: flex;
    padding: 6px 12px;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    transition: box-shadow 0.3s;
    &:hover {
      box-shadow: var(--shadow);
    }
    .button-icon {
      height: 18px;
      width: 18px;
    }
  }
  @media (max-width: 1024px) {
    margin-top: 20px;
    flex-wrap: wrap;
    justify-content: center;
    li {
      flex: 1 1 calc(50% - 8px);
    }
    a {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
    }
  }
}
#spacer {
  height: 88px;
  border-top: 1px solid var(--border);
  @media (max-width: 1024px) {
    height: 48px;
  }
}
.ticks {
  position: relative;
  width: 100%;
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -4.5px;
    border: 5px solid transparent;
  }
  &::before {
    left: 0;
    border-left-color: var(--border);
  }
  &::after {
    right: 0;
    border-right-color: var(--border);
  }
}
```

### File: `App.tsx` | Size: 2002 bytes | Ext: `.tsx` | Mod: 2026-11-25 23:28:42
```tsx
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameStore } from './store/useGameStore';
import { LoginScreen } from './components/ui/LoginScreen';
import { GameHUD } from './components/ui/GameHUD';
import { Scene } from './components/3d/Scene';
const LoadingFallback: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b1324',
        color: '#4ade80',
        fontFamily: 'system-ui, sans-serif',
        zIndex: 99,
      }}
    >
      <div style={{ fontSize: '48px' }}>🦖</div>
      <h2 style={{ margin: '16px 0 8px 0', fontSize: '20px', letterSpacing: '1px' }}>
        ĐANG TẢI HỆ SINH THÁI KHỦNG LONG...
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '13px' }}>
        Khởi tạo bản đồ núi &amp; thung lũng 10x + đồng bộ mạng 20Hz...
      </p>
    </div>
  );
};
export const App: React.FC = () => {
  const isJoined = useGameStore((s) => s.isJoined);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);
  const dpr: [number, number] =
    graphicsQuality === 'low' ? [0.8, 1] : graphicsQuality === 'high' ? [1, 1.5] : [1, 1.25];
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {!isJoined ? (
        <LoginScreen />
      ) : (
        <>
          <Suspense fallback={<LoadingFallback />}>
            <Canvas
              shadows={graphicsQuality !== 'low'}
              dpr={dpr}
              camera={{ position: [0, 8, -16], fov: 58, near: 0.3, far: 3500 }}
              gl={{ antialias: graphicsQuality !== 'low', powerPreference: 'high-performance' }}
            >
              <Scene />
            </Canvas>
          </Suspense>
          <GameHUD />
        </>
      )}
    </div>
  );
};
export default App;
```

### File: `assets\hero.png` | Size: 13057 bytes | Ext: `.png` | Mod: 2026-11-15 23:24:36
> **File nhị phân** (đã bỏ qua nội dung)

### File: `assets\react.svg` | Size: 4126 bytes | Ext: `.svg` | Mod: 2026-11-15 23:24:36
> **File nhị phân** (đã bỏ qua nội dung)

### File: `assets\vite.svg` | Size: 8709 bytes | Ext: `.svg` | Mod: 2026-11-15 23:24:36
> **File nhị phân** (đã bỏ qua nội dung)

### File: `components\3d\environment\Foliage.tsx` | Size: 21528 bytes | Ext: `.tsx` | Mod: 2026-11-26 16:54:25
```tsx
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
```

### File: `components\3d\environment\Lighting.tsx` | Size: 13398 bytes | Ext: `.tsx` | Mod: 2026-11-26 16:22:45
```tsx
import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { localTransformMutable, useGameStore, worldTimeMutable } from '../../../store/useGameStore';
import { getDinoSpec } from '../../../constants/dinosaurs';
import { soundEngine } from '../../../core/sound';
const discoveredHdrFiles = Object.keys(import.meta.glob('/public/textures/sky/*.hdr')).map((p) =>
  p.replace(/^\/public/, '')
);
// =========================================================================
// BẢNG TINH CHỈNH ÁNH SÁNG NGÀY / ĐÊM / ÁNH TRĂNG / NHÌN ĐÊM (CHỈNH TẠI ĐÂY)
// =========================================================================
const LIGHTING_CONFIG = {
  nightExposure: 0.86,
  nightMoonIntensity: 1.05,
  nightAmbient: 0.18,
  nightHemi: 0.24,
  nightFill: 0.1,
  nightFogNear: 42,
  nightFogFar: 180,
  daySunIntensity: 2.25,
  dayAmbient: 0.72,
  dayHemi: 0.88,
  dayFogNear: 125,
  dayFogFar: 460,
  nvRadiusCarnivore: 55,
  nvRadiusHerbivore: 42,
  nvLightIntensity: 3.8,
  nvAmbientBonus: 0.16,
};
export const Lighting: React.FC = () => {
  const { gl, scene } = useThree();
  const brightness = useGameStore((s) => s.brightness);
  const selectedModel = useGameStore((s) => s.selectedModel);
  const dino = getDinoSpec(selectedModel);
  const nvRadius =
    dino.diet === 'carnivore'
      ? LIGHTING_CONFIG.nvRadiusCarnivore
      : LIGHTING_CONFIG.nvRadiusHerbivore;
  const hdrPath = useMemo(() => {
    return (
      discoveredHdrFiles.find((f) => f.toLowerCase().includes('qwantani')) ||
      discoveredHdrFiles.find((f) => f.toLowerCase().includes('sunset')) ||
      discoveredHdrFiles[0] ||
      null
    );
  }, []);
  const skyRef = useRef<React.ComponentRef<typeof Sky>>(null);
  const bgRef = useRef<THREE.Color>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const starsGroupRef = useRef<THREE.Group>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const moonFillRef = useRef<THREE.DirectionalLight>(null);
  const nvLightRef = useRef<THREE.PointLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const fogRef = useRef<THREE.Fog>(null);
  const weatherBlendRef = useRef({ fog: 0, storm: 0 });
  const lightningFlashRef = useRef(0);
  const nextLightningTimerRef = useRef(7);
  const lightTarget = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    scene.add(lightTarget);
    return () => {
      scene.remove(lightTarget);
    };
  }, [scene, lightTarget]);
  const dayBg = useRef(new THREE.Color('#749bb3'));
  const duskBg = useRef(new THREE.Color('#b56e52'));
  const nightBg = useRef(new THREE.Color('#091326'));
  const stormBg = useRef(new THREE.Color('#1d2733'));
  const nvDarkBg = useRef(new THREE.Color('#040d0a'));
  const dayFog = useRef(new THREE.Color('#86a5b5'));
  const duskFog = useRef(new THREE.Color('#b57458'));
  const nightFog = useRef(new THREE.Color('#0b172c'));
  const stormFog = useRef(new THREE.Color('#232e3b'));
  const nvDarkFog = useRef(new THREE.Color('#040f0b'));
  const dayHemiSky = useRef(new THREE.Color('#dce8f2'));
  const nightHemiSky = useRef(new THREE.Color('#4b6b9c'));
  const dayHemiGround = useRef(new THREE.Color('#3b5936'));
  const nightHemiGround = useRef(new THREE.Color('#0d1624'));
  const tempColor = useRef(new THREE.Color());
  const tempBgColor = useRef(new THREE.Color());
  const flashWhite = useRef(new THREE.Color('#e2f1ff'));
  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1);
    const store = useGameStore.getState();
    const nightVision = store.nightVision;
    const weather = store.weather;
    const targetFogW = weather === 'fog' ? 1 : weather === 'rain' ? 0.55 : weather === 'storm' ? 0.85 : 0;
    const targetStormW = weather === 'storm' ? 1 : weather === 'rain' ? 0.55 : 0;
    weatherBlendRef.current.fog = THREE.MathUtils.lerp(
      weatherBlendRef.current.fog,
      targetFogW,
      Math.min(1, dt * 0.7)
    );
    weatherBlendRef.current.storm = THREE.MathUtils.lerp(
      weatherBlendRef.current.storm,
      targetStormW,
      Math.min(1, dt * 0.7)
    );
    // Sấm chớp ngẫu nhiên khi có bão
    if (weather === 'storm') {
      nextLightningTimerRef.current -= dt;
      if (nextLightningTimerRef.current <= 0) {
        lightningFlashRef.current = 1.0;
        nextLightningTimerRef.current = 9 + Math.random() * 14;
        soundEngine.playThunder();
      }
    }
    if (lightningFlashRef.current > 0) {
      lightningFlashRef.current = Math.max(0, lightningFlashRef.current - dt * 2.8);
    }
    const flash = lightningFlashRef.current;
    const px = localTransformMutable.x;
    const py = localTransformMutable.y;
    const pz = localTransformMutable.z;
    const t = worldTimeMutable.value;
    const sunAngle = (t - 0.25) * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle) * 140;
    const sunY = sunHeight * 140;
    const sunZ = 60;
    const moonX = -sunX;
    const moonY = -sunY;
    const moonZ = -55;
    const dayFactor = THREE.MathUtils.clamp((sunHeight + 0.1) / 0.48, 0, 1);
    const nightFactor = 1 - dayFactor;
    const twilightFactor = 1 - Math.min(1, Math.abs(sunHeight) / 0.28);
    const nvStrength = nightVision ? THREE.MathUtils.clamp((nightFactor - 0.12) / 0.45, 0, 1) : 0;
    const stormW = weatherBlendRef.current.storm;
    const fogW = weatherBlendRef.current.fog;
    const exposureMult =
      THREE.MathUtils.lerp(LIGHTING_CONFIG.nightExposure, 0.96 - stormW * 0.16, dayFactor) +
      nvStrength * 0.14 +
      flash * 0.35;
    gl.toneMappingExposure = brightness * exposureMult;
    // Điều khiển độ mạnh ánh sáng HDRI (IBL) mượt theo Ngày/Đêm/Bão
    scene.environmentIntensity =
      (0.06 + dayFactor * 0.42) * (1 - stormW * 0.35) + nvStrength * 0.08 + flash * 0.4;
    if (skyRef.current) {
      skyRef.current.visible = dayFactor > 0.05 && stormW < 0.78;
      skyRef.current.position.set(px, 0, pz);
      const mat = skyRef.current.material as THREE.ShaderMaterial;
      if (mat?.uniforms?.sunPosition?.value) {
        mat.uniforms.sunPosition.value.set(sunX, Math.max(-6, sunY), sunZ);
      }
    }
    if (moonGroupRef.current) {
      moonGroupRef.current.visible = moonY > -20 && stormW < 0.65;
      moonGroupRef.current.position.set(
        px + moonX * 3.8,
        Math.max(48, moonY * 3.8),
        pz + moonZ * 3.8
      );
    }
    if (starsGroupRef.current) {
      starsGroupRef.current.visible = nightFactor > 0.35 && stormW < 0.45;
      starsGroupRef.current.position.set(px, 0, pz);
    }
    tempBgColor.current.copy(nightBg.current).lerp(dayBg.current, dayFactor);
    if (twilightFactor > 0.08) {
      tempBgColor.current.lerp(duskBg.current, twilightFactor * 0.42);
    }
    if (stormW > 0.01) {
      tempBgColor.current.lerp(stormBg.current, stormW * (0.4 + dayFactor * 0.5));
    }
    if (nvStrength > 0.01) {
      tempBgColor.current.lerp(nvDarkBg.current, nvStrength * 0.85);
    }
    if (flash > 0.01) {
      tempBgColor.current.lerp(flashWhite.current, flash * 0.55);
    }
    if (bgRef.current) {
      bgRef.current.copy(tempBgColor.current);
    }
    if (fogRef.current) {
      tempColor.current.copy(nightFog.current).lerp(dayFog.current, dayFactor);
      if (twilightFactor > 0.08) {
        tempColor.current.lerp(duskFog.current, twilightFactor * 0.38);
      }
      if (stormW > 0.01 || fogW > 0.01) {
        tempColor.current.lerp(stormFog.current, Math.max(stormW, fogW * 0.6) * 0.65);
      }
      if (nvStrength > 0.01) {
        tempColor.current.lerp(nvDarkFog.current, nvStrength * 0.9);
      }
      if (flash > 0.01) {
        tempColor.current.lerp(flashWhite.current, flash * 0.4);
      }
      fogRef.current.color.copy(tempColor.current);
      const weatherNearMult = 1 - fogW * 0.72;
      const weatherFarMult = 1 - fogW * 0.68;
      const normalNear =
        THREE.MathUtils.lerp(LIGHTING_CONFIG.nightFogNear, LIGHTING_CONFIG.dayFogNear, dayFactor) *
        weatherNearMult;
      const normalFar =
        THREE.MathUtils.lerp(LIGHTING_CONFIG.nightFogFar, LIGHTING_CONFIG.dayFogFar, dayFactor) *
        weatherFarMult;
      const nvNear = nvRadius * 0.45;
      const nvFar = nvRadius * 1.15;
      fogRef.current.near = THREE.MathUtils.lerp(normalNear, nvNear, nvStrength);
      fogRef.current.far = THREE.MathUtils.lerp(normalFar, nvFar, nvStrength);
    }
    lightTarget.position.set(px, py, pz);
    lightTarget.updateMatrixWorld();
    if (dirLightRef.current) {
      dirLightRef.current.target = lightTarget;
      if (dayFactor >= 0.22) {
        dirLightRef.current.position.set(
          px + sunX * 0.48,
          py + Math.max(32, sunY * 0.65),
          pz + sunZ * 0.48
        );
        dirLightRef.current.intensity =
          (0.9 + dayFactor * (LIGHTING_CONFIG.daySunIntensity - 0.9)) * (1 - stormW * 0.55) +
          flash * 2.5;
        dirLightRef.current.color.set(flash > 0.2 ? '#e0f2fe' : '#ffedd5');
      } else {
        dirLightRef.current.position.set(
          px + moonX * 0.48,
          py + Math.max(42, Math.abs(moonY) * 0.65),
          pz + moonZ * 0.48
        );
        dirLightRef.current.intensity =
          LIGHTING_CONFIG.nightMoonIntensity *
            (0.75 + nightFactor * 0.25) *
            (1 - nvStrength * 0.35) *
            (1 - stormW * 0.4) +
          flash * 3.0;
        dirLightRef.current.color.set(flash > 0.2 ? '#e0f2fe' : '#b8d4ff');
      }
    }
    if (moonFillRef.current) {
      moonFillRef.current.intensity =
        LIGHTING_CONFIG.nightFill * nightFactor * (1 - nvStrength * 0.5) + flash * 0.6;
    }
    if (nvLightRef.current) {
      const active = nvStrength > 0.02;
      nvLightRef.current.visible = active;
      if (active) {
        nvLightRef.current.position.set(px, py + 9.0, pz);
        nvLightRef.current.distance = nvRadius;
        nvLightRef.current.intensity = LIGHTING_CONFIG.nvLightIntensity * nvStrength;
      }
    }
    if (ambientRef.current) {
      ambientRef.current.intensity =
        THREE.MathUtils.lerp(LIGHTING_CONFIG.nightAmbient, LIGHTING_CONFIG.dayAmbient, dayFactor) *
          (1 - stormW * 0.25) +
        LIGHTING_CONFIG.nvAmbientBonus * nvStrength +
        flash * 0.5;
      ambientRef.current.color.set(nvStrength > 0.25 ? '#a7f3d0' : '#d8e6f3');
    }
    if (hemiRef.current) {
      hemiRef.current.intensity =
        THREE.MathUtils.lerp(LIGHTING_CONFIG.nightHemi, LIGHTING_CONFIG.dayHemi, dayFactor) *
          (1 - stormW * 0.28) +
        0.12 * nvStrength;
      hemiRef.current.color.copy(nightHemiSky.current).lerp(dayHemiSky.current, dayFactor);
      hemiRef.current.groundColor
        .copy(nightHemiGround.current)
        .lerp(dayHemiGround.current, dayFactor);
    }
  });
  return (
    <>
      {hdrPath && (
        <Suspense fallback={null}>
          <Environment files={hdrPath} background={false} />
        </Suspense>
      )}
      <color ref={bgRef} attach="background" args={['#749bb3']} />
      <Sky
        ref={skyRef}
        distance={1800}
        sunPosition={[100, 60, 50]}
        rayleigh={0.85}
        turbidity={7.5}
      />
      <group ref={moonGroupRef} position={[-300, 260, -180]}>
        <mesh>
          <sphereGeometry args={[28, 24, 24]} />
          <meshBasicMaterial color="#f8fbff" fog={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[52, 20, 20]} />
          <meshBasicMaterial
            color="#93c5fd"
            transparent
            opacity={0.28}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      </group>
      <group ref={starsGroupRef} visible={false}>
        <Stars radius={520} depth={90} count={1800} factor={6} saturation={0} fade />
      </group>
      <fog ref={fogRef} attach="fog" args={['#86a5b5', 125, 460]} />
      <ambientLight ref={ambientRef} intensity={0.72} color="#d8e6f3" />
      <hemisphereLight ref={hemiRef} args={['#dce8f2', '#3b5936', 0.88]} />
      <directionalLight
        ref={dirLightRef}
        position={[70, 85, 45]}
        intensity={2.25}
        color="#ffedd5"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={5}
        shadow-camera-far={260}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-bias={-0.0004}
      />
      <directionalLight
        ref={moonFillRef}
        position={[-60, 75, 60]}
        intensity={0.1}
        color="#93c5fd"
      />
      <pointLight
        ref={nvLightRef}
        visible={false}
        color="#a7f3d0"
        intensity={0}
        distance={nvRadius}
        decay={0.25}
      />
    </>
  );
};
```

### File: `components\3d\environment\Terrain.tsx` | Size: 9714 bytes | Ext: `.tsx` | Mod: 2026-11-26 16:56:34
```tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  getTerrainHeight,
  HIGHLAND_LAKE_RADIUS,
  HIGHLAND_LAKE_X,
  HIGHLAND_LAKE_Z,
  OASIS_RADIUS,
  OASIS_X,
  OASIS_Z,
  TERRAIN_SEGMENTS,
  TERRAIN_SIZE,
  WATER_LEVEL,
} from '../../../constants/terrain';
import { useGameStore, worldTimeMutable } from '../../../store/useGameStore';
const groundTexFiles = Object.keys(
  import.meta.glob('/public/textures/ground/*.{jpg,jpeg,png,webp}')
).map((p) => p.replace(/^\/public/, ''));
function pickTexturePath(files: string[], keywords: string[]): string | null {
  for (const kw of keywords) {
    const found = files.find((f) => f.toLowerCase().includes(kw));
    if (found) return found;
  }
  return null;
}
const WATER_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uStormFactor;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    float amp = 1.0 + uStormFactor * 1.45;
    float wave =
      sin(worldPosition.x * 0.35 + uTime * (1.8 + uStormFactor)) * 0.05 * amp +
      cos(worldPosition.z * 0.42 - uTime * (1.45 + uStormFactor * 0.8)) * 0.045 * amp;
    worldPosition.y += wave;
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;
const WATER_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uDayFactor;
  uniform float uNightVision;
  uniform float uStormFactor;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vec2 centered = (vUv - 0.5) * 2.0;
    float radial = length(centered);
    float speed = 1.0 + uStormFactor * 0.7;
    float w1 = sin(vWorldPos.x * 0.65 + uTime * 2.1 * speed + sin(vWorldPos.z * 0.45 + uTime));
    float w2 = cos(vWorldPos.z * 0.78 - uTime * 1.7 * speed + cos(vWorldPos.x * 0.5 - uTime * 0.8));
    float ripple = (w1 + w2) * 0.5;
    vec3 dayDeep = mix(vec3(0.03, 0.27, 0.42), vec3(0.04, 0.14, 0.2), uStormFactor);
    vec3 dayShallow = mix(vec3(0.1, 0.54, 0.64), vec3(0.08, 0.25, 0.32), uStormFactor);
    vec3 nightDeep = vec3(0.015, 0.05, 0.11);
    vec3 nightShallow = vec3(0.045, 0.13, 0.22);
    vec3 deepCol = mix(nightDeep, dayDeep, uDayFactor);
    vec3 shallowCol = mix(nightShallow, dayShallow, uDayFactor);
    float shoreFactor = smoothstep(0.42, 0.96, radial);
    vec3 col = mix(deepCol, shallowCol, shoreFactor);
    float glint = smoothstep(0.62, 0.95, ripple) * (0.24 + 0.38 * uDayFactor) * (1.0 - uStormFactor * 0.45);
    vec3 glintCol = mix(vec3(0.55, 0.72, 0.95), vec3(0.92, 0.97, 1.0), uDayFactor);
    col += glintCol * glint;
    float foamWave = sin(radial * 24.0 - uTime * 2.6 * speed + ripple * 2.2) * 0.5 + 0.5;
    float shoreFoam = smoothstep(0.82, 0.98, radial) * (0.45 + 0.55 * foamWave);
    col = mix(col, vec3(0.78, 0.9, 0.94) * (0.32 + 0.68 * uDayFactor), shoreFoam * 0.62);
    if (uNightVision > 0.01) {
      col = mix(col, vec3(0.1, 0.42, 0.32) + glint * 0.25, uNightVision * 0.55);
    }
    float alpha = mix(0.89, 0.5, smoothstep(0.82, 1.0, radial));
    gl_FragColor = vec4(col, alpha);
  }
`;
export const Terrain: React.FC = React.memo(() => {
  const waterMatRef = useRef<THREE.ShaderMaterial>(null);
  const [pbrMaps, setPbrMaps] = useState<{
    map: THREE.Texture | null;
    normalMap: THREE.Texture | null;
    roughnessMap: THREE.Texture | null;
  }>({ map: null, normalMap: null, roughnessMap: null });
  const hasExternalGroundMap = Boolean(pbrMaps.map);
  useEffect(() => {
    const diffPath = pickTexturePath(groundTexFiles, ['diff', 'albedo', 'color', 'base']);
    const norPath = pickTexturePath(groundTexFiles, ['nor_gl', 'nor', 'normal']);
    const roughPath = pickTexturePath(groundTexFiles, ['arm', 'rough']);
    if (!diffPath && !norPath && !roughPath) return;
    const loader = new THREE.TextureLoader();
    const loaded: THREE.Texture[] = [];
    let cancelled = false;
    const configure = (tex: THREE.Texture, isColor: boolean) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(68, 68);
      tex.anisotropy = 4;
      if (isColor) {
        tex.colorSpace = THREE.SRGBColorSpace;
      }
      loaded.push(tex);
      return tex;
    };
    const next = {
      map: diffPath ? configure(loader.load(diffPath), true) : null,
      normalMap: norPath ? configure(loader.load(norPath), false) : null,
      roughnessMap: roughPath ? configure(loader.load(roughPath), false) : null,
    };
    if (!cancelled) {
      setPbrMaps(next);
    }
    return () => {
      cancelled = true;
      loaded.forEach((t) => t.dispose());
    };
  }, []);
  const { terrainGeometry, waterMaterial } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_SIZE,
      TERRAIN_SIZE,
      TERRAIN_SEGMENTS,
      TERRAIN_SEGMENTS
    );
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const color = new THREE.Color();
    const blend = new THREE.Color();
    // Khi có ảnh PBR đất rừng thật, nâng sáng màu vertex để không bị tối bệt khi nhân màu
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);
      const variation = Math.sin(x * 0.045) * Math.cos(z * 0.045) * 0.04;
      if (hasExternalGroundMap) {
        if (y < -0.5) {
          color.set('#7a8262');
        } else if (y < 0.5) {
          const t = (y + 0.5) / 1.0;
          color.set('#b8a885').lerp(blend.set('#9ab884'), t);
        } else if (y < 9.0) {
          const t = (y - 0.5) / 8.5;
          color.set('#96b57e').lerp(blend.set('#7ea372'), t);
        } else if (y < 18.0) {
          const t = (y - 9.0) / 9.0;
          color.set('#7ea372').lerp(blend.set('#8f969e'), t);
        } else if (y < 29.0) {
          const t = (y - 18.0) / 11.0;
          color.set('#8f969e').lerp(blend.set('#b5bec7'), t);
        } else {
          color.set('#cbd4de');
        }
      } else {
        if (y < -0.5) {
          color.set('#3f4b2f');
        } else if (y < 0.5) {
          const t = (y + 0.5) / 1.0;
          color.set('#7d6d4d').lerp(blend.set('#466939'), t);
        } else if (y < 8.0) {
          const t = (y - 0.5) / 7.5;
          color.set('#3f6b36').lerp(blend.set('#2f5932'), t);
        } else if (y < 17.0) {
          const t = (y - 8.0) / 9.0;
          color.set('#2f5932').lerp(blend.set('#4e585f'), t);
        } else if (y < 29.0) {
          const t = (y - 17.0) / 12.0;
          color.set('#4e585f').lerp(blend.set('#7e8792'), t);
        } else {
          color.set('#96a0ab');
        }
      }
      color.offsetHSL(0, 0, variation);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const wMat = new THREE.ShaderMaterial({
      vertexShader: WATER_VERTEX_SHADER,
      fragmentShader: WATER_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uDayFactor: { value: 1 },
        uNightVision: { value: 0 },
        uStormFactor: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    return { terrainGeometry: geo, waterMaterial: wMat };
  }, [hasExternalGroundMap]);
  useEffect(() => {
    return () => {
      terrainGeometry.dispose();
      waterMaterial.dispose();
    };
  }, [terrainGeometry, waterMaterial]);
  useFrame((_, rawDelta) => {
    const mat = waterMatRef.current;
    if (!mat) return;
    const dt = Math.min(rawDelta, 0.1);
    mat.uniforms.uTime.value += dt;
    const sunAngle = (worldTimeMutable.value - 0.25) * Math.PI * 2;
    const dayFactor = THREE.MathUtils.clamp((Math.sin(sunAngle) + 0.1) / 0.48, 0, 1);
    mat.uniforms.uDayFactor.value = dayFactor;
    const st = useGameStore.getState();
    mat.uniforms.uNightVision.value = st.nightVision ? 1 - dayFactor : 0;
    const targetStorm = st.weather === 'storm' ? 1 : st.weather === 'rain' ? 0.55 : 0;
    mat.uniforms.uStormFactor.value = THREE.MathUtils.lerp(
      mat.uniforms.uStormFactor.value,
      targetStorm,
      Math.min(1, dt * 1.5)
    );
  });
  const normalScaleVec = useMemo(() => new THREE.Vector2(0.85, 0.85), []);
  return (
    <group>
      <mesh geometry={terrainGeometry} receiveShadow>
        <meshStandardMaterial
          vertexColors
          map={pbrMaps.map}
          normalMap={pbrMaps.normalMap}
          normalScale={normalScaleVec}
          roughnessMap={pbrMaps.roughnessMap}
          roughness={0.94}
          metalness={0.02}
        />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[OASIS_X, WATER_LEVEL, OASIS_Z]}
        material={waterMaterial}
      >
        <circleGeometry args={[OASIS_RADIUS + 5.5, 48]} />
        <primitive ref={waterMatRef} object={waterMaterial} attach="material" />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[HIGHLAND_LAKE_X, WATER_LEVEL, HIGHLAND_LAKE_Z]}
        material={waterMaterial}
      >
        <circleGeometry args={[HIGHLAND_LAKE_RADIUS + 6.5, 48]} />
      </mesh>
    </group>
  );
});
```

### File: `components\3d\environment\WorldFoods.tsx` | Size: 2301 bytes | Ext: `.tsx` | Mod: 2026-11-26 00:48:05
```tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { foodsMutable, useGameStore } from '../../../store/useGameStore';
import { getMeshTerrainHeight } from '../../../constants/terrain';
const FoodNode: React.FC<{ id: string }> = React.memo(({ id }) => {
  const groupRef = useRef<THREE.Group>(null);
  const initial = foodsMutable[id];
  const isMeat = initial?.type === 'meat';
  useFrame(() => {
    const f = foodsMutable[id];
    if (!f || !groupRef.current) return;
    const ratio = Math.max(0.25, f.amount / Math.max(1, f.maxAmount));
    groupRef.current.scale.setScalar(ratio);
  });
  if (!initial) return null;
  const groundY = getMeshTerrainHeight(initial.x, initial.z);
  return (
    <group ref={groupRef} position={[initial.x, groundY, initial.z]}>
      {isMeat ? (
        <group>
          <mesh position={[0, 0.45, 0]} castShadow>
            <dodecahedronGeometry args={[0.85, 0]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.6} flatShading />
          </mesh>
          <mesh position={[0.45, 0.55, 0.1]} rotation={[0.4, 0.3, 0.8]}>
            <cylinderGeometry args={[0.12, 0.12, 1.3, 6]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.8} />
          </mesh>
        </group>
      ) : (
        <group>
          <mesh position={[0, 0.65, 0]} castShadow>
            <dodecahedronGeometry args={[1.15, 1]} />
            <meshStandardMaterial color="#16a34a" roughness={0.85} flatShading />
          </mesh>
          <mesh position={[0.55, 1.0, 0.4]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[-0.45, 0.9, -0.35]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.4} />
          </mesh>
        </group>
      )}
    </group>
  );
});
export const WorldFoods: React.FC = () => {
  const foodIds = useGameStore((s) => s.foodIds);
  return (
    <group>
      {foodIds.map((id) => (
        <FoodNode key={id} id={id} />
      ))}
    </group>
  );
};
```

### File: `components\3d\LocalDino.tsx` | Size: 20293 bytes | Ext: `.tsx` | Mod: 2026-11-26 16:30:53
```tsx
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { socket } from '../../core/socket';
import { soundEngine } from '../../core/sound';
import {
  useGameStore,
  localTransformMutable,
  playersMutable,
  foodsMutable,
} from '../../store/useGameStore';
import { getDinoSpec } from '../../constants/dinosaurs';
import {
  calcGrowthVisualScale,
  getEntityGroundHeight,
  getMeshTerrainHeight,
  getTerrainSlope,
  ISLAND_LIMIT,
  isNearWater,
  WORLD_ROCKS,
} from '../../constants/terrain';
import { useDinoControls } from '../../hooks/useDinoControls';
import { useDinoModel } from '../../hooks/useDinoModel';
import type { AnimState } from '../../types/game';
export const LocalDino: React.FC = () => {
  const myId = useGameStore((s) => s.myId);
  const myName = useGameStore((s) => s.myName);
  const selectedModel = useGameStore((s) => s.selectedModel);
  const modelRotationOffsets = useGameStore((s) => s.modelRotationOffsets);
  const growth = useGameStore((s) => s.growth);
  const isResting = useGameStore((s) => s.isResting);
  const isCrouching = useGameStore((s) => s.isCrouching);
  const boneBreak = useGameStore((s) => s.boneBreak);
  const setStamina = useGameStore((s) => s.setStamina);
  const setActionHint = useGameStore((s) => s.setActionHint);
  const dino = getDinoSpec(selectedModel);
  const userExtraYaw = modelRotationOffsets[dino.id.toLowerCase()] || 0;
  const group = useRef<THREE.Group>(null!);
  const slopeGroupRef = useRef<THREE.Group>(null!);
  const modelHolderRef = useRef<THREE.Group>(null!);
  const shadowMeshRef = useRef<THREE.Mesh>(null);
  const labelGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const wBadgeRef = useRef<HTMLSpanElement>(null);
  const aBadgeRef = useRef<HTMLSpanElement>(null);
  const sBadgeRef = useRef<HTMLSpanElement>(null);
  const dBadgeRef = useRef<HTMLSpanElement>(null);
  const {
    clonedScene,
    baseScaleRef,
    baseOffsetYRef,
    autoYawRef,
    isQuadrupedRef,
    activeAnimRef,
    activeActionObjRef,
    isOneShotPlayingRef,
    playAnim,
    calibrateAfterRender,
  } = useDinoModel(dino.modelPath, dino.targetSize, dino.rotationOffset);
  const position = useRef(new THREE.Vector3(0, getEntityGroundHeight(0, 0), 0));
  const rotationY = useRef(0);
  const staminaRef = useRef(100);
  const lastSyncTime = useRef(0);
  const lastHintCheck = useRef(0);
  const lastRespawnSeqRef = useRef(0);
  const postureBlendRef = useRef(0);
  const crouchBlendRef = useRef(0);
  const keysRefForCallback = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });
  const handleOneShot = useCallback(
    (anim: AnimState) => {
      if (useGameStore.getState().isResting) return;
      playAnim(anim, true, () => {
        if (useGameStore.getState().isResting) {
          playAnim('rest', false);
          return;
        }
        const k = keysRefForCallback.current;
        const moving = k.forward || k.backward || k.left || k.right;
        if (!moving) {
          playAnim('idle', false);
        } else {
          playAnim(k.sprint && k.forward ? 'run' : 'walk', false);
        }
      });
    },
    [playAnim]
  );
  const handleTriggerSpecial = useCallback(() => {
    const st = useGameStore.getState();
    if (st.isResting || st.specialCd > 0) return;
    const modelId = dino.id.toLowerCase();
    handleOneShot(modelId === 'stego' ? 'tail' : 'bite');
    socket.sendSpecial();
    soundEngine.playSpecial();
    // Lướt tiến tức thì cho các loài sát thủ nhanh nhẹn (khớp dash 10m của server)
    if (
      modelId !== 'trex' &&
      modelId !== 't-rex' &&
      modelId !== 'tricera' &&
      modelId !== 'mammoth' &&
      modelId !== 'stego'
    ) {
      const fx = Math.sin(rotationY.current);
      const fz = Math.cos(rotationY.current);
      position.current.x = Math.max(-ISLAND_LIMIT, Math.min(ISLAND_LIMIT, position.current.x + fx * 10));
      position.current.z = Math.max(-ISLAND_LIMIT, Math.min(ISLAND_LIMIT, position.current.z + fz * 10));
    }
  }, [dino.id, handleOneShot]);
  const { keys, isRightMouseDown, cameraYaw, cameraPitch, zoomDistance } = useDinoControls({
    defaultCamDistance: dino.camDistance,
    onTriggerOneShot: handleOneShot,
    onTriggerSpecial: handleTriggerSpecial,
  });
  useEffect(() => {
    keysRefForCallback.current = keys.current;
  }, [keys]);
  const tempCamOffset = useMemo(() => new THREE.Vector3(), []);
  const tempTargetCamPos = useMemo(() => new THREE.Vector3(), []);
  const tempLookTarget = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, rawDelta) => {
    if (!group.current || !modelHolderRef.current || !slopeGroupRef.current) return;
    const delta = Math.min(rawDelta, 0.1);
    const now = performance.now();
    const storeState = useGameStore.getState();
    // 1. Đồng bộ hồi sinh & phản hồi bị húc văng từ server
    if (myId && playersMutable[myId]) {
      const serverMe = playersMutable[myId];
      const serverSeq = serverMe.respawnSeq || 0;
      const serverDist = Math.hypot(
        serverMe.x - position.current.x,
        serverMe.z - position.current.z
      );
      const recentlyHit = now - storeState.lastDamagedAt < 500;
      if (serverSeq > lastRespawnSeqRef.current || serverDist > 26) {
        lastRespawnSeqRef.current = serverSeq;
        position.current.set(
          serverMe.x,
          getEntityGroundHeight(serverMe.x, serverMe.z),
          serverMe.z
        );
      } else if (recentlyHit && serverDist > 4.2) {
        position.current.x = THREE.MathUtils.lerp(position.current.x, serverMe.x, Math.min(1, delta * 14));
        position.current.z = THREE.MathUtils.lerp(position.current.z, serverMe.z, Math.min(1, delta * 14));
      }
    }
    calibrateAfterRender(group.current, modelHolderRef.current);
    // 2. Kích thước tăng trưởng + tư thế nằm nghỉ / rón rén
    const liveGrowth = storeState.growth;
    const liveScaleMult = storeState.dinoScaleMultiplier;
    const growthVisual = calcGrowthVisualScale(liveGrowth);
    const totalMultiplier = growthVisual * liveScaleMult;
    postureBlendRef.current = THREE.MathUtils.lerp(
      postureBlendRef.current,
      storeState.isResting ? 1 : 0,
      Math.min(1, delta * 7)
    );
    crouchBlendRef.current = THREE.MathUtils.lerp(
      crouchBlendRef.current,
      !storeState.isResting && storeState.isCrouching ? 1 : 0,
      Math.min(1, delta * 9)
    );
    const restFactor = postureBlendRef.current;
    const crouchFactor = crouchBlendRef.current;
    const baseScale = baseScaleRef.current * totalMultiplier;
    const scaleYMult = 1 - restFactor * 0.24 - crouchFactor * 0.12;
    modelHolderRef.current.scale.set(baseScale, baseScale * scaleYMult, baseScale);
    const postureDropY = (restFactor * 0.36 + crouchFactor * 0.16) * totalMultiplier;
    modelHolderRef.current.position.set(
      0,
      baseOffsetYRef.current * totalMultiplier * scaleYMult - postureDropY,
      0
    );
    modelHolderRef.current.rotation.set(0, autoYawRef.current + userExtraYaw, 0);
    if (shadowMeshRef.current) {
      const shadowBoost = 1 + restFactor * 0.18;
      shadowMeshRef.current.scale.set(totalMultiplier * shadowBoost, totalMultiplier * shadowBoost, 1);
    }
    if (labelGroupRef.current) {
      labelGroupRef.current.position.y =
        dino.nametagHeight * totalMultiplier * (1 - restFactor * 0.28 - crouchFactor * 0.12);
    }
    // 3. Khóa hoàn toàn input khi đang nghỉ ngơi
    if (storeState.isResting) {
      keys.current.forward = false;
      keys.current.backward = false;
      keys.current.left = false;
      keys.current.right = false;
      keys.current.sprint = false;
    }
    const forwardActive = !storeState.isResting && keys.current.forward;
    const backwardActive = !storeState.isResting && keys.current.backward;
    const leftActive = !storeState.isResting && keys.current.left;
    const rightActive = !storeState.isResting && keys.current.right;
    const paintBadge = (el: HTMLSpanElement | null, active: boolean) => {
      if (!el) return;
      el.style.background = active ? '#10b981' : 'rgba(15, 23, 42, 0.75)';
      el.style.color = active ? '#030712' : '#94a3b8';
    };
    paintBadge(wBadgeRef.current, forwardActive);
    paintBadge(aBadgeRef.current, leftActive);
    paintBadge(sBadgeRef.current, backwardActive);
    paintBadge(dBadgeRef.current, rightActive);
    const isMovingForward = forwardActive && !backwardActive;
    const isMovingBackward = backwardActive && !forwardActive;
    const isTurningLeft = leftActive && !rightActive;
    const isTurningRight = rightActive && !leftActive;
    const isTurning = isTurningLeft || isTurningRight;
    const isMoving = isMovingForward || isMovingBackward;
    const hasBoneBreak = storeState.boneBreak > 0;
    const isSprinting =
      !storeState.isResting &&
      !storeState.isCrouching &&
      !hasBoneBreak &&
      keys.current.sprint &&
      (isMovingForward || isTurning) &&
      staminaRef.current > 5;
    const nearWater = isNearWater(position.current.x, position.current.z);
    let regenRate = nearWater ? 26 : 14;
    if (storeState.isResting) regenRate = 38;
    if (isSprinting) {
      staminaRef.current = Math.max(0, staminaRef.current - delta * 20);
    } else {
      staminaRef.current = Math.min(100, staminaRef.current + delta * regenRate);
    }
    setStamina(staminaRef.current);
    if (!storeState.isResting) {
      const boneMult = hasBoneBreak ? 0.45 : 1.0;
      const effectiveTurnSpeed =
        (isQuadrupedRef.current ? dino.turnSpeed * 0.78 : dino.turnSpeed) * (hasBoneBreak ? 0.7 : 1.0);
      const turnDir = isMovingBackward ? -1 : 1;
      if (isTurningLeft) rotationY.current += effectiveTurnSpeed * delta * turnDir;
      if (isTurningRight) rotationY.current -= effectiveTurnSpeed * delta * turnDir;
      const forwardX = Math.sin(rotationY.current);
      const forwardZ = Math.cos(rotationY.current);
      const agilityBoost = 1.15 - 0.14 * Math.min(1.25, liveGrowth);
      const crouchSpeedMult = storeState.isCrouching ? 0.55 : 1.0;
      if (isMovingForward) {
        const speed =
          (isSprinting ? dino.sprintSpeed : dino.walkSpeed) *
          agilityBoost *
          crouchSpeedMult *
          boneMult;
        position.current.x += forwardX * speed * delta;
        position.current.z += forwardZ * speed * delta;
      } else if (isMovingBackward) {
        position.current.x -= forwardX * dino.backSpeed * crouchSpeedMult * boneMult * delta;
        position.current.z -= forwardZ * dino.backSpeed * crouchSpeedMult * boneMult * delta;
      } else if (isTurning) {
        const arcFactor = isQuadrupedRef.current ? 0.75 : 0.6;
        const turnWalkSpeed =
          (isSprinting ? dino.sprintSpeed : dino.walkSpeed) *
          arcFactor *
          crouchSpeedMult *
          boneMult;
        position.current.x += forwardX * turnWalkSpeed * delta;
        position.current.z += forwardZ * turnWalkSpeed * delta;
      }
    }
    // 4. Va chạm đá & bám sát mặt địa hình trũng/dốc
    const myRadius = 1.45 * totalMultiplier;
    for (let i = 0; i < WORLD_ROCKS.length; i++) {
      const rock = WORLD_ROCKS[i];
      const dx = position.current.x - rock.pos[0];
      const dz = position.current.z - rock.pos[2];
      const dist = Math.hypot(dx, dz);
      const minDist = rock.radius + myRadius;
      if (dist < minDist && dist > 0.001) {
        const push = minDist - dist;
        position.current.x += (dx / dist) * push;
        position.current.z += (dz / dist) * push;
      }
    }
    position.current.x = Math.max(-ISLAND_LIMIT, Math.min(ISLAND_LIMIT, position.current.x));
    position.current.z = Math.max(-ISLAND_LIMIT, Math.min(ISLAND_LIMIT, position.current.z));
    position.current.y = getEntityGroundHeight(position.current.x, position.current.z);
    group.current.position.copy(position.current);
    group.current.rotation.y = rotationY.current;
    const slope = getTerrainSlope(
      position.current.x,
      position.current.z,
      rotationY.current,
      Math.max(1.2, 1.5 * totalMultiplier)
    );
    const targetPitch = slope.pitch + crouchFactor * 0.1 + restFactor * 0.06;
    slopeGroupRef.current.rotation.x = THREE.MathUtils.lerp(
      slopeGroupRef.current.rotation.x,
      targetPitch,
      Math.min(1, delta * 10)
    );
    slopeGroupRef.current.rotation.z = THREE.MathUtils.lerp(
      slopeGroupRef.current.rotation.z,
      slope.roll,
      Math.min(1, delta * 10)
    );
    localTransformMutable.x = position.current.x;
    localTransformMutable.y = position.current.y;
    localTransformMutable.z = position.current.z;
    localTransformMutable.rot = rotationY.current;
    // 5. Gợi ý hành động
    if (now - lastHintCheck.current > 250) {
      lastHintCheck.current = now;
      let hint: string | null = null;
      if (storeState.isResting) {
        hint =
          storeState.restUnlockLeft > 0
            ? `💤 Đang nghỉ ngơi (+20 HP/s) — Mở khóa đứng dậy sau ${storeState.restUnlockLeft.toFixed(1)}s`
            : '💤 Đang nghỉ ngơi (+20 HP/s) — Bấm nút Hết nghỉ ngơi hoặc [H] để đứng dậy';
      } else if (nearWater) {
        hint = '💧 Bấm [G] để Uống nước (+Khát & Cầm máu)';
      } else {
        const desiredFood = dino.diet === 'herbivore' ? 'plant' : 'meat';
        for (const id of Object.keys(foodsMutable)) {
          const f = foodsMutable[id];
          if (f.type === desiredFood && f.amount > 0) {
            if (Math.hypot(f.x - position.current.x, f.z - position.current.z) < 8.0) {
              hint =
                desiredFood === 'meat'
                  ? '🥩 Bấm [G] để Ăn thịt (+Máu & +11% Trưởng thành)'
                  : '🌿 Bấm [G] để Ăn bụi quả (+Máu & +11% Trưởng thành)';
              break;
            }
          }
        }
      }
      setActionHint(hint);
    }
    // 6. Animation
    if (storeState.isResting) {
      isOneShotPlayingRef.current = false;
      if (activeAnimRef.current !== 'rest') {
        playAnim('rest', false);
      }
      if (activeActionObjRef.current) {
        activeActionObjRef.current.timeScale = 0.4;
      }
    } else if (!isOneShotPlayingRef.current) {
      let targetAnim: AnimState = 'idle';
      if (isMoving || isTurning) {
        targetAnim = isSprinting ? 'run' : 'walk';
      }
      if (activeAnimRef.current !== targetAnim) {
        playAnim(targetAnim, false);
      }
      if (activeActionObjRef.current && (targetAnim === 'walk' || targetAnim === 'run')) {
        if (hasBoneBreak) {
          activeActionObjRef.current.timeScale = 0.52;
        } else if (storeState.isCrouching) {
          activeActionObjRef.current.timeScale = 0.65;
        } else if (isMovingBackward) {
          activeActionObjRef.current.timeScale = 0.8;
        } else if (isSprinting) {
          activeActionObjRef.current.timeScale = 1.25;
        } else {
          activeActionObjRef.current.timeScale = 1.0;
        }
      } else if (activeActionObjRef.current) {
        activeActionObjRef.current.timeScale = 1.0;
      }
    }
    // 7. Đồng bộ mạng 20Hz
    if (!storeState.isResting && now - lastSyncTime.current > 50) {
      lastSyncTime.current = now;
      socket.sendMove(
        position.current.x,
        position.current.y,
        position.current.z,
        rotationY.current,
        activeAnimRef.current
      );
    }
    // 8. Camera xoay 360°
    if (isMovingForward && !isTurning && !isRightMouseDown.current) {
      let diff = (rotationY.current - cameraYaw.current) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      cameraYaw.current += diff * Math.min(1, delta * 1.8);
    }
    const pivotY =
      position.current.y + dino.lookAtY * totalMultiplier * (1 - restFactor * 0.3) + 0.6;
    const pitch = cameraPitch.current;
    const dist = zoomDistance.current * (0.7 + 0.35 * totalMultiplier);
    const horizDist = Math.cos(pitch) * dist;
    const camX = position.current.x - Math.sin(cameraYaw.current) * horizDist;
    const camZ = position.current.z - Math.cos(cameraYaw.current) * horizDist;
    const desiredCamY = pivotY + Math.sin(pitch) * dist;
    const minCamY = getMeshTerrainHeight(camX, camZ) + 0.9;
    const actualCamY = Math.max(minCamY, desiredCamY);
    const skyTiltLift = Math.max(0, actualCamY - desiredCamY);
    tempCamOffset.set(
      camX - position.current.x,
      actualCamY - position.current.y,
      camZ - position.current.z
    );
    tempTargetCamPos.copy(position.current).add(tempCamOffset);
    camera.position.lerp(tempTargetCamPos, Math.min(1, delta * 12));
    tempLookTarget.set(position.current.x, pivotY + skyTiltLift, position.current.z);
    camera.lookAt(tempLookTarget);
  });
  const badgeStyle: React.CSSProperties = {
    padding: '2px 7px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
    background: 'rgba(15, 23, 42, 0.75)',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.15)',
  };
  return (
    <group ref={group}>
      <group ref={slopeGroupRef}>
        <group ref={modelHolderRef}>
          <primitive object={clonedScene} />
        </group>
        <mesh ref={shadowMeshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <circleGeometry args={[1.4, 20]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      </group>
      <group ref={labelGroupRef} position={[0, dino.nametagHeight, 0]}>
        <Html center distanceFactor={26}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
              userSelect: 'none',
              transform: 'translateY(-16px)',
              gap: '4px',
            }}
          >
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.88)',
                border:
                  boneBreak > 0
                    ? '1px solid #fb923c'
                    : isResting
                    ? '1px solid #38bdf8'
                    : isCrouching
                    ? '1px solid #facc15'
                    : '1px solid #10b981',
                borderRadius: '6px',
                padding: '3px 10px',
                color: '#34d399',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '12px',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
              }}
            >
              {boneBreak > 0 ? '🦴 ' : isResting ? '💤 ' : isCrouching ? '🐾 ' : ''}
              {myName}{' '}
              <span style={{ color: '#fde047', fontSize: '10px' }}>
                {Math.round(growth * 100)}%
              </span>
            </div>
            {!isResting && (
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                <span ref={wBadgeRef} style={badgeStyle}>W</span>
                <span ref={aBadgeRef} style={badgeStyle}>A</span>
                <span ref={sBadgeRef} style={badgeStyle}>S</span>
                <span ref={dBadgeRef} style={badgeStyle}>D</span>
              </div>
            )}
          </div>
        </Html>
      </group>
    </group>
  );
};
```

### File: `components\3d\RemoteDino.tsx` | Size: 12420 bytes | Ext: `.tsx` | Mod: 2026-11-26 16:54:41
```tsx
import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  localTransformMutable,
  playersMutable,
  useGameStore,
  worldTimeMutable,
} from '../../store/useGameStore';
import { getDinoSpec } from '../../constants/dinosaurs';
import {
  calcGrowthVisualScale,
  getEntityGroundHeight,
  getTerrainSlope,
} from '../../constants/terrain';
import { useDinoModel } from '../../hooks/useDinoModel';
import type { AnimState } from '../../types/game';
interface RemoteDinoProps {
  id: string;
}
export const RemoteDino: React.FC<RemoteDinoProps> = React.memo(({ id }) => {
  const dinoScaleMultiplier = useGameStore((s) => s.dinoScaleMultiplier);
  const modelRotationOffsets = useGameStore((s) => s.modelRotationOffsets);
  const myPackId = useGameStore((s) => s.packId);
  const initialData = playersMutable[id];
  const dino = getDinoSpec(initialData?.model);
  const userExtraYaw = modelRotationOffsets[dino.id.toLowerCase()] || 0;
  const group = useRef<THREE.Group>(null!);
  const slopeGroupRef = useRef<THREE.Group>(null!);
  const modelHolderRef = useRef<THREE.Group>(null!);
  const shadowMeshRef = useRef<THREE.Mesh>(null);
  const labelGroupRef = useRef<THREE.Group>(null);
  const hpBarRef = useRef<HTMLDivElement>(null);
  const aiStateLabelRef = useRef<HTMLSpanElement>(null);
  const restTagRef = useRef<HTMLSpanElement>(null);
  const boneTagRef = useRef<HTMLSpanElement>(null);
  const packTagRef = useRef<HTMLSpanElement>(null);
  const badgeBoxRef = useRef<HTMLDivElement>(null);
  const [showLabel, setShowLabel] = useState(false);
  const showLabelRef = useRef(false);
  const lastLabelCheck = useRef(0);
  const restBlendRef = useRef(0);
  const crouchBlendRef = useRef(0);
  const wasCulledRef = useRef(false);
  const {
    clonedScene,
    baseScaleRef,
    baseOffsetYRef,
    autoYawRef,
    activeAnimRef,
    activeActionObjRef,
    playAnim,
    calibrateAfterRender,
  } = useDinoModel(dino.modelPath, dino.targetSize, dino.rotationOffset);
  const initY = getEntityGroundHeight(initialData?.x || 0, initialData?.z || 0);
  const targetPos = useMemo(
    () => new THREE.Vector3(initialData?.x || 0, initY, initialData?.z || 0),
    []
  );
  useFrame((_, rawDelta) => {
    const p = playersMutable[id];
    if (!p || !group.current || !modelHolderRef.current || !slopeGroupRef.current) return;
    const dxMe = p.x - localTransformMutable.x;
    const dzMe = p.z - localTransformMutable.z;
    const distSq = dxMe * dxMe + dzMe * dzMe;
    const isPackmate = Boolean(!p.isAi && myPackId && p.packId && p.packId === myPackId);
    // Distance Culling: Ẩn hoàn toàn SkinnedMesh ở xa > 165m (giảm mạnh tải GPU/CPU)
    const cullDistSq = isPackmate ? 280 * 280 : 165 * 165;
    if (distSq > cullDistSq) {
      if (group.current.visible) {
        group.current.visible = false;
      }
      if (showLabelRef.current) {
        showLabelRef.current = false;
        setShowLabel(false);
      }
      wasCulledRef.current = true;
      return;
    }
    if (!group.current.visible) {
      group.current.visible = true;
    }
    const delta = Math.min(rawDelta, 0.1);
    calibrateAfterRender(group.current, modelHolderRef.current);
    const growthVal = typeof p.growth === 'number' && p.growth > 0 ? p.growth : 0.9;
    const visualMult = calcGrowthVisualScale(growthVal) * dinoScaleMultiplier;
    restBlendRef.current = THREE.MathUtils.lerp(
      restBlendRef.current,
      p.isResting ? 1 : 0,
      Math.min(1, delta * 7)
    );
    crouchBlendRef.current = THREE.MathUtils.lerp(
      crouchBlendRef.current,
      !p.isResting && p.isCrouching ? 1 : 0,
      Math.min(1, delta * 9)
    );
    const restFactor = restBlendRef.current;
    const crouchFactor = crouchBlendRef.current;
    const scaleYMult = 1 - restFactor * 0.24 - crouchFactor * 0.12;
    const baseScale = baseScaleRef.current * visualMult;
    modelHolderRef.current.scale.set(baseScale, baseScale * scaleYMult, baseScale);
    const postureDropY = (restFactor * 0.36 + crouchFactor * 0.16) * visualMult;
    modelHolderRef.current.position.set(
      0,
      baseOffsetYRef.current * visualMult * scaleYMult - postureDropY,
      0
    );
    modelHolderRef.current.rotation.set(0, autoYawRef.current + userExtraYaw, 0);
    if (shadowMeshRef.current) {
      shadowMeshRef.current.scale.set(visualMult, visualMult, 1);
    }
    if (labelGroupRef.current) {
      labelGroupRef.current.position.y =
        dino.nametagHeight * visualMult * (1 - restFactor * 0.28 - crouchFactor * 0.12);
    }
    let nextX = p.x;
    let nextZ = p.z;
    if (!wasCulledRef.current) {
      nextX = THREE.MathUtils.lerp(group.current.position.x, p.x, Math.min(1, delta * 12));
      nextZ = THREE.MathUtils.lerp(group.current.position.z, p.z, Math.min(1, delta * 12));
    } else {
      wasCulledRef.current = false;
    }
    const exactGroundY = getEntityGroundHeight(nextX, nextZ);
    targetPos.set(nextX, exactGroundY, nextZ);
    group.current.position.copy(targetPos);
    const currentRot = group.current.rotation.y;
    let diff = (p.rot - currentRot) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    group.current.rotation.y += diff * Math.min(1, delta * 10);
    // Chỉ tính góc nghiêng địa hình khi bot ở trong vòng 95m
    if (distSq < 95 * 95) {
      const slope = getTerrainSlope(
        nextX,
        nextZ,
        group.current.rotation.y,
        Math.max(1.2, 1.5 * visualMult)
      );
      slopeGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        slopeGroupRef.current.rotation.x,
        slope.pitch + crouchFactor * 0.1 + restFactor * 0.06,
        Math.min(1, delta * 10)
      );
      slopeGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        slopeGroupRef.current.rotation.z,
        slope.roll,
        Math.min(1, delta * 10)
      );
    }
    const nextAnim = (p.isResting ? 'rest' : p.anim || 'idle') as AnimState;
    if (nextAnim !== activeAnimRef.current) {
      const isOneShot = nextAnim === 'bite' || nextAnim === 'roar' || nextAnim === 'tail';
      playAnim(nextAnim, isOneShot);
    }
    if (activeActionObjRef.current) {
      activeActionObjRef.current.timeScale = p.isResting ? 0.4 : 1.0;
    }
    const now = performance.now();
    if (now - lastLabelCheck.current > 350) {
      lastLabelCheck.current = now;
      const distToMe = Math.sqrt(distSq);
      let maxVisibleDist = isPackmate ? 260 : 75;
      if (!isPackmate) {
        const sunAngle = (worldTimeMutable.value - 0.25) * Math.PI * 2;
        const isNight = Math.sin(sunAngle) < 0.05;
        if (isNight) {
          const st = useGameStore.getState();
          if (st.nightVision) {
            const mySpec = getDinoSpec(st.selectedModel);
            maxVisibleDist = mySpec.diet === 'carnivore' ? 55 : 42;
          } else {
            maxVisibleDist = 20;
          }
        }
      }
      const shouldShow = distToMe <= maxVisibleDist;
      if (shouldShow !== showLabelRef.current) {
        showLabelRef.current = shouldShow;
        setShowLabel(shouldShow);
      }
    }
    if (hpBarRef.current && typeof p.hp === 'number') {
      const maxHp = p.maxHp || 100;
      const pct = Math.max(0, Math.min(100, (p.hp / maxHp) * 100));
      hpBarRef.current.style.width = `${pct}%`;
      if (isPackmate) {
        hpBarRef.current.style.background = '#38bdf8';
      }
    }
    if (badgeBoxRef.current && isPackmate) {
      badgeBoxRef.current.style.borderColor = '#38bdf8';
      badgeBoxRef.current.style.color = '#7dd3fc';
    }
    if (aiStateLabelRef.current && p.aiState) {
      aiStateLabelRef.current.textContent = p.aiState;
      aiStateLabelRef.current.style.color =
        p.aiState === 'CHASE' || p.aiState === 'ATTACK' ? '#f87171' : '#a5b4fc';
    }
    if (restTagRef.current) {
      restTagRef.current.style.display = p.isResting ? 'inline' : 'none';
    }
    if (boneTagRef.current) {
      boneTagRef.current.style.display = (p.boneBreak || 0) > 0 ? 'inline' : 'none';
    }
    if (packTagRef.current) {
      packTagRef.current.style.display = isPackmate ? 'inline' : 'none';
    }
  });
  const isAI = Boolean(initialData?.isAi || id.startsWith('bot-'));
  const isHerbivore = initialData?.diet === 'herbivore' || dino.diet === 'herbivore';
  const displayName = initialData?.name || 'Dinosaur';
  const initVisualMult = calcGrowthVisualScale(initialData?.growth || 0.9) * dinoScaleMultiplier;
  return (
    <group ref={group} position={[initialData?.x || 0, initY, initialData?.z || 0]}>
      <group ref={slopeGroupRef}>
        <group ref={modelHolderRef}>
          <primitive object={clonedScene} />
        </group>
        <mesh ref={shadowMeshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <circleGeometry args={[1.3, 18]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.32} depthWrite={false} />
        </mesh>
      </group>
      <group ref={labelGroupRef} position={[0, dino.nametagHeight * initVisualMult, 0]}>
        {showLabel && (
          <Html center distanceFactor={28}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none',
                userSelect: 'none',
                transform: 'translateY(-14px)',
              }}
            >
              <div
                ref={badgeBoxRef}
                style={{
                  background: isAI ? 'rgba(30, 27, 75, 0.9)' : 'rgba(15, 23, 42, 0.9)',
                  border: isHerbivore
                    ? '1px solid #34d399'
                    : isAI
                    ? '1px solid #818cf8'
                    : '1px solid #f87171',
                  borderRadius: '6px',
                  padding: '3px 10px',
                  color: isHerbivore ? '#a7f3d0' : isAI ? '#c7d2fe' : '#fca5a5',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                }}
              >
                <span ref={packTagRef} style={{ display: 'none', marginRight: '4px' }}>
                  🐾
                </span>
                <span ref={boneTagRef} style={{ display: 'none', marginRight: '4px' }}>
                  🦴
                </span>
                <span ref={restTagRef} style={{ display: 'none', marginRight: '4px' }}>
                  💤
                </span>
                {isHerbivore ? '🌿 ' : '🥩 '}
                {displayName}
                {isAI ? (
                  <span
                    ref={aiStateLabelRef}
                    style={{ color: '#a5b4fc', fontSize: '10px', marginLeft: '5px' }}
                  >
                    [AI]
                  </span>
                ) : (
                  <span style={{ color: '#cbd5e1', fontSize: '10px', marginLeft: '4px' }}>
                    [{dino.species}]
                  </span>
                )}
              </div>
              <div
                style={{
                  width: '56px',
                  height: '4px',
                  background: 'rgba(0,0,0,0.65)',
                  borderRadius: '2px',
                  marginTop: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  ref={hpBarRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    background: isHerbivore ? '#10b981' : isAI ? '#6366f1' : '#ef4444',
                    transition: 'width 0.12s ease-out',
                  }}
                />
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
});
```

### File: `components\3d\Scene.tsx` | Size: 1180 bytes | Ext: `.tsx` | Mod: 2026-11-26 16:30:20
```tsx
import React, { useMemo } from 'react';
import { useGameStore, playersMutable } from '../../store/useGameStore';
import { Lighting } from './environment/Lighting';
import { Terrain } from './environment/Terrain';
import { Foliage } from './environment/Foliage';
import { WorldFoods } from './environment/WorldFoods';
import { CombatEffects } from './vfx/CombatEffects';
import { ScentPulse } from './vfx/ScentPulse';
import { WeatherAndTrails } from './vfx/WeatherAndTrails';
import { LocalDino } from './LocalDino';
import { RemoteDino } from './RemoteDino';
export const Scene: React.FC = () => {
  const playerIds = useGameStore((s) => s.playerIds);
  const myId = useGameStore((s) => s.myId);
  const remoteIds = useMemo(() => {
    return playerIds.filter((id) => id !== myId);
  }, [playerIds, myId]);
  return (
    <>
      <Lighting />
      <Terrain />
      <Foliage />
      <WorldFoods />
      <WeatherAndTrails />
      <CombatEffects />
      <ScentPulse />
      <LocalDino />
      {remoteIds.map((id) => {
        const modelKey = playersMutable[id]?.model || 'trex';
        return <RemoteDino key={`${id}-${modelKey}`} id={id} />;
      })}
    </>
  );
};
```

### File: `components\3d\vfx\CombatEffects.tsx` | Size: 3272 bytes | Ext: `.tsx` | Mod: 2026-11-26 16:31:29
```tsx
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { combatEventsQueue } from '../../../store/useGameStore';
import type { CombatEvent } from '../../../types/game';
interface ActivePopup extends CombatEvent {
  createdAt: number;
}
const ROAR_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: '📢 GẦM LÃNH THỔ!', color: '#fde047' },
  2: { label: '💚 GỌI BẦY THÂN THIỆN', color: '#4ade80' },
  3: { label: '💢 GẦM ĐE DỌA!', color: '#fb923c' },
  4: { label: '🆘 KÊU CỨU!', color: '#f43f5e' },
};
export const CombatEffects: React.FC = () => {
  const [popups, setPopups] = useState<ActivePopup[]>([]);
  const lastFrameUpdateRef = useRef(0);
  useFrame(() => {
    const now = performance.now();
    while (combatEventsQueue.length > 0 && now - combatEventsQueue[0].createdAt > 1250) {
      combatEventsQueue.shift();
    }
    if (combatEventsQueue.length > 0) {
      if (now - lastFrameUpdateRef.current >= 33) {
        lastFrameUpdateRef.current = now;
        setPopups([...combatEventsQueue]);
      }
    } else if (popups.length > 0) {
      setPopups([]);
    }
  });
  const now = performance.now();
  return (
    <group>
      {popups.map((evt) => {
        const age = Math.min(1, (now - evt.createdAt) / 1250);
        const yOffset = evt.y + age * 2.4;
        const isHeal = evt.attackType === 'heal';
        const isRoar = evt.attackType === 'roar';
        const isBoneBreak = evt.attackType === 'bonebreak';
        const isSpecial = evt.attackType === 'special';
        const roarMeta = ROAR_LABELS[evt.damage] || ROAR_LABELS[1];
        let text = `🩸 -${evt.damage} HP`;
        let color = '#ef4444';
        if (evt.isKill) {
          text = `💀 HẠ GỤC! -${evt.damage}`;
          color = '#fde047';
        } else if (isBoneBreak) {
          text = `🦴 GÃY XƯƠNG! -${evt.damage}`;
          color = '#fb923c';
        } else if (isSpecial) {
          text = `⚡ CHIÊU MẠNH! -${evt.damage}`;
          color = '#facc15';
        } else if (isHeal) {
          text = `💚 +${evt.damage} HP`;
          color = evt.damage >= 15 ? '#38bdf8' : '#4ade80';
        } else if (isRoar) {
          text = roarMeta.label;
          color = roarMeta.color;
        }
        return (
          <group key={evt.id} position={[evt.x, yOffset, evt.z]}>
            <Html center distanceFactor={25}>
              <div
                style={{
                  pointerEvents: 'none',
                  userSelect: 'none',
                  opacity: 1 - age * 0.85,
                  transform: `scale(${1 + (1 - age) * 0.22})`,
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: '900',
                  fontSize: evt.isKill || isRoar || isBoneBreak ? '17px' : '15px',
                  color,
                  textShadow: '0 2px 8px rgba(0,0,0,0.95)',
                  whiteSpace: 'nowrap',
                }}
              >
                {text}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
```

### File: `components\3d\vfx\ScentPulse.tsx` | Size: 4137 bytes | Ext: `.tsx` | Mod: 2026-11-26 00:48:16
```tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { foodsMutable, localTransformMutable, useGameStore } from '../../../store/useGameStore';
import {
  getMeshTerrainHeight,
  HIGHLAND_LAKE_X,
  HIGHLAND_LAKE_Z,
  OASIS_X,
  OASIS_Z,
} from '../../../constants/terrain';
export const ScentPulse: React.FC = () => {
  const scentUntil = useGameStore((s) => s.scentUntil);
  const foodIds = useGameStore((s) => s.foodIds);
  const mapWaypoint = useGameStore((s) => s.mapWaypoint);
  const setMapWaypoint = useGameStore((s) => s.setMapWaypoint);
  const ringRef = useRef<THREE.Mesh>(null);
  const beaconsRef = useRef<THREE.Group>(null);
  const waypointRingRef = useRef<THREE.Mesh>(null);
  useFrame((_, rawDelta) => {
    const now = performance.now();
    const remaining = scentUntil - now;
    const isActive = remaining > 0;
    if (beaconsRef.current) {
      beaconsRef.current.visible = isActive;
    }
    if (ringRef.current) {
      ringRef.current.visible = isActive;
      if (isActive) {
        const progress = 1 - remaining / 6500;
        const radius = 3 + ((progress * 2.5) % 1) * 75;
        ringRef.current.position.set(
          localTransformMutable.x,
          localTransformMutable.y + 0.35,
          localTransformMutable.z
        );
        ringRef.current.scale.set(radius, radius, 1);
      }
    }
    if (mapWaypoint) {
      if (waypointRingRef.current) {
        waypointRingRef.current.rotation.z += Math.min(rawDelta, 0.1) * 1.8;
      }
      const dx = mapWaypoint.x - localTransformMutable.x;
      const dz = mapWaypoint.z - localTransformMutable.z;
      if (dx * dx + dz * dz < 36) {
        // Đã tới điểm ghim (< 6m) -> tự gỡ ghim
        setMapWaypoint(null);
      }
    }
  });
  const wpY = mapWaypoint ? getMeshTerrainHeight(mapWaypoint.x, mapWaypoint.z) : 0;
  return (
    <group>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.92, 1.0, 36]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Cột sáng dẫn đường cho điểm ghim trên Bản Đồ Toàn Đảo */}
      {mapWaypoint && (
        <group position={[mapWaypoint.x, wpY, mapWaypoint.z]}>
          <mesh position={[0, 42, 0]}>
            <cylinderGeometry args={[0.35, 1.4, 84, 12]} />
            <meshBasicMaterial
              color="#facc15"
              transparent
              opacity={0.42}
              depthWrite={false}
            />
          </mesh>
          <mesh ref={waypointRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.4, 0]}>
            <ringGeometry args={[2.2, 3.0, 24]} />
            <meshBasicMaterial
              color="#fde047"
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
      <group ref={beaconsRef} visible={false}>
        <mesh position={[OASIS_X, 24, OASIS_Z]}>
          <cylinderGeometry args={[0.5, 2.2, 48, 12]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.45} depthWrite={false} />
        </mesh>
        <mesh position={[HIGHLAND_LAKE_X, 24, HIGHLAND_LAKE_Z]}>
          <cylinderGeometry args={[0.5, 2.2, 48, 12]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.45} depthWrite={false} />
        </mesh>
        {foodIds.map((id) => {
          const f = foodsMutable[id];
          if (!f || f.amount <= 0) return null;
          const y = getMeshTerrainHeight(f.x, f.z);
          const color = f.type === 'meat' ? '#ef4444' : '#4ade80';
          return (
            <mesh key={id} position={[f.x, y + 16, f.z]}>
              <cylinderGeometry args={[0.25, 0.9, 32, 10]} />
              <meshBasicMaterial color={color} transparent opacity={0.45} depthWrite={false} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};
```

### File: `components\3d\vfx\WeatherAndTrails.tsx` | Size: 5709 bytes | Ext: `.tsx` | Mod: 2026-11-26 16:30:08
```tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  bloodTrailsMutable,
  localTransformMutable,
  useGameStore,
} from '../../../store/useGameStore';
import { getMeshTerrainHeight } from '../../../constants/terrain';
const MAX_RAIN_DROPS = 1100;
const RAIN_AREA = 72;
const RAIN_HEIGHT = 34;
export const WeatherAndTrails: React.FC = () => {
  const weather = useGameStore((s) => s.weather);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);
  const bloodTrailsVersion = useGameStore((s) => s.bloodTrailsVersion);
  const scentUntil = useGameStore((s) => s.scentUntil);
  const rainLinesRef = useRef<THREE.LineSegments>(null);
  const rainMatRef = useRef<THREE.LineBasicMaterial>(null);
  const bloodGroupRef = useRef<THREE.Group>(null);
  const bloodScentRef = useRef<THREE.Group>(null);
  // Khởi tạo bộ đệm hạt mưa cố định (tái sử dụng, không cấp phát rác RAM mỗi frame)
  const { rainGeo, rainOffsets, rainSpeeds } = useMemo(() => {
    const positions = new Float32Array(MAX_RAIN_DROPS * 2 * 3);
    const offsets = new Float32Array(MAX_RAIN_DROPS * 3);
    const speeds = new Float32Array(MAX_RAIN_DROPS);
    for (let i = 0; i < MAX_RAIN_DROPS; i++) {
      offsets[i * 3] = (Math.random() - 0.5) * RAIN_AREA;
      offsets[i * 3 + 1] = Math.random() * RAIN_HEIGHT;
      offsets[i * 3 + 2] = (Math.random() - 0.5) * RAIN_AREA;
      speeds[i] = 28 + Math.random() * 14;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { rainGeo: geo, rainOffsets: offsets, rainSpeeds: speeds };
  }, []);
  useEffect(() => {
    return () => {
      rainGeo.dispose();
    };
  }, [rainGeo]);
  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.08);
    const now = performance.now();
    // 1. Hiện cột mùi đỏ cho vệt máu khi đang bật Đánh hơi [Q]
    if (bloodScentRef.current) {
      bloodScentRef.current.visible = scentUntil > now;
    }
    // 2. Cập nhật hạt mưa rơi theo vị trí nhân vật
    const lines = rainLinesRef.current;
    if (!lines) return;
    const isRaining = weather === 'rain' || weather === 'storm';
    lines.visible = isRaining;
    if (!isRaining) return;
    const qualityFactor = graphicsQuality === 'low' ? 0.4 : graphicsQuality === 'high' ? 1.0 : 0.7;
    const stormFactor = weather === 'storm' ? 1.0 : 0.6;
    const activeDrops = Math.floor(MAX_RAIN_DROPS * qualityFactor * stormFactor);
    rainGeo.setDrawRange(0, activeDrops * 2);
    const px = localTransformMutable.x;
    const py = localTransformMutable.y;
    const pz = localTransformMutable.z;
    const windSlantX = weather === 'storm' ? 4.8 : 1.5;
    const streakLen = weather === 'storm' ? 1.55 : 1.05;
    const posAttr = rainGeo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < activeDrops; i++) {
      const oi = i * 3;
      rainOffsets[oi + 1] -= rainSpeeds[i] * (weather === 'storm' ? 1.35 : 1.0) * dt;
      rainOffsets[oi] += windSlantX * dt;
      if (rainOffsets[oi + 1] < -2) {
        rainOffsets[oi + 1] = RAIN_HEIGHT;
        rainOffsets[oi] = (Math.random() - 0.5) * RAIN_AREA;
        rainOffsets[oi + 2] = (Math.random() - 0.5) * RAIN_AREA;
      }
      const wx = px + rainOffsets[oi];
      const wy = py + rainOffsets[oi + 1];
      const wz = pz + rainOffsets[oi + 2];
      const pi = i * 6;
      arr[pi] = wx;
      arr[pi + 1] = wy;
      arr[pi + 2] = wz;
      arr[pi + 3] = wx - windSlantX * 0.045;
      arr[pi + 4] = wy + streakLen;
      arr[pi + 5] = wz;
    }
    posAttr.needsUpdate = true;
    if (rainMatRef.current) {
      rainMatRef.current.opacity = weather === 'storm' ? 0.42 : 0.28;
    }
  });
  // Render vệt máu trên mặt đất (tối đa 44 điểm từ server)
  const bloodPoints = useMemo(() => {
    void bloodTrailsVersion;
    return bloodTrailsMutable.map((bt) => ({
      id: bt.id,
      x: bt.x,
      y: getMeshTerrainHeight(bt.x, bt.z) + 0.07,
      z: bt.z,
    }));
  }, [bloodTrailsVersion]);
  return (
    <group>
      {/* Mưa GPU 1 Draw Call */}
      <lineSegments ref={rainLinesRef} geometry={rainGeo} visible={false} frustumCulled={false}>
        <lineBasicMaterial
          ref={rainMatRef}
          color="#cbd5e1"
          transparent
          opacity={0.32}
          depthWrite={false}
        />
      </lineSegments>
      {/* Vệt máu trên mặt đất */}
      <group ref={bloodGroupRef}>
        {bloodPoints.map((bp) => (
          <mesh key={bp.id} position={[bp.x, bp.y, bp.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.72, 10]} />
            <meshBasicMaterial
              color="#991b1b"
              transparent
              opacity={0.78}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
      {/* Cột mùi máu phát sáng khi bật Đánh hơi [Q] */}
      <group ref={bloodScentRef} visible={false}>
        {bloodPoints.map((bp) => (
          <mesh key={`scent-${bp.id}`} position={[bp.x, bp.y + 3.2, bp.z]}>
            <cylinderGeometry args={[0.08, 0.42, 6.4, 8]} />
            <meshBasicMaterial
              color="#ef4444"
              transparent
              opacity={0.48}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};
```

### File: `components\ui\GameHUD.tsx` | Size: 1189 bytes | Ext: `.tsx` | Mod: 2026-11-26 01:07:55
```tsx
import React from 'react';
import { RobloxTopLeftBar } from './hud/RobloxTopLeftBar';
import { SettingsModal } from './hud/SettingsModal';
import { VitalsPanel } from './hud/VitalsPanel';
import { RadarMinimap } from './hud/RadarMinimap';
import { ControlsHelp } from './hud/ControlsHelp';
import { DamageOverlay } from './hud/DamageOverlay';
import { ChatBox } from './hud/ChatBox';
import { NightVisionOverlay } from './hud/NightVisionOverlay';
import { DeathOverlay } from './hud/DeathOverlay';
import { LeaderboardModal } from './hud/LeaderboardModal';
import { WorldMapModal } from './hud/WorldMapModal';
export const GameHUD: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        userSelect: 'none',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#fff',
        zIndex: 20000000,
      }}
    >
      <NightVisionOverlay />
      <DamageOverlay />
      <RobloxTopLeftBar />
      <ChatBox />
      <ControlsHelp />
      <VitalsPanel />
      <RadarMinimap />
      <WorldMapModal />
      <LeaderboardModal />
      <DeathOverlay />
      <SettingsModal />
    </div>
  );
};
```

### File: `components\ui\hud\ChatBox.tsx` | Size: 4335 bytes | Ext: `.tsx` | Mod: 2026-11-25 23:31:31
```tsx
import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { socket } from '../../../core/socket';
export const ChatBox: React.FC = () => {
  const chatMessages = useGameStore((s) => s.chatMessages);
  const isChatVisible = useGameStore((s) => s.isChatVisible);
  const isChatOpen = useGameStore((s) => s.isChatOpen);
  const setChatOpen = useGameStore((s) => s.setChatOpen);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const closeAndRefocusCanvas = () => {
    setChatOpen(false);
    const canvas = document.querySelector('canvas');
    if (canvas instanceof HTMLElement) {
      canvas.focus();
    }
  };
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [chatMessages]);
  if (!isChatVisible) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed) {
      socket.sendChat(trimmed);
      setText('');
    }
    closeAndRefocusCanvas();
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      closeAndRefocusCanvas();
    }
  };
  return (
    <div
      style={{
        position: 'absolute',
        top: '14px',
        right: '16px',
        width: '310px',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div
        ref={listRef}
        style={{
          maxHeight: '150px',
          overflowY: 'auto',
          background: isChatOpen ? 'rgba(15, 23, 42, 0.88)' : 'rgba(15, 23, 42, 0.56)',
          borderRadius: '10px',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '11.5px',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        }}
      >
        {chatMessages.length === 0 ? (
          <div style={{ color: '#cbd5e1', fontSize: '11px' }}>
            💬 Nhấn <b>[Enter]</b> để chat cùng phòng LAN.
          </div>
        ) : (
          chatMessages.map((m) => (
            <div key={m.id} style={{ lineHeight: '1.35', wordBreak: 'break-word' }}>
              {m.isSystem ? (
                <span style={{ color: '#fde047', fontWeight: '600' }}>{m.text}</span>
              ) : (
                <>
                  <span style={{ color: '#34d399', fontWeight: '700' }}>{m.sender}: </span>
                  <span style={{ color: '#f8fafc' }}>{m.text}</span>
                </>
              )}
            </div>
          ))
        )}
      </div>
      {isChatOpen ? (
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={closeAndRefocusCanvas}
            placeholder="Nhập tin nhắn (Enter gửi, Esc thoát)..."
            maxLength={140}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
              outline: 'none',
            }}
          />
        </form>
      ) : (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            alignSelf: 'flex-end',
            background: 'rgba(15, 23, 42, 0.78)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '7px',
            padding: '4px 10px',
            color: '#cbd5e1',
            fontSize: '10.5px',
            cursor: 'pointer',
          }}
        >
          💬 Nhấn [Enter] để Chat
        </button>
      )}
    </div>
  );
};
```

### File: `components\ui\hud\ControlsHelp.tsx` | Size: 2597 bytes | Ext: `.tsx` | Mod: 2026-11-26 16:48:11
```tsx
import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
export const ControlsHelp: React.FC = () => {
  const showHelp = useGameStore((s) => s.showHelp);
  const toggleHelp = useGameStore((s) => s.toggleHelp);
  if (!showHelp) return null;
  return (
    <div style={{ position: 'absolute', top: '60px', left: '16px', pointerEvents: 'auto' }}>
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '11.5px',
          color: '#cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          width: '345px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: '700',
            color: '#38bdf8',
            marginBottom: '2px',
          }}
        >
          <span>🎮 PHÍM ĐIỀU KHIỂN (THE ISLE)</span>
          <span onClick={toggleHelp} style={{ cursor: 'pointer', color: '#94a3b8' }}>
            ✕
          </span>
        </div>
        <div>• <b>W / A / S / D (↑ ← ↓ →):</b> Di chuyển &amp; Rẽ</div>
        <div>• <b>Giữ Shift / Phím C:</b> Chạy nhanh / Rón rén ẩn nấp</div>
        <div>• <b>Chuột Phải + Kéo / Lăn:</b> Xoay 360° ngắm trời &amp; Zoom</div>
        <div>• <b>Chuột Trái / Space / F / E:</b> Cắn / Quất đuôi (E)</div>
        <div>• <b>Phím V:</b> Kỹ năng đặc trưng loài (Nghiền xương / Húc văng / Quất gai / Vồ mồi)</div>
        <div>• <b>Phím 1 / 2 / 3 / 4 / R:</b> 4 kiểu gọi (Lãnh thổ / Thân thiện / Đe dọa / Kêu cứu)</div>
        <div>• <b>Phím G:</b> Uống nước tại hồ / Ăn thịt &amp; quả (+Lớn)</div>
        <div>• <b>Phím H / Nút HUD:</b> Nghỉ ngơi (+20 HP/s, khóa hành động, mở sau 3s)</div>
        <div>• <b>Phím M / Bấm Radar:</b> Mở Bản đồ toàn đảo &amp; ghim dẫn đường 📍</div>
        <div>• <b>Phím N / Q:</b> Tầm nhìn đêm (giới hạn bán kính) / Đánh hơi thức ăn &amp; vệt máu</div>
        <div>• <b>Phím Tab / Nút 🏆:</b> Bảng sinh tồn &amp; Mời vào Bầy đàn</div>
        <div>• <b>Ngoài giao chiến 30s:</b> Tự động hồi +5 HP/giây</div>
      </div>
    </div>
  );
};
```

### File: `components\ui\hud\DamageOverlay.tsx` | Size: 806 bytes | Ext: `.tsx` | Mod: 2026-11-16 16:10:12
```tsx
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
export const DamageOverlay: React.FC = () => {
  const lastDamagedAt = useGameStore((s) => s.lastDamagedAt);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!lastDamagedAt) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 380);
    return () => window.clearTimeout(timer);
  }, [lastDamagedAt]);
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        boxShadow: 'inset 0 0 95px 35px rgba(220, 38, 38, 0.55)',
        transition: 'opacity 0.25s ease-out',
        zIndex: 60,
      }}
    />
  );
};
```

### File: `components\ui\hud\DeathOverlay.tsx` | Size: 2643 bytes | Ext: `.tsx` | Mod: 2026-11-26 00:30:15
```tsx
import React, { useEffect } from 'react';
import { useGameStore } from '../../../store/useGameStore';
export const DeathOverlay: React.FC = () => {
  const deathInfo = useGameStore((s) => s.deathInfo);
  const dismissDeathOverlay = useGameStore((s) => s.dismissDeathOverlay);
  useEffect(() => {
    if (!deathInfo) return;
    const timer = window.setTimeout(() => {
      dismissDeathOverlay();
    }, 5500);
    return () => window.clearTimeout(timer);
  }, [deathInfo, dismissDeathOverlay]);
  if (!deathInfo) return null;
  const handleContinue = () => {
    dismissDeathOverlay();
    const canvas = document.querySelector('canvas');
    if (canvas instanceof HTMLElement) {
      canvas.focus();
    }
  };
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle, rgba(127,29,29,0.45) 0%, rgba(2,6,23,0.82) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        zIndex: 90,
      }}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(239, 68, 68, 0.55)',
          borderRadius: '16px',
          padding: '28px 36px',
          textAlign: 'center',
          maxWidth: '400px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85)',
        }}
      >
        <div style={{ fontSize: '42px', marginBottom: '8px' }}>💀</div>
        <h2
          style={{
            margin: '0 0 8px 0',
            color: '#f87171',
            fontSize: '22px',
            fontWeight: '900',
            letterSpacing: '1.5px',
          }}
        >
          BẠN ĐÃ BỊ HẠ GỤC!
        </h2>
        <p style={{ margin: '0 0 6px 0', color: '#e2e8f0', fontSize: '13.5px' }}>
          Nguyên nhân: <b style={{ color: '#fde047' }}>{deathInfo.killedBy}</b>
        </p>
        <p style={{ margin: '0 0 18px 0', color: '#94a3b8', fontSize: '12px' }}>
          Bạn đã được hồi sinh ở vị trí mới dưới dạng con non (45% trưởng thành).
        </p>
        <button
          onClick={handleContinue}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            color: '#fff',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Tiếp tục sinh tồn
        </button>
      </div>
    </div>
  );
};
```

### File: `components\ui\hud\LeaderboardModal.tsx` | Size: 7854 bytes | Ext: `.tsx` | Mod: 2026-11-26 16:47:29
```tsx
import React from 'react';
import { createPortal } from 'react-dom';
import { playersMutable, useGameStore } from '../../../store/useGameStore';
import { getDinoSpec } from '../../../constants/dinosaurs';
import { socket } from '../../../core/socket';
export const LeaderboardModal: React.FC = () => {
  const showLeaderboard = useGameStore((s) => s.showLeaderboard);
  const setShowLeaderboard = useGameStore((s) => s.setShowLeaderboard);
  const myId = useGameStore((s) => s.myId);
  const myPackId = useGameStore((s) => s.packId);
  const selectedModel = useGameStore((s) => s.selectedModel);
  const playerIds = useGameStore((s) => s.playerIds);
  if (!showLeaderboard || typeof document === 'undefined') return null;
  const myDiet = getDinoSpec(selectedModel).diet;
  const list = playerIds
    .map((id) => playersMutable[id])
    .filter(Boolean)
    .sort((a, b) => {
      if (Boolean(a.isAi) !== Boolean(b.isAi)) return a.isAi ? 1 : -1;
      const killDiff = (b.kills || 0) - (a.kills || 0);
      if (killDiff !== 0) return killDiff;
      return (b.growth || 0) - (a.growth || 0);
    });
  const closeAndRefocus = () => {
    setShowLeaderboard(false);
    const canvas = document.querySelector('canvas');
    if (canvas instanceof HTMLElement) {
      canvas.focus();
    }
  };
  return createPortal(
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={closeAndRefocus}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(2, 6, 23, 0.58)',
        pointerEvents: 'auto',
        zIndex: 99999998,
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#fff',
        userSelect: 'none',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px, 94vw)',
          maxHeight: '76vh',
          overflowY: 'auto',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
          borderRadius: '14px',
          padding: '16px 20px',
          boxShadow: '0 20px 55px rgba(0,0,0,0.8)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '15px', fontWeight: '800', color: '#4ade80' }}>
            🏆 BẢNG SINH TỒN &amp; BẦY ĐÀN ({list.length})
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {myPackId && (
              <button
                onClick={() => socket.sendPackLeave()}
                style={{
                  background: 'rgba(239, 68, 68, 0.22)',
                  border: '1px solid rgba(239, 68, 68, 0.55)',
                  color: '#fca5a5',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                🚪 Rời Bầy Đàn
              </button>
            )}
            <button
              onClick={closeAndRefocus}
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.16)',
                color: '#cbd5e1',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Đóng [Tab]
            </button>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
              <th style={{ textAlign: 'left', padding: '6px 4px' }}>Tên</th>
              <th style={{ textAlign: 'left', padding: '6px 4px' }}>Loài</th>
              <th style={{ textAlign: 'right', padding: '6px 4px' }}>Lớn</th>
              <th style={{ textAlign: 'right', padding: '6px 4px' }}>HP</th>
              <th style={{ textAlign: 'right', padding: '6px 4px' }}>Hạ gục</th>
              <th style={{ textAlign: 'right', padding: '6px 4px' }}>Bầy đàn</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const isMe = p.id === myId;
              const spec = getDinoSpec(p.model);
              const isSamePack = Boolean(!p.isAi && myPackId && p.packId === myPackId);
              const canInvite = !isMe && !p.isAi && !isSamePack && (p.diet || spec.diet) === myDiet;
              return (
                <tr
                  key={p.id}
                  style={{
                    background: isMe
                      ? 'rgba(16, 185, 129, 0.16)'
                      : isSamePack
                      ? 'rgba(56, 189, 248, 0.14)'
                      : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <td
                    style={{
                      padding: '7px 4px',
                      fontWeight: isMe || isSamePack ? '800' : '600',
                      color: isMe ? '#4ade80' : isSamePack ? '#7dd3fc' : '#f8fafc',
                    }}
                  >
                    {p.isAi ? '🤖 ' : isSamePack ? '🐾 ' : '🦖 '}
                    {p.name}
                    {p.isResting ? ' 💤' : ''}
                  </td>
                  <td style={{ padding: '7px 4px', color: '#cbd5e1' }}>
                    {spec.icon} {spec.name}
                  </td>
                  <td style={{ padding: '7px 4px', textAlign: 'right', color: '#fde047', fontWeight: '700' }}>
                    {Math.round((p.growth || 0.45) * 100)}%
                  </td>
                  <td style={{ padding: '7px 4px', textAlign: 'right', color: '#fca5a5' }}>
                    {Math.round(p.hp || 0)}/{p.maxHp || 100}
                  </td>
                  <td style={{ padding: '7px 4px', textAlign: 'right', color: '#f87171', fontWeight: '800' }}>
                    {p.kills || 0}
                  </td>
                  <td style={{ padding: '7px 4px', textAlign: 'right' }}>
                    {isSamePack ? (
                      <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: '800' }}>
                        Đồng đội
                      </span>
                    ) : canInvite ? (
                      <button
                        onClick={() => socket.sendPackInvite(p.id)}
                        style={{
                          background: 'rgba(14, 165, 233, 0.25)',
                          border: '1px solid #38bdf8',
                          color: '#7dd3fc',
                          padding: '3px 8px',
                          borderRadius: '5px',
                          fontSize: '10.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        + Mời
                      </button>
                    ) : (
                      <span style={{ color: '#475569', fontSize: '11px' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>,
    document.body
  );
};
```

### File: `components\ui\hud\NightVisionOverlay.tsx` | Size: 2011 bytes | Ext: `.tsx` | Mod: 2026-11-26 01:13:03
```tsx
import React, { useEffect, useState } from 'react';
import { useGameStore, worldTimeMutable } from '../../../store/useGameStore';
import { getDinoSpec } from '../../../constants/dinosaurs';
export const NightVisionOverlay: React.FC = () => {
  const nightVision = useGameStore((s) => s.nightVision);
  const selectedModel = useGameStore((s) => s.selectedModel);
  const [isDaytime, setIsDaytime] = useState(false);
  useEffect(() => {
    if (!nightVision) return;
    const check = () => {
      const sunAngle = (worldTimeMutable.value - 0.25) * Math.PI * 2;
      setIsDaytime(Math.sin(sunAngle) > 0.15);
    };
    check();
    const timer = window.setInterval(check, 500);
    return () => window.clearInterval(timer);
  }, [nightVision]);
  if (!nightVision) return null;
  const dino = getDinoSpec(selectedModel);
  const nvRadius = dino.diet === 'carnivore' ? 55 : 42;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        background: isDaytime
          ? 'radial-gradient(circle, transparent 58%, rgba(6, 78, 59, 0.22) 100%)'
          : 'radial-gradient(circle, rgba(16, 185, 129, 0.03) 36%, rgba(2, 18, 14, 0.58) 82%, rgba(0, 6, 5, 0.85) 100%)',
        boxShadow: 'inset 0 0 90px rgba(6, 78, 59, 0.35)',
        zIndex: 45,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '18px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(4, 38, 29, 0.86)',
          border: '1px solid #34d399',
          color: '#6ee7b7',
          padding: '5px 14px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: '800',
          letterSpacing: '0.8px',
          whiteSpace: 'nowrap',
        }}
      >
        👁️ TẦM NHÌN BAN ĐÊM • RÕ TRONG BÁN KÍNH {nvRadius}m [N]
        {isDaytime ? ' • (Đang ban ngày)' : ''}
      </div>
    </div>
  );
};
```

### File: `components\ui\hud\RadarMinimap.tsx` | Size: 7058 bytes | Ext: `.tsx` | Mod: 2026-11-26 16:47:40
```tsx
import React, { useEffect, useRef } from 'react';
import {
  useGameStore,
  playersMutable,
  foodsMutable,
  localTransformMutable,
} from '../../../store/useGameStore';
import {
  HIGHLAND_LAKE_RADIUS,
  HIGHLAND_LAKE_X,
  HIGHLAND_LAKE_Z,
  OASIS_RADIUS,
  OASIS_X,
  OASIS_Z,
} from '../../../constants/terrain';
export const RadarMinimap: React.FC = () => {
  const myId = useGameStore((s) => s.myId);
  const setMapOpen = useGameStore((s) => s.setMapOpen);
  const mapWaypoint = useGameStore((s) => s.mapWaypoint);
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let animId: number;
    let lastDraw = 0;
    const renderRadar = (now: number) => {
      if (now - lastDraw >= 50) {
        lastDraw = now;
        const canvas = radarCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;
            const radarRadius = w * 0.48;
            const mapScale = radarRadius / 240;
            const meX = localTransformMutable.x;
            const meZ = localTransformMutable.z;
            const st = useGameStore.getState();
            ctx.clearRect(0, 0, w, h);
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radarRadius, 0, Math.PI * 2);
            ctx.clip();
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.22)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, w * 0.24, 0, Math.PI * 2);
            ctx.stroke();
            const drawLake = (lx: number, lz: number, r: number) => {
              const sx = cx + (lx - meX) * mapScale;
              const sz = cy + (lz - meZ) * mapScale;
              ctx.fillStyle = 'rgba(14, 165, 233, 0.55)';
              ctx.beginPath();
              ctx.arc(sx, sz, Math.max(4, r * mapScale), 0, Math.PI * 2);
              ctx.fill();
            };
            drawLake(OASIS_X, OASIS_Z, OASIS_RADIUS);
            drawLake(HIGHLAND_LAKE_X, HIGHLAND_LAKE_Z, HIGHLAND_LAKE_RADIUS);
            for (const id of Object.keys(foodsMutable)) {
              const f = foodsMutable[id];
              if (!f || f.amount <= 0) continue;
              const fx = cx + (f.x - meX) * mapScale;
              const fz = cy + (f.z - meZ) * mapScale;
              ctx.fillStyle = f.type === 'meat' ? '#f43f5e' : '#86efac';
              ctx.fillRect(fx - 2, fz - 2, 4, 4);
            }
            for (const id of Object.keys(playersMutable)) {
              if (id === myId) continue;
              const p = playersMutable[id];
              if (!p) continue;
              const px = cx + (p.x - meX) * mapScale;
              const pz = cy + (p.z - meZ) * mapScale;
              const isPackmate = Boolean(!p.isAi && st.packId && p.packId === st.packId);
              const isHunting = p.aiState === 'CHASE' || p.aiState === 'ATTACK';
              ctx.fillStyle = isPackmate
                ? '#38bdf8'
                : isHunting
                ? '#f97316'
                : p.diet === 'herbivore'
                ? '#34d399'
                : p.isAi
                ? '#818cf8'
                : '#ef4444';
              const dotSize = isPackmate
                ? 4.6
                : p.growth && p.growth > 1.1
                ? 4.8
                : p.growth && p.growth < 0.55
                ? 2.6
                : 3.6;
              ctx.beginPath();
              ctx.arc(px, pz, dotSize, 0, Math.PI * 2);
              ctx.fill();
              if (isPackmate) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.2;
                ctx.stroke();
              }
            }
            const wp = st.mapWaypoint;
            if (wp) {
              let dx = (wp.x - meX) * mapScale;
              let dz = (wp.z - meZ) * mapScale;
              const d = Math.hypot(dx, dz);
              if (d > radarRadius - 6) {
                dx = (dx / d) * (radarRadius - 6);
                dz = (dz / d) * (radarRadius - 6);
              }
              const wx = cx + dx;
              const wz = cy + dz;
              ctx.fillStyle = '#facc15';
              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(wx, wz - 5);
              ctx.lineTo(wx + 5, wz);
              ctx.lineTo(wx, wz + 5);
              ctx.lineTo(wx - 5, wz);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            }
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(
              cx + Math.sin(localTransformMutable.rot) * 12,
              cy + Math.cos(localTransformMutable.rot) * 12
            );
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      animId = requestAnimationFrame(renderRadar);
    };
    animId = requestAnimationFrame(renderRadar);
    return () => cancelAnimationFrame(animId);
  }, [myId]);
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        setMapOpen(true);
      }}
      title="Bấm để mở Bản Đồ Toàn Đảo (Phím M)"
      style={{
        position: 'absolute',
        bottom: '22px',
        right: '20px',
        background: 'rgba(15, 23, 42, 0.88)',
        border: mapWaypoint
          ? '1px solid rgba(250, 204, 21, 0.55)'
          : '1px solid rgba(52, 211, 153, 0.35)',
        borderRadius: '12px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        pointerEvents: 'auto',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{ fontSize: '10px', fontWeight: '800', color: '#34d399', letterSpacing: '0.8px' }}>
        🗺️ BẤM MỞ BẢN ĐỒ [M]
      </div>
      <div style={{ width: '136px', height: '136px', flexShrink: 0 }}>
        <canvas
          ref={radarCanvasRef}
          width={136}
          height={136}
          style={{
            width: '136px',
            height: '136px',
            borderRadius: '50%',
            background: '#090d16',
          }}
        />
      </div>
      <div style={{ fontSize: '9px', color: mapWaypoint ? '#fde047' : '#94a3b8' }}>
        {mapWaypoint
          ? `📍 Đang ghim (${mapWaypoint.x}, ${mapWaypoint.z})`
          : '🟡 Bạn • 🩵 Bầy • 🟢 Cỏ • 🟣 Thịt'}
      </div>
    </div>
  );
};
```

### File: `components\ui\hud\RobloxTopLeftBar.tsx` | Size: 6638 bytes | Ext: `.tsx` | Mod: 2026-11-26 16:47:17
```tsx
import React, { useEffect, useState } from 'react';
import { useGameStore, worldTimeMutable } from '../../../store/useGameStore';
import { getDinoSpec } from '../../../constants/dinosaurs';
import type { WeatherType } from '../../../types/game';
const WEATHER_BADGE: Record<WeatherType, { label: string; color: string }> = {
  clear: { label: '🌤️ Quang', color: '#fde68a' },
  fog: { label: '🌫️ Sương mù', color: '#cbd5e1' },
  rain: { label: '🌧️ Mưa rào', color: '#7dd3fc' },
  storm: { label: '⛈️ Bão giông', color: '#c084fc' },
};
export const RobloxTopLeftBar: React.FC = () => {
  const selectedModel = useGameStore((s) => s.selectedModel);
  const playerCount = useGameStore((s) => s.playerIds.length);
  const kills = useGameStore((s) => s.kills);
  const weather = useGameStore((s) => s.weather);
  const isConnected = useGameStore((s) => s.isConnected);
  const isSettingsOpen = useGameStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen);
  const isChatVisible = useGameStore((s) => s.isChatVisible);
  const toggleChatVisible = useGameStore((s) => s.toggleChatVisible);
  const showHelp = useGameStore((s) => s.showHelp);
  const toggleHelp = useGameStore((s) => s.toggleHelp);
  const rotateCurrentModel90 = useGameStore((s) => s.rotateCurrentModel90);
  const nightVision = useGameStore((s) => s.nightVision);
  const toggleNightVision = useGameStore((s) => s.toggleNightVision);
  const isMapOpen = useGameStore((s) => s.isMapOpen);
  const toggleMapOpen = useGameStore((s) => s.toggleMapOpen);
  const showLeaderboard = useGameStore((s) => s.showLeaderboard);
  const setShowLeaderboard = useGameStore((s) => s.setShowLeaderboard);
  const [fps, setFps] = useState(60);
  const [clockLabel, setClockLabel] = useState('☀️ 08:30');
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;
    const calcFps = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastTime;
      if (elapsed >= 500) {
        setFps(Math.round((frameCount * 1000) / elapsed));
        frameCount = 0;
        lastTime = now;
        const totalMins = Math.floor(worldTimeMutable.value * 24 * 60);
        const hh = Math.floor(totalMins / 60) % 24;
        const mm = totalMins % 60;
        const icon = hh >= 6 && hh < 18 ? '☀️' : '🌙';
        setClockLabel(`${icon} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
      }
      animId = requestAnimationFrame(calcFps);
    };
    animId = requestAnimationFrame(calcFps);
    return () => cancelAnimationFrame(animId);
  }, []);
  const dino = getDinoSpec(selectedModel);
  const weatherMeta = WEATHER_BADGE[weather] || WEATHER_BADGE.clear;
  const fpsColor = fps >= 55 ? '#4ade80' : fps >= 30 ? '#facc15' : '#f87171';
  const iconBtnStyle = (active: boolean): React.CSSProperties => ({
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    border: active ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.16)',
    background: active ? 'rgba(16, 185, 129, 0.28)' : 'rgba(15, 23, 42, 0.84)',
    color: '#f8fafc',
    fontSize: '17px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    transition: 'transform 0.1s ease, background 0.15s ease',
  });
  const handleBtnClick = (fn: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.blur();
    fn();
  };
  return (
    <div
      style={{
        position: 'absolute',
        top: '14px',
        left: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'auto',
      }}
    >
      <button
        onClick={handleBtnClick(() => setSettingsOpen(!isSettingsOpen))}
        title="Cài đặt & Đồ họa (Settings)"
        style={iconBtnStyle(isSettingsOpen)}
      >
        ⚙️
      </button>
      <button
        onClick={handleBtnClick(toggleChatVisible)}
        title="Ẩn / Hiện khung Chat"
        style={iconBtnStyle(isChatVisible)}
      >
        💬
      </button>
      <button
        onClick={handleBtnClick(toggleHelp)}
        title="Bảng phím điều khiển"
        style={iconBtnStyle(showHelp)}
      >
        🎮
      </button>
      <button
        onClick={handleBtnClick(rotateCurrentModel90)}
        title="Xoay hướng đầu thú 90° (Phím T)"
        style={iconBtnStyle(false)}
      >
        ↻
      </button>
      <button
        onClick={handleBtnClick(toggleNightVision)}
        title="Tầm nhìn Ban Đêm - Night Vision (Phím N)"
        style={iconBtnStyle(nightVision)}
      >
        👁️
      </button>
      <button
        onClick={handleBtnClick(toggleMapOpen)}
        title="Mở Bản Đồ Toàn Đảo (Phím M)"
        style={iconBtnStyle(isMapOpen)}
      >
        🗺️
      </button>
      <button
        onClick={handleBtnClick(() => setShowLeaderboard(!showLeaderboard))}
        title="Bảng Sinh Tồn & Bầy Đàn (Tab)"
        style={iconBtnStyle(showLeaderboard)}
      >
        🏆
      </button>
      <div
        style={{
          height: '38px',
          background: 'rgba(15, 23, 42, 0.84)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '10px',
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          fontSize: '12px',
          fontWeight: '700',
          boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
        }}
      >
        <span style={{ color: '#4ade80' }}>
          {dino.icon} {dino.species}
        </span>
        <span style={{ color: '#475569' }}>|</span>
        <span style={{ color: '#fde047' }}>{clockLabel}</span>
        <span style={{ color: weatherMeta.color }}>{weatherMeta.label}</span>
        <span style={{ color: '#f87171' }}>💀 {kills}</span>
        <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: isConnected ? '#22c55e' : '#ef4444',
            }}
          />
          {playerCount}
        </span>
        <span style={{ color: fpsColor }}>{fps} FPS</span>
      </div>
    </div>
  );
};
```

### File: `components\ui\hud\SettingsModal.tsx` | Size: 8064 bytes | Ext: `.tsx` | Mod: 2026-11-25 23:31:18
```tsx
import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { socket } from '../../../core/socket';
import type { GraphicsQuality } from '../../../types/game';
export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useGameStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen);
  const brightness = useGameStore((s) => s.brightness);
  const setBrightness = useGameStore((s) => s.setBrightness);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);
  const setGraphicsQuality = useGameStore((s) => s.setGraphicsQuality);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled);
  const dinoScaleMultiplier = useGameStore((s) => s.dinoScaleMultiplier);
  const setDinoScaleMultiplier = useGameStore((s) => s.setDinoScaleMultiplier);
  const rotateCurrentModel90 = useGameStore((s) => s.rotateCurrentModel90);
  const setJoined = useGameStore((s) => s.setJoined);
  if (!isSettingsOpen) return null;
  const closeModal = () => {
    setSettingsOpen(false);
    const canvas = document.querySelector('canvas');
    if (canvas instanceof HTMLElement) {
      canvas.focus();
    }
  };
  const handleLeave = () => {
    setSettingsOpen(false);
    socket.disconnect();
    setJoined(false);
  };
  const qualities: Array<{ id: GraphicsQuality; label: string }> = [
    { id: 'low', label: 'Thấp (Max FPS)' },
    { id: 'medium', label: 'Trung bình' },
    { id: 'high', label: 'Cao' },
  ];
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 23, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        zIndex: 80,
      }}
      onClick={closeModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '380px',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(52, 211, 153, 0.35)',
          borderRadius: '14px',
          padding: '20px 22px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.75)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: '800', color: '#4ade80' }}>
            ⚙️ CÀI ĐẶT GAME (SETTINGS)
          </span>
          <button
            onClick={closeModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
        {/* Độ sáng màn hình */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: '#cbd5e1', fontWeight: '600' }}>☀️ Độ sáng màn hình (Brightness)</span>
            <span style={{ color: '#fde047', fontWeight: '700' }}>{Math.round(brightness * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.8}
            max={2.1}
            step={0.05}
            value={brightness}
            onChange={(e) => setBrightness(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
          />
        </div>
        {/* Chất lượng đồ họa */}
        <div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600', marginBottom: '6px' }}>
            🖥️ Chất lượng Đồ họa (Tối ưu FPS)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {qualities.map((q) => {
              const active = graphicsQuality === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => setGraphicsQuality(q.id)}
                  style={{
                    padding: '7px 6px',
                    borderRadius: '7px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    border: active ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.12)',
                    background: active ? 'rgba(16, 185, 129, 0.25)' : '#1e293b',
                    color: active ? '#4ade80' : '#cbd5e1',
                  }}
                >
                  {q.label}
                </button>
              );
            })}
          </div>
        </div>
        {/* Âm thanh & Xoay đầu */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              padding: '9px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.14)',
              background: soundEnabled ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
              color: soundEnabled ? '#4ade80' : '#94a3b8',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            {soundEnabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT'}
          </button>
          <button
            onClick={rotateCurrentModel90}
            style={{
              padding: '9px 10px',
              borderRadius: '8px',
              border: '1px solid #38bdf8',
              background: 'rgba(56, 189, 248, 0.14)',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            ↻ Xoay đầu 90° (T)
          </button>
        </div>
        {/* Hệ số kích thước tổng */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: '#cbd5e1', fontWeight: '600' }}>📏 Hệ số Kích thước Thú ([ / ])</span>
            <span style={{ color: '#34d399', fontWeight: '700' }}>{dinoScaleMultiplier.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.4}
            max={2.2}
            step={0.1}
            value={dinoScaleMultiplier}
            onChange={(e) => setDinoScaleMultiplier(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
          />
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '2px 0' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={closeModal}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: '#16a34a',
              color: '#fff',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Tiếp tục chơi
          </button>
          <button
            onClick={handleLeave}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            🚪 Đổi Loài / Rời
          </button>
        </div>
      </div>
    </div>
  );
};
```

### File: `components\ui\hud\VitalsPanel.tsx` | Size: 15754 bytes | Ext: `.tsx` | Mod: 2026-11-26 16:47:05
```tsx
import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { socket } from '../../../core/socket';
import { soundEngine } from '../../../core/sound';
import { getDinoSpec } from '../../../constants/dinosaurs';
export const VitalsPanel: React.FC = () => {
  const myName = useGameStore((s) => s.myName);
  const selectedModel = useGameStore((s) => s.selectedModel);
  const stamina = useGameStore((s) => s.stamina);
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const hunger = useGameStore((s) => s.hunger);
  const thirst = useGameStore((s) => s.thirst);
  const growth = useGameStore((s) => s.growth);
  const bleed = useGameStore((s) => s.bleed);
  const boneBreak = useGameStore((s) => s.boneBreak);
  const specialCd = useGameStore((s) => s.specialCd);
  const isResting = useGameStore((s) => s.isResting);
  const restUnlockLeft = useGameStore((s) => s.restUnlockLeft);
  const combatTimerLeft = useGameStore((s) => s.combatTimerLeft);
  const regenRate = useGameStore((s) => s.regenRate);
  const isCrouching = useGameStore((s) => s.isCrouching);
  const packId = useGameStore((s) => s.packId);
  const packInviteFrom = useGameStore((s) => s.packInviteFrom);
  const packInviteName = useGameStore((s) => s.packInviteName);
  const actionHint = useGameStore((s) => s.actionHint);
  const dino = getDinoSpec(selectedModel);
  const hpPercent = Math.max(0, Math.min(100, (health / Math.max(1, maxHealth)) * 100));
  const growthPct = Math.round(growth * 100);
  const stageLabel =
    growthPct >= 115
      ? 'APEX TITAN'
      : growthPct >= 95
      ? 'ADULT'
      : growthPct >= 65
      ? 'SUB-ADULT'
      : 'JUVENILE';
  const canExitRest = isResting && restUnlockLeft <= 0;
  const canUseSpecial = !isResting && specialCd <= 0;
  const refocusCanvas = () => {
    const canvas = document.querySelector('canvas');
    if (canvas instanceof HTMLElement) {
      canvas.focus();
    }
  };
  const handleRestButtonClick = () => {
    if (!isResting) {
      socket.sendToggleRest();
      soundEngine.playRest(true);
      refocusCanvas();
      return;
    }
    if (canExitRest) {
      socket.sendToggleRest();
      soundEngine.playRest(false);
      refocusCanvas();
    }
  };
  const handleSpecialButtonClick = () => {
    if (!canUseSpecial) return;
    // Gửi sự kiện phím V để đồng bộ animation, dash (nếu có) và gói tin server giống hệt khi bấm phím
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV', key: 'v', bubbles: true }));
    refocusCanvas();
  };
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '22px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {/* Thông báo Lời mời vào Bầy Đàn */}
      {packInviteFrom && (
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(15, 23, 42, 0.96)',
            border: '1px solid #38bdf8',
            borderRadius: '10px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            boxShadow: '0 8px 24px rgba(56, 189, 248, 0.35)',
          }}
        >
          <span>
            🐾 <b style={{ color: '#7dd3fc' }}>{packInviteName || 'Người chơi'}</b> mời bạn vào Bầy Đàn!
          </span>
          <button
            onClick={() => {
              socket.sendPackAccept();
              refocusCanvas();
            }}
            style={{
              background: '#16a34a',
              border: 'none',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '800',
              cursor: 'pointer',
            }}
          >
            ✅ Đồng ý
          </button>
          <button
            onClick={() => {
              socket.sendPackLeave();
              refocusCanvas();
            }}
            style={{
              background: '#334155',
              border: 'none',
              color: '#cbd5e1',
              padding: '4px 9px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}
      {/* Hàng nút Kỹ năng [V] + Nghỉ ngơi [H] + Trạng thái Giao chiến / Hồi máu */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px',
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={handleSpecialButtonClick}
          disabled={!canUseSpecial}
          title={dino.specialDesc}
          style={{
            background: canUseSpecial
              ? 'linear-gradient(135deg, #d97706, #b45309)'
              : 'rgba(30, 41, 59, 0.9)',
            border: canUseSpecial ? '1px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
            color: canUseSpecial ? '#fffbeb' : '#94a3b8',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: '800',
            cursor: canUseSpecial ? 'pointer' : 'not-allowed',
            boxShadow: canUseSpecial ? '0 4px 14px rgba(245, 158, 11, 0.4)' : 'none',
          }}
        >
          {specialCd > 0
            ? `⏳ ${dino.specialName} (${specialCd.toFixed(1)}s)`
            : `⚡ ${dino.specialName} [V]`}
        </button>
        {!isResting ? (
          <button
            onClick={handleRestButtonClick}
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid #38bdf8',
              color: '#7dd3fc',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
            }}
          >
            💤 Nghỉ ngơi (+20 HP/s) [H]
          </button>
        ) : (
          <button
            onClick={handleRestButtonClick}
            disabled={!canExitRest}
            style={{
              background: canExitRest
                ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                : 'rgba(30, 41, 59, 0.92)',
              border: canExitRest ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.35)',
              color: canExitRest ? '#ffffff' : '#94a3b8',
              padding: '7px 18px',
              borderRadius: '999px',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: canExitRest ? 'pointer' : 'not-allowed',
              boxShadow: canExitRest ? '0 0 18px rgba(56, 189, 248, 0.55)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {canExitRest
              ? '✅ HẾT NGHỈ NGƠI [H]'
              : `🔒 Hết nghỉ ngơi (mở sau ${restUnlockLeft.toFixed(1)}s)`}
          </button>
        )}
        {combatTimerLeft > 0 && !isResting && (
          <div
            style={{
              background: 'rgba(127, 29, 29, 0.9)',
              border: '1px solid #f87171',
              color: '#fecaca',
              padding: '6px 12px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: '800',
            }}
          >
            ⚔️ Giao chiến ({combatTimerLeft}s nữa hồi +5 HP/s)
          </div>
        )}
        {regenRate > 0 && (
          <div
            style={{
              background:
                regenRate >= 20 ? 'rgba(2, 132, 199, 0.92)' : 'rgba(22, 163, 74, 0.92)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: '800',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            💚 Hồi +{regenRate} HP/s
          </div>
        )}
      </div>
      {actionHint && (
        <div
          style={{
            background: isResting ? 'rgba(2, 132, 199, 0.92)' : 'rgba(16, 185, 129, 0.92)',
            color: isResting ? '#f8fafc' : '#030712',
            padding: '5px 14px',
            borderRadius: '999px',
            fontSize: '11.5px',
            fontWeight: '800',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
          }}
        >
          {actionHint}
        </div>
      )}
      {/* Bảng chỉ số sinh tồn */}
      <div
        style={{
          width: '450px',
          background: 'rgba(15, 23, 42, 0.88)',
          border:
            bleed > 0
              ? '1px solid #ef4444'
              : boneBreak > 0
              ? '1px solid #fb923c'
              : isResting
              ? '1px solid #38bdf8'
              : isCrouching
              ? '1px solid #facc15'
              : '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '12px 18px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', fontSize: '14px', color: '#f8fafc' }}>{myName}</span>
            {packId && (
              <span
                style={{
                  background: '#0369a1',
                  color: '#e0f2fe',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                🐾 BẦY ĐÀN
              </span>
            )}
            {isResting && (
              <span
                style={{
                  background: '#0284c7',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                💤 KHÓA HÀNH ĐỘNG
              </span>
            )}
            {isCrouching && !isResting && (
              <span
                style={{
                  background: '#ca8a04',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                🐾 ẨN NẤP [C]
              </span>
            )}
            {boneBreak > 0 && (
              <span
                style={{
                  background: '#ea580c',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                🦴 GÃY XƯƠNG {boneBreak}s
              </span>
            )}
            {bleed > 0 && (
              <span
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                🩸 CHẢY MÁU {bleed}s
              </span>
            )}
          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#fde047' }}>
            🧬 {stageLabel} ({growthPct}%)
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#f87171', marginBottom: '3px' }}>
              <span>❤️ MÁU {regenRate > 0 ? `(+${regenRate}/s)` : ''}</span>
              <span>
                {Math.round(health)}/{maxHealth}
              </span>
            </div>
            <div style={{ height: '7px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${hpPercent}%`,
                  height: '100%',
                  background:
                    regenRate > 0
                      ? 'linear-gradient(90deg, #ef4444, #22c55e)'
                      : 'linear-gradient(90deg, #ef4444, #dc2626)',
                  transition: 'width 0.15s',
                }}
              />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#34d399', marginBottom: '3px' }}>
              <span>⚡ THỂ LỰC</span>
              <span>{Math.round(stamina)}%</span>
            </div>
            <div style={{ height: '7px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${stamina}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  transition: 'width 0.1s',
                }}
              />
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#fb923c', marginBottom: '3px' }}>
              <span>🍖 ĐÓI</span>
              <span>{hunger}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${hunger}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f97316, #ea580c)',
                  transition: 'width 0.2s',
                }}
              />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#38bdf8', marginBottom: '3px' }}>
              <span>💧 KHÁT</span>
              <span>{thirst}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${thirst}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0ea5e9, #0284c7)',
                  transition: 'width 0.2s',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### File: `components\ui\hud\WorldMapModal.tsx` | Size: 16728 bytes | Ext: `.tsx` | Mod: 2026-11-26 16:47:56
```tsx
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  bloodTrailsMutable,
  foodsMutable,
  localTransformMutable,
  playersMutable,
  useGameStore,
} from '../../../store/useGameStore';
import {
  getTerrainHeight,
  HIGHLAND_LAKE_RADIUS,
  HIGHLAND_LAKE_X,
  HIGHLAND_LAKE_Z,
  isInsideLake,
  ISLAND_LIMIT,
  OASIS_RADIUS,
  OASIS_X,
  OASIS_Z,
} from '../../../constants/terrain';
const MAP_PX = 600;
let cachedTerrainCanvas: HTMLCanvasElement | null = null;
function worldToMap(wx: number, wz: number): [number, number] {
  const half = MAP_PX / 2;
  const scale = half / ISLAND_LIMIT;
  return [half + wx * scale, half + wz * scale];
}
function mapToWorld(mx: number, my: number): [number, number] {
  const half = MAP_PX / 2;
  const scale = ISLAND_LIMIT / half;
  const wx = Math.max(-ISLAND_LIMIT, Math.min(ISLAND_LIMIT, (mx - half) * scale));
  const wz = Math.max(-ISLAND_LIMIT, Math.min(ISLAND_LIMIT, (my - half) * scale));
  return [Math.round(wx), Math.round(wz)];
}
function getOrBuildTerrainCanvas(): HTMLCanvasElement {
  if (cachedTerrainCanvas) return cachedTerrainCanvas;
  const offscreen = document.createElement('canvas');
  offscreen.width = MAP_PX;
  offscreen.height = MAP_PX;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return offscreen;
  const step = 2;
  const img = ctx.createImageData(MAP_PX, MAP_PX);
  const data = img.data;
  for (let py = 0; py < MAP_PX; py += step) {
    for (let px = 0; px < MAP_PX; px += step) {
      const [wx, wz] = mapToWorld(px + 1, py + 1);
      const h = getTerrainHeight(wx, wz);
      let r = 61;
      let g = 107;
      let b = 60;
      if (isInsideLake(wx, wz) && h < -0.25) {
        r = 14;
        g = 140;
        b = 215;
      } else if (h < -0.5) {
        r = 58;
        g = 76;
        b = 46;
      } else if (h < 0.4) {
        r = 128;
        g = 114;
        b = 82;
      } else if (h < 7.5) {
        r = 56;
        g = 100;
        b = 58;
      } else if (h < 16.5) {
        r = 44;
        g = 82;
        b = 50;
      } else if (h < 28.0) {
        r = 88;
        g = 96;
        b = 108;
      } else {
        r = 142;
        g = 152;
        b = 166;
      }
      const mod = ((h % 8) + 8) % 8;
      if (mod < 0.32) {
        r = Math.max(0, r - 18);
        g = Math.max(0, g - 18);
        b = Math.max(0, b - 18);
      }
      for (let dy = 0; dy < step && py + dy < MAP_PX; dy++) {
        for (let dx = 0; dx < step && px + dx < MAP_PX; dx++) {
          const idx = ((py + dy) * MAP_PX + (px + dx)) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  const gridStep = MAP_PX / 6;
  for (let i = 1; i < 6; i++) {
    const pos = i * gridStep;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, MAP_PX);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(MAP_PX, pos);
    ctx.stroke();
  }
  const drawLakeOutline = (lx: number, lz: number, radius: number) => {
    const [sx, sy] = worldToMap(lx, lz);
    const rPx = (radius / ISLAND_LIMIT) * (MAP_PX / 2);
    ctx.fillStyle = 'rgba(14, 165, 233, 0.58)';
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.92)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, rPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  drawLakeOutline(OASIS_X, OASIS_Z, OASIS_RADIUS);
  drawLakeOutline(HIGHLAND_LAKE_X, HIGHLAND_LAKE_Z, HIGHLAND_LAKE_RADIUS);
  const landmarks: Array<{ label: string; x: number; z: number; color: string }> = [
    { label: '💧 Hồ Oasis', x: OASIS_X, z: OASIS_Z - 36, color: '#7dd3fc' },
    { label: '💧 Hồ Cao Nguyên', x: HIGHLAND_LAKE_X, z: HIGHLAND_LAKE_Z - 44, color: '#7dd3fc' },
    { label: '🏔️ Núi Đá Đông Nam', x: 210, z: 170, color: '#e2e8f0' },
    { label: '🏔️ Đỉnh Tây Bắc', x: -220, z: -160, color: '#e2e8f0' },
    { label: '🌿 Thung Lũng Trũng', x: -140, z: 20, color: '#bbf7d0' },
    { label: '⭐ Bãi Cỏ Trung Tâm', x: 0, z: 20, color: '#fef08a' },
  ];
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const lm of landmarks) {
    const [lx, ly] = worldToMap(lm.x, lm.z);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
    ctx.fillText(lm.label, lx + 1, ly + 1);
    ctx.fillStyle = lm.color;
    ctx.fillText(lm.label, lx, ly);
  }
  cachedTerrainCanvas = offscreen;
  return offscreen;
}
export const WorldMapModal: React.FC = () => {
  const isMapOpen = useGameStore((s) => s.isMapOpen);
  const setMapOpen = useGameStore((s) => s.setMapOpen);
  const myId = useGameStore((s) => s.myId);
  const mapWaypoint = useGameStore((s) => s.mapWaypoint);
  const setMapWaypoint = useGameStore((s) => s.setMapWaypoint);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRound, setIsRound] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; z: number; y: number } | null>(null);
  const closeAndRefocus = () => {
    setMapOpen(false);
    const canvas3d = document.querySelector('canvas');
    if (canvas3d instanceof HTMLElement) {
      canvas3d.focus();
    }
  };
  useEffect(() => {
    if (!isMapOpen) return;
    const bgCanvas = getOrBuildTerrainCanvas();
    let animId = 0;
    let lastDraw = 0;
    const drawFrame = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const st = useGameStore.getState();
      ctx.clearRect(0, 0, MAP_PX, MAP_PX);
      ctx.drawImage(bgCanvas, 0, 0);
      // 1. Vệt máu truy dấu trên đảo
      for (let i = 0; i < bloodTrailsMutable.length; i++) {
        const bt = bloodTrailsMutable[i];
        const [bx, by] = worldToMap(bt.x, bt.z);
        ctx.fillStyle = 'rgba(220, 38, 38, 0.72)';
        ctx.beginPath();
        ctx.arc(bx, by, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      // 2. Nguồn thức ăn
      for (const id of Object.keys(foodsMutable)) {
        const f = foodsMutable[id];
        if (!f || f.amount <= 0) continue;
        const [fx, fy] = worldToMap(f.x, f.z);
        ctx.fillStyle = f.type === 'meat' ? '#f43f5e' : '#86efac';
        if (f.type === 'meat') {
          ctx.beginPath();
          ctx.moveTo(fx, fy - 5);
          ctx.lineTo(fx + 5, fy);
          ctx.lineTo(fx, fy + 5);
          ctx.lineTo(fx - 5, fy);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(fx - 3, fy - 3, 6, 6);
        }
      }
      // 3. Các sinh vật khác (ưu tiên làm nổi bật Đồng đội Bầy đàn màu xanh dương)
      for (const id of Object.keys(playersMutable)) {
        if (id === myId) continue;
        const p = playersMutable[id];
        if (!p) continue;
        const [px, py] = worldToMap(p.x, p.z);
        const isPackmate = Boolean(!p.isAi && st.packId && p.packId === st.packId);
        const isHunting = p.aiState === 'CHASE' || p.aiState === 'ATTACK';
        ctx.fillStyle = isPackmate
          ? '#38bdf8'
          : isHunting
          ? '#f97316'
          : p.diet === 'herbivore'
          ? '#34d399'
          : p.isAi
          ? '#a78bfa'
          : '#ef4444';
        const radius = isPackmate ? 6.2 : !p.isAi ? 6 : p.growth && p.growth > 1.1 ? 5.5 : 4.2;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
        if (isPackmate) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
        if (isPackmate || !p.isAi || (p.growth && p.growth >= 1.25)) {
          ctx.font = 'bold 11px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
          ctx.fillText(p.name, px + 1, py - 8);
          ctx.fillStyle = isPackmate ? '#7dd3fc' : !p.isAi ? '#fca5a5' : '#e9d5ff';
          ctx.fillText(p.name, px, py - 9);
        }
      }
      const [meX, meY] = worldToMap(localTransformMutable.x, localTransformMutable.z);
      // 4. Điểm ghim Waypoint
      const wp = st.mapWaypoint;
      if (wp) {
        const [wx, wy] = worldToMap(wp.x, wp.z);
        const distM = Math.round(
          Math.hypot(wp.x - localTransformMutable.x, wp.z - localTransformMutable.z)
        );
        ctx.save();
        ctx.setLineDash([7, 5]);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(meX, meY);
        ctx.lineTo(wx, wy);
        ctx.stroke();
        ctx.restore();
        const pulse = 9 + Math.sin(now * 0.008) * 3.5;
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(wx, wy, pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(wx, wy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fef08a';
        ctx.fillText(`📍 ${distM}m`, wx, wy - 14);
      }
      // 5. Người chơi hiện tại
      const rot = localTransformMutable.rot;
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(meX, meY);
      ctx.lineTo(meX + Math.sin(rot) * 20, meY + Math.cos(rot) * 20);
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(meX, meY, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };
    drawFrame(performance.now());
    const loop = (now: number) => {
      if (now - lastDraw >= 50) {
        lastDraw = now;
        drawFrame(now);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isMapOpen, myId]);
  if (!isMapOpen || typeof document === 'undefined') return null;
  const getCoordsFromMouse = (e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = MAP_PX / Math.max(1, rect.width);
    const scaleY = MAP_PX / Math.max(1, rect.height);
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    return mapToWorld(mx, my);
  };
  const handleMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [wx, wz] = getCoordsFromMouse(e);
    setMapWaypoint({ x: wx, z: wz });
  };
  const handleMapContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setMapWaypoint(null);
  };
  const handleMapMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [wx, wz] = getCoordsFromMouse(e);
    const wy = Math.round(getTerrainHeight(wx, wz) * 10) / 10;
    setHoverInfo({ x: wx, z: wz, y: wy });
  };
  return createPortal(
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={closeAndRefocus}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 23, 0.76)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        zIndex: 99999999,
        padding: '16px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#fff',
        userSelect: 'none',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(15, 23, 42, 0.97)',
          border: '1px solid rgba(52, 211, 153, 0.5)',
          borderRadius: '18px',
          padding: '16px 20px',
          boxShadow: '0 28px 80px rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '94vw',
          maxHeight: '95vh',
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#4ade80', letterSpacing: '1px' }}>
              🗺️ BẢN ĐỒ TOÀN ĐẢO KHỦNG LONG (900m × 900m)
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Click trái để <b>đặt ghim dẫn đường 📍</b> (hiện cột sáng 3D) • Click phải để xóa ghim
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsRound((v) => !v)}
              style={{
                background: '#1e293b',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                color: '#7dd3fc',
                padding: '5px 10px',
                borderRadius: '7px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              {isRound ? '⬜ Dạng Vuông' : '⭕ Dạng Tròn'}
            </button>
            {mapWaypoint && (
              <button
                onClick={() => setMapWaypoint(null)}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#fca5a5',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                ✕ Xóa ghim
              </button>
            )}
            <button
              onClick={closeAndRefocus}
              style={{
                background: '#dc2626',
                border: 'none',
                color: '#fff',
                padding: '5px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
              }}
            >
              Đóng [M / Esc]
            </button>
          </div>
        </div>
        <div
          style={{
            width: 'min(600px, 74vmin)',
            height: 'min(600px, 74vmin)',
            position: 'relative',
            borderRadius: isRound ? '50%' : '12px',
            overflow: 'hidden',
            border: '2px solid rgba(52, 211, 153, 0.55)',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.25)',
            flexShrink: 0,
          }}
        >
          <canvas
            ref={canvasRef}
            width={MAP_PX}
            height={MAP_PX}
            onClick={handleMapClick}
            onContextMenu={handleMapContextMenu}
            onMouseMove={handleMapMouseMove}
            onMouseLeave={() => setHoverInfo(null)}
            style={{
              width: '100%',
              height: '100%',
              cursor: 'crosshair',
              display: 'block',
            }}
          />
        </div>
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#cbd5e1',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            🟡 Bạn • 🩵 Bầy đàn • 🔴 Người chơi • 🟢 Ăn cỏ • 🟣 Ăn thịt AI • 🩸 Vệt máu • ♦️ Thịt
          </div>
          <div style={{ color: '#fde047', fontWeight: '700' }}>
            {hoverInfo
              ? `Con trỏ: X ${hoverInfo.x} | Z ${hoverInfo.z} | Cao ${hoverInfo.y}m`
              : `Vị trí bạn: X ${Math.round(localTransformMutable.x)} | Z ${Math.round(localTransformMutable.z)}`}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
```

### File: `components\ui\LoginScreen.tsx` | Size: 8999 bytes | Ext: `.tsx` | Mod: 2026-11-25 15:27:41
```tsx
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { socket } from '../../core/socket';
import { DINOSAURS } from '../../constants/dinosaurs';
import type { DinoModelType } from '../../types/game';
export const LoginScreen: React.FC = () => {
  const setMyName = useGameStore((s) => s.setMyName);
  const selectedModel = useGameStore((s) => s.selectedModel);
  const setSelectedModel = useGameStore((s) => s.setSelectedModel);
  const setJoined = useGameStore((s) => s.setJoined);
  const isConnected = useGameStore((s) => s.isConnected);
  const [nameInput, setNameInput] = useState('Apex Predator');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    socket.connect();
  }, []);
  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const trimmed = nameInput.trim() || 'Wild Raptor';
    setMyName(trimmed);
    setLoading(true);
    socket.connect(() => {
      socket.join(trimmed, selectedModel);
      setJoined(true);
    });
  };
  const dinoList = Object.values(DINOSAURS);
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #111827 0%, #030712 100%)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#f3f4f6',
        zIndex: 100,
        padding: '16px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.15,
          backgroundImage: 'radial-gradient(#22c55e 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 26px',
          background: 'rgba(17, 24, 39, 0.94)',
          border: '1px solid rgba(34, 197, 94, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(34, 197, 94, 0.15)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '38px', lineHeight: '1', marginBottom: '6px' }}>🦖</div>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: '900',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            margin: '0 0 4px 0',
            background: 'linear-gradient(135deg, #4ade80 0%, #10b981 50%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Dino Isle Web
        </h1>
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 12px 0', letterSpacing: '0.5px' }}>
          PREHISTORIC SURVIVAL SIMULATION ({dinoList.length} LOÀI SẴN SÀNG)
        </p>
        <div
          style={{
            alignSelf: 'center',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '9999px',
            fontSize: '12px',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? '#22c55e' : '#eab308',
            }}
          />
          <span style={{ color: isConnected ? '#86efac' : '#fde047' }}>
            {isConnected ? 'Máy chủ Go 8080: Sẵn sàng' : 'Đang kết nối Server Go (8080)...'}
          </span>
        </div>
        <form onSubmit={handleStartGame} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ textAlign: 'left', marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: '#34d399',
                marginBottom: '8px',
                letterSpacing: '1px',
              }}
            >
              CHỌN LOÀI KHỦNG LONG
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                gap: '10px',
                maxHeight: '260px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {dinoList.map((dino) => {
                const isSelected = selectedModel === dino.id;
                const isHerb = dino.diet === 'herbivore';
                return (
                  <div
                    key={dino.id}
                    onClick={() => setSelectedModel(dino.id as DinoModelType)}
                    style={{
                      background: isSelected ? 'rgba(16, 185, 129, 0.16)' : 'rgba(0, 0, 0, 0.4)',
                      border: isSelected ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '5px',
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{dino.icon}</span>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: '800',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          background: isHerb ? 'rgba(34, 197, 94, 0.25)' : 'rgba(249, 115, 22, 0.25)',
                          color: isHerb ? '#86efac' : '#fdba74',
                        }}
                      >
                        {dino.badge}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: isSelected ? '#4ade80' : '#f3f4f6',
                        marginBottom: '3px',
                      }}
                    >
                      {dino.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.3' }}>
                      {dino.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ textAlign: 'left', marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                color: '#9ca3af',
                marginBottom: '6px',
                letterSpacing: '1px',
              }}
            >
              Tên Khủng Long (Player Name)
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Nhập tên khủng long..."
              maxLength={20}
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 14px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px 20px',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(22, 163, 74, 0.4)',
            }}
          >
            {loading ? 'ĐANG VÀO ĐẢO...' : 'VÀO SINH TỒN (ENTER THE ISLE)'}
          </button>
        </form>
      </div>
    </div>
  );
};
```

### File: `constants\dinosaurs.ts` | Size: 12044 bytes | Ext: `.ts` | Mod: 2026-11-26 16:17:56
```typescript
import * as THREE from 'three';
import type { AnimState, DietType, DinoModelType } from '../types/game';
export interface DinoSpec {
  id: DinoModelType;
  name: string;
  species: string;
  diet: DietType;
  fileName: string;
  badge: string;
  description: string;
  specialName: string;
  specialDesc: string;
  specialCooldown: number;
  icon: string;
  modelPath: string;
  targetSize: number;
  rotationOffset?: number;
  nametagHeight: number;
  camDistance: number;
  camHeight: number;
  lookAtY: number;
  turnSpeed: number;
  walkSpeed: number;
  sprintSpeed: number;
  backSpeed: number;
}
const discoveredGlbFiles = import.meta.glob('/public/models/dino/*.glb');
const discoveredJsonConfigs = import.meta.glob('/public/models/dino/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Partial<DinoSpec>>;
const PRESET_SPECS: Record<string, Partial<DinoSpec>> = {
  trex: {
    name: 'T-Rex Apex',
    species: 'Tyrannosaurus Rex (Adult)',
    diet: 'carnivore',
    badge: 'ĂN THỊT',
    description: 'Bạo chúa đỉnh chuỗi thức ăn (150 HP), cú cắn gây chảy máu nặng.',
    specialName: 'Ngoạm Nghiền Xương',
    specialDesc: 'Gây sát thương lớn + Gãy xương 6s (giảm tốc & khóa chạy nhanh)',
    specialCooldown: 12,
    icon: '🦖',
    targetSize: 4.4,
    rotationOffset: 0,
    nametagHeight: 3.4,
    camDistance: 10.5,
    camHeight: 3.8,
    lookAtY: 1.5,
    turnSpeed: 3.2,
    walkSpeed: 7.5,
    sprintSpeed: 14.5,
    backSpeed: 5.5,
  },
  't-rex': {
    name: 'T-Rex Alpha',
    species: 'Tyrannosaurus Rex (Alpha)',
    diet: 'carnivore',
    badge: 'ĂN THỊT',
    description: 'Săn mồi cân bằng giữa tốc độ và sức cắn (135 HP).',
    specialName: 'Ngoạm Nghiền Xương',
    specialDesc: 'Cắn xuyên giáp gây Gãy xương 6s & Chảy máu',
    specialCooldown: 12,
    icon: '🦖',
    targetSize: 4.0,
    rotationOffset: 0,
    nametagHeight: 3.1,
    camDistance: 9.5,
    camHeight: 3.5,
    lookAtY: 1.4,
    turnSpeed: 3.5,
    walkSpeed: 8.0,
    sprintSpeed: 15.0,
    backSpeed: 6.0,
  },
  tyranno: {
    name: 'Tyranno Juvie',
    species: 'Tyrannosaurus (Juvenile)',
    diet: 'carnivore',
    badge: 'TỐC ĐỘ CAO',
    description: 'Sát thủ tốc độ cao (110 HP), rẽ ngoặt nhanh, săn mồi cực nhạy.',
    specialName: 'Vồ Săn Mồi',
    specialDesc: 'Lướt tiến 10m chớp nhoáng + cào gây chảy máu 7.5s',
    specialCooldown: 8,
    icon: '🦎',
    targetSize: 3.1,
    rotationOffset: -Math.PI / 2,
    nametagHeight: 2.6,
    camDistance: 8.2,
    camHeight: 3.0,
    lookAtY: 1.1,
    turnSpeed: 4.0,
    walkSpeed: 9.0,
    sprintSpeed: 17.0,
    backSpeed: 6.8,
  },
  tricera: {
    name: 'Triceratops',
    species: 'Triceratops Horridus',
    diet: 'herbivore',
    badge: 'ĂN CỎ • TANK',
    description: 'Khủng long 3 sừng giáp dày (175 HP), húc văng kẻ săn mồi.',
    specialName: 'Húc Tam Sừng',
    specialDesc: 'Húc văng kẻ địch ra xa + Gãy xương 4.5s',
    specialCooldown: 10,
    icon: '🦕',
    targetSize: 4.2,
    nametagHeight: 3.0,
    camDistance: 10.2,
    camHeight: 3.6,
    lookAtY: 1.4,
    turnSpeed: 2.9,
    walkSpeed: 6.8,
    sprintSpeed: 13.0,
    backSpeed: 4.8,
  },
  stego: {
    name: 'Stegosaurus',
    species: 'Stegosaurus Stenops',
    diet: 'herbivore',
    badge: 'ĂN CỎ • GAI ĐUÔI',
    description: 'Giáp lưng gai sắc bén (165 HP), quất đuôi (E) sát thương diện rộng.',
    specialName: 'Quất Gai 360°',
    specialDesc: 'Quét gai đuôi xung quanh gây siêu chảy máu 10s',
    specialCooldown: 9,
    icon: '🦕',
    targetSize: 4.3,
    nametagHeight: 3.1,
    camDistance: 10.2,
    camHeight: 3.6,
    lookAtY: 1.4,
    turnSpeed: 2.8,
    walkSpeed: 6.5,
    sprintSpeed: 12.2,
    backSpeed: 4.5,
  },
  mammoth: {
    name: 'Woolly Mammoth',
    species: 'Mammuthus Primigenius',
    diet: 'herbivore',
    badge: 'ĂN CỎ • KHỔNG LỒ',
    description: 'Voi ma mút tiền sử siêu trâu (210 HP), đầm chắc và mạnh mẽ.',
    specialName: 'Giẫm Chấn Động',
    specialDesc: 'Chấn động 360° hất văng mọi kẻ thù + Gãy xương 4.5s',
    specialCooldown: 10,
    icon: '🦣',
    targetSize: 4.8,
    nametagHeight: 3.6,
    camDistance: 11.5,
    camHeight: 4.2,
    lookAtY: 1.7,
    turnSpeed: 2.5,
    walkSpeed: 6.4,
    sprintSpeed: 12.0,
    backSpeed: 4.4,
  },
  dino_hunter_deadly_shores_vicious: {
    name: 'Vicious Predator',
    species: 'Deadly Shores Hunter',
    diet: 'carnivore',
    badge: 'ĂN THỊT',
    description: 'Dã thú săn mồi hung tợn (130 HP), tốc độ vồ mồi chớp nhoáng.',
    specialName: 'Vồ Săn Mồi',
    specialDesc: 'Lao tiến 10m vồ mồi + gây chảy máu nặng 7.5s',
    specialCooldown: 8,
    icon: '🦖',
    targetSize: 3.9,
    nametagHeight: 3.0,
    camDistance: 9.5,
    camHeight: 3.5,
    lookAtY: 1.4,
    turnSpeed: 3.6,
    walkSpeed: 8.2,
    sprintSpeed: 15.8,
    backSpeed: 6.0,
  },
};
function formatSpeciesTitle(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
function createDefaultSpec(id: string, fileName: string): DinoSpec {
  const title = formatSpeciesTitle(id);
  const preset = PRESET_SPECS[id] || {};
  const jsonOverrideKey = Object.keys(discoveredJsonConfigs).find((k) =>
    k.toLowerCase().endsWith(`/${id}.json`)
  );
  const externalJson = jsonOverrideKey ? discoveredJsonConfigs[jsonOverrideKey] : {};
  return {
    id,
    name: title,
    species: title,
    diet: 'carnivore',
    fileName,
    badge: 'LOÀI MỚI',
    description: `Mô hình khủng long tự động nạp từ public/models/dino/${fileName}.`,
    specialName: 'Vồ Săn Mồi',
    specialDesc: 'Lao tới tấn công mạnh gây chảy máu',
    specialCooldown: 8,
    icon: '🦕',
    modelPath: `/models/dino/${fileName}`,
    targetSize: 4.0,
    nametagHeight: 3.1,
    camDistance: 10.0,
    camHeight: 3.6,
    lookAtY: 1.4,
    turnSpeed: 3.0,
    walkSpeed: 7.2,
    sprintSpeed: 14.0,
    backSpeed: 5.2,
    ...preset,
    ...externalJson,
  };
}
function buildDinosaurRegistry(): Record<string, DinoSpec> {
  const registry: Record<string, DinoSpec> = {};
  for (const fullPath of Object.keys(discoveredGlbFiles)) {
    const match = fullPath.match(/\/([^/]+\.glb)$/i);
    if (!match) continue;
    const fileName = match[1];
    const id = fileName.replace(/\.glb$/i, '').toLowerCase();
    registry[id] = createDefaultSpec(id, fileName);
  }
  if (Object.keys(registry).length === 0) {
    registry['trex'] = createDefaultSpec('trex', 'trex.glb');
  }
  return registry;
}
export const DINOSAURS: Record<string, DinoSpec> = buildDinosaurRegistry();
export function getDinoSpec(modelId?: string): DinoSpec {
  if (modelId) {
    const normalized = modelId.toLowerCase();
    if (DINOSAURS[normalized]) {
      return DINOSAURS[normalized];
    }
  }
  return DINOSAURS['trex'] || Object.values(DINOSAURS)[0];
}
export interface DinoNormalizationResult {
  scale: number;
  offsetY: number;
  autoForwardYaw: number;
  isQuadruped: boolean;
}
export function computeDinoNormalization(
  root: THREE.Object3D,
  targetSize: number,
  explicitOffset?: number
): DinoNormalizationResult {
  const measureWrapper = new THREE.Group();
  const prevParent = root.parent;
  measureWrapper.add(root);
  measureWrapper.updateMatrixWorld(true);
  const geomBox = new THREE.Box3();
  const boneBox = new THREE.Box3();
  const tempVec = new THREE.Vector3();
  let headBonePos: THREE.Vector3 | null = null;
  let rearBonePos: THREE.Vector3 | null = null;
  root.traverse((child) => {
    if ((child as THREE.Bone).isBone) {
      child.getWorldPosition(tempVec);
      boneBox.expandByPoint(tempVec);
      const bName = child.name.toLowerCase();
      if (!headBonePos && (bName.includes('head') || bName.includes('snout') || bName.includes('jaw'))) {
        headBonePos = tempVec.clone();
      }
      if (!rearBonePos && (bName.includes('tail') || bName.includes('pelvis') || bName.includes('hips'))) {
        rearBonePos = tempVec.clone();
      }
    }
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.computeBoundingBox();
        if (mesh.geometry.boundingBox) {
          const b = mesh.geometry.boundingBox.clone();
          b.applyMatrix4(mesh.matrixWorld);
          geomBox.union(b);
        }
      }
    }
  });
  measureWrapper.remove(root);
  if (prevParent) {
    prevParent.add(root);
  }
  const geomSize = new THREE.Vector3();
  geomBox.getSize(geomSize);
  const geomMax = Math.max(geomSize.x, geomSize.y, geomSize.z);
  const boneSize = new THREE.Vector3();
  boneBox.getSize(boneSize);
  const boneMax = Math.max(boneSize.x, boneSize.y, boneSize.z);
  let chosenBox = geomBox;
  let chosenSize = geomSize;
  let maxDim = geomMax;
  if (boneMax > geomMax * 1.2 && isFinite(boneMax) && boneMax < 10000) {
    chosenBox = boneBox;
    chosenSize = boneSize;
    maxDim = boneMax * 1.25;
  }
  if (!isFinite(maxDim) || maxDim < 0.05) {
    maxDim = targetSize;
  }
  let autoForwardYaw = 0;
  if (typeof explicitOffset === 'number') {
    autoForwardYaw = explicitOffset;
  } else if (headBonePos && rearBonePos) {
    const dx = (headBonePos as THREE.Vector3).x - (rearBonePos as THREE.Vector3).x;
    const dz = (headBonePos as THREE.Vector3).z - (rearBonePos as THREE.Vector3).z;
    if (Math.hypot(dx, dz) > 0.01) {
      const rawYaw = -Math.atan2(dx, dz);
      const quarterTurn = Math.PI / 2;
      autoForwardYaw = Math.round(rawYaw / quarterTurn) * quarterTurn;
    }
  } else if (chosenSize.x > chosenSize.z * 1.25) {
    autoForwardYaw = -Math.PI / 2;
  }
  const horizontalLength = Math.max(chosenSize.x, chosenSize.z);
  const horizontalWidth = Math.min(chosenSize.x, chosenSize.z);
  const isQuadruped =
    horizontalLength > chosenSize.y * 1.25 && horizontalLength > horizontalWidth * 1.35;
  const scale = targetSize / maxDim;
  const offsetY = isFinite(chosenBox.min.y) ? -chosenBox.min.y * scale : 0;
  return { scale, offsetY, autoForwardYaw, isQuadruped };
}
export function getDinoAction(
  actions: Record<string, THREE.AnimationAction | null>,
  animType: AnimState
): THREE.AnimationAction | null {
  if (!actions) return null;
  const names = Object.keys(actions);
  if (names.length === 0) return null;
  const findMatch = (keywords: string[]) => {
    for (const kw of keywords) {
      const match = names.find((n) => n.toLowerCase().includes(kw));
      if (match && actions[match]) {
        return actions[match];
      }
    }
    return null;
  };
  switch (animType) {
    case 'idle':
      return findMatch(['idle', 'stand', 'wait', 'breathe', 'rest']) || actions[names[0]] || null;
    case 'walk':
      return (
        findMatch(['walk', 'trot', 'step', 'move', 'run', 'locomotion']) ||
        actions[names[Math.min(1, names.length - 1)]] ||
        actions[names[0]] ||
        null
      );
    case 'run':
      return (
        findMatch(['run', 'gallop', 'sprint', 'chase', 'walk', 'move']) ||
        actions[names[Math.min(1, names.length - 1)]] ||
        actions[names[0]] ||
        null
      );
    case 'bite':
      return (
        findMatch(['bite', 'attack', 'horn', 'headbutt', 'chomp', 'strike', 'eat']) ||
        actions[names[0]] ||
        null
      );
    case 'roar':
      return findMatch(['roar', 'screech', 'bellow', 'call', 'scream']) || actions[names[0]] || null;
    case 'tail':
      return findMatch(['tail', 'whip', 'swipe', 'stomp', 'attack2']) || actions[names[0]] || null;
    case 'rest':
      return (
        findMatch(['sleep', 'rest', 'sit', 'lie', 'crouch', 'idle', 'stand', 'breathe']) ||
        actions[names[0]] ||
        null
      );
    default:
      return actions[names[0]] || null;
  }
}
```

### File: `constants\terrain.ts` | Size: 6157 bytes | Ext: `.ts` | Mod: 2026-11-26 00:23:32
```typescript
export const OASIS_X = 60;
export const OASIS_Z = -60;
export const OASIS_RADIUS = 26;
export const HIGHLAND_LAKE_X = -160;
export const HIGHLAND_LAKE_Z = 140;
export const HIGHLAND_LAKE_RADIUS = 32;
export const ISLAND_LIMIT = 450;
export const WATER_LEVEL = -0.35;
export const TERRAIN_SIZE = 1200;
export const TERRAIN_SEGMENTS = 128;
export interface WorldRock {
  pos: [number, number, number];
  scale: [number, number, number];
  rot: number;
  radius: number;
}
function clamp(v: number, minV: number, maxV: number): number {
  return v < minV ? minV : v > maxV ? maxV : v;
}
// Công thức giải tích khớp 100% với server/internal/world/obstacles.go -> GetTerrainHeight
export function getTerrainHeight(x: number, z: number): number {
  const distOrigin = Math.hypot(x, z);
  let hills =
    Math.sin(x * 0.011) * Math.cos(z * 0.011) * 11.0 +
    Math.sin(x * 0.024 + z * 0.017) * 4.5 +
    Math.cos(x * 0.0055 - z * 0.0065) * 9.0;
  const dPeak1 = Math.hypot(x - 210, z - 170);
  if (dPeak1 < 120) {
    const t = 1 - dPeak1 / 120;
    hills += t * t * 34;
  }
  const dPeak2 = Math.hypot(x + 220, z + 160);
  if (dPeak2 < 130) {
    const t = 1 - dPeak2 / 130;
    hills += t * t * 38;
  }
  const dValley = Math.hypot(x + 140, z - 20);
  if (dValley < 110) {
    const t = 1 - dValley / 110;
    hills -= t * t * 8;
  }
  const spawnWeight = clamp((distOrigin - 32) / 55, 0, 1);
  let h = 0.8 + hills * spawnWeight;
  const dOasis = Math.hypot(x - OASIS_X, z - OASIS_Z);
  if (dOasis < OASIS_RADIUS + 18) {
    let t = clamp((dOasis - OASIS_RADIUS) / 18, 0, 1);
    t = t * t * (3 - 2 * t);
    h = -2.2 * (1 - t) + h * t;
  }
  const dLake2 = Math.hypot(x - HIGHLAND_LAKE_X, z - HIGHLAND_LAKE_Z);
  if (dLake2 < HIGHLAND_LAKE_RADIUS + 22) {
    let t = clamp((dLake2 - HIGHLAND_LAKE_RADIUS) / 22, 0, 1);
    t = t * t * (3 - 2 * t);
    h = -2.2 * (1 - t) + h * t;
  }
  if (distOrigin > 370) {
    const angle = Math.atan2(z, x);
    const edgeT = (distOrigin - 370) / 140;
    const ridge = 0.72 + 0.28 * Math.sin(angle * 7) + 0.14 * Math.cos(angle * 13);
    h += edgeT * edgeT * 62 * ridge;
  }
  return h;
}
// Nội suy chính xác độ cao trên đúng mặt tam giác của PlaneGeometry(1200, 1200, 128, 128)
// Fix triệt để lỗi chân khủng long lơ lửng hoặc chìm ở vùng trũng / sườn dốc
export function getMeshTerrainHeight(x: number, z: number): number {
  const half = TERRAIN_SIZE / 2;
  const cellSize = TERRAIN_SIZE / TERRAIN_SEGMENTS;
  const gx = clamp((x + half) / cellSize, 0, TERRAIN_SEGMENTS - 0.0001);
  const gz = clamp((z + half) / cellSize, 0, TERRAIN_SEGMENTS - 0.0001);
  const ix = Math.floor(gx);
  const iz = Math.floor(gz);
  const u = gx - ix;
  const v = gz - iz;
  const x0 = ix * cellSize - half;
  const x1 = x0 + cellSize;
  const z0 = iz * cellSize - half;
  const z1 = z0 + cellSize;
  const hD = getTerrainHeight(x1, z0);
  const hB = getTerrainHeight(x0, z1);
  if (u + v <= 1) {
    const hA = getTerrainHeight(x0, z0);
    return hA + u * (hD - hA) + v * (hB - hA);
  }
  const hC = getTerrainHeight(x1, z1);
  return hC + (1 - u) * (hB - hC) + (1 - v) * (hD - hC);
}
export function isInsideLake(x: number, z: number): boolean {
  return (
    Math.hypot(x - OASIS_X, z - OASIS_Z) <= OASIS_RADIUS + 4 ||
    Math.hypot(x - HIGHLAND_LAKE_X, z - HIGHLAND_LAKE_Z) <= HIGHLAND_LAKE_RADIUS + 5
  );
}
export function isNearWater(x: number, z: number): boolean {
  return (
    Math.hypot(x - OASIS_X, z - OASIS_Z) <= OASIS_RADIUS + 6 ||
    Math.hypot(x - HIGHLAND_LAKE_X, z - HIGHLAND_LAKE_Z) <= HIGHLAND_LAKE_RADIUS + 6
  );
}
// Độ cao mặt đất cho sinh vật: trên thung lũng khô bám sát mặt đất (kể cả Y < 0),
// chỉ giữ mực lội nước khi thực sự đi vào lòng 2 hồ nước
export function getEntityGroundHeight(x: number, z: number): number {
  const groundY = getMeshTerrainHeight(x, z);
  if (isInsideLake(x, z)) {
    return Math.max(WATER_LEVEL - 0.85, groundY);
  }
  return groundY;
}
// Tính góc nghiêng pitch/roll theo độ dốc địa hình để thân thú áp sát lòng chảo & sườn đồi
export function getTerrainSlope(
  x: number,
  z: number,
  yaw: number,
  sampleDist = 1.6
): { pitch: number; roll: number } {
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const hFront = getEntityGroundHeight(x + fx * sampleDist, z + fz * sampleDist);
  const hBack = getEntityGroundHeight(x - fx * sampleDist, z - fz * sampleDist);
  const hRight = getEntityGroundHeight(x + rx * sampleDist, z + rz * sampleDist);
  const hLeft = getEntityGroundHeight(x - rx * sampleDist, z - rz * sampleDist);
  const pitch = clamp(-Math.atan2(hFront - hBack, sampleDist * 2), -0.38, 0.38);
  const roll = clamp(Math.atan2(hRight - hLeft, sampleDist * 2), -0.32, 0.32);
  return { pitch, roll };
}
// Công thức phóng to rõ rệt theo độ tuổi: Baby (0.35 -> 0.57x) | Adult (1.0 -> 1.32x) | Apex (1.25 -> 1.61x)
export function calcGrowthVisualScale(growth: number): number {
  const g = clamp(growth, 0.3, 1.35);
  return 0.17 + 1.15 * g;
}
export const WORLD_ROCKS: WorldRock[] = (() => {
  const list: WorldRock[] = [];
  for (let i = 0; i < 140; i++) {
    const angle = i * 2.3999632 + (i % 5) * 0.11;
    const dist = 30 + ((i * 19.37) % 360);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (Math.hypot(x - OASIS_X, z - OASIS_Z) < OASIS_RADIUS + 10) continue;
    if (Math.hypot(x - HIGHLAND_LAKE_X, z - HIGHLAND_LAKE_Z) < HIGHLAND_LAKE_RADIUS + 10) continue;
    const y = getMeshTerrainHeight(x, z);
    if (y > 24) continue;
    const sy = 1.6 + (i % 5) * 1.15;
    const sx = 1.6 + (i % 4) * 1.35;
    const sz = 1.6 + (i % 3) * 1.45;
    list.push({
      pos: [x, y + sy * 0.25, z],
      scale: [sx, sy, sz],
      rot: i * 0.9,
      radius: Math.max(sx, sz) * 1.15,
    });
  }
  return list;
})();
```

### File: `core\meshopt.ts` | Size: 364 bytes | Ext: `.ts` | Mod: 2026-11-26 16:21:28
```typescript
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
export function setupMeshoptLoader(loader: unknown): void {
  const gltfLoader = loader as { setMeshoptDecoder?: (decoder: unknown) => void };
  if (gltfLoader && typeof gltfLoader.setMeshoptDecoder === 'function') {
    gltfLoader.setMeshoptDecoder(MeshoptDecoder);
  }
}
```

### File: `core\socket.ts` | Size: 5216 bytes | Ext: `.ts` | Mod: 2026-11-26 16:18:24
```typescript
import { useGameStore } from '../store/useGameStore';
class GameSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimer: number | null = null;
  private isIntentionalClose: boolean = false;
  private lastJoinName: string | null = null;
  private lastJoinModel: string = 'trex';
  constructor() {
    const host =
      typeof window !== 'undefined' && window.location.hostname
        ? window.location.hostname
        : 'localhost';
    const protocol =
      typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${protocol}//${host}:8080/ws`;
  }
  public connect(onConnected?: () => void) {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      if (this.ws.readyState === WebSocket.OPEN && onConnected) {
        onConnected();
      }
      return;
    }
    this.isIntentionalClose = false;
    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      console.warn('[WS] Failed to create WebSocket connection:', e);
      this.scheduleReconnect();
      return;
    }
    this.ws.onopen = () => {
      const store = useGameStore.getState();
      store.setConnected(true);
      if (onConnected) {
        onConnected();
      } else if (store.isJoined && this.lastJoinName) {
        this.join(this.lastJoinName, this.lastJoinModel);
      }
    };
    this.ws.onmessage = (event) => {
      const raw = typeof event.data === 'string' ? event.data : '';
      const lines = raw.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.type === 'INIT') {
            if (data.id) {
              useGameStore.getState().setMyId(data.id);
            }
            useGameStore.getState().syncFromServer({
              players: data.players,
              foods: data.foods,
              bloodTrails: data.bloodTrails,
              worldTime: data.worldTime,
              weather: data.weather,
            });
          } else if (data.type === 'SYNC') {
            useGameStore.getState().syncFromServer({
              players: data.players,
              foods: data.foods,
              bloodTrails: data.bloodTrails,
              events: data.events,
              chats: data.chats,
              worldTime: data.worldTime,
              weather: data.weather,
            });
          }
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      }
    };
    this.ws.onerror = (err) => {
      console.warn('[WS] Error:', err);
    };
    this.ws.onclose = () => {
      useGameStore.getState().setConnected(false);
      if (!this.isIntentionalClose) {
        this.scheduleReconnect();
      }
    };
  }
  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2500);
  }
  public join(name: string, model: string = 'trex') {
    this.lastJoinName = name;
    this.lastJoinModel = model;
    this.send({
      type: 'JOIN',
      payload: { name, model },
    });
  }
  public sendMove(x: number, y: number, z: number, rotation: number, animState: string) {
    this.send({
      type: 'MOVE',
      payload: {
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        z: Math.round(z * 100) / 100,
        rotation: Math.round(rotation * 1000) / 1000,
        animState,
      },
    });
  }
  public sendAttack(attackType: 'bite' | 'tail') {
    this.send({
      type: 'ATTACK',
      payload: { attackType },
    });
  }
  public sendSpecial() {
    this.send({
      type: 'SPECIAL',
      payload: {},
    });
  }
  public sendInteract() {
    this.send({
      type: 'INTERACT',
      payload: {},
    });
  }
  public sendChat(text: string) {
    this.send({
      type: 'CHAT',
      payload: { text },
    });
  }
  public sendToggleRest() {
    this.send({
      type: 'REST',
      payload: {},
    });
  }
  public sendCrouch(crouching: boolean) {
    this.send({
      type: 'CROUCH',
      payload: { crouching },
    });
  }
  public sendRoar(callType: number = 1) {
    this.send({
      type: 'ROAR',
      payload: { callType },
    });
  }
  public sendPackInvite(targetId: string) {
    this.send({
      type: 'PACK_INVITE',
      payload: { targetId },
    });
  }
  public sendPackAccept() {
    this.send({
      type: 'PACK_ACCEPT',
      payload: {},
    });
  }
  public sendPackLeave() {
    this.send({
      type: 'PACK_LEAVE',
      payload: {},
    });
  }
  private send(obj: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }
  public disconnect() {
    this.isIntentionalClose = true;
    this.lastJoinName = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    useGameStore.getState().setConnected(false);
  }
}
export const socket = new GameSocket();
```

### File: `core\sound.ts` | Size: 5279 bytes | Ext: `.ts` | Mod: 2026-11-26 16:18:35
```typescript
import { useGameStore } from '../store/useGameStore';
class SoundEngine {
  private ctx: AudioContext | null = null;
  private getContext(): AudioContext | null {
    if (!useGameStore.getState().soundEnabled) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }
  public playRoar(callType: number = 1, growth: number = 0.8) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const sizePitch = Math.max(0.65, 1.45 - growth * 0.55);
    if (callType === 2) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(210 * sizePitch, now);
      osc.frequency.exponentialRampToValueAtTime(320 * sizePitch, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(190 * sizePitch, now + 0.55);
    } else if (callType === 3) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(115 * sizePitch, now);
      osc.frequency.exponentialRampToValueAtTime(48 * sizePitch, now + 0.75);
    } else if (callType === 4) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420 * sizePitch, now);
      osc.frequency.exponentialRampToValueAtTime(260 * sizePitch, now + 0.45);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(155 * sizePitch, now);
      osc.frequency.exponentialRampToValueAtTime(62 * sizePitch, now + 0.9);
    }
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.05);
  }
  public playBite() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.14);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }
  public playSpecial() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.34);
    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }
  public playThunder() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 1.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.45));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.35);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }
  public playScent() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.35);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  }
  public playRest(entering: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(entering ? 240 : 180, now);
    osc.frequency.exponentialRampToValueAtTime(entering ? 120 : 300, now + 0.25);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}
export const soundEngine = new SoundEngine();
```

### File: `hooks\useDinoControls.ts` | Size: 12211 bytes | Ext: `.ts` | Mod: 2026-11-26 16:30:31
```typescript
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { socket } from '../core/socket';
import { soundEngine } from '../core/sound';
import { useGameStore } from '../store/useGameStore';
import type { AnimState } from '../types/game';
const FORWARD_CHARS = new Set(['w', 'ư', 'ơ']);
const BACKWARD_CHARS = new Set(['s']);
const LEFT_CHARS = new Set(['a', 'â', 'ă']);
const RIGHT_CHARS = new Set(['d', 'đ']);
const BITE_CHARS = new Set([' ', 'f']);
const ROAR_CHARS = new Set(['r']);
const TAIL_CHARS = new Set(['e', 'ê']);
interface UseDinoControlsParams {
  defaultCamDistance: number;
  onTriggerOneShot: (anim: AnimState) => void;
  onTriggerSpecial: () => void;
}
export function useDinoControls({
  defaultCamDistance,
  onTriggerOneShot,
  onTriggerSpecial,
}: UseDinoControlsParams) {
  const { gl } = useThree();
  const setDinoScaleMultiplier = useGameStore((s) => s.setDinoScaleMultiplier);
  const rotateCurrentModel90 = useGameStore((s) => s.rotateCurrentModel90);
  const triggerScent = useGameStore((s) => s.triggerScent);
  const setChatOpen = useGameStore((s) => s.setChatOpen);
  const toggleNightVision = useGameStore((s) => s.toggleNightVision);
  const setShowLeaderboard = useGameStore((s) => s.setShowLeaderboard);
  const toggleMapOpen = useGameStore((s) => s.toggleMapOpen);
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });
  const isRightMouseDown = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const cameraYaw = useRef(0);
  const cameraPitch = useRef(0.26);
  const zoomDistance = useRef(defaultCamDistance);
  useEffect(() => {
    zoomDistance.current = defaultCamDistance;
  }, [defaultCamDistance]);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.tabIndex = 0;
    canvas.style.outline = 'none';
    canvas.focus();
    const resetMovementKeys = () => {
      keys.current.forward = false;
      keys.current.backward = false;
      keys.current.left = false;
      keys.current.right = false;
      keys.current.sprint = false;
    };
    const resetAllKeys = () => {
      resetMovementKeys();
      isRightMouseDown.current = false;
      setShowLeaderboard(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      const store = useGameStore.getState();
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || store.isChatOpen) {
        return;
      }
      const code = e.code || '';
      const key = (e.key || '').toLowerCase();
      const keyCode = e.keyCode || 0;
      if (code === 'Escape') {
        if (store.isMapOpen) {
          store.setMapOpen(false);
          canvas.focus();
        } else if (store.isSettingsOpen) {
          store.setSettingsOpen(false);
          canvas.focus();
        } else if (store.deathInfo) {
          store.dismissDeathOverlay();
        }
        return;
      }
      if ((code === 'KeyM' || key === 'm' || keyCode === 77) && !e.repeat) {
        if (!store.isSettingsOpen) {
          resetMovementKeys();
          toggleMapOpen();
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return;
      }
      if (store.isSettingsOpen || store.isMapOpen) return;
      if (code === 'Tab' || keyCode === 9) {
        e.preventDefault();
        setShowLeaderboard(true);
        return;
      }
      if (e.repeat) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (code === 'Backspace' || keyCode === 8) return;
      if (code === 'Enter' || keyCode === 13) {
        resetMovementKeys();
        setChatOpen(true);
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      let handled = false;
      if (code === 'KeyH' || key === 'h' || keyCode === 72) {
        if (!store.isResting) {
          resetMovementKeys();
          socket.sendToggleRest();
          soundEngine.playRest(true);
        } else if (store.restUnlockLeft <= 0) {
          socket.sendToggleRest();
          soundEngine.playRest(false);
        }
        handled = true;
      }
      if (code === 'KeyN' || key === 'n' || keyCode === 78) {
        toggleNightVision();
        handled = true;
      }
      if (code === 'KeyT' || key === 't' || keyCode === 84) {
        rotateCurrentModel90();
        handled = true;
      }
      if (code === 'BracketLeft' || key === '[') {
        setDinoScaleMultiplier(store.dinoScaleMultiplier - 0.1);
        handled = true;
      }
      if (code === 'BracketRight' || key === ']') {
        setDinoScaleMultiplier(store.dinoScaleMultiplier + 0.1);
        handled = true;
      }
      // ĐANG NGHỈ NGƠI -> KHÓA TOÀN BỘ DI CHUYỂN, TẤN CÔNG & HÀNH ĐỘNG
      if (store.isResting) {
        resetMovementKeys();
        if (handled) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return;
      }
      if (code === 'KeyW' || code === 'ArrowUp' || keyCode === 87 || FORWARD_CHARS.has(key)) {
        keys.current.forward = true;
        handled = true;
      }
      if (code === 'KeyS' || code === 'ArrowDown' || keyCode === 83 || BACKWARD_CHARS.has(key)) {
        keys.current.backward = true;
        handled = true;
      }
      if (code === 'KeyA' || code === 'ArrowLeft' || keyCode === 65 || LEFT_CHARS.has(key)) {
        keys.current.left = true;
        handled = true;
      }
      if (code === 'KeyD' || code === 'ArrowRight' || keyCode === 68 || RIGHT_CHARS.has(key)) {
        keys.current.right = true;
        handled = true;
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight' || e.shiftKey) {
        keys.current.sprint = true;
      }
      if (code === 'Space' || code === 'KeyF' || keyCode === 32 || keyCode === 70 || BITE_CHARS.has(key)) {
        onTriggerOneShot('bite');
        socket.sendAttack('bite');
        soundEngine.playBite();
        handled = true;
      }
      if (code === 'KeyE' || keyCode === 69 || TAIL_CHARS.has(key)) {
        onTriggerOneShot('tail');
        socket.sendAttack('tail');
        soundEngine.playBite();
        handled = true;
      }
      // Phím V: Kỹ năng đặc trưng từng loài (Nghiền xương / Húc văng / Quất gai / Vồ săn mồi)
      if (code === 'KeyV' || key === 'v' || keyCode === 86) {
        if (store.specialCd <= 0) {
          onTriggerSpecial();
        }
        handled = true;
      }
      if (code === 'KeyG' || key === 'g' || keyCode === 71) {
        onTriggerOneShot('bite');
        socket.sendInteract();
        soundEngine.playBite();
        handled = true;
      }
      if (code === 'KeyC' || key === 'c' || keyCode === 67) {
        socket.sendCrouch(!store.isCrouching);
        handled = true;
      }
      if (code === 'KeyQ' || key === 'q' || keyCode === 81) {
        triggerScent();
        soundEngine.playScent();
        handled = true;
      }
      if (code === 'KeyR' || keyCode === 82 || ROAR_CHARS.has(key) || code === 'Digit1') {
        onTriggerOneShot('roar');
        socket.sendRoar(1);
        soundEngine.playRoar(1, store.growth);
        handled = true;
      }
      if (code === 'Digit2') {
        onTriggerOneShot('roar');
        socket.sendRoar(2);
        soundEngine.playRoar(2, store.growth);
        handled = true;
      }
      if (code === 'Digit3') {
        onTriggerOneShot('roar');
        socket.sendRoar(3);
        soundEngine.playRoar(3, store.growth);
        handled = true;
      }
      if (code === 'Digit4') {
        onTriggerOneShot('roar');
        socket.sendRoar(4);
        soundEngine.playRoar(4, store.growth);
        handled = true;
      }
      if (handled) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code || '';
      const keyCode = e.keyCode || 0;
      if (code === 'Tab' || keyCode === 9) {
        setShowLeaderboard(false);
        return;
      }
      if (!code && keyCode !== 87 && keyCode !== 83 && keyCode !== 65 && keyCode !== 68) {
        return;
      }
      if (code === 'KeyW' || code === 'ArrowUp' || keyCode === 87) keys.current.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown' || keyCode === 83) keys.current.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft' || keyCode === 65) keys.current.left = false;
      if (code === 'KeyD' || code === 'ArrowRight' || keyCode === 68) keys.current.right = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight' || !e.shiftKey) {
        keys.current.sprint = false;
      }
    };
    const handleMouseDown = (e: MouseEvent) => {
      const is3DCanvas = e.target === canvas;
      if (!is3DCanvas) return;
      canvas.focus();
      const store = useGameStore.getState();
      if (store.isMapOpen || store.isSettingsOpen) return;
      if (e.button === 2) {
        isRightMouseDown.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      } else if (e.button === 0) {
        if (store.isChatOpen || store.isResting) {
          return;
        }
        onTriggerOneShot('bite');
        socket.sendAttack('bite');
        soundEngine.playBite();
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isRightMouseDown.current) return;
      const dx =
        e.movementX !== undefined && e.movementX !== 0
          ? e.movementX
          : e.clientX - lastMousePos.current.x;
      const dy =
        e.movementY !== undefined && e.movementY !== 0
          ? e.movementY
          : e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      const sensitivity = 0.006;
      cameraYaw.current -= dx * sensitivity;
      cameraPitch.current = Math.max(-1.42, Math.min(1.35, cameraPitch.current + dy * sensitivity));
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        isRightMouseDown.current = false;
      }
    };
    const handleWheel = (e: WheelEvent) => {
      const store = useGameStore.getState();
      if (store.isMapOpen || store.isSettingsOpen) return;
      zoomDistance.current = Math.max(4, Math.min(34, zoomDistance.current + e.deltaY * 0.012));
    };
    const handleContextMenu = (e: MouseEvent) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', resetAllKeys);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', resetAllKeys);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [
    gl,
    onTriggerOneShot,
    onTriggerSpecial,
    setDinoScaleMultiplier,
    rotateCurrentModel90,
    triggerScent,
    setChatOpen,
    toggleNightVision,
    setShowLeaderboard,
    toggleMapOpen,
  ]);
  return {
    keys,
    isRightMouseDown,
    cameraYaw,
    cameraPitch,
    zoomDistance,
  };
}
```

### File: `hooks\useDinoModel.ts` | Size: 6124 bytes | Ext: `.ts` | Mod: 2026-11-26 16:18:57
```typescript
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { computeDinoNormalization, getDinoAction } from '../constants/dinosaurs';
import { setupMeshoptLoader } from '../core/meshopt';
import type { AnimState } from '../types/game';
export function useDinoModel(
  modelPath: string,
  targetSize: number,
  explicitOffset?: number
) {
  const { scene, animations } = useGLTF(modelPath, false, true, setupMeshoptLoader);
  const { clonedScene, cleanedAnimations, initialNorm } = useMemo(() => {
    const cloned = clone(scene);
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = false;
        child.frustumCulled = false;
      }
    });
    const strippedClips = animations.map((clip) => {
      const c = clip.clone();
      c.tracks = c.tracks.map((track) => {
        if (
          track.name.endsWith('.position') &&
          /^(armature|root|hips|pelvis|character)/i.test(track.name)
        ) {
          const vals = track.values;
          if (vals.length >= 6) {
            const startX = vals[0];
            const startZ = vals[2];
            let maxDisp = 0;
            for (let i = 0; i < vals.length; i += 3) {
              const d = Math.hypot(vals[i] - startX, vals[i + 2] - startZ);
              if (d > maxDisp) maxDisp = d;
            }
            if (maxDisp > 0.25) {
              const tClone = track.clone();
              for (let i = 0; i < tClone.values.length; i += 3) {
                tClone.values[i] = startX;
                tClone.values[i + 2] = startZ;
              }
              return tClone;
            }
          }
        }
        return track;
      });
      return c;
    });
    const norm = computeDinoNormalization(cloned, targetSize, explicitOffset);
    return { clonedScene: cloned, cleanedAnimations: strippedClips, initialNorm: norm };
  }, [scene, animations, targetSize, explicitOffset]);
  const { actions } = useAnimations(cleanedAnimations, clonedScene);
  const baseScaleRef = useRef(initialNorm.scale);
  const baseOffsetYRef = useRef(initialNorm.offsetY);
  const autoYawRef = useRef(initialNorm.autoForwardYaw);
  const isQuadrupedRef = useRef(initialNorm.isQuadruped);
  const calibratedFramesRef = useRef(0);
  const activeAnimRef = useRef<AnimState>('idle');
  const activeActionObjRef = useRef<THREE.AnimationAction | null>(null);
  const isOneShotPlayingRef = useRef(false);
  const oneShotTimerRef = useRef<number | null>(null);
  const playAnim = useCallback(
    (nextAnim: AnimState, forceOneShot = false, onOneShotComplete?: () => void) => {
      if (!actions) return;
      if (!forceOneShot && activeAnimRef.current === nextAnim && activeActionObjRef.current) {
        return;
      }
      const nextAction = getDinoAction(actions, nextAnim);
      if (!nextAction) return;
      const prevAction = activeActionObjRef.current;
      if (prevAction && prevAction !== nextAction) {
        prevAction.fadeOut(0.15);
      }
      activeAnimRef.current = nextAnim;
      activeActionObjRef.current = nextAction;
      if (forceOneShot) {
        isOneShotPlayingRef.current = true;
        nextAction.reset();
        nextAction.setLoop(THREE.LoopOnce, 1);
        nextAction.clampWhenFinished = false;
        nextAction.timeScale = 1.0;
        nextAction.fadeIn(0.1).play();
        if (oneShotTimerRef.current) {
          window.clearTimeout(oneShotTimerRef.current);
        }
        const clipDuration = nextAction.getClip()?.duration || 1.0;
        oneShotTimerRef.current = window.setTimeout(() => {
          isOneShotPlayingRef.current = false;
          if (onOneShotComplete) {
            onOneShotComplete();
          } else {
            playAnim('idle', false);
          }
        }, Math.max(350, clipDuration * 850));
      } else {
        nextAction.reset();
        nextAction.setLoop(THREE.LoopRepeat, Infinity);
        nextAction.clampWhenFinished = false;
        nextAction.timeScale = 1.0;
        nextAction.fadeIn(0.15).play();
      }
    },
    [actions]
  );
  useEffect(() => {
    baseScaleRef.current = initialNorm.scale;
    baseOffsetYRef.current = initialNorm.offsetY;
    autoYawRef.current = initialNorm.autoForwardYaw;
    isQuadrupedRef.current = initialNorm.isQuadruped;
    calibratedFramesRef.current = 0;
    playAnim('idle', false);
    return () => {
      if (oneShotTimerRef.current) {
        window.clearTimeout(oneShotTimerRef.current);
      }
    };
  }, [initialNorm, playAnim]);
  const calibrateAfterRender = useCallback(
    (rootGroup: THREE.Group, holderGroup: THREE.Group) => {
      if (calibratedFramesRef.current >= 3) return;
      calibratedFramesRef.current++;
      if (calibratedFramesRef.current === 3) {
        const savedPos = rootGroup.position.clone();
        const savedRot = rootGroup.rotation.y;
        rootGroup.position.set(0, 0, 0);
        rootGroup.rotation.set(0, 0, 0);
        holderGroup.scale.setScalar(1);
        holderGroup.position.set(0, 0, 0);
        holderGroup.rotation.set(0, 0, 0);
        const postAnimNorm = computeDinoNormalization(clonedScene, targetSize, explicitOffset);
        baseScaleRef.current = postAnimNorm.scale;
        baseOffsetYRef.current = postAnimNorm.offsetY;
        autoYawRef.current = postAnimNorm.autoForwardYaw;
        isQuadrupedRef.current = postAnimNorm.isQuadruped;
        rootGroup.position.copy(savedPos);
        rootGroup.rotation.y = savedRot;
      }
    },
    [clonedScene, targetSize, explicitOffset]
  );
  return {
    clonedScene,
    initialNorm,
    baseScaleRef,
    baseOffsetYRef,
    autoYawRef,
    isQuadrupedRef,
    activeAnimRef,
    activeActionObjRef,
    isOneShotPlayingRef,
    playAnim,
    calibrateAfterRender,
  };
}
```

### File: `index.css` | Size: 399 bytes | Ext: `.css` | Mod: 2026-11-26 01:06:57
```css
* {
  box-sizing: border-box;
}
html,
body,
#root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #030712;
  user-select: none;
  -webkit-user-select: none;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
canvas {
  display: block;
}
```

### File: `main.tsx` | Size: 230 bytes | Ext: `.tsx` | Mod: 2026-11-15 23:24:36
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### File: `store\useGameStore.ts` | Size: 13047 bytes | Ext: `.ts` | Mod: 2026-11-26 16:18:10
```typescript
import { create } from 'zustand';
import type {
  BloodTrail,
  ChatMessage,
  CombatEvent,
  DinoModelType,
  FoodItem,
  GraphicsQuality,
  PlayerData,
  WeatherType,
} from '../types/game';
export const playersMutable: Record<string, PlayerData> = {};
export const foodsMutable: Record<string, FoodItem> = {};
export const bloodTrailsMutable: BloodTrail[] = [];
export const localTransformMutable = { x: 0, y: 0, z: 0, rot: 0 };
export const worldTimeMutable = { value: 0.36 };
export const combatEventsQueue: Array<CombatEvent & { createdAt: number }> = [];
const ROTATION_STORAGE_KEY = 'dino_isle_model_rotations_v1';
function loadSavedRotations(): Record<string, number> {
  try {
    const raw = localStorage.getItem(ROTATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
export interface DeathInfo {
  killedBy: string;
  diedAt: number;
}
export interface MapWaypoint {
  x: number;
  z: number;
}
interface GameStore {
  myId: string | null;
  myName: string;
  selectedModel: DinoModelType;
  dinoScaleMultiplier: number;
  modelRotationOffsets: Record<string, number>;
  isJoined: boolean;
  isConnected: boolean;
  playerIds: string[];
  foodIds: string[];
  bloodTrailsVersion: number;
  weather: WeatherType;
  stamina: number;
  health: number;
  maxHealth: number;
  hunger: number;
  thirst: number;
  growth: number;
  bleed: number;
  boneBreak: number;
  specialCd: number;
  kills: number;
  isResting: boolean;
  restUnlockLeft: number;
  combatTimerLeft: number;
  regenRate: number;
  isCrouching: boolean;
  packId: string;
  packInviteFrom: string;
  packInviteName: string;
  respawnSeq: number;
  deathInfo: DeathInfo | null;
  lastDamagedAt: number;
  scentUntil: number;
  actionHint: string | null;
  // HUD, World Map & The Isle extras
  isSettingsOpen: boolean;
  isMapOpen: boolean;
  mapWaypoint: MapWaypoint | null;
  isChatVisible: boolean;
  isChatOpen: boolean;
  showHelp: boolean;
  showLeaderboard: boolean;
  nightVision: boolean;
  brightness: number;
  graphicsQuality: GraphicsQuality;
  soundEnabled: boolean;
  chatMessages: ChatMessage[];
  setMyId: (id: string) => void;
  setMyName: (name: string) => void;
  setSelectedModel: (model: DinoModelType) => void;
  setDinoScaleMultiplier: (val: number) => void;
  rotateCurrentModel90: () => void;
  setJoined: (joined: boolean) => void;
  setConnected: (connected: boolean) => void;
  setStamina: (val: number) => void;
  setActionHint: (hint: string | null) => void;
  setSettingsOpen: (open: boolean) => void;
  setMapOpen: (open: boolean) => void;
  toggleMapOpen: () => void;
  setMapWaypoint: (wp: MapWaypoint | null) => void;
  toggleChatVisible: () => void;
  setChatOpen: (open: boolean) => void;
  toggleHelp: () => void;
  setShowLeaderboard: (open: boolean) => void;
  toggleNightVision: () => void;
  dismissDeathOverlay: () => void;
  setBrightness: (val: number) => void;
  setGraphicsQuality: (q: GraphicsQuality) => void;
  setSoundEnabled: (enabled: boolean) => void;
  triggerScent: () => void;
  syncFromServer: (payload: {
    players?: Record<string, PlayerData>;
    foods?: Record<string, FoodItem>;
    bloodTrails?: BloodTrail[];
    events?: CombatEvent[];
    chats?: ChatMessage[];
    worldTime?: number;
    weather?: WeatherType;
  }) => void;
}
export const useGameStore = create<GameStore>((set, get) => ({
  myId: null,
  myName: 'Dino Hunter',
  selectedModel: 'trex',
  dinoScaleMultiplier: 1.0,
  modelRotationOffsets: loadSavedRotations(),
  isJoined: false,
  isConnected: false,
  playerIds: [],
  foodIds: [],
  bloodTrailsVersion: 0,
  weather: 'clear',
  stamina: 100,
  health: 100,
  maxHealth: 100,
  hunger: 90,
  thirst: 90,
  growth: 0.45,
  bleed: 0,
  boneBreak: 0,
  specialCd: 0,
  kills: 0,
  isResting: false,
  restUnlockLeft: 0,
  combatTimerLeft: 0,
  regenRate: 0,
  isCrouching: false,
  packId: '',
  packInviteFrom: '',
  packInviteName: '',
  respawnSeq: 0,
  deathInfo: null,
  lastDamagedAt: 0,
  scentUntil: 0,
  actionHint: null,
  isSettingsOpen: false,
  isMapOpen: false,
  mapWaypoint: null,
  isChatVisible: true,
  isChatOpen: false,
  showHelp: false,
  showLeaderboard: false,
  nightVision: false,
  brightness: 1.38,
  graphicsQuality: 'medium',
  soundEnabled: true,
  chatMessages: [],
  setMyId: (id) => set({ myId: id }),
  setMyName: (name) => set({ myName: name }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setDinoScaleMultiplier: (val) =>
    set({ dinoScaleMultiplier: Math.round(Math.max(0.3, Math.min(2.5, val)) * 10) / 10 }),
  rotateCurrentModel90: () => {
    const modelId = get().selectedModel.toLowerCase();
    const current = get().modelRotationOffsets[modelId] || 0;
    const next = (current + Math.PI / 2) % (Math.PI * 2);
    const updated = { ...get().modelRotationOffsets, [modelId]: next };
    try {
      localStorage.setItem(ROTATION_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
    set({ modelRotationOffsets: updated });
  },
  setJoined: (joined) =>
    set(
      joined
        ? { isJoined: true, deathInfo: null }
        : {
            isJoined: false,
            isResting: false,
            restUnlockLeft: 0,
            combatTimerLeft: 0,
            regenRate: 0,
            isCrouching: false,
            boneBreak: 0,
            specialCd: 0,
            packId: '',
            packInviteFrom: '',
            packInviteName: '',
            deathInfo: null,
            showLeaderboard: false,
            isMapOpen: false,
            mapWaypoint: null,
          }
    ),
  setConnected: (connected) => set({ isConnected: connected }),
  setStamina: (val) => {
    const rounded = Math.round(val);
    if (Math.round(get().stamina) !== rounded) {
      set({ stamina: rounded });
    }
  },
  setActionHint: (hint) => {
    if (get().actionHint !== hint) set({ actionHint: hint });
  },
  setSettingsOpen: (open) =>
    set({ isSettingsOpen: open, isMapOpen: open ? false : get().isMapOpen }),
  setMapOpen: (open) =>
    set({ isMapOpen: open, isSettingsOpen: open ? false : get().isSettingsOpen }),
  toggleMapOpen: () =>
    set((s) => ({
      isMapOpen: !s.isMapOpen,
      isSettingsOpen: !s.isMapOpen ? false : s.isSettingsOpen,
    })),
  setMapWaypoint: (wp) => set({ mapWaypoint: wp }),
  toggleChatVisible: () =>
    set((s) => ({
      isChatVisible: !s.isChatVisible,
      isChatOpen: s.isChatVisible ? false : s.isChatOpen,
    })),
  setChatOpen: (open) =>
    set((s) => ({
      isChatOpen: open,
      isChatVisible: open ? true : s.isChatVisible,
    })),
  toggleHelp: () => set((s) => ({ showHelp: !s.showHelp })),
  setShowLeaderboard: (open) => {
    if (get().showLeaderboard !== open) set({ showLeaderboard: open });
  },
  toggleNightVision: () => set((s) => ({ nightVision: !s.nightVision })),
  dismissDeathOverlay: () => set({ deathInfo: null }),
  setBrightness: (val) => set({ brightness: Math.max(0.8, Math.min(2.2, val)) }),
  setGraphicsQuality: (q) => set({ graphicsQuality: q }),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  triggerScent: () => set({ scentUntil: performance.now() + 6500 }),
  syncFromServer: ({ players, foods, bloodTrails, events, chats, worldTime, weather }) => {
    if (typeof worldTime === 'number') {
      worldTimeMutable.value = worldTime;
    }
    const state = get();
    const patch: Partial<GameStore> = {};
    if (weather && weather !== state.weather) {
      patch.weather = weather;
    }
    if (players) {
      const incomingIds = Object.keys(players);
      for (const key of Object.keys(playersMutable)) {
        if (!(key in players)) delete playersMutable[key];
      }
      for (const id of incomingIds) {
        playersMutable[id] = players[id];
      }
      const myId = state.myId;
      if (myId && players[myId]) {
        const me = players[myId];
        const nextHp = typeof me.hp === 'number' ? me.hp : state.health;
        const nextMaxHp = typeof me.maxHp === 'number' ? me.maxHp : state.maxHealth;
        const nextHunger = typeof me.hunger === 'number' ? Math.round(me.hunger) : state.hunger;
        const nextThirst = typeof me.thirst === 'number' ? Math.round(me.thirst) : state.thirst;
        const nextGrowth =
          typeof me.growth === 'number' ? Math.round(me.growth * 100) / 100 : state.growth;
        const nextBleed = typeof me.bleed === 'number' ? Math.ceil(me.bleed) : state.bleed;
        const nextBoneBreak =
          typeof me.boneBreak === 'number' ? Math.ceil(me.boneBreak) : state.boneBreak;
        const nextSpecialCd =
          typeof me.specialCd === 'number' ? Math.max(0, Math.round(me.specialCd * 10) / 10) : 0;
        const nextKills = typeof me.kills === 'number' ? me.kills : state.kills;
        const nextResting = Boolean(me.isResting);
        const nextRestUnlock =
          typeof me.restUnlockLeft === 'number'
            ? Math.max(0, Math.round(me.restUnlockLeft * 10) / 10)
            : 0;
        const nextCombatTimer =
          typeof me.combatTimerLeft === 'number' ? Math.max(0, Math.ceil(me.combatTimerLeft)) : 0;
        const nextRegenRate = typeof me.regenRate === 'number' ? me.regenRate : 0;
        const nextCrouching = Boolean(me.isCrouching);
        const nextPackId = me.packId || '';
        const nextInviteFrom = me.packInviteFrom || '';
        const nextInviteName = me.packInviteName || '';
        const nextRespawnSeq = typeof me.respawnSeq === 'number' ? me.respawnSeq : state.respawnSeq;
        if (nextHp !== state.health) patch.health = nextHp;
        if (nextMaxHp !== state.maxHealth) patch.maxHealth = nextMaxHp;
        if (nextHunger !== state.hunger) patch.hunger = nextHunger;
        if (nextThirst !== state.thirst) patch.thirst = nextThirst;
        if (nextGrowth !== state.growth) patch.growth = nextGrowth;
        if (nextBleed !== state.bleed) patch.bleed = nextBleed;
        if (nextBoneBreak !== state.boneBreak) patch.boneBreak = nextBoneBreak;
        if (nextSpecialCd !== state.specialCd) patch.specialCd = nextSpecialCd;
        if (nextKills !== state.kills) patch.kills = nextKills;
        if (nextResting !== state.isResting) patch.isResting = nextResting;
        if (nextRestUnlock !== state.restUnlockLeft) patch.restUnlockLeft = nextRestUnlock;
        if (nextCombatTimer !== state.combatTimerLeft) patch.combatTimerLeft = nextCombatTimer;
        if (nextRegenRate !== state.regenRate) patch.regenRate = nextRegenRate;
        if (nextCrouching !== state.isCrouching) patch.isCrouching = nextCrouching;
        if (nextPackId !== state.packId) patch.packId = nextPackId;
        if (nextInviteFrom !== state.packInviteFrom) patch.packInviteFrom = nextInviteFrom;
        if (nextInviteName !== state.packInviteName) patch.packInviteName = nextInviteName;
        if (nextRespawnSeq > state.respawnSeq) {
          patch.respawnSeq = nextRespawnSeq;
          patch.deathInfo = {
            killedBy: me.lastKilledBy || 'Thiên nhiên khắc nghiệt',
            diedAt: performance.now(),
          };
        }
      }
      let idsChanged = state.playerIds.length !== incomingIds.length;
      if (!idsChanged) {
        for (let i = 0; i < incomingIds.length; i++) {
          if (state.playerIds[i] !== incomingIds[i]) {
            idsChanged = true;
            break;
          }
        }
      }
      if (idsChanged) patch.playerIds = incomingIds;
    }
    if (foods) {
      const incomingFoodIds = Object.keys(foods);
      for (const key of Object.keys(foodsMutable)) {
        if (!(key in foods)) delete foodsMutable[key];
      }
      for (const id of incomingFoodIds) {
        foodsMutable[id] = foods[id];
      }
      let foodChanged = state.foodIds.length !== incomingFoodIds.length;
      if (!foodChanged) {
        for (let i = 0; i < incomingFoodIds.length; i++) {
          if (state.foodIds[i] !== incomingFoodIds[i]) {
            foodChanged = true;
            break;
          }
        }
      }
      if (foodChanged) patch.foodIds = incomingFoodIds;
    }
    if (bloodTrails) {
      bloodTrailsMutable.length = 0;
      for (let i = 0; i < bloodTrails.length; i++) {
        bloodTrailsMutable.push(bloodTrails[i]);
      }
      patch.bloodTrailsVersion = state.bloodTrailsVersion + 1;
    }
    if (events && events.length > 0) {
      const now = performance.now();
      for (const evt of events) {
        combatEventsQueue.push({ ...evt, createdAt: now });
        if (
          state.myId &&
          evt.targetId === state.myId &&
          evt.attackType !== 'heal' &&
          evt.attackType !== 'roar'
        ) {
          patch.lastDamagedAt = now;
        }
      }
      if (combatEventsQueue.length > 45) {
        combatEventsQueue.splice(0, combatEventsQueue.length - 45);
      }
    }
    if (chats && chats.length > 0) {
      patch.chatMessages = [...state.chatMessages, ...chats].slice(-30);
    }
    if (Object.keys(patch).length > 0) {
      set(patch);
    }
  },
}));
```

### File: `types\game.ts` | Size: 1529 bytes | Ext: `.ts` | Mod: 2026-11-26 16:17:22
```typescript
export type DinoModelType = string;
export type DietType = 'carnivore' | 'herbivore';
export type AnimState = 'idle' | 'walk' | 'run' | 'bite' | 'roar' | 'tail' | 'rest';
export type GraphicsQuality = 'low' | 'medium' | 'high';
export type WeatherType = 'clear' | 'fog' | 'rain' | 'storm';
export interface PlayerData {
  id: string;
  name: string;
  model?: DinoModelType;
  diet?: DietType;
  x: number;
  y?: number;
  z: number;
  rot: number;
  anim: string;
  hp?: number;
  maxHp?: number;
  hunger?: number;
  thirst?: number;
  growth?: number;
  bleed?: number;
  boneBreak?: number;
  specialCd?: number;
  kills?: number;
  isResting?: boolean;
  restUnlockLeft?: number;
  combatTimerLeft?: number;
  regenRate?: number;
  isCrouching?: boolean;
  packId?: string;
  packInviteFrom?: string;
  packInviteName?: string;
  respawnSeq?: number;
  lastKilledBy?: string;
  isAi?: boolean;
  aiState?: string;
}
export interface FoodItem {
  id: string;
  type: 'meat' | 'plant';
  x: number;
  z: number;
  amount: number;
  maxAmount: number;
}
export interface BloodTrail {
  id: string;
  x: number;
  z: number;
}
export interface CombatEvent {
  id: string;
  attackerId: string;
  targetId: string;
  damage: number;
  targetHp: number;
  isKill: boolean;
  attackType: string;
  x: number;
  y: number;
  z: number;
}
export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  ts: number;
  isSystem?: boolean;
}
```

