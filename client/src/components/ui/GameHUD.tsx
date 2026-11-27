import React from 'react';
import { RobloxTopLeftBar } from './hud/RobloxTopLeftBar';
import { SettingsModal } from './hud/SettingsModal';
import { VitalsPanel } from './hud/VitalsPanel';
import { RadarMinimap } from './hud/RadarMinimap';
import { ControlsHelp } from './hud/ControlsHelp';
import { DamageOverlay } from './hud/DamageOverlay';
import { ChatBox } from './hud/ChatBox';
import { NightVisionOverlay } from './hud/NightVisionOverlay';
import { DeathOverlay } from './hud/DeathOverlay';
import { LeaderboardModal } from './hud/LeaderboardModal';
import { WorldMapModal } from './hud/WorldMapModal';

export const GameHUD: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        userSelect: 'none',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#fff',
        zIndex: 20000000,
      }}
    >
      <NightVisionOverlay />
      <DamageOverlay />
      <RobloxTopLeftBar />
      <ChatBox />
      <ControlsHelp />
      <VitalsPanel />
      <RadarMinimap />
      <WorldMapModal />
      <LeaderboardModal />
      <DeathOverlay />
      <SettingsModal />
    </div>
  );
};