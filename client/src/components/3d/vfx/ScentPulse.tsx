import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { foodsMutable, localTransformMutable, useGameStore } from '../../../store/useGameStore';
import {
  getTerrainHeight,
  HIGHLAND_LAKE_X,
  HIGHLAND_LAKE_Z,
  OASIS_X,
  OASIS_Z,
} from '../../../constants/terrain';

export const ScentPulse: React.FC = () => {
  const scentUntil = useGameStore((s) => s.scentUntil);
  const foodIds = useGameStore((s) => s.foodIds);
  const ringRef = useRef<THREE.Mesh>(null);
  const beaconsRef = useRef<THREE.Group>(null);

  useFrame(() => {
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
  });

  return (
    <group>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.92, 1.0, 36]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

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
          const y = getTerrainHeight(f.x, f.z);
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