import React, { useMemo } from 'react';
import { useGameStore, playersMutable } from '../../store/useGameStore';
import { Lighting } from './environment/Lighting';
import { Terrain } from './environment/Terrain';
import { Foliage } from './environment/Foliage';
import { WorldFoods } from './environment/WorldFoods';
import { CombatEffects } from './vfx/CombatEffects';
import { ScentPulse } from './vfx/ScentPulse';
import { LocalDino } from './LocalDino';
import { RemoteDino } from './RemoteDino';

export const Scene: React.FC = () => {
  const playerIds = useGameStore((s) => s.playerIds);
  const myId = useGameStore((s) => s.myId);

  const remoteIds = useMemo(() => {
    return playerIds.filter((id) => id !== myId);
  }, [playerIds, myId]);

  return (
    <>
      <Lighting />
      <Terrain />
      <Foliage />
      <WorldFoods />
      <CombatEffects />
      <ScentPulse />

      <LocalDino />

      {remoteIds.map((id) => {
        const modelKey = playersMutable[id]?.model || 'trex';
        return <RemoteDino key={`${id}-${modelKey}`} id={id} />;
      })}
    </>
  );
};