import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { combatEventsQueue } from '../../../store/useGameStore';
import type { CombatEvent } from '../../../types/game';

interface ActivePopup extends CombatEvent {
  createdAt: number;
}

export const CombatEffects: React.FC = () => {
  const [popups, setPopups] = useState<ActivePopup[]>([]);
  const lastFrameUpdateRef = useRef(0);

  useFrame(() => {
    const now = performance.now();
    while (combatEventsQueue.length > 0 && now - combatEventsQueue[0].createdAt > 1100) {
      combatEventsQueue.shift();
    }

    // Chỉ re-render ở ~30Hz khi đang có popup sát thương; khi không chiến đấu = 0 re-render
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
        const age = Math.min(1, (now - evt.createdAt) / 1100);
        const yOffset = evt.y + age * 2.2;
        return (
          <group key={evt.id} position={[evt.x, yOffset, evt.z]}>
            <Html center distanceFactor={25}>
              <div
                style={{
                  pointerEvents: 'none',
                  userSelect: 'none',
                  opacity: 1 - age * 0.85,
                  transform: `scale(${1 + (1 - age) * 0.25})`,
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: '900',
                  fontSize: evt.isKill ? '18px' : '15px',
                  color: evt.isKill ? '#fde047' : '#ef4444',
                  textShadow: '0 2px 8px rgba(0,0,0,0.95)',
                  whiteSpace: 'nowrap',
                }}
              >
                {evt.isKill ? `💀 HẠ GỤC! -${evt.damage}` : `🩸 -${evt.damage} HP`}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};