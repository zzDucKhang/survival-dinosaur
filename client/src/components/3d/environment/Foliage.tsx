import React, { useMemo } from 'react';
import { Instances, Instance } from '@react-three/drei';
import { getTerrainHeight, isNearWater, WORLD_ROCKS } from '../../../constants/terrain';
import { useGameStore } from '../../../store/useGameStore';

export const Foliage: React.FC = React.memo(() => {
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);

  const { trees, grassTufts } = useMemo(() => {
    const treeCount = graphicsQuality === 'low' ? 120 : graphicsQuality === 'high' ? 320 : 220;
    const grassCount = graphicsQuality === 'low' ? 180 : graphicsQuality === 'high' ? 700 : 420;

    const treeList: Array<{ pos: [number, number, number]; scale: number }> = [];
    const grassList: Array<{
      pos: [number, number, number];
      scale: [number, number, number];
      rot: number;
    }> = [];

    for (let i = 0; i < treeCount; i++) {
      const angle = i * 2.3999632 + (i % 7) * 0.21;
      const dist = 34 + ((i * 27.3) % 355);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (isNearWater(x, z)) continue;

      const y = getTerrainHeight(x, z);
      if (y < 0.2 || y > 23) continue;

      treeList.push({
        pos: [x, y, z],
        scale: 1.05 + (i % 5) * 0.35,
      });
    }

    for (let i = 0; i < grassCount; i++) {
      const angle = i * 2.3999632;
      const dist = 10 + ((i * 11.73) % 340);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (isNearWater(x, z)) continue;

      const y = getTerrainHeight(x, z);
      if (y < 0.2 || y > 17) continue;

      const s = 0.8 + (i % 5) * 0.25;
      grassList.push({
        pos: [x, y + 0.3 * s, z],
        scale: [s * 1.25, s, s * 1.25],
        rot: i * 1.1,
      });
    }

    return { trees: treeList, grassTufts: grassList };
  }, [graphicsQuality]);

  return (
    <group>
      <Instances limit={150} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial color="#58616e" roughness={0.88} metalness={0.06} flatShading />
        {WORLD_ROCKS.map((rock, idx) => (
          <Instance key={idx} position={rock.pos} scale={rock.scale} rotation={[0, rock.rot, 0]} />
        ))}
      </Instances>

      <Instances limit={330} castShadow>
        <cylinderGeometry args={[0.35, 0.58, 4.4, 6]} />
        <meshStandardMaterial color="#5c2b12" roughness={0.95} />
        {trees.map((t, idx) => (
          <Instance
            key={idx}
            position={[t.pos[0], t.pos[1] + 2.1 * t.scale, t.pos[2]]}
            scale={[t.scale, t.scale, t.scale]}
          />
        ))}
      </Instances>

      <Instances limit={330} castShadow>
        <coneGeometry args={[3.2, 6.4, 7]} />
        <meshStandardMaterial color="#1e6b3a" roughness={0.85} flatShading />
        {trees.map((t, idx) => (
          <Instance
            key={idx}
            position={[t.pos[0], t.pos[1] + 5.4 * t.scale, t.pos[2]]}
            scale={[t.scale, t.scale, t.scale]}
          />
        ))}
      </Instances>

      <Instances limit={330} castShadow>
        <coneGeometry args={[2.3, 5.2, 7]} />
        <meshStandardMaterial color="#258046" roughness={0.82} flatShading />
        {trees.map((t, idx) => (
          <Instance
            key={idx}
            position={[t.pos[0], t.pos[1] + 8.3 * t.scale, t.pos[2]]}
            scale={[t.scale, t.scale, t.scale]}
          />
        ))}
      </Instances>

      <Instances limit={720}>
        <coneGeometry args={[0.7, 0.95, 5]} />
        <meshStandardMaterial color="#3c7a33" roughness={0.9} flatShading />
        {grassTufts.map((g, idx) => (
          <Instance key={idx} position={g.pos} scale={g.scale} rotation={[0, g.rot, 0]} />
        ))}
      </Instances>
    </group>
  );
});