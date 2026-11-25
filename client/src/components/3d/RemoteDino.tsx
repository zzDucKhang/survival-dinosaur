import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { localTransformMutable, playersMutable, useGameStore } from '../../store/useGameStore';
import { getDinoSpec } from '../../constants/dinosaurs';
import { calcGrowthVisualScale, getTerrainHeight, WATER_LEVEL } from '../../constants/terrain';
import { useDinoModel } from '../../hooks/useDinoModel';
import type { AnimState } from '../../types/game';

interface RemoteDinoProps {
  id: string;
}

export const RemoteDino: React.FC<RemoteDinoProps> = React.memo(({ id }) => {
  const dinoScaleMultiplier = useGameStore((s) => s.dinoScaleMultiplier);
  const modelRotationOffsets = useGameStore((s) => s.modelRotationOffsets);
  const initialData = playersMutable[id];
  const dino = getDinoSpec(initialData?.model);
  const userExtraYaw = modelRotationOffsets[dino.id.toLowerCase()] || 0;

  const group = useRef<THREE.Group>(null!);
  const modelHolderRef = useRef<THREE.Group>(null!);
  const shadowMeshRef = useRef<THREE.Mesh>(null);
  const hpBarRef = useRef<HTMLDivElement>(null);
  const aiStateLabelRef = useRef<HTMLSpanElement>(null);

  const [showLabel, setShowLabel] = useState(true);
  const showLabelRef = useRef(true);
  const lastLabelCheck = useRef(0);

  const {
    clonedScene,
    baseScaleRef,
    baseOffsetYRef,
    autoYawRef,
    activeAnimRef,
    playAnim,
    calibrateAfterRender,
  } = useDinoModel(dino.modelPath, dino.targetSize, dino.rotationOffset);

  const initY = Math.max(
    WATER_LEVEL,
    getTerrainHeight(initialData?.x || 0, initialData?.z || 0)
  );
  const targetPos = useMemo(
    () => new THREE.Vector3(initialData?.x || 0, initY, initialData?.z || 0),
    []
  );

  useFrame((_, rawDelta) => {
    const p = playersMutable[id];
    if (!p || !group.current || !modelHolderRef.current) return;
    const delta = Math.min(rawDelta, 0.1);

    calibrateAfterRender(group.current, modelHolderRef.current);

    const growthVal = typeof p.growth === 'number' && p.growth > 0 ? p.growth : 0.9;
    const visualMult = calcGrowthVisualScale(growthVal) * dinoScaleMultiplier;

    modelHolderRef.current.scale.setScalar(baseScaleRef.current * visualMult);
    modelHolderRef.current.position.set(0, baseOffsetYRef.current * visualMult, 0);
    modelHolderRef.current.rotation.set(0, autoYawRef.current + userExtraYaw, 0);

    if (shadowMeshRef.current) {
      shadowMeshRef.current.scale.set(visualMult, visualMult, 1);
    }

    const groundY = Math.max(WATER_LEVEL, getTerrainHeight(p.x, p.z));
    targetPos.set(p.x, groundY, p.z);
    group.current.position.lerp(targetPos, Math.min(1, delta * 12));

    const currentRot = group.current.rotation.y;
    let diff = (p.rot - currentRot) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    group.current.rotation.y += diff * Math.min(1, delta * 10);

    const nextAnim = (p.anim || 'idle') as AnimState;
    if (nextAnim !== activeAnimRef.current) {
      const isOneShot = nextAnim === 'bite' || nextAnim === 'roar' || nextAnim === 'tail';
      playAnim(nextAnim, isOneShot);
    }

    const now = performance.now();
    if (now - lastLabelCheck.current > 350) {
      lastLabelCheck.current = now;
      const distToMe = Math.hypot(p.x - localTransformMutable.x, p.z - localTransformMutable.z);
      const shouldShow = distToMe <= 75;
      if (shouldShow !== showLabelRef.current) {
        showLabelRef.current = shouldShow;
        setShowLabel(shouldShow);
      }
    }

    if (hpBarRef.current && typeof p.hp === 'number') {
      const maxHp = p.maxHp || 100;
      const pct = Math.max(0, Math.min(100, (p.hp / maxHp) * 100));
      hpBarRef.current.style.width = `${pct}%`;
    }

    if (aiStateLabelRef.current && p.aiState) {
      aiStateLabelRef.current.textContent = p.aiState;
      aiStateLabelRef.current.style.color =
        p.aiState === 'CHASE' || p.aiState === 'ATTACK' ? '#f87171' : '#a5b4fc';
    }
  });

  const isAI = Boolean(initialData?.isAi || id.startsWith('bot-'));
  const isHerbivore = initialData?.diet === 'herbivore' || dino.diet === 'herbivore';
  const displayName = initialData?.name || 'Dinosaur';
  const initVisualMult =
    calcGrowthVisualScale(initialData?.growth || 0.9) * dinoScaleMultiplier;

  return (
    <group ref={group} position={[initialData?.x || 0, initY, initialData?.z || 0]}>
      <group ref={modelHolderRef}>
        <primitive object={clonedScene} />
      </group>

      <mesh ref={shadowMeshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[1.3, 18]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.32} depthWrite={false} />
      </mesh>

      {showLabel && (
        <Html position={[0, dino.nametagHeight * initVisualMult, 0]} center distanceFactor={28}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
              userSelect: 'none',
              transform: 'translateY(-14px)',
            }}
          >
            <div
              style={{
                background: isAI ? 'rgba(30, 27, 75, 0.9)' : 'rgba(15, 23, 42, 0.9)',
                border: isHerbivore
                  ? '1px solid #34d399'
                  : isAI
                  ? '1px solid #818cf8'
                  : '1px solid #f87171',
                borderRadius: '6px',
                padding: '3px 10px',
                color: isHerbivore ? '#a7f3d0' : isAI ? '#c7d2fe' : '#fca5a5',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '12px',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
              }}
            >
              {isHerbivore ? '🌿 ' : '🥩 '}
              {displayName}
              {isAI ? (
                <span
                  ref={aiStateLabelRef}
                  style={{ color: '#a5b4fc', fontSize: '10px', marginLeft: '5px' }}
                >
                  [AI]
                </span>
              ) : (
                <span style={{ color: '#cbd5e1', fontSize: '10px', marginLeft: '4px' }}>
                  [{dino.species}]
                </span>
              )}
            </div>
            <div
              style={{
                width: '56px',
                height: '4px',
                background: 'rgba(0,0,0,0.65)',
                borderRadius: '2px',
                marginTop: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                ref={hpBarRef}
                style={{
                  width: '100%',
                  height: '100%',
                  background: isHerbivore ? '#10b981' : isAI ? '#6366f1' : '#ef4444',
                  transition: 'width 0.12s ease-out',
                }}
              />
            </div>
          </div>
        </Html>
      )}
    </group>
  );
});