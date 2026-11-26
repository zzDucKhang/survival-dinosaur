import React from 'react';
import { createPortal } from 'react-dom';
import { playersMutable, useGameStore } from '../../../store/useGameStore';
import { getDinoSpec } from '../../../constants/dinosaurs';
import { socket } from '../../../core/socket';

export const LeaderboardModal: React.FC = () => {
  const showLeaderboard = useGameStore((s) => s.showLeaderboard);
  const setShowLeaderboard = useGameStore((s) => s.setShowLeaderboard);
  const myId = useGameStore((s) => s.myId);
  const myPackId = useGameStore((s) => s.packId);
  const selectedModel = useGameStore((s) => s.selectedModel);
  const playerIds = useGameStore((s) => s.playerIds);

  if (!showLeaderboard || typeof document === 'undefined') return null;

  const myDiet = getDinoSpec(selectedModel).diet;

  const list = playerIds
    .map((id) => playersMutable[id])
    .filter(Boolean)
    .sort((a, b) => {
      if (Boolean(a.isAi) !== Boolean(b.isAi)) return a.isAi ? 1 : -1;
      const killDiff = (b.kills || 0) - (a.kills || 0);
      if (killDiff !== 0) return killDiff;
      return (b.growth || 0) - (a.growth || 0);
    });

  const closeAndRefocus = () => {
    setShowLeaderboard(false);
    const canvas = document.querySelector('canvas');
    if (canvas instanceof HTMLElement) {
      canvas.focus();
    }
  };

  return createPortal(
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={closeAndRefocus}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(2, 6, 23, 0.58)',
        pointerEvents: 'auto',
        zIndex: 99999998,
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#fff',
        userSelect: 'none',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px, 94vw)',
          maxHeight: '76vh',
          overflowY: 'auto',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
          borderRadius: '14px',
          padding: '16px 20px',
          boxShadow: '0 20px 55px rgba(0,0,0,0.8)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '15px', fontWeight: '800', color: '#4ade80' }}>
            🏆 BẢNG SINH TỒN &amp; BẦY ĐÀN ({list.length})
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {myPackId && (
              <button
                onClick={() => socket.sendPackLeave()}
                style={{
                  background: 'rgba(239, 68, 68, 0.22)',
                  border: '1px solid rgba(239, 68, 68, 0.55)',
                  color: '#fca5a5',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                🚪 Rời Bầy Đàn
              </button>
            )}
            <button
              onClick={closeAndRefocus}
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.16)',
                color: '#cbd5e1',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Đóng [Tab]
            </button>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
              <th style={{ textAlign: 'left', padding: '6px 4px' }}>Tên</th>
              <th style={{ textAlign: 'left', padding: '6px 4px' }}>Loài</th>
              <th style={{ textAlign: 'right', padding: '6px 4px' }}>Lớn</th>
              <th style={{ textAlign: 'right', padding: '6px 4px' }}>HP</th>
              <th style={{ textAlign: 'right', padding: '6px 4px' }}>Hạ gục</th>
              <th style={{ textAlign: 'right', padding: '6px 4px' }}>Bầy đàn</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const isMe = p.id === myId;
              const spec = getDinoSpec(p.model);
              const isSamePack = Boolean(!p.isAi && myPackId && p.packId === myPackId);
              const canInvite = !isMe && !p.isAi && !isSamePack && (p.diet || spec.diet) === myDiet;

              return (
                <tr
                  key={p.id}
                  style={{
                    background: isMe
                      ? 'rgba(16, 185, 129, 0.16)'
                      : isSamePack
                      ? 'rgba(56, 189, 248, 0.14)'
                      : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <td
                    style={{
                      padding: '7px 4px',
                      fontWeight: isMe || isSamePack ? '800' : '600',
                      color: isMe ? '#4ade80' : isSamePack ? '#7dd3fc' : '#f8fafc',
                    }}
                  >
                    {p.isAi ? '🤖 ' : isSamePack ? '🐾 ' : '🦖 '}
                    {p.name}
                    {p.isResting ? ' 💤' : ''}
                  </td>
                  <td style={{ padding: '7px 4px', color: '#cbd5e1' }}>
                    {spec.icon} {spec.name}
                  </td>
                  <td style={{ padding: '7px 4px', textAlign: 'right', color: '#fde047', fontWeight: '700' }}>
                    {Math.round((p.growth || 0.45) * 100)}%
                  </td>
                  <td style={{ padding: '7px 4px', textAlign: 'right', color: '#fca5a5' }}>
                    {Math.round(p.hp || 0)}/{p.maxHp || 100}
                  </td>
                  <td style={{ padding: '7px 4px', textAlign: 'right', color: '#f87171', fontWeight: '800' }}>
                    {p.kills || 0}
                  </td>
                  <td style={{ padding: '7px 4px', textAlign: 'right' }}>
                    {isSamePack ? (
                      <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: '800' }}>
                        Đồng đội
                      </span>
                    ) : canInvite ? (
                      <button
                        onClick={() => socket.sendPackInvite(p.id)}
                        style={{
                          background: 'rgba(14, 165, 233, 0.25)',
                          border: '1px solid #38bdf8',
                          color: '#7dd3fc',
                          padding: '3px 8px',
                          borderRadius: '5px',
                          fontSize: '10.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        + Mời
                      </button>
                    ) : (
                      <span style={{ color: '#475569', fontSize: '11px' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>,
    document.body
  );
};