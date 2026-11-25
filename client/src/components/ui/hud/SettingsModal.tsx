import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { socket } from '../../../core/socket';
import type { GraphicsQuality } from '../../../types/game';

export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useGameStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen);
  const brightness = useGameStore((s) => s.brightness);
  const setBrightness = useGameStore((s) => s.setBrightness);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);
  const setGraphicsQuality = useGameStore((s) => s.setGraphicsQuality);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled);
  const dinoScaleMultiplier = useGameStore((s) => s.dinoScaleMultiplier);
  const setDinoScaleMultiplier = useGameStore((s) => s.setDinoScaleMultiplier);
  const rotateCurrentModel90 = useGameStore((s) => s.rotateCurrentModel90);
  const setJoined = useGameStore((s) => s.setJoined);

  if (!isSettingsOpen) return null;

  const closeModal = () => {
    setSettingsOpen(false);
    const canvas = document.querySelector('canvas');
    if (canvas instanceof HTMLElement) {
      canvas.focus();
    }
  };

  const handleLeave = () => {
    setSettingsOpen(false);
    socket.disconnect();
    setJoined(false);
  };

  const qualities: Array<{ id: GraphicsQuality; label: string }> = [
    { id: 'low', label: 'Thấp (Max FPS)' },
    { id: 'medium', label: 'Trung bình' },
    { id: 'high', label: 'Cao' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 23, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        zIndex: 80,
      }}
      onClick={closeModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '380px',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(52, 211, 153, 0.35)',
          borderRadius: '14px',
          padding: '20px 22px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.75)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: '800', color: '#4ade80' }}>
            ⚙️ CÀI ĐẶT GAME (SETTINGS)
          </span>
          <button
            onClick={closeModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Độ sáng màn hình */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: '#cbd5e1', fontWeight: '600' }}>☀️ Độ sáng màn hình (Brightness)</span>
            <span style={{ color: '#fde047', fontWeight: '700' }}>{Math.round(brightness * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.8}
            max={2.1}
            step={0.05}
            value={brightness}
            onChange={(e) => setBrightness(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
          />
        </div>

        {/* Chất lượng đồ họa */}
        <div>
          <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600', marginBottom: '6px' }}>
            🖥️ Chất lượng Đồ họa (Tối ưu FPS)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {qualities.map((q) => {
              const active = graphicsQuality === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => setGraphicsQuality(q.id)}
                  style={{
                    padding: '7px 6px',
                    borderRadius: '7px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    border: active ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.12)',
                    background: active ? 'rgba(16, 185, 129, 0.25)' : '#1e293b',
                    color: active ? '#4ade80' : '#cbd5e1',
                  }}
                >
                  {q.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Âm thanh & Xoay đầu */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              padding: '9px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.14)',
              background: soundEnabled ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
              color: soundEnabled ? '#4ade80' : '#94a3b8',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            {soundEnabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT'}
          </button>

          <button
            onClick={rotateCurrentModel90}
            style={{
              padding: '9px 10px',
              borderRadius: '8px',
              border: '1px solid #38bdf8',
              background: 'rgba(56, 189, 248, 0.14)',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            ↻ Xoay đầu 90° (T)
          </button>
        </div>

        {/* Hệ số kích thước tổng */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: '#cbd5e1', fontWeight: '600' }}>📏 Hệ số Kích thước Thú ([ / ])</span>
            <span style={{ color: '#34d399', fontWeight: '700' }}>{dinoScaleMultiplier.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.4}
            max={2.2}
            step={0.1}
            value={dinoScaleMultiplier}
            onChange={(e) => setDinoScaleMultiplier(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '2px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={closeModal}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: '#16a34a',
              color: '#fff',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Tiếp tục chơi
          </button>
          <button
            onClick={handleLeave}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            🚪 Đổi Loài / Rời
          </button>
        </div>
      </div>
    </div>
  );
};