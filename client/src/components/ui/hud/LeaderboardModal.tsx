import React from 'react';
import { playersMutable, useGameStore } from '../../../store/useGameStore';
import { getDinoSpec } from '../../../constants/dinosaurs';

export const LeaderboardModal: React.FC = () => {
  const showLeaderboard = useGameStore((s) => s.showLeaderboard);
  const myId = useGameStore((s) => s.myId);
  const playerIds = useGameStore((s) => s.playerIds);

  if (!showLeaderboard) return null;

  const list = playerIds
    .map((id) => playersMutable[id])
    .filter(Boolean)
    .sort((a, b) => {
      if (Boolean(a.isAi) !== Boolean(b.isAi)) return a.isAi ? 1 : -1;
      const killDiff = (b.kills || 0) - (a.kills || 0);
      if (killDiff !== 0) return killDiff;
      return (b.growth || 0) - (a.growth || 0);
    });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(2, 6, 23, 0.45)',
        pointerEvents: 'none',
        zIndex: 75,
      }}
    >
      <div
        style={{
          width: '540px',
          maxHeight: '72vh',
          overflowY: 'auto',
          background: 'rgba(15, 23, 42, 0.94)',
          border: '1px solid rgba(52, 211, 153, 0.35)',
          borderRadius: '14px',
          padding: '16px 20px',
          boxShadow: '0 20px 55px rgba(0,0,0,0.75)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <span style={{ fontSize: '15px', fontWeight: '800', color: '#4ade80' }}>
            🏆 BẢNG SINH TỒN HÒN ĐẢO ({list.length})
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Thả [Tab] để đóng</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
              <th style={{ textAlign: 'left', padding: '6px 4px' }}>Tên</th>
              <th style={{ textAlign: 'left', padding: '6px 4px' }}>Loài</th>
              <th style={{ textAlign: 'right', padding: '6px 4px' }}>Trưởng thành</th>
              <th style={{ textAlign: 'right', padding: '6px 4px' }}>HP</th>
              <th style={{ textAlign: 'right', padding: '6px 4px' }}>Hạ gục</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const isMe = p.id === myId;
              const spec = getDinoSpec(p.model);
              return (
                <tr
                  key={p.id}
                  style={{
                    background: isMe ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <td style={{ padding: '7px 4px', fontWeight: isMe ? '800' : '600', color: isMe ? '#4ade80' : '#f8fafc' }}>
                    {p.isAi ? '🤖 ' : '🦖 '}
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};