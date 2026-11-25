import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { localTransformMutable, useGameStore, worldTimeMutable } from '../../../store/useGameStore';

export const Lighting: React.FC = () => {
  const { gl, scene } = useThree();
  const brightness = useGameStore((s) => s.brightness);

  const skyRef = useRef<React.ComponentRef<typeof Sky>>(null);
  const bgRef = useRef<THREE.Color>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const starsGroupRef = useRef<THREE.Group>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const moonFillRef = useRef<THREE.DirectionalLight>(null);
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
  const duskBg = useRef(new THREE.Color('#df916d'));
  const nightBg = useRef(new THREE.Color('#1d335c'));

  const dayFog = useRef(new THREE.Color('#a8def5'));
  const duskFog = useRef(new THREE.Color('#e09a76'));
  const nightFog = useRef(new THREE.Color('#274372'));

  const dayHemiSky = useRef(new THREE.Color('#f0f9ff'));
  const nightHemiSky = useRef(new THREE.Color('#bfdbfe'));
  const dayHemiGround = useRef(new THREE.Color('#4a7c44'));
  const nightHemiGround = useRef(new THREE.Color('#355375'));

  const tempColor = useRef(new THREE.Color());
  const tempBgColor = useRef(new THREE.Color());

  useFrame(() => {
    gl.toneMappingExposure = brightness;

    const px = localTransformMutable.x;
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

    const dayFactor = THREE.MathUtils.clamp((sunHeight + 0.12) / 0.5, 0, 1);
    const nightFactor = 1 - dayFactor;
    const twilightFactor = 1 - Math.min(1, Math.abs(sunHeight) / 0.3);

    if (skyRef.current) {
      skyRef.current.visible = dayFactor > 0.05;
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
        Math.max(45, moonY * 3.8),
        pz + moonZ * 3.8
      );
    }

    if (starsGroupRef.current) {
      starsGroupRef.current.visible = nightFactor > 0.35;
      starsGroupRef.current.position.set(px, 0, pz);
    }

    tempBgColor.current.copy(nightBg.current).lerp(dayBg.current, dayFactor);
    if (twilightFactor > 0.08) {
      tempBgColor.current.lerp(duskBg.current, twilightFactor * 0.48);
    }
    if (bgRef.current) {
      bgRef.current.copy(tempBgColor.current);
    }

    if (fogRef.current) {
      tempColor.current.copy(nightFog.current).lerp(dayFog.current, dayFactor);
      if (twilightFactor > 0.08) {
        tempColor.current.lerp(duskFog.current, twilightFactor * 0.42);
      }
      fogRef.current.color.copy(tempColor.current);
      fogRef.current.near = 95 + dayFactor * 45;
      fogRef.current.far = 360 + dayFactor * 160;
    }

    // Shadow camera bám theo vị trí người chơi
    lightTarget.position.set(px, localTransformMutable.y, pz);
    lightTarget.updateMatrixWorld();

    if (dirLightRef.current) {
      dirLightRef.current.target = lightTarget;
      if (dayFactor >= 0.25) {
        dirLightRef.current.position.set(
          px + sunX * 0.55,
          Math.max(28, sunY * 0.7),
          pz + sunZ * 0.55
        );
        dirLightRef.current.intensity = 1.35 + dayFactor * 1.15;
        dirLightRef.current.color.set('#fffbeb');
      } else {
        // Ánh trăng bạc xanh chiếu rõ địa hình ban đêm
        dirLightRef.current.position.set(
          px + moonX * 0.55,
          Math.max(45, Math.abs(moonY) * 0.75),
          pz + moonZ * 0.55
        );
        dirLightRef.current.intensity = 1.35 + nightFactor * 0.35;
        dirLightRef.current.color.set('#dbeafe');
      }
    }

    if (moonFillRef.current) {
      moonFillRef.current.intensity = 0.2 + nightFactor * 0.65;
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = 0.72 + dayFactor * 0.28;
    }

    if (hemiRef.current) {
      hemiRef.current.intensity = 0.85 + dayFactor * 0.3;
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

      {/* Mặt Trăng 3D sáng rực + Quầng sáng */}
      <group ref={moonGroupRef} position={[-300, 260, -180]}>
        <mesh>
          <sphereGeometry args={[28, 24, 24]} />
          <meshBasicMaterial color="#f8fbff" fog={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[48, 20, 20]} />
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

      <fog ref={fogRef} attach="fog" args={['#a8def5', 130, 500]} />

      <ambientLight ref={ambientRef} intensity={0.9} color="#f8fafc" />
      <hemisphereLight ref={hemiRef} args={['#f0f9ff', '#4a7c44', 1.05]} />

      <directionalLight
        ref={dirLightRef}
        position={[70, 85, 45]}
        intensity={2.3}
        color="#fffbeb"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={240}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-bias={-0.0005}
      />

      {/* Đèn bù ánh trăng phản chiếu toàn cảnh ban đêm */}
      <directionalLight
        ref={moonFillRef}
        position={[-60, 75, 60]}
        intensity={0.3}
        color="#bae6fd"
      />
    </>
  );
};