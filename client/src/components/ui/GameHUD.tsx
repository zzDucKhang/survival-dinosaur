import React from 'react';
import { RobloxTopLeftBar } from './hud/RobloxTopLeftBar';
import { SettingsModal } from './hud/SettingsModal';
import { VitalsPanel } from './hud/VitalsPanel';
import { RadarMinimap } from './hud/RadarMinimap';
import { ControlsHelp } from './hud/ControlsHelp';
import { DamageOverlay } from './hud/DamageOverlay';
import { ChatBox } from './hud/ChatBox';

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
        zIndex: 50,
      }}
    >
      <DamageOverlay />
      <RobloxTopLeftBar />
      <ChatBox />
      <ControlsHelp />
      <VitalsPanel />
      <RadarMinimap />
      <SettingsModal />
    </div>
  );
};