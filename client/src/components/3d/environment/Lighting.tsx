import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { localTransformMutable, useGameStore, worldTimeMutable } from '../../../store/useGameStore';
import { getDinoSpec } from '../../../constants/dinosaurs';

// =========================================================================
// BẢNG TINH CHỈNH ÁNH SÁNG NGÀY / ĐÊM / ÁNH TRĂNG / NHÌN ĐÊM (CHỈNH TẠI ĐÂY)
// =========================================================================
const LIGHTING_CONFIG = {
  // Ban đêm & Ánh trăng (Moonlight mạnh hơn Ambient để thấy rõ ánh trăng và bóng đổ)
  nightExposure: 0.86,      // Độ phơi sáng ban đêm (0.7 = rất tối, 1.0 = sáng)
  nightMoonIntensity: 0.15, // Cường độ đèn Mặt Trăng tạo ánh sáng bạc & bóng đổ rõ
  nightAmbient: 0.09,       // Độ sáng nền vùng tối (giữ thấp để bóng đổ đậm rõ)
  nightHemi: 0.24,          // Ánh sáng bầu trời/mặt đất ban đêm
  nightFill: 0.1,           // Đèn bù ngược hướng rất nhẹ để không xóa mất bóng
  nightFogNear: 42,         // Bắt đầu mờ sương ban đêm (mét)
  nightFogFar: 180,         // Hết tầm nhìn ban đêm khi tắt nhìn đêm (mét)

  // Ban ngày
  daySunIntensity: 2.35,
  dayAmbient: 0.85,
  dayHemi: 1.0,
  dayFogNear: 135,
  dayFogFar: 520,

  // Tầm nhìn ban đêm (Night Vision - Phím N)
  nvRadiusCarnivore: 55,    // Bán kính nhìn rõ cho loài ăn thịt (mét)
  nvRadiusHerbivore: 42,    // Bán kính nhìn rõ cho loài ăn cỏ (mét)
  nvLightIntensity: 3.8,    // Độ sáng đèn nhìn đêm trong bán kính
  nvAmbientBonus: 0.16,     // Tăng nhẹ sáng nền khi bật NV
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

  const lightTarget = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    scene.add(lightTarget);
    return () => {
      scene.remove(lightTarget);
    };
  }, [scene, lightTarget]);

  const dayBg = useRef(new THREE.Color('#8fd3f4'));
  const duskBg = useRef(new THREE.Color('#cf815e'));
  const nightBg = useRef(new THREE.Color('#091326'));
  const nvDarkBg = useRef(new THREE.Color('#040d0a'));

  const dayFog = useRef(new THREE.Color('#a8def5'));
  const duskFog = useRef(new THREE.Color('#cc8463'));
  const nightFog = useRef(new THREE.Color('#0b172c'));
  const nvDarkFog = useRef(new THREE.Color('#040f0b'));

  const dayHemiSky = useRef(new THREE.Color('#f0f9ff'));
  const nightHemiSky = useRef(new THREE.Color('#4b6b9c'));
  const dayHemiGround = useRef(new THREE.Color('#4a7c44'));
  const nightHemiGround = useRef(new THREE.Color('#0d1624'));

  const tempColor = useRef(new THREE.Color());
  const tempBgColor = useRef(new THREE.Color());

  useFrame(() => {
    const nightVision = useGameStore.getState().nightVision;
    const px = localTransformMutable.x;
    const py = localTransformMutable.y;
    const pz = localTransformMutable.z;

    // 0.0=00h, 0.25=06h, 0.50=12h, 0.75=18h
    const t = worldTimeMutable.value;
    const sunAngle = (t - 0.25) * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle) * 140;
    const sunY = sunHeight * 140;
    const sunZ = 60;

    // Mặt Trăng mọc đối diện Mặt Trời
    const moonX = -sunX;
    const moonY = -sunY;
    const moonZ = -55;

    const dayFactor = THREE.MathUtils.clamp((sunHeight + 0.1) / 0.48, 0, 1);
    const nightFactor = 1 - dayFactor;
    const twilightFactor = 1 - Math.min(1, Math.abs(sunHeight) / 0.28);
    const nvStrength = nightVision ? THREE.MathUtils.clamp((nightFactor - 0.12) / 0.45, 0, 1) : 0;

    const exposureMult =
      THREE.MathUtils.lerp(LIGHTING_CONFIG.nightExposure, 1.0, dayFactor) + nvStrength * 0.14;
    gl.toneMappingExposure = brightness * exposureMult;

    if (skyRef.current) {
      skyRef.current.visible = dayFactor > 0.04;
      skyRef.current.position.set(px, 0, pz);
      const mat = skyRef.current.material as THREE.ShaderMaterial;
      if (mat?.uniforms?.sunPosition?.value) {
        mat.uniforms.sunPosition.value.set(sunX, Math.max(-6, sunY), sunZ);
      }
    }

    if (moonGroupRef.current) {
      moonGroupRef.current.visible = moonY > -20;
      moonGroupRef.current.position.set(
        px + moonX * 3.8,
        Math.max(48, moonY * 3.8),
        pz + moonZ * 3.8
      );
    }

    if (starsGroupRef.current) {
      starsGroupRef.current.visible = nightFactor > 0.35;
      starsGroupRef.current.position.set(px, 0, pz);
    }

    tempBgColor.current.copy(nightBg.current).lerp(dayBg.current, dayFactor);
    if (twilightFactor > 0.08) {
      tempBgColor.current.lerp(duskBg.current, twilightFactor * 0.45);
    }
    if (nvStrength > 0.01) {
      tempBgColor.current.lerp(nvDarkBg.current, nvStrength * 0.85);
    }
    if (bgRef.current) {
      bgRef.current.copy(tempBgColor.current);
    }

    if (fogRef.current) {
      tempColor.current.copy(nightFog.current).lerp(dayFog.current, dayFactor);
      if (twilightFactor > 0.08) {
        tempColor.current.lerp(duskFog.current, twilightFactor * 0.4);
      }
      if (nvStrength > 0.01) {
        tempColor.current.lerp(nvDarkFog.current, nvStrength * 0.9);
      }
      fogRef.current.color.copy(tempColor.current);

      const normalNear = THREE.MathUtils.lerp(
        LIGHTING_CONFIG.nightFogNear,
        LIGHTING_CONFIG.dayFogNear,
        dayFactor
      );
      const normalFar = THREE.MathUtils.lerp(
        LIGHTING_CONFIG.nightFogFar,
        LIGHTING_CONFIG.dayFogFar,
        dayFactor
      );

      // Khi bật Night Vision: chỉ thấy rõ đúng trong bán kính nvRadius, ngoài bán kính mờ dần vào bóng tối
      const nvNear = nvRadius * 0.45;
      const nvFar = nvRadius * 1.15;

      fogRef.current.near = THREE.MathUtils.lerp(normalNear, nvNear, nvStrength);
      fogRef.current.far = THREE.MathUtils.lerp(normalFar, nvFar, nvStrength);
    }

    // Shadow camera bám sát nhân vật để bóng đổ ánh trăng & mặt trời luôn sắc nét
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
          0.9 + dayFactor * (LIGHTING_CONFIG.daySunIntensity - 0.9);
        dirLightRef.current.color.set('#fffbeb');
      } else {
        // Ánh trăng bạc chiếu góc xiên rõ ràng -> hiện rõ vệt sáng trăng & bóng khủng long/cây/đá
        dirLightRef.current.position.set(
          px + moonX * 0.48,
          py + Math.max(42, Math.abs(moonY) * 0.65),
          pz + moonZ * 0.48
        );
        dirLightRef.current.intensity =
          LIGHTING_CONFIG.nightMoonIntensity * (0.75 + nightFactor * 0.25) * (1 - nvStrength * 0.35);
        dirLightRef.current.color.set('#b8d4ff');
      }
    }

    if (moonFillRef.current) {
      moonFillRef.current.intensity =
        LIGHTING_CONFIG.nightFill * nightFactor * (1 - nvStrength * 0.5);
    }

    // Đèn Night Vision chỉ chiếu rõ trong đúng bán kính nvRadius quanh khủng long
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
        THREE.MathUtils.lerp(LIGHTING_CONFIG.nightAmbient, LIGHTING_CONFIG.dayAmbient, dayFactor) +
        LIGHTING_CONFIG.nvAmbientBonus * nvStrength;
      ambientRef.current.color.set(nvStrength > 0.25 ? '#a7f3d0' : '#dbeafe');
    }

    if (hemiRef.current) {
      hemiRef.current.intensity =
        THREE.MathUtils.lerp(LIGHTING_CONFIG.nightHemi, LIGHTING_CONFIG.dayHemi, dayFactor) +
        0.12 * nvStrength;
      hemiRef.current.color.copy(nightHemiSky.current).lerp(dayHemiSky.current, dayFactor);
      hemiRef.current.groundColor
        .copy(nightHemiGround.current)
        .lerp(dayHemiGround.current, dayFactor);
    }
  });

  return (
    <>
      <color ref={bgRef} attach="background" args={['#8fd3f4']} />
      <Sky
        ref={skyRef}
        distance={1800}
        sunPosition={[100, 60, 50]}
        rayleigh={0.55}
        turbidity={4.5}
      />

      {/* Mặt Trăng sáng bạc có quầng sáng rõ trên bầu trời đêm */}
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

      <fog ref={fogRef} attach="fog" args={['#a8def5', 135, 520]} />
      <ambientLight ref={ambientRef} intensity={0.85} color="#dbeafe" />
      <hemisphereLight ref={hemiRef} args={['#f0f9ff', '#4a7c44', 1.0]} />

      {/* Đèn chính chiếu Mặt Trời ban ngày & Mặt Trăng ban đêm (tạo bóng đổ sắc nét) */}
      <directionalLight
        ref={dirLightRef}
        position={[70, 85, 45]}
        intensity={2.35}
        color="#fffbeb"
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

      {/* Đèn bù ánh trăng rất nhẹ để bóng đổ vẫn nổi bật */}
      <directionalLight
        ref={moonFillRef}
        position={[-60, 75, 60]}
        intensity={0.1}
        color="#93c5fd"
      />

      {/* Đèn Night Vision giới hạn đúng bán kính quanh khủng long */}
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