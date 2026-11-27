import React, { useEffect } from "react";
import { ipcSocket } from "./services/ipcSocket";
import { useGameStore } from "./store/useGameStore";
import { LoginScreen } from "./features/login/LoginScreen";
import { TopStatusBar } from "./features/topbar/TopStatusBar";
import { ChatBox } from "./features/chat/ChatBox";
import { VitalsPanel } from "./features/vitals/VitalsPanel";
import { RadarMinimap } from "./features/radar/RadarMinimap";
import { WorldMapModal } from "./features/map/WorldMapModal";
import { LeaderboardModal } from "./features/leaderboard/LeaderboardModal";
import { SettingsModal } from "./features/settings/SettingsModal";
import { ControlsHelp } from "./features/overlays/ControlsHelp";
import { DamageOverlay } from "./features/overlays/DamageOverlay";
import { DeathOverlay } from "./features/overlays/DeathOverlay";
import { NightVisionOverlay } from "./features/overlays/NightVisionOverlay";

export const App: React.FC = () => {
  const isJoined = useGameStore((s) => s.isJoined);
  const isOverlayMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("overlay") === "1";

  useEffect(() => {
    ipcSocket.connect();
    return () => ipcSocket.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const st = useGameStore.getState();
      if (
        !st.isJoined ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        st.isChatOpen
      )
        return;

      if (e.code === "Escape") {
        if (st.isMapOpen) st.setMapOpen(false);
        else if (st.isSettingsOpen) st.setSettingsOpen(false);
        else if (st.deathInfo) st.dismissDeathOverlay();
        return;
      }
      if (e.code === "KeyM" && !e.repeat && !st.isSettingsOpen) {
        e.preventDefault();
        st.toggleMapOpen();
        return;
      }
      if (e.code === "Tab") {
        e.preventDefault();
        st.setShowLeaderboard(true);
        return;
      }
      if (
        e.code === "Enter" &&
        !e.repeat &&
        !st.isMapOpen &&
        !st.isSettingsOpen
      ) {
        e.preventDefault();
        st.setChatOpen(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Tab") {
        useGameStore.getState().setShowLeaderboard(false);
      }
    };

    const onBlur = () => {
      useGameStore.getState().setShowLeaderboard(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: isOverlayMode ? "transparent" : "#060c16",
      }}
    >
      {!isJoined ? (
        <LoginScreen />
      ) : (
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            color: "#fff",
          }}
        >
          <NightVisionOverlay />
          <DamageOverlay />
          <TopStatusBar />
          <ChatBox />
          <ControlsHelp />
          <VitalsPanel />
          <RadarMinimap />
          <WorldMapModal />
          <LeaderboardModal />
          <DeathOverlay />
          <SettingsModal />
        </div>
      )}
    </div>
  );
};

export default App;
