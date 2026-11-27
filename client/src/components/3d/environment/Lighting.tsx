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