import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameStore } from './store/useGameStore';
import { LoginScreen } from './components/ui/LoginScreen';
import { GameHUD } from './components/ui/GameHUD';
import { Scene } from './components/3d/Scene';

const LoadingFallback: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b1324',
        color: '#4ade80',
        fontFamily: 'system-ui, sans-serif',
        zIndex: 99,
      }}
    >
      <div style={{ fontSize: '48px' }}>🦖</div>
      <h2 style={{ margin: '16px 0 8px 0', fontSize: '20px', letterSpacing: '1px' }}>
        ĐANG TẢI HỆ SINH THÁI KHỦNG LONG...
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '13px' }}>
        Khởi tạo bản đồ núi &amp; thung lũng 10x + đồng bộ mạng 20Hz...
      </p>
    </div>
  );
};

export const App: React.FC = () => {
  const isJoined = useGameStore((s) => s.isJoined);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);

  const dpr: [number, number] =
    graphicsQuality === 'low' ? [0.8, 1] : graphicsQuality === 'high' ? [1, 1.5] : [1, 1.25];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {!isJoined ? (
        <LoginScreen />
      ) : (
        <>
          <Suspense fallback={<LoadingFallback />}>
            <Canvas
              shadows={graphicsQuality !== 'low'}
              dpr={dpr}
              camera={{ position: [0, 8, -16], fov: 58, near: 0.3, far: 3500 }}
              gl={{ antialias: graphicsQuality !== 'low', powerPreference: 'high-performance' }}
            >
              <Scene />
            </Canvas>
          </Suspense>
          <GameHUD />
        </>
      )}
    </div>
  );
};

export default App;