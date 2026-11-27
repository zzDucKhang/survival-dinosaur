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