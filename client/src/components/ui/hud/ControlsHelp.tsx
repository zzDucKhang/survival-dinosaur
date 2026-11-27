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
          width: '345px',
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
          <span>🎮 PHÍM ĐIỀU KHIỂN (THE ISLE)</span>
          <span onClick={toggleHelp} style={{ cursor: 'pointer', color: '#94a3b8' }}>
            ✕
          </span>
        </div>
        <div>• <b>W / A / S / D (↑ ← ↓ →):</b> Di chuyển &amp; Rẽ</div>
        <div>• <b>Giữ Shift / Phím C:</b> Chạy nhanh / Rón rén ẩn nấp</div>
        <div>• <b>Chuột Phải + Kéo / Lăn:</b> Xoay 360° ngắm trời &amp; Zoom</div>
        <div>• <b>Chuột Trái / Space / F / E:</b> Cắn / Quất đuôi (E)</div>
        <div>• <b>Phím V:</b> Kỹ năng đặc trưng loài (Nghiền xương / Húc văng / Quất gai / Vồ mồi)</div>
        <div>• <b>Phím 1 / 2 / 3 / 4 / R:</b> 4 kiểu gọi (Lãnh thổ / Thân thiện / Đe dọa / Kêu cứu)</div>
        <div>• <b>Phím G:</b> Uống nước tại hồ / Ăn thịt &amp; quả (+Lớn)</div>
        <div>• <b>Phím H / Nút HUD:</b> Nghỉ ngơi (+20 HP/s, khóa hành động, mở sau 3s)</div>
        <div>• <b>Phím M / Bấm Radar:</b> Mở Bản đồ toàn đảo &amp; ghim dẫn đường 📍</div>
        <div>• <b>Phím N / Q:</b> Tầm nhìn đêm (giới hạn bán kính) / Đánh hơi thức ăn &amp; vệt máu</div>
        <div>• <b>Phím Tab / Nút 🏆:</b> Bảng sinh tồn &amp; Mời vào Bầy đàn</div>
        <div>• <b>Ngoài giao chiến 30s:</b> Tự động hồi +5 HP/giây</div>
      </div>
    </div>
  );
};