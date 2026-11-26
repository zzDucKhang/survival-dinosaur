import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  localTransformMutable,
  playersMutable,
  useGameStore,
  worldTimeMutable,
} from '../../store/useGameStore';
import { getDinoSpec } from '../../constants/dinosaurs';
import {
  calcGrowthVisualScale,
  getEntityGroundHeight,
  getTerrainSlope,
} from '../../constants/terrain';
import { useDinoModel } from '../../hooks/useDinoModel';
import type { AnimState } from '../../types/game';

interface RemoteDinoProps {
  id: string;
}

export const RemoteDino: React.FC<RemoteDinoProps> = React.memo(({ id }) => {
  const dinoScaleMultiplier = useGameStore((s) => s.dinoScaleMultiplier);
  const modelRotationOffsets = useGameStore((s) => s.modelRotationOffsets);
  const myPackId = useGameStore((s) => s.packId);
  const initialData = playersMutable[id];
  const dino = getDinoSpec(initialData?.model);
  const userExtraYaw = modelRotationOffsets[dino.id.toLowerCase()] || 0;

  const group = useRef<THREE.Group>(null!);
  const slopeGroupRef = useRef<THREE.Group>(null!);
  const modelHolderRef = useRef<THREE.Group>(null!);
  const shadowMeshRef = useRef<THREE.Mesh>(null);
  const labelGroupRef = useRef<THREE.Group>(null);
  const hpBarRef = useRef<HTMLDivElement>(null);
  const aiStateLabelRef = useRef<HTMLSpanElement>(null);
  const restTagRef = useRef<HTMLSpanElement>(null);
  const boneTagRef = useRef<HTMLSpanElement>(null);
  const packTagRef = useRef<HTMLSpanElement>(null);
  const badgeBoxRef = useRef<HTMLDivElement>(null);

  const [showLabel, setShowLabel] = useState(false);
  const showLabelRef = useRef(false);
  const lastLabelCheck = useRef(0);
  const restBlendRef = useRef(0);
  const crouchBlendRef = useRef(0);
  const wasCulledRef = useRef(false);

  const {
    clonedScene,
    baseScaleRef,
    baseOffsetYRef,
    autoYawRef,
    activeAnimRef,
    activeActionObjRef,
    playAnim,
    calibrateAfterRender,
  } = useDinoModel(dino.modelPath, dino.targetSize, dino.rotationOffset);

  const initY = getEntityGroundHeight(initialData?.x || 0, initialData?.z || 0);
  const targetPos = useMemo(
    () => new THREE.Vector3(initialData?.x || 0, initY, initialData?.z || 0),
    []
  );

  useFrame((_, rawDelta) => {
    const p = playersMutable[id];
    if (!p || !group.current || !modelHolderRef.current || !slopeGroupRef.current) return;

    const dxMe = p.x - localTransformMutable.x;
    const dzMe = p.z - localTransformMutable.z;
    const distSq = dxMe * dxMe + dzMe * dzMe;
    const isPackmate = Boolean(!p.isAi && myPackId && p.packId && p.packId === myPackId);

    // Distance Culling: Ẩn hoàn toàn SkinnedMesh ở xa > 165m (giảm mạnh tải GPU/CPU)
    const cullDistSq = isPackmate ? 280 * 280 : 165 * 165;
    if (distSq > cullDistSq) {
      if (group.current.visible) {
        group.current.visible = false;
      }
      if (showLabelRef.current) {
        showLabelRef.current = false;
        setShowLabel(false);
      }
      wasCulledRef.current = true;
      return;
    }

    if (!group.current.visible) {
      group.current.visible = true;
    }

    const delta = Math.min(rawDelta, 0.1);
    calibrateAfterRender(group.current, modelHolderRef.current);

    const growthVal = typeof p.growth === 'number' && p.growth > 0 ? p.growth : 0.9;
    const visualMult = calcGrowthVisualScale(growthVal) * dinoScaleMultiplier;

    restBlendRef.current = THREE.MathUtils.lerp(
      restBlendRef.current,
      p.isResting ? 1 : 0,
      Math.min(1, delta * 7)
    );
    crouchBlendRef.current = THREE.MathUtils.lerp(
      crouchBlendRef.current,
      !p.isResting && p.isCrouching ? 1 : 0,
      Math.min(1, delta * 9)
    );

    const restFactor = restBlendRef.current;
    const crouchFactor = crouchBlendRef.current;
    const scaleYMult = 1 - restFactor * 0.24 - crouchFactor * 0.12;
    const baseScale = baseScaleRef.current * visualMult;

    modelHolderRef.current.scale.set(baseScale, baseScale * scaleYMult, baseScale);
    const postureDropY = (restFactor * 0.36 + crouchFactor * 0.16) * visualMult;
    modelHolderRef.current.position.set(
      0,
      baseOffsetYRef.current * visualMult * scaleYMult - postureDropY,
      0
    );
    modelHolderRef.current.rotation.set(0, autoYawRef.current + userExtraYaw, 0);

    if (shadowMeshRef.current) {
      shadowMeshRef.current.scale.set(visualMult, visualMult, 1);
    }
    if (labelGroupRef.current) {
      labelGroupRef.current.position.y =
        dino.nametagHeight * visualMult * (1 - restFactor * 0.28 - crouchFactor * 0.12);
    }

    let nextX = p.x;
    let nextZ = p.z;
    if (!wasCulledRef.current) {
      nextX = THREE.MathUtils.lerp(group.current.position.x, p.x, Math.min(1, delta * 12));
      nextZ = THREE.MathUtils.lerp(group.current.position.z, p.z, Math.min(1, delta * 12));
    } else {
      wasCulledRef.current = false;
    }

    const exactGroundY = getEntityGroundHeight(nextX, nextZ);
    targetPos.set(nextX, exactGroundY, nextZ);
    group.current.position.copy(targetPos);

    const currentRot = group.current.rotation.y;
    let diff = (p.rot - currentRot) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    group.current.rotation.y += diff * Math.min(1, delta * 10);

    // Chỉ tính góc nghiêng địa hình khi bot ở trong vòng 95m
    if (distSq < 95 * 95) {
      const slope = getTerrainSlope(
        nextX,
        nextZ,
        group.current.rotation.y,
        Math.max(1.2, 1.5 * visualMult)
      );
      slopeGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        slopeGroupRef.current.rotation.x,
        slope.pitch + crouchFactor * 0.1 + restFactor * 0.06,
        Math.min(1, delta * 10)
      );
      slopeGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        slopeGroupRef.current.rotation.z,
        slope.roll,
        Math.min(1, delta * 10)
      );
    }

    const nextAnim = (p.isResting ? 'rest' : p.anim || 'idle') as AnimState;
    if (nextAnim !== activeAnimRef.current) {
      const isOneShot = nextAnim === 'bite' || nextAnim === 'roar' || nextAnim === 'tail';
      playAnim(nextAnim, isOneShot);
    }
    if (activeActionObjRef.current) {
      activeActionObjRef.current.timeScale = p.isResting ? 0.4 : 1.0;
    }

    const now = performance.now();
    if (now - lastLabelCheck.current > 350) {
      lastLabelCheck.current = now;
      const distToMe = Math.sqrt(distSq);

      let maxVisibleDist = isPackmate ? 260 : 75;
      if (!isPackmate) {
        const sunAngle = (worldTimeMutable.value - 0.25) * Math.PI * 2;
        const isNight = Math.sin(sunAngle) < 0.05;
        if (isNight) {
          const st = useGameStore.getState();
          if (st.nightVision) {
            const mySpec = getDinoSpec(st.selectedModel);
            maxVisibleDist = mySpec.diet === 'carnivore' ? 55 : 42;
          } else {
            maxVisibleDist = 20;
          }
        }
      }

      const shouldShow = distToMe <= maxVisibleDist;
      if (shouldShow !== showLabelRef.current) {
        showLabelRef.current = shouldShow;
        setShowLabel(shouldShow);
      }
    }

    if (hpBarRef.current && typeof p.hp === 'number') {
      const maxHp = p.maxHp || 100;
      const pct = Math.max(0, Math.min(100, (p.hp / maxHp) * 100));
      hpBarRef.current.style.width = `${pct}%`;
      if (isPackmate) {
        hpBarRef.current.style.background = '#38bdf8';
      }
    }
    if (badgeBoxRef.current && isPackmate) {
      badgeBoxRef.current.style.borderColor = '#38bdf8';
      badgeBoxRef.current.style.color = '#7dd3fc';
    }
    if (aiStateLabelRef.current && p.aiState) {
      aiStateLabelRef.current.textContent = p.aiState;
      aiStateLabelRef.current.style.color =
        p.aiState === 'CHASE' || p.aiState === 'ATTACK' ? '#f87171' : '#a5b4fc';
    }
    if (restTagRef.current) {
      restTagRef.current.style.display = p.isResting ? 'inline' : 'none';
    }
    if (boneTagRef.current) {
      boneTagRef.current.style.display = (p.boneBreak || 0) > 0 ? 'inline' : 'none';
    }
    if (packTagRef.current) {
      packTagRef.current.style.display = isPackmate ? 'inline' : 'none';
    }
  });

  const isAI = Boolean(initialData?.isAi || id.startsWith('bot-'));
  const isHerbivore = initialData?.diet === 'herbivore' || dino.diet === 'herbivore';
  const displayName = initialData?.name || 'Dinosaur';
  const initVisualMult = calcGrowthVisualScale(initialData?.growth || 0.9) * dinoScaleMultiplier;

  return (
    <group ref={group} position={[initialData?.x || 0, initY, initialData?.z || 0]}>
      <group ref={slopeGroupRef}>
        <group ref={modelHolderRef}>
          <primitive object={clonedScene} />
        </group>
        <mesh ref={shadowMeshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <circleGeometry args={[1.3, 18]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.32} depthWrite={false} />
        </mesh>
      </group>

      <group ref={labelGroupRef} position={[0, dino.nametagHeight * initVisualMult, 0]}>
        {showLabel && (
          <Html center distanceFactor={28}>
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
                ref={badgeBoxRef}
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
                <span ref={packTagRef} style={{ display: 'none', marginRight: '4px' }}>
                  🐾
                </span>
                <span ref={boneTagRef} style={{ display: 'none', marginRight: '4px' }}>
                  🦴
                </span>
                <span ref={restTagRef} style={{ display: 'none', marginRight: '4px' }}>
                  💤
                </span>
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
    </group>
  );
});