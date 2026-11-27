import React, { useEffect, useState } from "react";
import { combatEventsQueue, playersMutable } from "../../store/mutableCache";
import { useGameStore } from "../../store/useGameStore";

interface FeedItem {
  id: string;
  text: string;
  color: string;
  bg: string;
  border: string;
}

export const CombatFeed: React.FC = () => {
  const myId = useGameStore((s) => s.myId);
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const refresh = () => {
      const now = performance.now();
      const next: FeedItem[] = [];
      for (let i = combatEventsQueue.length - 1; i >= 0 && next.length < 4; i--) {
        const ev = combatEventsQueue[i];
        if (now - ev.createdAt > 4200) continue;
        if (ev.attackType === "roar") continue;

        const isMeAtk = Boolean(myId && ev.attackerId === myId);
        const isMeTarget = Boolean(myId && ev.targetId === myId);
        if (!isMeAtk && !isMeTarget && !ev.isKill) continue;

        const atkName = playersMutable[ev.attackerId]?.name || "Khủng long";
        const tgtName = playersMutable[ev.targetId]?.name || "Mục tiêu";

        if (ev.attackType === "heal" && isMeTarget) {
          next.push({
            id: ev.id,
            text: `💚 +${ev.damage} HP`,
            color: "#86efac",
            bg: "rgba(6, 78, 59, 0.78)",
            border: "rgba(52, 211, 153, 0.45)",
          });
        } else if (ev.attackType === "bleed" && isMeTarget) {
          next.push({
            id: ev.id,
            text: `🩸 Chảy máu -${ev.damage} HP`,
            color: "#fca5a5",
            bg: "rgba(127, 29, 29, 0.78)",
            border: "rgba(248, 113, 113, 0.45)",
          });
        } else if (ev.isKill) {
          next.push({
            id: ev.id,
            text: `💀 ${atkName} đã hạ gục ${tgtName}!`,
            color: "#fde047",
            bg: "rgba(120, 53, 15, 0.85)",
            border: "rgba(250, 204, 21, 0.55)",
          });
        } else if (isMeAtk) {
          const icon =
            ev.attackType === "bonebreak"
              ? "🦴"
              : ev.attackType === "special"
                ? "⚡"
                : "⚔️";
          next.push({
            id: ev.id,
            text: `${icon} Gây ${ev.damage} ST lên ${tgtName}`,
            color: "#fed7aa",
            bg: "rgba(124, 45, 18, 0.82)",
            border: "rgba(251, 146, 60, 0.5)",
          });
        } else if (isMeTarget) {
          next.push({
            id: ev.id,
            text: `💥 ${atkName} cắn -${ev.damage} HP`,
            color: "#fecaca",
            bg: "rgba(127, 29, 29, 0.84)",
            border: "rgba(239, 68, 68, 0.55)",
          });
        }
      }

      setItems((prev) => {
        if (
          prev.length === next.length &&
          prev.every((p, idx) => p.id === next[idx].id)
        ) {
          return prev;
        }
        return next;
      });
    };

    refresh();
    const timer = window.setInterval(refresh, 220);
    return () => window.clearInterval(timer);
  }, [myId]);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "22px",
        left: "16px",
        display: "flex",
        flexDirection: "column-reverse",
        gap: "6px",
        pointerEvents: "none",
        maxWidth: "clamp(170px, calc(50vw - 255px), 270px)",
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="hud-glass"
          style={{
            background: item.bg,
            border: `1px solid ${item.border}`,
            color: item.color,
            padding: "5px 11px",
            borderRadius: "8px",
            fontSize: "11.5px",
            fontWeight: 700,
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.45)",
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};
