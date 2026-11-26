import React, { useEffect, useState } from "react";
import { getDinoSpec } from "../../config/species";
import { worldTimeMutable } from "../../store/mutableCache";
import { useGameStore } from "../../store/useGameStore";

export const NightVisionOverlay: React.FC = () => {
  const nightVision = useGameStore((s) => s.nightVision);
  const selectedModel = useGameStore((s) => s.selectedModel);
  const [isDaytime, setIsDaytime] = useState(false);

  useEffect(() => {
    if (!nightVision) return;
    const check = () => {
      const sunAngle = (worldTimeMutable.value - 0.25) * Math.PI * 2;
      setIsDaytime(Math.sin(sunAngle) > 0.15);
    };
    check();
    const timer = window.setInterval(check, 500);
    return () => window.clearInterval(timer);
  }, [nightVision]);

  if (!nightVision) return null;

  const dino = getDinoSpec(selectedModel);
  const nvRadius = dino.diet === "carnivore" ? 55 : 42;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        background: isDaytime
          ? "radial-gradient(circle, transparent 58%, rgba(6, 78, 59, 0.22) 100%)"
          : "radial-gradient(circle, rgba(16, 185, 129, 0.03) 36%, rgba(2, 18, 14, 0.52) 82%, rgba(0, 6, 5, 0.80) 100%)",
        boxShadow: "inset 0 0 90px rgba(6, 78, 59, 0.35)",
        zIndex: 45,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "18px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(4, 38, 29, 0.86)",
          border: "1px solid #34d399",
          color: "#6ee7b7",
          padding: "5px 14px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.8px",
          whiteSpace: "nowrap",
        }}
      >
        👁️ TẦM NHÌN BAN ĐÊM • RÕ TRONG BÁN KÍNH {nvRadius}m [N]
        {isDaytime ? " • (Đang ban ngày)" : ""}
      </div>
    </div>
  );
};
