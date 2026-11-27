import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { computeDinoNormalization, getDinoAction } from '../constants/dinosaurs';
import { setupMeshoptLoader } from '../core/meshopt';
import type { AnimState } from '../types/game';

export function useDinoModel(
  modelPath: string,
  targetSize: number,
  explicitOffset?: number
) {
  const { scene, animations } = useGLTF(modelPath, false, true, setupMeshoptLoader);

  const { clonedScene, cleanedAnimations, initialNorm } = useMemo(() => {
    const cloned = clone(scene);
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = false;
        child.frustumCulled = false;
      }
    });

    const strippedClips = animations.map((clip) => {
      const c = clip.clone();
      c.tracks = c.tracks.map((track) => {
        if (
          track.name.endsWith('.position') &&
          /^(armature|root|hips|pelvis|character)/i.test(track.name)
        ) {
          const vals = track.values;
          if (vals.length >= 6) {
            const startX = vals[0];
            const startZ = vals[2];
            let maxDisp = 0;
            for (let i = 0; i < vals.length; i += 3) {
              const d = Math.hypot(vals[i] - startX, vals[i + 2] - startZ);
              if (d > maxDisp) maxDisp = d;
            }
            if (maxDisp > 0.25) {
              const tClone = track.clone();
              for (let i = 0; i < tClone.values.length; i += 3) {
                tClone.values[i] = startX;
                tClone.values[i + 2] = startZ;
              }
              return tClone;
            }
          }
        }
        return track;
      });
      return c;
    });

    const norm = computeDinoNormalization(cloned, targetSize, explicitOffset);
    return { clonedScene: cloned, cleanedAnimations: strippedClips, initialNorm: norm };
  }, [scene, animations, targetSize, explicitOffset]);

  const { actions } = useAnimations(cleanedAnimations, clonedScene);
  const baseScaleRef = useRef(initialNorm.scale);
  const baseOffsetYRef = useRef(initialNorm.offsetY);
  const autoYawRef = useRef(initialNorm.autoForwardYaw);
  const isQuadrupedRef = useRef(initialNorm.isQuadruped);
  const calibratedFramesRef = useRef(0);
  const activeAnimRef = useRef<AnimState>('idle');
  const activeActionObjRef = useRef<THREE.AnimationAction | null>(null);
  const isOneShotPlayingRef = useRef(false);
  const oneShotTimerRef = useRef<number | null>(null);

  const playAnim = useCallback(
    (nextAnim: AnimState, forceOneShot = false, onOneShotComplete?: () => void) => {
      if (!actions) return;
      if (!forceOneShot && activeAnimRef.current === nextAnim && activeActionObjRef.current) {
        return;
      }
      const nextAction = getDinoAction(actions, nextAnim);
      if (!nextAction) return;

      const prevAction = activeActionObjRef.current;
      if (prevAction && prevAction !== nextAction) {
        prevAction.fadeOut(0.15);
      }

      activeAnimRef.current = nextAnim;
      activeActionObjRef.current = nextAction;

      if (forceOneShot) {
        isOneShotPlayingRef.current = true;
        nextAction.reset();
        nextAction.setLoop(THREE.LoopOnce, 1);
        nextAction.clampWhenFinished = false;
        nextAction.timeScale = 1.0;
        nextAction.fadeIn(0.1).play();
        if (oneShotTimerRef.current) {
          window.clearTimeout(oneShotTimerRef.current);
        }
        const clipDuration = nextAction.getClip()?.duration || 1.0;
        oneShotTimerRef.current = window.setTimeout(() => {
          isOneShotPlayingRef.current = false;
          if (onOneShotComplete) {
            onOneShotComplete();
          } else {
            playAnim('idle', false);
          }
        }, Math.max(350, clipDuration * 850));
      } else {
        nextAction.reset();
        nextAction.setLoop(THREE.LoopRepeat, Infinity);
        nextAction.clampWhenFinished = false;
        nextAction.timeScale = 1.0;
        nextAction.fadeIn(0.15).play();
      }
    },
    [actions]
  );

  useEffect(() => {
    baseScaleRef.current = initialNorm.scale;
    baseOffsetYRef.current = initialNorm.offsetY;
    autoYawRef.current = initialNorm.autoForwardYaw;
    isQuadrupedRef.current = initialNorm.isQuadruped;
    calibratedFramesRef.current = 0;
    playAnim('idle', false);
    return () => {
      if (oneShotTimerRef.current) {
        window.clearTimeout(oneShotTimerRef.current);
      }
    };
  }, [initialNorm, playAnim]);

  const calibrateAfterRender = useCallback(
    (rootGroup: THREE.Group, holderGroup: THREE.Group) => {
      if (calibratedFramesRef.current >= 3) return;
      calibratedFramesRef.current++;
      if (calibratedFramesRef.current === 3) {
        const savedPos = rootGroup.position.clone();
        const savedRot = rootGroup.rotation.y;
        rootGroup.position.set(0, 0, 0);
        rootGroup.rotation.set(0, 0, 0);
        holderGroup.scale.setScalar(1);
        holderGroup.position.set(0, 0, 0);
        holderGroup.rotation.set(0, 0, 0);
        const postAnimNorm = computeDinoNormalization(clonedScene, targetSize, explicitOffset);
        baseScaleRef.current = postAnimNorm.scale;
        baseOffsetYRef.current = postAnimNorm.offsetY;
        autoYawRef.current = postAnimNorm.autoForwardYaw;
        isQuadrupedRef.current = postAnimNorm.isQuadruped;
        rootGroup.position.copy(savedPos);
        rootGroup.rotation.y = savedRot;
      }
    },
    [clonedScene, targetSize, explicitOffset]
  );

  return {
    clonedScene,
    initialNorm,
    baseScaleRef,
    baseOffsetYRef,
    autoYawRef,
    isQuadrupedRef,
    activeAnimRef,
    activeActionObjRef,
    isOneShotPlayingRef,
    playAnim,
    calibrateAfterRender,
  };
}