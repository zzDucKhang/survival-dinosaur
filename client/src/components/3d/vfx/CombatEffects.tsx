import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { combatEventsQueue } from '../../../store/useGameStore';
import type { CombatEvent } from '../../../types/game';

interface ActivePopup extends CombatEvent {
  createdAt: number;
}

const ROAR_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: '📢 GẦM LÃNH THỔ!', color: '#fde047' },
  2: { label: '💚 GỌI BẦY THÂN THIỆN', color: '#4ade80' },
  3: { label: '💢 GẦM ĐE DỌA!', color: '#fb923c' },
  4: { label: '🆘 KÊU CỨU!', color: '#f43f5e' },
};

export const CombatEffects: React.FC = () => {
  const [popups, setPopups] = useState<ActivePopup[]>([]);
  const lastFrameUpdateRef = useRef(0);

  useFrame(() => {
    const now = performance.now();
    while (combatEventsQueue.length > 0 && now - combatEventsQueue[0].createdAt > 1250) {
      combatEventsQueue.shift();
    }
    if (combatEventsQueue.length > 0) {
      if (now - lastFrameUpdateRef.current >= 33) {
        lastFrameUpdateRef.current = now;
        setPopups([...combatEventsQueue]);
      }
    } else if (popups.length > 0) {
      setPopups([]);
    }
  });

  const now = performance.now();

  return (
    <group>
      {popups.map((evt) => {
        const age = Math.min(1, (now - evt.createdAt) / 1250);
        const yOffset = evt.y + age * 2.4;
        const isHeal = evt.attackType === 'heal';
        const isRoar = evt.attackType === 'roar';
        const isBoneBreak = evt.attackType === 'bonebreak';
        const isSpecial = evt.attackType === 'special';
        const roarMeta = ROAR_LABELS[evt.damage] || ROAR_LABELS[1];

        let text = `🩸 -${evt.damage} HP`;
        let color = '#ef4444';
        if (evt.isKill) {
          text = `💀 HẠ GỤC! -${evt.damage}`;
          color = '#fde047';
        } else if (isBoneBreak) {
          text = `🦴 GÃY XƯƠNG! -${evt.damage}`;
          color = '#fb923c';
        } else if (isSpecial) {
          text = `⚡ CHIÊU MẠNH! -${evt.damage}`;
          color = '#facc15';
        } else if (isHeal) {
          text = `💚 +${evt.damage} HP`;
          color = evt.damage >= 15 ? '#38bdf8' : '#4ade80';
        } else if (isRoar) {
          text = roarMeta.label;
          color = roarMeta.color;
        }

        return (
          <group key={evt.id} position={[evt.x, yOffset, evt.z]}>
            <Html center distanceFactor={25}>
              <div
                style={{
                  pointerEvents: 'none',
                  userSelect: 'none',
                  opacity: 1 - age * 0.85,
                  transform: `scale(${1 + (1 - age) * 0.22})`,
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: '900',
                  fontSize: evt.isKill || isRoar || isBoneBreak ? '17px' : '15px',
                  color,
                  textShadow: '0 2px 8px rgba(0,0,0,0.95)',
                  whiteSpace: 'nowrap',
                }}
              >
                {text}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};