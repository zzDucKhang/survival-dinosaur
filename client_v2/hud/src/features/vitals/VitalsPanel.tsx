import React from "react";
import { useGameStore } from "../../store/useGameStore";
import { ActionBar } from "./ActionBar";
import { PackInviteToast } from "./PackInviteToast";

export const VitalsPanel: React.FC = () => {
  const myName = useGameStore((s) => s.myName);
  const stamina = useGameStore((s) => s.stamina);
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const hunger = useGameStore((s) => s.hunger);
  const thirst = useGameStore((s) => s.thirst);
  const growth = useGameStore((s) => s.growth);
  const bleed = useGameStore((s) => s.bleed);
  const boneBreak = useGameStore((s) => s.boneBreak);
  const isResting = useGameStore((s) => s.isResting);
  const regenRate = useGameStore((s) => s.regenRate);
  const isCrouching = useGameStore((s) => s.isCrouching);
  const packId = useGameStore((s) => s.packId);
  const actionHint = useGameStore((s) => s.actionHint);

  const hpPercent = Math.max(
    0,
    Math.min(100, (health / Math.max(1, maxHealth)) * 100),
  );
  const isCritical = hpPercent < 25 || bleed > 0 || hunger < 18 || thirst < 18;
  const growthPct = Math.round(growth * 100);
  const stageLabel =
    growthPct >= 115
      ? "APEX TITAN"
      : growthPct >= 95
        ? "ADULT"
        : growthPct >= 65
          ? "SUB-ADULT"
          : "JUVENILE";

  return (
    <div
      style={{
        position: "absolute",
        bottom: "22px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        pointerEvents: "none",
      }}
    >
      <PackInviteToast />
      <ActionBar />

      {actionHint && (
        <div
          style={{
            background: isResting
              ? "rgba(2, 132, 199, 0.92)"
              : "rgba(16, 185, 129, 0.92)",
            color: isResting ? "#f8fafc" : "#030712",
            padding: "5px 14px",
            borderRadius: "999px",
            fontSize: "11.5px",
            fontWeight: 800,
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.45)",
          }}
        >
          {actionHint}
        </div>
      )}

      <div
        className={`hud-glass${isCritical ? " hud-critical-pulse" : ""}`}
        style={{
          width: "min(460px, 92vw)",
          background: "var(--bg-panel)",
          border:
            bleed > 0
              ? "1px solid #ef4444"
              : boneBreak > 0
                ? "1px solid #fb923c"
                : isResting
                  ? "1px solid #38bdf8"
                  : isCrouching
                    ? "1px solid #facc15"
                    : "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: "14px",
          padding: "13px 18px",
          boxShadow: "var(--shadow-panel)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{ fontWeight: 700, fontSize: "14px", color: "#f8fafc" }}
            >
              {myName}
            </span>
            {packId && (
              <StatusTag bg="#0369a1" color="#e0f2fe" text="🐾 BẦY ĐÀN" />
            )}
            {isResting && (
              <StatusTag bg="#0284c7" color="#fff" text="💤 KHÓA HÀNH ĐỘNG" />
            )}
            {isCrouching && !isResting && (
              <StatusTag bg="#ca8a04" color="#fff" text="🐾 ẨN NẤP [C]" />
            )}
            {boneBreak > 0 && (
              <StatusTag
                bg="#ea580c"
                color="#fff"
                text={`🦴 GÃY XƯƠNG ${boneBreak}s`}
              />
            )}
            {bleed > 0 && (
              <StatusTag
                bg="#dc2626"
                color="#fff"
                text={`🩸 CHẢY MÁU ${bleed}s`}
              />
            )}
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#fde047",
              whiteSpace: "nowrap",
            }}
          >
            🧬 {stageLabel} ({growthPct}%)
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "8px",
          }}
        >
          <VitalBar
            label={`❤️ MÁU${regenRate > 0 ? ` (+${regenRate}/s)` : ""}`}
            valueText={`${Math.round(health)}/${maxHealth}`}
            percent={hpPercent}
            color="#f87171"
            gradient={
              regenRate > 0
                ? "linear-gradient(90deg, #ef4444, #22c55e)"
                : "linear-gradient(90deg, #ef4444, #dc2626)"
            }
            height={7}
          />
          <VitalBar
            label="⚡ THỂ LỰC"
            valueText={`${Math.round(stamina)}%`}
            percent={stamina}
            color="#34d399"
            gradient="linear-gradient(90deg, #10b981, #059669)"
            height={7}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          <VitalBar
            label="🍖 ĐÓI"
            valueText={`${hunger}%`}
            percent={hunger}
            color="#fb923c"
            gradient="linear-gradient(90deg, #f97316, #ea580c)"
            height={6}
          />
          <VitalBar
            label="💧 KHÁT"
            valueText={`${thirst}%`}
            percent={thirst}
            color="#38bdf8"
            gradient="linear-gradient(90deg, #0ea5e9, #0284c7)"
            height={6}
          />
        </div>
      </div>
    </div>
  );
};

const StatusTag: React.FC<{ bg: string; color: string; text: string }> = ({
  bg,
  color,
  text,
}) => (
  <span
    style={{
      background: bg,
      color,
      fontSize: "10px",
      fontWeight: 800,
      padding: "2px 6px",
      borderRadius: "4px",
    }}
  >
    {text}
  </span>
);

const VitalBar: React.FC<{
  label: string;
  valueText: string;
  percent: number;
  color: string;
  gradient: string;
  height: number;
}> = ({ label, valueText, percent, color, gradient, height }) => (
  <div>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "10px",
        fontWeight: 700,
        color,
        marginBottom: "3px",
      }}
    >
      <span>{label}</span>
      <span>{valueText}</span>
    </div>
    <div
      style={{
        height: `${height}px`,
        background: "rgba(0,0,0,0.5)",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, percent))}%`,
          height: "100%",
          background: gradient,
          transition: "width 0.14s ease-out",
        }}
      />
    </div>
  </div>
);
