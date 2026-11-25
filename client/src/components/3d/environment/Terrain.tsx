import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  getTerrainHeight,
  HIGHLAND_LAKE_RADIUS,
  HIGHLAND_LAKE_X,
  HIGHLAND_LAKE_Z,
  OASIS_RADIUS,
  OASIS_X,
  OASIS_Z,
  WATER_LEVEL,
} from '../../../constants/terrain';

export const Terrain: React.FC = React.memo(() => {
  const terrainGeometry = useMemo(() => {
    const size = 1200;
    const segments = 128;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);

      if (y < -0.5) {
        color.set('#5a4f3a'); // Đáy hồ
      } else if (y < 0.4) {
        color.set('#9e8b63'); // Bờ cát
      } else if (y < 7.5) {
        color.set('#3d6b3c'); // Đồng cỏ thung lũng
      } else if (y < 16.5) {
        color.set('#355c37'); // Đồi rừng
      } else if (y < 28.0) {
        color.set('#5c636e'); // Sườn núi đá
      } else {
        color.set('#8f99a6'); // Đỉnh núi cao
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      <mesh geometry={terrainGeometry} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.92} metalness={0.03} />
      </mesh>

      {/* Hồ Oasis (60, -60) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[OASIS_X, WATER_LEVEL, OASIS_Z]}>
        <circleGeometry args={[OASIS_RADIUS + 5, 36]} />
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#0369a1"
          emissiveIntensity={0.32}
          roughness={0.14}
          metalness={0.55}
          transparent
          opacity={0.86}
        />
      </mesh>

      {/* Hồ Cao Nguyên (-160, 140) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[HIGHLAND_LAKE_X, WATER_LEVEL, HIGHLAND_LAKE_Z]}>
        <circleGeometry args={[HIGHLAND_LAKE_RADIUS + 6, 36]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#075985"
          emissiveIntensity={0.32}
          roughness={0.14}
          metalness={0.55}
          transparent
          opacity={0.86}
        />
      </mesh>
    </group>
  );
});