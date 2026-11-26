import React, { useEffect, useState } from "react";
import { useGameStore } from "../../store/useGameStore";

export const DamageOverlay: React.FC = () => {
  const lastDamagedAt = useGameStore((s) => s.lastDamagedAt);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastDamagedAt) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 380);
    return () => window.clearTimeout(timer);
  }, [lastDamagedAt]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        boxShadow: "inset 0 0 95px 35px rgba(220, 38, 38, 0.55)",
        transition: "opacity 0.25s ease-out",
        zIndex: 60,
      }}
    />
  );
};
