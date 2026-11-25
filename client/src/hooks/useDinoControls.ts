import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { socket } from '../core/socket';
import { soundEngine } from '../core/sound';
import { useGameStore } from '../store/useGameStore';
import type { AnimState } from '../types/game';

const FORWARD_CHARS = new Set(['w', 'ư', 'ơ']);
const BACKWARD_CHARS = new Set(['s', 'á', 'ắ', 'ấ', 'é', 'ế', 'í', 'ó', 'ố', 'ớ', 'ú', 'ứ', 'ý']);
const LEFT_CHARS = new Set(['a', 'â', 'ă', 'à', 'ả', 'ã', 'ạ']);
const RIGHT_CHARS = new Set(['d', 'đ']);
const BITE_CHARS = new Set([' ', 'f', 'à', 'ằ', 'ầ', 'è', 'ề', 'ì', 'ò', 'ồ', 'ờ', 'ù', 'ừ', 'ỳ']);
const ROAR_CHARS = new Set(['r', 'ả', 'ẳ', 'ẩ', 'ẻ', 'ể', 'ỉ', 'ỏ', 'ổ', 'ở', 'ủ', 'ử', 'ỷ']);
const TAIL_CHARS = new Set(['e', 'ê']);

interface UseDinoControlsParams {
  defaultCamDistance: number;
  onTriggerOneShot: (anim: AnimState) => void;
}

export function useDinoControls({
  defaultCamDistance,
  onTriggerOneShot,
}: UseDinoControlsParams) {
  const { gl } = useThree();
  const setDinoScaleMultiplier = useGameStore((s) => s.setDinoScaleMultiplier);
  const rotateCurrentModel90 = useGameStore((s) => s.rotateCurrentModel90);
  const triggerScent = useGameStore((s) => s.triggerScent);
  const setChatOpen = useGameStore((s) => s.setChatOpen);

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

    const resetKeys = () => {
      keys.current.forward = false;
      keys.current.backward = false;
      keys.current.left = false;
      keys.current.right = false;
      keys.current.sprint = false;
      isRightMouseDown.current = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      const store = useGameStore.getState();
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || store.isChatOpen) {
        return;
      }

      if (e.code === 'Escape' && store.isSettingsOpen) {
        store.setSettingsOpen(false);
        return;
      }
      if (store.isSettingsOpen) return;

      if (e.repeat) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      const code = e.code || '';
      const key = (e.key || '').toLowerCase();
      const keyCode = e.keyCode || 0;

      if (code === 'Backspace' || keyCode === 8) return;

      if (code === 'Enter' || keyCode === 13) {
        resetKeys();
        setChatOpen(true);
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      let handled = false;

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
      if (code === 'KeyR' || keyCode === 82 || ROAR_CHARS.has(key)) {
        onTriggerOneShot('roar');
        soundEngine.playRoar();
        handled = true;
      }
      if (code === 'KeyE' || keyCode === 69 || TAIL_CHARS.has(key)) {
        onTriggerOneShot('tail');
        socket.sendAttack('tail');
        soundEngine.playBite();
        handled = true;
      }
      if (code === 'KeyG' || key === 'g' || keyCode === 71) {
        onTriggerOneShot('bite');
        socket.sendInteract();
        soundEngine.playBite();
        handled = true;
      }
      if (code === 'KeyH' || key === 'h' || keyCode === 72) {
        socket.sendToggleRest();
        handled = true;
      }
      if (code === 'KeyQ' || key === 'q' || keyCode === 81) {
        triggerScent();
        soundEngine.playScent();
        handled = true;
      }
      if (code === 'KeyT' || key === 't' || keyCode === 84) {
        rotateCurrentModel90();
        handled = true;
      }
      if (code === 'BracketLeft' || key === '[') {
        setDinoScaleMultiplier(useGameStore.getState().dinoScaleMultiplier - 0.1);
        handled = true;
      }
      if (code === 'BracketRight' || key === ']') {
        setDinoScaleMultiplier(useGameStore.getState().dinoScaleMultiplier + 0.1);
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
      const isCanvas = (e.target as HTMLElement)?.tagName === 'CANVAS';
      if (isCanvas) {
        canvas.focus();
      }
      if (e.button === 2) {
        isRightMouseDown.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      } else if (
        e.button === 0 &&
        isCanvas &&
        !useGameStore.getState().isChatOpen &&
        !useGameStore.getState().isSettingsOpen
      ) {
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
      // Kéo chuột lên trên (dy < 0) ngước nhìn tự do tới -81° ngắm trọn bầu trời/Mặt Trăng
      cameraPitch.current = Math.max(-1.42, Math.min(1.35, cameraPitch.current + dy * sensitivity));
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        isRightMouseDown.current = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      zoomDistance.current = Math.max(4, Math.min(34, zoomDistance.current + e.deltaY * 0.012));
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', resetKeys);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', resetKeys);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl, onTriggerOneShot, setDinoScaleMultiplier, rotateCurrentModel90, triggerScent, setChatOpen]);

  return {
    keys,
    isRightMouseDown,
    cameraYaw,
    cameraPitch,
    zoomDistance,
  };
}