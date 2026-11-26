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