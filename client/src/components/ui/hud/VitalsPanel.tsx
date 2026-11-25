import React from 'react';
import { useGameStore } from '../../../store/useGameStore';

export const VitalsPanel: React.FC = () => {
  const myName = useGameStore((s) => s.myName);
  const stamina = useGameStore((s) => s.stamina);
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const hunger = useGameStore((s) => s.hunger);
  const thirst = useGameStore((s) => s.thirst);
  const growth = useGameStore((s) => s.growth);
  const bleed = useGameStore((s) => s.bleed);
  const isResting = useGameStore((s) => s.isResting);
  const actionHint = useGameStore((s) => s.actionHint);

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
      }}
    >
      {actionHint && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.92)',
            color: '#030712',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: '800',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.45)',
          }}
        >
          {actionHint}
        </div>
      )}

      <div
        style={{
          width: '430px',
          background: 'rgba(15, 23, 42, 0.88)',
          border:
            bleed > 0
              ? '1px solid #ef4444'
              : isResting
              ? '1px solid #38bdf8'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '700', fontSize: '14px', color: '#f8fafc' }}>{myName}</span>
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
                💤 ĐANG NGHỈ [H]
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

        {/* Health & Stamina */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#f87171', marginBottom: '3px' }}>
              <span>❤️ MÁU</span>
              <span>
                {Math.round(health)}/{maxHealth}
              </span>
            </div>
            <div style={{ height: '7px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${hpPercent}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #dc2626)', transition: 'width 0.15s' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#34d399', marginBottom: '3px' }}>
              <span>⚡ THỂ LỰC</span>
              <span>{Math.round(stamina)}%</span>
            </div>
            <div style={{ height: '7px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${stamina}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', transition: 'width 0.1s' }} />
            </div>
          </div>
        </div>

        {/* Hunger & Thirst */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#fb923c', marginBottom: '3px' }}>
              <span>🍖 ĐÓI</span>
              <span>{hunger}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${hunger}%`, height: '100%', background: 'linear-gradient(90deg, #f97316, #ea580c)', transition: 'width 0.2s' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#38bdf8', marginBottom: '3px' }}>
              <span>💧 KHÁT</span>
              <span>{thirst}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${thirst}%`, height: '100%', background: 'linear-gradient(90deg, #0ea5e9, #0284c7)', transition: 'width 0.2s' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};