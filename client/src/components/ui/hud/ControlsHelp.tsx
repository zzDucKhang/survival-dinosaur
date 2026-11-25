import React from 'react';
import { useGameStore } from '../../../store/useGameStore';

export const ControlsHelp: React.FC = () => {
  const showHelp = useGameStore((s) => s.showHelp);
  const toggleHelp = useGameStore((s) => s.toggleHelp);

  if (!showHelp) return null;

  return (
    <div style={{ position: 'absolute', top: '60px', left: '16px', pointerEvents: 'auto' }}>
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '11.5px',
          color: '#cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          width: '295px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: '700',
            color: '#38bdf8',
            marginBottom: '2px',
          }}
        >
          <span>🎮 PHÍM ĐIỀU KHIỂN</span>
          <span onClick={toggleHelp} style={{ cursor: 'pointer', color: '#94a3b8' }}>
            ✕
          </span>
        </div>
        <div>• <b>W / A / S / D (↑ ← ↓ →):</b> Di chuyển &amp; Rẽ</div>
        <div>• <b>Giữ Shift:</b> Chạy nước rút (Sprint)</div>
        <div>• <b>Chuột Phải + Kéo / Lăn:</b> Xoay 360° ngắm trời &amp; Zoom</div>
        <div>• <b>Chuột Trái / Space / F:</b> Cắn gây mất máu</div>
        <div>• <b>Phím E / R:</b> Quất đuôi (E) / Gầm vang (R)</div>
        <div>• <b>Phím G:</b> Uống nước tại hồ / Ăn thịt &amp; quả (+Lớn)</div>
        <div>• <b>Phím H:</b> Nghỉ ngơi hồi Máu/Thể lực nhanh</div>
        <div>• <b>Phím Q / Enter:</b> Đánh hơi / Chat phòng</div>
      </div>
    </div>
  );
};