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