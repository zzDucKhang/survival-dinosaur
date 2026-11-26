import React from "react";
import { ipcSocket } from "../../services/ipcSocket";
import { useGameStore } from "../../store/useGameStore";

export const PackInviteToast: React.FC = () => {
  const packInviteFrom = useGameStore((s) => s.packInviteFrom);
  const packInviteName = useGameStore((s) => s.packInviteName);

  if (!packInviteFrom) return null;

  return (
    <div
      style={{
        pointerEvents: "auto",
        background: "var(--bg-panel-solid)",
        border: "1px solid var(--accent-sky)",
        borderRadius: "10px",
        padding: "8px 14px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "12px",
        boxShadow: "0 8px 24px rgba(56, 189, 248, 0.35)",
      }}
    >
      <span>
        🐾 <b style={{ color: "#7dd3fc" }}>{packInviteName || "Người chơi"}</b>{" "}
        mời bạn vào Bầy Đàn!
      </span>
      <button
        onClick={(e) => {
          e.currentTarget.blur();
          ipcSocket.sendPackAccept();
        }}
        style={{
          background: "#16a34a",
          border: "none",
          color: "#fff",
          padding: "4px 10px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        ✅ Đồng ý
      </button>
      <button
        onClick={(e) => {
          e.currentTarget.blur();
          ipcSocket.sendPackLeave();
        }}
        style={{
          background: "#334155",
          border: "none",
          color: "#cbd5e1",
          padding: "4px 9px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ✕
      </button>
    </div>
  );
};
