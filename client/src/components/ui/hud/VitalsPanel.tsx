import React from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { socket } from '../../../core/socket';
import { soundEngine } from '../../../core/sound';
import { getDinoSpec } from '../../../constants/dinosaurs';

export const VitalsPanel: React.FC = () => {
  const myName = useGameStore((s) => s.myName);
  const selectedModel = useGameStore((s) => s.selectedModel);
  const stamina = useGameStore((s) => s.stamina);
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const hunger = useGameStore((s) => s.hunger);
  const thirst = useGameStore((s) => s.thirst);
  const growth = useGameStore((s) => s.growth);
  const bleed = useGameStore((s) => s.bleed);
  const boneBreak = useGameStore((s) => s.boneBreak);
  const specialCd = useGameStore((s) => s.specialCd);
  const isResting = useGameStore((s) => s.isResting);
  const restUnlockLeft = useGameStore((s) => s.restUnlockLeft);
  const combatTimerLeft = useGameStore((s) => s.combatTimerLeft);
  const regenRate = useGameStore((s) => s.regenRate);
  const isCrouching = useGameStore((s) => s.isCrouching);
  const packId = useGameStore((s) => s.packId);
  const packInviteFrom = useGameStore((s) => s.packInviteFrom);
  const packInviteName = useGameStore((s) => s.packInviteName);
  const actionHint = useGameStore((s) => s.actionHint);

  const dino = getDinoSpec(selectedModel);
  const hpPercent = Math.max(0, Math.min(100, (health / Math.max(1, maxHealth)) * 100));
  const growthPct = Math.round(growth * 100);
  const stageLabel =
    growthPct >= 115
      ? 'APEX TITAN'
      : growthPct >= 95
      ? 'ADULT'
      : growthPct >= 65
      ? 'SUB-ADULT'
      : 'JUVENILE';

  const canExitRest = isResting && restUnlockLeft <= 0;
  const canUseSpecial = !isResting && specialCd <= 0;

  const refocusCanvas = () => {
    const canvas = document.querySelector('canvas');
    if (canvas instanceof HTMLElement) {
      canvas.focus();
    }
  };

  const handleRestButtonClick = () => {
    if (!isResting) {
      socket.sendToggleRest();
      soundEngine.playRest(true);
      refocusCanvas();
      return;
    }
    if (canExitRest) {
      socket.sendToggleRest();
      soundEngine.playRest(false);
      refocusCanvas();
    }
  };

  const handleSpecialButtonClick = () => {
    if (!canUseSpecial) return;
    // Gửi sự kiện phím V để đồng bộ animation, dash (nếu có) và gói tin server giống hệt khi bấm phím
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV', key: 'v', bubbles: true }));
    refocusCanvas();
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '22px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {/* Thông báo Lời mời vào Bầy Đàn */}
      {packInviteFrom && (
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(15, 23, 42, 0.96)',
            border: '1px solid #38bdf8',
            borderRadius: '10px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            boxShadow: '0 8px 24px rgba(56, 189, 248, 0.35)',
          }}
        >
          <span>
            🐾 <b style={{ color: '#7dd3fc' }}>{packInviteName || 'Người chơi'}</b> mời bạn vào Bầy Đàn!
          </span>
          <button
            onClick={() => {
              socket.sendPackAccept();
              refocusCanvas();
            }}
            style={{
              background: '#16a34a',
              border: 'none',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '800',
              cursor: 'pointer',
            }}
          >
            ✅ Đồng ý
          </button>
          <button
            onClick={() => {
              socket.sendPackLeave();
              refocusCanvas();
            }}
            style={{
              background: '#334155',
              border: 'none',
              color: '#cbd5e1',
              padding: '4px 9px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Hàng nút Kỹ năng [V] + Nghỉ ngơi [H] + Trạng thái Giao chiến / Hồi máu */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px',
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={handleSpecialButtonClick}
          disabled={!canUseSpecial}
          title={dino.specialDesc}
          style={{
            background: canUseSpecial
              ? 'linear-gradient(135deg, #d97706, #b45309)'
              : 'rgba(30, 41, 59, 0.9)',
            border: canUseSpecial ? '1px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
            color: canUseSpecial ? '#fffbeb' : '#94a3b8',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: '800',
            cursor: canUseSpecial ? 'pointer' : 'not-allowed',
            boxShadow: canUseSpecial ? '0 4px 14px rgba(245, 158, 11, 0.4)' : 'none',
          }}
        >
          {specialCd > 0
            ? `⏳ ${dino.specialName} (${specialCd.toFixed(1)}s)`
            : `⚡ ${dino.specialName} [V]`}
        </button>

        {!isResting ? (
          <button
            onClick={handleRestButtonClick}
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid #38bdf8',
              color: '#7dd3fc',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
            }}
          >
            💤 Nghỉ ngơi (+20 HP/s) [H]
          </button>
        ) : (
          <button
            onClick={handleRestButtonClick}
            disabled={!canExitRest}
            style={{
              background: canExitRest
                ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                : 'rgba(30, 41, 59, 0.92)',
              border: canExitRest ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.35)',
              color: canExitRest ? '#ffffff' : '#94a3b8',
              padding: '7px 18px',
              borderRadius: '999px',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: canExitRest ? 'pointer' : 'not-allowed',
              boxShadow: canExitRest ? '0 0 18px rgba(56, 189, 248, 0.55)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {canExitRest
              ? '✅ HẾT NGHỈ NGƠI [H]'
              : `🔒 Hết nghỉ ngơi (mở sau ${restUnlockLeft.toFixed(1)}s)`}
          </button>
        )}

        {combatTimerLeft > 0 && !isResting && (
          <div
            style={{
              background: 'rgba(127, 29, 29, 0.9)',
              border: '1px solid #f87171',
              color: '#fecaca',
              padding: '6px 12px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: '800',
            }}
          >
            ⚔️ Giao chiến ({combatTimerLeft}s nữa hồi +5 HP/s)
          </div>
        )}

        {regenRate > 0 && (
          <div
            style={{
              background:
                regenRate >= 20 ? 'rgba(2, 132, 199, 0.92)' : 'rgba(22, 163, 74, 0.92)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: '800',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            💚 Hồi +{regenRate} HP/s
          </div>
        )}
      </div>

      {actionHint && (
        <div
          style={{
            background: isResting ? 'rgba(2, 132, 199, 0.92)' : 'rgba(16, 185, 129, 0.92)',
            color: isResting ? '#f8fafc' : '#030712',
            padding: '5px 14px',
            borderRadius: '999px',
            fontSize: '11.5px',
            fontWeight: '800',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
          }}
        >
          {actionHint}
        </div>
      )}

      {/* Bảng chỉ số sinh tồn */}
      <div
        style={{
          width: '450px',
          background: 'rgba(15, 23, 42, 0.88)',
          border:
            bleed > 0
              ? '1px solid #ef4444'
              : boneBreak > 0
              ? '1px solid #fb923c'
              : isResting
              ? '1px solid #38bdf8'
              : isCrouching
              ? '1px solid #facc15'
              : '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '12px 18px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', fontSize: '14px', color: '#f8fafc' }}>{myName}</span>
            {packId && (
              <span
                style={{
                  background: '#0369a1',
                  color: '#e0f2fe',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                🐾 BẦY ĐÀN
              </span>
            )}
            {isResting && (
              <span
                style={{
                  background: '#0284c7',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                💤 KHÓA HÀNH ĐỘNG
              </span>
            )}
            {isCrouching && !isResting && (
              <span
                style={{
                  background: '#ca8a04',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                🐾 ẨN NẤP [C]
              </span>
            )}
            {boneBreak > 0 && (
              <span
                style={{
                  background: '#ea580c',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                🦴 GÃY XƯƠNG {boneBreak}s
              </span>
            )}
            {bleed > 0 && (
              <span
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                🩸 CHẢY MÁU {bleed}s
              </span>
            )}
          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#fde047' }}>
            🧬 {stageLabel} ({growthPct}%)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#f87171', marginBottom: '3px' }}>
              <span>❤️ MÁU {regenRate > 0 ? `(+${regenRate}/s)` : ''}</span>
              <span>
                {Math.round(health)}/{maxHealth}
              </span>
            </div>
            <div style={{ height: '7px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${hpPercent}%`,
                  height: '100%',
                  background:
                    regenRate > 0
                      ? 'linear-gradient(90deg, #ef4444, #22c55e)'
                      : 'linear-gradient(90deg, #ef4444, #dc2626)',
                  transition: 'width 0.15s',
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#34d399', marginBottom: '3px' }}>
              <span>⚡ THỂ LỰC</span>
              <span>{Math.round(stamina)}%</span>
            </div>
            <div style={{ height: '7px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${stamina}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  transition: 'width 0.1s',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#fb923c', marginBottom: '3px' }}>
              <span>🍖 ĐÓI</span>
              <span>{hunger}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${hunger}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f97316, #ea580c)',
                  transition: 'width 0.2s',
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#38bdf8', marginBottom: '3px' }}>
              <span>💧 KHÁT</span>
              <span>{thirst}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${thirst}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0ea5e9, #0284c7)',
                  transition: 'width 0.2s',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};