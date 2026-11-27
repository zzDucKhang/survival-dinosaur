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