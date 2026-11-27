import React, { useEffect, useState } from "react";
import { getDinoSpec } from "../../config/species";
import { ipcSocket } from "../../services/ipcSocket";
import { worldTimeMutable } from "../../store/mutableCache";
import { useGameStore } from "../../store/useGameStore";
import type { WeatherType } from "../../types";

const WEATHER_BADGE: Record<WeatherType, { label: string; color: string }> = {
  clear: { label: "🌤️ Quang", color: "#fde68a" },
  fog: { label: "🌫️ Sương mù", color: "#cbd5e1" },
  rain: { label: "🌧️ Mưa rào", color: "#7dd3fc" },
  storm: { label: "⛈️ Bão giông", color: "#c084fc" },
};

export const TopStatusBar: React.FC = () => {
  const selectedModel = useGameStore((s) => s.selectedModel);
  const playerCount = useGameStore((s) => s.playerIds.length);
  const kills = useGameStore((s) => s.kills);
  const weather = useGameStore((s) => s.weather);
  const fps = useGameStore((s) => s.fps);
  const ipcConnected = useGameStore((s) => s.ipcConnected);
  const serverConnected = useGameStore((s) => s.serverConnected);

  const isSettingsOpen = useGameStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen);
  const isChatVisible = useGameStore((s) => s.isChatVisible);
  const toggleChatVisible = useGameStore((s) => s.toggleChatVisible);
  const showHelp = useGameStore((s) => s.showHelp);
  const toggleHelp = useGameStore((s) => s.toggleHelp);
  const rotateModel90 = useGameStore((s) => s.rotateModel90);
  const nightVision = useGameStore((s) => s.nightVision);
  const toggleNightVision = useGameStore((s) => s.toggleNightVision);
  const scentRemaining = useGameStore((s) => s.scentRemaining);
  const isMapOpen = useGameStore((s) => s.isMapOpen);
  const toggleMapOpen = useGameStore((s) => s.toggleMapOpen);
  const showLeaderboard = useGameStore((s) => s.showLeaderboard);
  const setShowLeaderboard = useGameStore((s) => s.setShowLeaderboard);

  const [clockLabel, setClockLabel] = useState("☀️ 08:30");

  useEffect(() => {
    const syncClock = () => {
      const totalMins = Math.floor(worldTimeMutable.value * 24 * 60);
      const hh = Math.floor(totalMins / 60) % 24;
      const mm = totalMins % 60;
      const icon = hh >= 6 && hh < 18 ? "☀️" : "🌙";
      setClockLabel(
        `${icon} ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
      );
    };
    syncClock();
    const timer = window.setInterval(syncClock, 500);
    return () => window.clearInterval(timer);
  }, []);

  const dino = getDinoSpec(selectedModel);
  const weatherMeta = WEATHER_BADGE[weather] || WEATHER_BADGE.clear;
  const fpsColor = fps >= 55 ? "#4ade80" : fps >= 30 ? "#facc15" : "#f87171";
  const online = ipcConnected && serverConnected;

  const iconBtnStyle = (active: boolean): React.CSSProperties => ({
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    border: active ? "1px solid #34d399" : "1px solid rgba(255,255,255,0.16)",
    background: active
      ? "rgba(16, 185, 129, 0.30)"
      : "rgba(11, 18, 32, 0.80)",
    color: "#f8fafc",
    fontSize: "17px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: active
      ? "0 4px 16px rgba(16, 185, 129, 0.35)"
      : "0 4px 12px rgba(0,0,0,0.4)",
  });

  const handleBtn =
    (fn: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.currentTarget.blur();
      fn();
    };

  return (
    <div
      style={{
        position: "absolute",
        top: "14px",
        left: "16px",
        maxWidth: "calc(100vw - 32px)",
        display: "flex",
        alignItems: "center",
        flexWrap: "nowrap",
        overflowX: "auto",
        gap: "8px",
        pointerEvents: "auto",
      }}
    >
      <button
        className="hud-icon-btn hud-glass"
        onClick={handleBtn(() => setSettingsOpen(!isSettingsOpen))}
        title="Cài đặt & Đồ họa"
        style={iconBtnStyle(isSettingsOpen)}
      >
        ⚙️
      </button>
      <button
        className="hud-icon-btn hud-glass"
        onClick={handleBtn(toggleChatVisible)}
        title="Ẩn / Hiện khung Chat"
        style={iconBtnStyle(isChatVisible)}
      >
        💬
      </button>
      <button
        className="hud-icon-btn hud-glass"
        onClick={handleBtn(toggleHelp)}
        title="Bảng phím điều khiển"
        style={iconBtnStyle(showHelp)}
      >
        🎮
      </button>
      <button
        className="hud-icon-btn hud-glass"
        onClick={handleBtn(rotateModel90)}
        title="Xoay hướng đầu thú 90° (Phím T)"
        style={iconBtnStyle(false)}
      >
        ↻
      </button>
      <button
        className="hud-icon-btn hud-glass"
        onClick={handleBtn(toggleNightVision)}
        title="Tầm nhìn Ban Đêm (Phím N)"
        style={iconBtnStyle(nightVision)}
      >
        👁️
      </button>
      <button
        className="hud-icon-btn hud-glass"
        onClick={handleBtn(() => ipcSocket.triggerScent())}
        title="Đánh hơi thức ăn, nước & vệt máu (Phím Q)"
        style={iconBtnStyle(scentRemaining > 0)}
      >
        👃
      </button>
      <button
        className="hud-icon-btn hud-glass"
        onClick={handleBtn(toggleMapOpen)}
        title="Mở Bản Đồ Toàn Đảo (Phím M)"
        style={iconBtnStyle(isMapOpen)}
      >
        🗺️
      </button>
      <button
        className="hud-icon-btn hud-glass"
        onClick={handleBtn(() => setShowLeaderboard(!showLeaderboard))}
        title="Bảng Sinh Tồn & Bầy Đàn (Tab)"
        style={iconBtnStyle(showLeaderboard)}
      >
        🏆
      </button>

      <div
        className="hud-glass"
        style={{
          height: "38px",
          background: "rgba(11, 18, 32, 0.88)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "10px",
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          gap: "11px",
          fontSize: "12px",
          fontWeight: 700,
          whiteSpace: "nowrap",
          flexShrink: 0,
          boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
        }}
      >
        <span style={{ color: "#4ade80" }}>
          {dino.icon} {dino.species}
        </span>
        <span style={{ color: "#475569" }}>|</span>
        <span style={{ color: "#fde047" }}>{clockLabel}</span>
        <span style={{ color: weatherMeta.color }}>{weatherMeta.label}</span>
        {scentRemaining > 0 && (
          <span style={{ color: "#38bdf8" }}>
            👃 {scentRemaining.toFixed(1)}s
          </span>
        )}
        <span style={{ color: "#f87171" }}>💀 {kills}</span>
        <span
          style={{
            color: "#38bdf8",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: online ? "#22c55e" : "#ef4444",
            }}
          />
          {playerCount}
        </span>
        <span
          style={{
            color: fpsColor,
            display: "inline-block",
            minWidth: "64px",
            textAlign: "right",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {fps} FPS
        </span>
      </div>
    </div>
  );
};
