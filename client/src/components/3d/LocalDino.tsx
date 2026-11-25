import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { socket } from '../../core/socket';
import {
  useGameStore,
  localTransformMutable,
  playersMutable,
  foodsMutable,
} from '../../store/useGameStore';
import { getDinoSpec } from '../../constants/dinosaurs';
import {
  calcGrowthVisualScale,
  getTerrainHeight,
  ISLAND_LIMIT,
  isNearWater,
  WATER_LEVEL,
  WORLD_ROCKS,
} from '../../constants/terrain';
import { useDinoControls } from '../../hooks/useDinoControls';
import { useDinoModel } from '../../hooks/useDinoModel';
import type { AnimState } from '../../types/game';

export const LocalDino: React.FC = () => {
  const myId = useGameStore((s) => s.myId);
  const myName = useGameStore((s) => s.myName);
  const selectedModel = useGameStore((s) => s.selectedModel);
  const dinoScaleMultiplier = useGameStore((s) => s.dinoScaleMultiplier);
  const modelRotationOffsets = useGameStore((s) => s.modelRotationOffsets);
  const growth = useGameStore((s) => s.growth);
  const isResting = useGameStore((s) => s.isResting);
  const setStamina = useGameStore((s) => s.setStamina);
  const setActionHint = useGameStore((s) => s.setActionHint);

  const dino = getDinoSpec(selectedModel);
  const userExtraYaw = modelRotationOffsets[dino.id.toLowerCase()] || 0;

  const group = useRef<THREE.Group>(null!);
  const modelHolderRef = useRef<THREE.Group>(null!);
  const shadowMeshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const wBadgeRef = useRef<HTMLSpanElement>(null);
  const aBadgeRef = useRef<HTMLSpanElement>(null);
  const sBadgeRef = useRef<HTMLSpanElement>(null);
  const dBadgeRef = useRef<HTMLSpanElement>(null);

  const {
    clonedScene,
    baseScaleRef,
    baseOffsetYRef,
    autoYawRef,
    isQuadrupedRef,
    activeAnimRef,
    activeActionObjRef,
    isOneShotPlayingRef,
    playAnim,
    calibrateAfterRender,
  } = useDinoModel(dino.modelPath, dino.targetSize, dino.rotationOffset);

  const keysRefForCallback = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });

  const handleOneShot = useCallback(
    (anim: AnimState) => {
      playAnim(anim, true, () => {
        const k = keysRefForCallback.current;
        const moving = k.forward || k.backward || k.left || k.right;
        if (!moving) {
          playAnim('idle', false);
        } else {
          playAnim(k.sprint && k.forward ? 'run' : 'walk', false);
        }
      });
    },
    [playAnim]
  );

  const { keys, isRightMouseDown, cameraYaw, cameraPitch, zoomDistance } = useDinoControls({
    defaultCamDistance: dino.camDistance,
    onTriggerOneShot: handleOneShot,
  });

  useEffect(() => {
    keysRefForCallback.current = keys.current;
  }, [keys]);

  const position = useRef(new THREE.Vector3(0, getTerrainHeight(0, 0), 0));
  const rotationY = useRef(0);
  const staminaRef = useRef(100);
  const lastSyncTime = useRef(0);
  const lastHintCheck = useRef(0);

  const tempCamOffset = useMemo(() => new THREE.Vector3(), []);
  const tempTargetCamPos = useMemo(() => new THREE.Vector3(), []);
  const tempLookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDelta) => {
    if (!group.current || !modelHolderRef.current) return;
    const delta = Math.min(rawDelta, 0.1);
    const now = performance.now();

    if (myId && playersMutable[myId]) {
      const serverMe = playersMutable[myId];
      const serverDist = Math.hypot(
        serverMe.x - position.current.x,
        serverMe.z - position.current.z
      );
      if (serverDist > 26) {
        position.current.set(
          serverMe.x,
          Math.max(WATER_LEVEL, getTerrainHeight(serverMe.x, serverMe.z)),
          serverMe.z
        );
      }
    }

    calibrateAfterRender(group.current, modelHolderRef.current);

    // Áp dụng độ lớn tăng trưởng trực tiếp (không bao giờ bị React reset)
    const storeState = useGameStore.getState();
    const liveGrowth = storeState.growth;
    const liveScaleMult = storeState.dinoScaleMultiplier;
    const growthVisual = calcGrowthVisualScale(liveGrowth);
    const totalMultiplier = growthVisual * liveScaleMult;

    modelHolderRef.current.scale.setScalar(baseScaleRef.current * totalMultiplier);
    modelHolderRef.current.position.set(0, baseOffsetYRef.current * totalMultiplier, 0);
    modelHolderRef.current.rotation.set(0, autoYawRef.current + userExtraYaw, 0);

    if (shadowMeshRef.current) {
      shadowMeshRef.current.scale.set(totalMultiplier, totalMultiplier, 1);
    }

    const forwardActive = keys.current.forward;
    const backwardActive = keys.current.backward;
    const leftActive = keys.current.left;
    const rightActive = keys.current.right;

    const paintBadge = (el: HTMLSpanElement | null, active: boolean) => {
      if (!el) return;
      el.style.background = active ? '#10b981' : 'rgba(15, 23, 42, 0.75)';
      el.style.color = active ? '#030712' : '#94a3b8';
    };
    paintBadge(wBadgeRef.current, forwardActive);
    paintBadge(aBadgeRef.current, leftActive);
    paintBadge(sBadgeRef.current, backwardActive);
    paintBadge(dBadgeRef.current, rightActive);

    const isMovingForward = forwardActive && !backwardActive;
    const isMovingBackward = backwardActive && !forwardActive;
    const isTurningLeft = leftActive && !rightActive;
    const isTurningRight = rightActive && !leftActive;
    const isTurning = isTurningLeft || isTurningRight;
    const isMoving = isMovingForward || isMovingBackward;

    const isSprinting =
      keys.current.sprint && (isMovingForward || isTurning) && staminaRef.current > 5;

    const nearWater = isNearWater(position.current.x, position.current.z);
    let regenRate = nearWater ? 26 : 14;
    if (storeState.isResting) regenRate = 34;

    if (isSprinting) {
      staminaRef.current = Math.max(0, staminaRef.current - delta * 20);
    } else {
      staminaRef.current = Math.min(100, staminaRef.current + delta * regenRate);
    }
    setStamina(staminaRef.current);

    const effectiveTurnSpeed = isQuadrupedRef.current ? dino.turnSpeed * 0.78 : dino.turnSpeed;
    const turnDir = isMovingBackward ? -1 : 1;
    if (isTurningLeft) rotationY.current += effectiveTurnSpeed * delta * turnDir;
    if (isTurningRight) rotationY.current -= effectiveTurnSpeed * delta * turnDir;

    const forwardX = Math.sin(rotationY.current);
    const forwardZ = Math.cos(rotationY.current);
    const agilityBoost = 1.15 - 0.14 * Math.min(1.25, liveGrowth);

    if (isMovingForward) {
      const speed = (isSprinting ? dino.sprintSpeed : dino.walkSpeed) * agilityBoost;
      position.current.x += forwardX * speed * delta;
      position.current.z += forwardZ * speed * delta;
    } else if (isMovingBackward) {
      position.current.x -= forwardX * dino.backSpeed * delta;
      position.current.z -= forwardZ * dino.backSpeed * delta;
    } else if (isTurning) {
      const arcFactor = isQuadrupedRef.current ? 0.75 : 0.6;
      const turnWalkSpeed = (isSprinting ? dino.sprintSpeed : dino.walkSpeed) * arcFactor;
      position.current.x += forwardX * turnWalkSpeed * delta;
      position.current.z += forwardZ * turnWalkSpeed * delta;
    }

    const myRadius = 1.45 * totalMultiplier;
    for (let i = 0; i < WORLD_ROCKS.length; i++) {
      const rock = WORLD_ROCKS[i];
      const dx = position.current.x - rock.pos[0];
      const dz = position.current.z - rock.pos[2];
      const dist = Math.hypot(dx, dz);
      const minDist = rock.radius + myRadius;
      if (dist < minDist && dist > 0.001) {
        const push = minDist - dist;
        position.current.x += (dx / dist) * push;
        position.current.z += (dz / dist) * push;
      }
    }

    position.current.x = Math.max(-ISLAND_LIMIT, Math.min(ISLAND_LIMIT, position.current.x));
    position.current.z = Math.max(-ISLAND_LIMIT, Math.min(ISLAND_LIMIT, position.current.z));

    const groundY = Math.max(WATER_LEVEL, getTerrainHeight(position.current.x, position.current.z));
    position.current.y = THREE.MathUtils.lerp(position.current.y, groundY, Math.min(1, delta * 18));

    group.current.position.copy(position.current);
    group.current.rotation.y = rotationY.current;

    localTransformMutable.x = position.current.x;
    localTransformMutable.y = position.current.y;
    localTransformMutable.z = position.current.z;
    localTransformMutable.rot = rotationY.current;

    if (now - lastHintCheck.current > 250) {
      lastHintCheck.current = now;
      let hint: string | null = null;
      if (nearWater) {
        hint = '💧 Bấm [G] để Uống nước (+Khát & Cầm máu)';
      } else {
        const desiredFood = dino.diet === 'herbivore' ? 'plant' : 'meat';
        for (const id of Object.keys(foodsMutable)) {
          const f = foodsMutable[id];
          if (f.type === desiredFood && f.amount > 0) {
            if (Math.hypot(f.x - position.current.x, f.z - position.current.z) < 8.0) {
              hint =
                desiredFood === 'meat'
                  ? '🥩 Bấm [G] để Ăn thịt (+Máu & +11% Trưởng thành)'
                  : '🌿 Bấm [G] để Ăn bụi quả (+Máu & +11% Trưởng thành)';
              break;
            }
          }
        }
      }
      setActionHint(hint);
    }

    if (!isOneShotPlayingRef.current) {
      let targetAnim: AnimState = 'idle';
      if (isMoving || isTurning) {
        targetAnim = isSprinting ? 'run' : 'walk';
      }
      if (activeAnimRef.current !== targetAnim) {
        playAnim(targetAnim, false);
      }
      if (activeActionObjRef.current && (targetAnim === 'walk' || targetAnim === 'run')) {
        if (isMovingBackward) {
          activeActionObjRef.current.timeScale = 0.8;
        } else if (isSprinting) {
          activeActionObjRef.current.timeScale = 1.25;
        } else {
          activeActionObjRef.current.timeScale = 1.0;
        }
      }
    }

    if (now - lastSyncTime.current > 50) {
      lastSyncTime.current = now;
      socket.sendMove(
        position.current.x,
        position.current.y,
        position.current.z,
        rotationY.current,
        activeAnimRef.current
      );
    }

    // --- CAMERA NGẮM TRỌN BẦU TRỜI (không giới hạn khi kéo chuột phải lên trên) ---
    if (isMovingForward && !isTurning && !isRightMouseDown.current) {
      let diff = (rotationY.current - cameraYaw.current) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      cameraYaw.current += diff * Math.min(1, delta * 1.8);
    }

    const pivotY = position.current.y + dino.lookAtY * totalMultiplier + 0.6;
    const pitch = cameraPitch.current;
    const dist = zoomDistance.current * (0.7 + 0.35 * totalMultiplier);

    const horizDist = Math.cos(pitch) * dist;
    const camX = position.current.x - Math.sin(cameraYaw.current) * horizDist;
    const camZ = position.current.z - Math.cos(cameraYaw.current) * horizDist;
    const desiredCamY = pivotY + Math.sin(pitch) * dist;

    // Giữ camera luôn trên mặt đất đồi núi, đồng thời nâng điểm nhìn ngước thẳng lên bầu trời
    const minCamY = getTerrainHeight(camX, camZ) + 0.9;
    const actualCamY = Math.max(minCamY, desiredCamY);
    const skyTiltLift = Math.max(0, actualCamY - desiredCamY);

    tempCamOffset.set(
      camX - position.current.x,
      actualCamY - position.current.y,
      camZ - position.current.z
    );

    tempTargetCamPos.copy(position.current).add(tempCamOffset);
    camera.position.lerp(tempTargetCamPos, Math.min(1, delta * 12));

    tempLookTarget.set(position.current.x, pivotY + skyTiltLift, position.current.z);
    camera.lookAt(tempLookTarget);
  });

  const badgeStyle: React.CSSProperties = {
    padding: '2px 7px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
    background: 'rgba(15, 23, 42, 0.75)',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.15)',
  };

  const visualMult = calcGrowthVisualScale(growth) * dinoScaleMultiplier;

  return (
    <group ref={group}>
      <group ref={modelHolderRef}>
        <primitive object={clonedScene} />
      </group>

      <mesh ref={shadowMeshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[1.4, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      <Html position={[0, dino.nametagHeight * visualMult, 0]} center distanceFactor={26}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            transform: 'translateY(-16px)',
            gap: '4px',
          }}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.88)',
              border: isResting ? '1px solid #38bdf8' : '1px solid #10b981',
              borderRadius: '6px',
              padding: '3px 10px',
              color: '#34d399',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '12px',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            }}
          >
            {isResting ? '💤 ' : ''}
            {myName}{' '}
            <span style={{ color: '#fde047', fontSize: '10px' }}>
              {Math.round(growth * 100)}%
            </span>
          </div>
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            <span ref={wBadgeRef} style={badgeStyle}>W</span>
            <span ref={aBadgeRef} style={badgeStyle}>A</span>
            <span ref={sBadgeRef} style={badgeStyle}>S</span>
            <span ref={dBadgeRef} style={badgeStyle}>D</span>
          </div>
        </div>
      </Html>
    </group>
  );
};