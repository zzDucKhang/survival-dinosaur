import React, { useEffect } from "react";
import { useGameStore } from "../../store/useGameStore";

export const DeathOverlay: React.FC = () => {
  const deathInfo = useGameStore((s) => s.deathInfo);
  const dismissDeathOverlay = useGameStore((s) => s.dismissDeathOverlay);

  useEffect(() => {
    if (!deathInfo) return;
    const timer = window.setTimeout(() => dismissDeathOverlay(), 5500);
    return () => window.clearTimeout(timer);
  }, [deathInfo, dismissDeathOverlay]);

  if (!deathInfo) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "radial-gradient(circle, rgba(127,29,29,0.45) 0%, rgba(2,6,23,0.82) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
        zIndex: 850,
      }}
    >
      <div
        style={{
          background: "var(--bg-panel-solid)",
          border: "1px solid rgba(239, 68, 68, 0.55)",
          borderRadius: "16px",
          padding: "28px 36px",
          textAlign: "center",
          maxWidth: "400px",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <div style={{ fontSize: "42px", marginBottom: "8px" }}>💀</div>
        <h2
          style={{
            margin: "0 0 8px 0",
            color: "#f87171",
            fontSize: "22px",
            fontWeight: 900,
            letterSpacing: "1.5px",
          }}
        >
          BẠN ĐÃ BỊ HẠ GỤC!
        </h2>
        <p
          style={{ margin: "0 0 6px 0", color: "#e2e8f0", fontSize: "13.5px" }}
        >
          Nguyên nhân: <b style={{ color: "#fde047" }}>{deathInfo.killedBy}</b>
        </p>
        <p style={{ margin: "0 0 18px 0", color: "#94a3b8", fontSize: "12px" }}>
          Bạn đã được hồi sinh ở vị trí mới dưới dạng con non (45% trưởng
          thành).
        </p>
        <button
          onClick={dismissDeathOverlay}
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            border: "none",
            background: "linear-gradient(135deg, #16a34a, #15803d)",
            color: "#fff",
            fontWeight: 800,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Tiếp tục sinh tồn
        </button>
      </div>
    </div>
  );
};
