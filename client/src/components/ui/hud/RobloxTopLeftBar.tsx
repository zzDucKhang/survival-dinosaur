import React, { useEffect, useState } from 'react';
import { useGameStore, worldTimeMutable } from '../../../store/useGameStore';
import { getDinoSpec } from '../../../constants/dinosaurs';

export const RobloxTopLeftBar: React.FC = () => {
  const selectedModel = useGameStore((s) => s.selectedModel);
  const playerCount = useGameStore((s) => s.playerIds.length);
  const kills = useGameStore((s) => s.kills);
  const isConnected = useGameStore((s) => s.isConnected);
  const isSettingsOpen = useGameStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen);
  const isChatVisible = useGameStore((s) => s.isChatVisible);
  const toggleChatVisible = useGameStore((s) => s.toggleChatVisible);
  const showHelp = useGameStore((s) => s.showHelp);
  const toggleHelp = useGameStore((s) => s.toggleHelp);
  const rotateCurrentModel90 = useGameStore((s) => s.rotateCurrentModel90);

  const [fps, setFps] = useState(60);
  const [clockLabel, setClockLabel] = useState('☀️ 08:30');

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const calcFps = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastTime;
      if (elapsed >= 500) {
        setFps(Math.round((frameCount * 1000) / elapsed));
        frameCount = 0;
        lastTime = now;

        const totalMins = Math.floor(worldTimeMutable.value * 24 * 60);
        const hh = Math.floor(totalMins / 60) % 24;
        const mm = totalMins % 60;
        const icon = hh >= 6 && hh < 18 ? '☀️' : '🌙';
        setClockLabel(`${icon} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
      }
      animId = requestAnimationFrame(calcFps);
    };

    animId = requestAnimationFrame(calcFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  const dino = getDinoSpec(selectedModel);
  const fpsColor = fps >= 55 ? '#4ade80' : fps >= 30 ? '#facc15' : '#f87171';

  const iconBtnStyle = (active: boolean): React.CSSProperties => ({
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    border: active ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.16)',
    background: active ? 'rgba(16, 185, 129, 0.28)' : 'rgba(15, 23, 42, 0.84)',
    color: '#f8fafc',
    fontSize: '17px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    transition: 'transform 0.1s ease, background 0.15s ease',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: '14px',
        left: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'auto',
      }}
    >
      {/* Cụm nút điều khiển phong cách Roblox */}
      <button
        onClick={() => setSettingsOpen(!isSettingsOpen)}
        title="Cài đặt & Đồ họa (Settings)"
        style={iconBtnStyle(isSettingsOpen)}
      >
        ⚙️
      </button>

      <button
        onClick={toggleChatVisible}
        title="Ẩn / Hiện khung Chat"
        style={iconBtnStyle(isChatVisible)}
      >
        💬
      </button>

      <button
        onClick={toggleHelp}
        title="Bảng phím điều khiển"
        style={iconBtnStyle(showHelp)}
      >
        🎮
      </button>

      <button
        onClick={rotateCurrentModel90}
        title="Xoay hướng đầu thú 90° (Phím T)"
        style={iconBtnStyle(false)}
      >
        ↻
      </button>

      {/* Thanh thông tin nhanh */}
      <div
        style={{
          height: '38px',
          background: 'rgba(15, 23, 42, 0.84)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '10px',
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '12px',
          fontWeight: '700',
          boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
        }}
      >
        <span style={{ color: '#4ade80' }}>
          {dino.icon} {dino.species}
        </span>
        <span style={{ color: '#475569' }}>|</span>
        <span style={{ color: '#fde047' }}>{clockLabel}</span>
        <span style={{ color: '#f87171' }}>💀 {kills}</span>
        <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: isConnected ? '#22c55e' : '#ef4444',
            }}
          />
          {playerCount}
        </span>
        <span style={{ color: fpsColor }}>{fps} FPS</span>
      </div>
    </div>
  );
};