import React, { useState } from "react";
import { DINO_LIST } from "../../config/species";
import { ipcSocket } from "../../services/ipcSocket";
import { useGameStore } from "../../store/useGameStore";
import type { DinoModelType } from "../../types";

export const LoginScreen: React.FC = () => {
  const ipcConnected = useGameStore((s) => s.ipcConnected);
  const serverConnected = useGameStore((s) => s.serverConnected);
  const myName = useGameStore((s) => s.myName);
  const selectedModel = useGameStore((s) => s.selectedModel);
  const setMyName = useGameStore((s) => s.setMyName);
  const setSelectedModel = useGameStore((s) => s.setSelectedModel);

  const [nameInput, setNameInput] = useState(myName || "Apex Predator");
  const [submitting, setSubmitting] = useState(false);

  const canJoin = ipcConnected && serverConnected;

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipcConnected || submitting) return;
    const trimmed = nameInput.trim() || "Wild Raptor";
    setMyName(trimmed);
    setSubmitting(true);
    ipcSocket.join(trimmed, selectedModel);
    window.setTimeout(() => setSubmitting(false), 1500);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at center, rgba(17,24,39,0.92) 0%, rgba(3,7,18,0.97) 100%)",
        color: "#f3f4f6",
        zIndex: 100,
        padding: "16px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "740px",
          maxHeight: "94vh",
          display: "flex",
          flexDirection: "column",
          padding: "24px 26px",
          background: "var(--bg-panel-solid)",
          border: "1px solid var(--border-emerald)",
          borderRadius: "16px",
          boxShadow: "var(--shadow-modal)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "36px", lineHeight: 1, marginBottom: "6px" }}>
          🦖
        </div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 900,
            letterSpacing: "2px",
            textTransform: "uppercase",
            margin: "0 0 4px 0",
            background:
              "linear-gradient(135deg, #4ade80 0%, #10b981 50%, #059669 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Dino Isle Native
        </h1>
        <p
          style={{
            fontSize: "11px",
            color: "#9ca3af",
            margin: "0 0 12px 0",
            letterSpacing: "0.6px",
          }}
        >
          RUST BEVY 3D ENGINE + TYPESCRIPT HUD ({DINO_LIST.length} LOÀI SẴN
          SÀNG)
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <StatusPill
            ok={ipcConnected}
            okText="Bevy Engine (IPC :9001): Đã kết nối"
            waitText="Đang chờ dino-isle-native.exe (:9001)..."
          />
          <StatusPill
            ok={serverConnected}
            okText="Server Go (:8080): Sẵn sàng"
            waitText="Server Go (:8080): Chưa kết nối"
          />
        </div>

        <form
          onSubmit={handleStartGame}
          style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          <div style={{ textAlign: "left", marginBottom: "14px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#34d399",
                marginBottom: "8px",
                letterSpacing: "1px",
              }}
            >
              CHỌN LOÀI KHỦNG LONG
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))",
                gap: "10px",
                maxHeight: "260px",
                overflowY: "auto",
                paddingRight: "4px",
              }}
            >
              {DINO_LIST.map((dino) => {
                const isSelected =
                  selectedModel.toLowerCase() === dino.id.toLowerCase();
                const isHerb = dino.diet === "herbivore";
                return (
                  <div
                    key={dino.id}
                    onClick={() => setSelectedModel(dino.id as DinoModelType)}
                    style={{
                      background: isSelected
                        ? "rgba(16, 185, 129, 0.16)"
                        : "rgba(0, 0, 0, 0.42)",
                      border: isSelected
                        ? "2px solid #10b981"
                        : "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "10px",
                      padding: "10px 12px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>{dino.icon}</span>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 800,
                          padding: "2px 5px",
                          borderRadius: "4px",
                          background: isHerb
                            ? "rgba(34, 197, 94, 0.25)"
                            : "rgba(249, 115, 22, 0.25)",
                          color: isHerb ? "#86efac" : "#fdba74",
                        }}
                      >
                        {dino.badge}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: isSelected ? "#4ade80" : "#f3f4f6",
                        marginBottom: "3px",
                      }}
                    >
                      {dino.name}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#9ca3af",
                        lineHeight: 1.3,
                      }}
                    >
                      {dino.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ textAlign: "left", marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                color: "#9ca3af",
                marginBottom: "6px",
                letterSpacing: "1px",
              }}
            >
              Tên Khủng Long (Player Name)
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Nhập tên khủng long..."
              maxLength={20}
              required
              style={{
                width: "100%",
                padding: "11px 14px",
                background: "rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(34, 197, 94, 0.4)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!ipcConnected || submitting}
            style={{
              width: "100%",
              padding: "13px 20px",
              background: canJoin
                ? "linear-gradient(135deg, #16a34a 0%, #15803d 100%)"
                : "rgba(51, 65, 85, 0.85)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              cursor: ipcConnected ? "pointer" : "not-allowed",
              boxShadow: canJoin ? "0 4px 20px rgba(22, 163, 74, 0.4)" : "none",
            }}
          >
            {submitting
              ? "ĐANG VÀO ĐẢO..."
              : ipcConnected
                ? "VÀO SINH TỒN (ENTER THE ISLE)"
                : "HÃY MỞ DINO-ISLE-NATIVE.EXE TRƯỚC"}
          </button>
        </form>
      </div>
    </div>
  );
};

const StatusPill: React.FC<{
  ok: boolean;
  okText: string;
  waitText: string;
}> = ({ ok, okText, waitText }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "7px",
      padding: "4px 12px",
      background: "rgba(0, 0, 0, 0.42)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "9999px",
      fontSize: "11.5px",
    }}
  >
    <span
      style={{
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: ok ? "#22c55e" : "#eab308",
      }}
    />
    <span style={{ color: ok ? "#86efac" : "#fde047" }}>
      {ok ? okText : waitText}
    </span>
  </div>
);
