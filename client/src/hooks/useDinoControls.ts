import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { socket } from '../core/socket';
import { soundEngine } from '../core/sound';
import { useGameStore } from '../store/useGameStore';
import type { AnimState } from '../types/game';

const FORWARD_CHARS = new Set(['w', 'ư', 'ơ']);
const BACKWARD_CHARS = new Set(['s']);
const LEFT_CHARS = new Set(['a', 'â', 'ă']);
const RIGHT_CHARS = new Set(['d', 'đ']);
const BITE_CHARS = new Set([' ', 'f']);
const ROAR_CHARS = new Set(['r']);
const TAIL_CHARS = new Set(['e', 'ê']);

interface UseDinoControlsParams {
  defaultCamDistance: number;
  onTriggerOneShot: (anim: AnimState) => void;
  onTriggerSpecial: () => void;
}

export function useDinoControls({
  defaultCamDistance,
  onTriggerOneShot,
  onTriggerSpecial,
}: UseDinoControlsParams) {
  const { gl } = useThree();
  const setDinoScaleMultiplier = useGameStore((s) => s.setDinoScaleMultiplier);
  const rotateCurrentModel90 = useGameStore((s) => s.rotateCurrentModel90);
  const triggerScent = useGameStore((s) => s.triggerScent);
  const setChatOpen = useGameStore((s) => s.setChatOpen);
  const toggleNightVision = useGameStore((s) => s.toggleNightVision);
  const setShowLeaderboard = useGameStore((s) => s.setShowLeaderboard);
  const toggleMapOpen = useGameStore((s) => s.toggleMapOpen);

  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });
  const isRightMouseDown = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const cameraYaw = useRef(0);
  const cameraPitch = useRef(0.26);
  const zoomDistance = useRef(defaultCamDistance);

  useEffect(() => {
    zoomDistance.current = defaultCamDistance;
  }, [defaultCamDistance]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.tabIndex = 0;
    canvas.style.outline = 'none';
    canvas.focus();

    const resetMovementKeys = () => {
      keys.current.forward = false;
      keys.current.backward = false;
      keys.current.left = false;
      keys.current.right = false;
      keys.current.sprint = false;
    };

    const resetAllKeys = () => {
      resetMovementKeys();
      isRightMouseDown.current = false;
      setShowLeaderboard(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      const store = useGameStore.getState();
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || store.isChatOpen) {
        return;
      }

      const code = e.code || '';
      const key = (e.key || '').toLowerCase();
      const keyCode = e.keyCode || 0;

      if (code === 'Escape') {
        if (store.isMapOpen) {
          store.setMapOpen(false);
          canvas.focus();
        } else if (store.isSettingsOpen) {
          store.setSettingsOpen(false);
          canvas.focus();
        } else if (store.deathInfo) {
          store.dismissDeathOverlay();
        }
        return;
      }

      if ((code === 'KeyM' || key === 'm' || keyCode === 77) && !e.repeat) {
        if (!store.isSettingsOpen) {
          resetMovementKeys();
          toggleMapOpen();
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return;
      }

      if (store.isSettingsOpen || store.isMapOpen) return;

      if (code === 'Tab' || keyCode === 9) {
        e.preventDefault();
        setShowLeaderboard(true);
        return;
      }

      if (e.repeat) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      if (code === 'Backspace' || keyCode === 8) return;

      if (code === 'Enter' || keyCode === 13) {
        resetMovementKeys();
        setChatOpen(true);
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      let handled = false;

      if (code === 'KeyH' || key === 'h' || keyCode === 72) {
        if (!store.isResting) {
          resetMovementKeys();
          socket.sendToggleRest();
          soundEngine.playRest(true);
        } else if (store.restUnlockLeft <= 0) {
          socket.sendToggleRest();
          soundEngine.playRest(false);
        }
        handled = true;
      }

      if (code === 'KeyN' || key === 'n' || keyCode === 78) {
        toggleNightVision();
        handled = true;
      }
      if (code === 'KeyT' || key === 't' || keyCode === 84) {
        rotateCurrentModel90();
        handled = true;
      }
      if (code === 'BracketLeft' || key === '[') {
        setDinoScaleMultiplier(store.dinoScaleMultiplier - 0.1);
        handled = true;
      }
      if (code === 'BracketRight' || key === ']') {
        setDinoScaleMultiplier(store.dinoScaleMultiplier + 0.1);
        handled = true;
      }

      // ĐANG NGHỈ NGƠI -> KHÓA TOÀN BỘ DI CHUYỂN, TẤN CÔNG & HÀNH ĐỘNG
      if (store.isResting) {
        resetMovementKeys();
        if (handled) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return;
      }

      if (code === 'KeyW' || code === 'ArrowUp' || keyCode === 87 || FORWARD_CHARS.has(key)) {
        keys.current.forward = true;
        handled = true;
      }
      if (code === 'KeyS' || code === 'ArrowDown' || keyCode === 83 || BACKWARD_CHARS.has(key)) {
        keys.current.backward = true;
        handled = true;
      }
      if (code === 'KeyA' || code === 'ArrowLeft' || keyCode === 65 || LEFT_CHARS.has(key)) {
        keys.current.left = true;
        handled = true;
      }
      if (code === 'KeyD' || code === 'ArrowRight' || keyCode === 68 || RIGHT_CHARS.has(key)) {
        keys.current.right = true;
        handled = true;
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight' || e.shiftKey) {
        keys.current.sprint = true;
      }

      if (code === 'Space' || code === 'KeyF' || keyCode === 32 || keyCode === 70 || BITE_CHARS.has(key)) {
        onTriggerOneShot('bite');
        socket.sendAttack('bite');
        soundEngine.playBite();
        handled = true;
      }
      if (code === 'KeyE' || keyCode === 69 || TAIL_CHARS.has(key)) {
        onTriggerOneShot('tail');
        socket.sendAttack('tail');
        soundEngine.playBite();
        handled = true;
      }
      // Phím V: Kỹ năng đặc trưng từng loài (Nghiền xương / Húc văng / Quất gai / Vồ săn mồi)
      if (code === 'KeyV' || key === 'v' || keyCode === 86) {
        if (store.specialCd <= 0) {
          onTriggerSpecial();
        }
        handled = true;
      }
      if (code === 'KeyG' || key === 'g' || keyCode === 71) {
        onTriggerOneShot('bite');
        socket.sendInteract();
        soundEngine.playBite();
        handled = true;
      }
      if (code === 'KeyC' || key === 'c' || keyCode === 67) {
        socket.sendCrouch(!store.isCrouching);
        handled = true;
      }
      if (code === 'KeyQ' || key === 'q' || keyCode === 81) {
        triggerScent();
        soundEngine.playScent();
        handled = true;
      }

      if (code === 'KeyR' || keyCode === 82 || ROAR_CHARS.has(key) || code === 'Digit1') {
        onTriggerOneShot('roar');
        socket.sendRoar(1);
        soundEngine.playRoar(1, store.growth);
        handled = true;
      }
      if (code === 'Digit2') {
        onTriggerOneShot('roar');
        socket.sendRoar(2);
        soundEngine.playRoar(2, store.growth);
        handled = true;
      }
      if (code === 'Digit3') {
        onTriggerOneShot('roar');
        socket.sendRoar(3);
        soundEngine.playRoar(3, store.growth);
        handled = true;
      }
      if (code === 'Digit4') {
        onTriggerOneShot('roar');
        socket.sendRoar(4);
        soundEngine.playRoar(4, store.growth);
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code || '';
      const keyCode = e.keyCode || 0;
      if (code === 'Tab' || keyCode === 9) {
        setShowLeaderboard(false);
        return;
      }
      if (!code && keyCode !== 87 && keyCode !== 83 && keyCode !== 65 && keyCode !== 68) {
        return;
      }
      if (code === 'KeyW' || code === 'ArrowUp' || keyCode === 87) keys.current.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown' || keyCode === 83) keys.current.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft' || keyCode === 65) keys.current.left = false;
      if (code === 'KeyD' || code === 'ArrowRight' || keyCode === 68) keys.current.right = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight' || !e.shiftKey) {
        keys.current.sprint = false;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const is3DCanvas = e.target === canvas;
      if (!is3DCanvas) return;

      canvas.focus();
      const store = useGameStore.getState();
      if (store.isMapOpen || store.isSettingsOpen) return;

      if (e.button === 2) {
        isRightMouseDown.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      } else if (e.button === 0) {
        if (store.isChatOpen || store.isResting) {
          return;
        }
        onTriggerOneShot('bite');
        socket.sendAttack('bite');
        soundEngine.playBite();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isRightMouseDown.current) return;
      const dx =
        e.movementX !== undefined && e.movementX !== 0
          ? e.movementX
          : e.clientX - lastMousePos.current.x;
      const dy =
        e.movementY !== undefined && e.movementY !== 0
          ? e.movementY
          : e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      const sensitivity = 0.006;
      cameraYaw.current -= dx * sensitivity;
      cameraPitch.current = Math.max(-1.42, Math.min(1.35, cameraPitch.current + dy * sensitivity));
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        isRightMouseDown.current = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const store = useGameStore.getState();
      if (store.isMapOpen || store.isSettingsOpen) return;
      zoomDistance.current = Math.max(4, Math.min(34, zoomDistance.current + e.deltaY * 0.012));
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', resetAllKeys);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', resetAllKeys);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [
    gl,
    onTriggerOneShot,
    onTriggerSpecial,
    setDinoScaleMultiplier,
    rotateCurrentModel90,
    triggerScent,
    setChatOpen,
    toggleNightVision,
    setShowLeaderboard,
    toggleMapOpen,
  ]);

  return {
    keys,
    isRightMouseDown,
    cameraYaw,
    cameraPitch,
    zoomDistance,
  };
}