import React from "react";
import { getDinoSpec } from "../../config/species";
import { ipcSocket } from "../../services/ipcSocket";
import { soundEngine } from "../../services/soundEngine";
import { useGameStore } from "../../store/useGameStore";

export const ActionBar: React.FC = () => {
  const selectedModel = useGameStore((s) => s.selectedModel);
  const specialCd = useGameStore((s) => s.specialCd);
  const isResting = useGameStore((s) => s.isResting);
  const restUnlockLeft = useGameStore((s) => s.restUnlockLeft);
  const combatTimerLeft = useGameStore((s) => s.combatTimerLeft);
  const regenRate = useGameStore((s) => s.regenRate);

  const dino = getDinoSpec(selectedModel);
  const canExitRest = isResting && restUnlockLeft <= 0;
  const canUseSpecial = !isResting && specialCd <= 0;
  const maxCd = Math.max(1, dino.special.cooldown);
  const cdProgressPct =
    specialCd > 0 ? Math.min(100, (specialCd / maxCd) * 100) : 0;

  const handleRestClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (!isResting) {
      ipcSocket.sendToggleRest();
      soundEngine.playRest(true);
    } else if (canExitRest) {
      ipcSocket.sendToggleRest();
      soundEngine.playRest(false);
    }
  };

  const handleSpecialClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (!canUseSpecial) return;
    ipcSocket.markLocalSpecialAudio();
    ipcSocket.sendSpecial();
    soundEngine.playSpecial();
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "8px",
        pointerEvents: "auto",
      }}
    >
      <button
        onClick={handleSpecialClick}
        disabled={!canUseSpecial}
        title={dino.special.desc}
        className="hud-icon-btn"
        style={{
          position: "relative",
          overflow: "hidden",
          background: canUseSpecial
            ? "linear-gradient(135deg, #d97706, #b45309)"
            : "rgba(15, 23, 42, 0.88)",
          border: canUseSpecial
            ? "1px solid #fbbf24"
            : "1px solid rgba(148, 163, 184, 0.3)",
          color: canUseSpecial ? "#fffbeb" : "#cbd5e1",
          padding: "6px 14px",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: 800,
          cursor: canUseSpecial ? "pointer" : "not-allowed",
          boxShadow: canUseSpecial
            ? "0 4px 16px rgba(245, 158, 11, 0.45)"
            : "none",
        }}
      >
        {cdProgressPct > 0 && (
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${100 - cdProgressPct}%`,
              background: "rgba(245, 158, 11, 0.25)",
              transition: "width 0.15s linear",
            }}
          />
        )}
        <span style={{ position: "relative" }}>
          {specialCd > 0
            ? `⏳ ${dino.special.name} (${specialCd.toFixed(1)}s)`
            : `⚡ ${dino.special.name} [V]`}
        </span>
      </button>

      {!isResting ? (
        <button
          onClick={handleRestClick}
          className="hud-icon-btn"
          style={{
            background: "rgba(15, 23, 42, 0.88)",
            border: "1px solid #38bdf8",
            color: "#7dd3fc",
            padding: "6px 14px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
          }}
        >
          💤 Nghỉ ngơi (+20 HP/s) [H]
        </button>
      ) : (
        <button
          onClick={handleRestClick}
          disabled={!canExitRest}
          className="hud-icon-btn"
          style={{
            background: canExitRest
              ? "linear-gradient(135deg, #0284c7, #0369a1)"
              : "rgba(30, 41, 59, 0.92)",
            border: canExitRest
              ? "1px solid #38bdf8"
              : "1px solid rgba(148, 163, 184, 0.35)",
            color: canExitRest ? "#ffffff" : "#94a3b8",
            padding: "7px 18px",
            borderRadius: "999px",
            fontSize: "12.5px",
            fontWeight: 800,
            cursor: canExitRest ? "pointer" : "not-allowed",
            boxShadow: canExitRest
              ? "0 0 18px rgba(56, 189, 248, 0.55)"
              : "none",
          }}
        >
          {canExitRest
            ? "✅ HẾT NGHỈ NGƠI [H]"
            : `🔒 Hết nghỉ ngơi (mở sau ${restUnlockLeft.toFixed(1)}s)`}
        </button>
      )}

      {combatTimerLeft > 0 && !isResting && (
        <div
          style={{
            background: "rgba(127, 29, 29, 0.9)",
            border: "1px solid #f87171",
            color: "#fecaca",
            padding: "6px 12px",
            borderRadius: "999px",
            fontSize: "11.5px",
            fontWeight: 800,
          }}
        >
          ⚔️ Giao chiến ({combatTimerLeft}s nữa hồi +5 HP/s)
        </div>
      )}

      {regenRate > 0 && (
        <div
          style={{
            background:
              regenRate >= 20
                ? "rgba(2, 132, 199, 0.92)"
                : "rgba(22, 163, 74, 0.92)",
            color: "#ffffff",
            padding: "6px 12px",
            borderRadius: "999px",
            fontSize: "11.5px",
            fontWeight: 800,
            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
          }}
        >
          💚 Hồi +{regenRate} HP/s
        </div>
      )}
    </div>
  );
};
