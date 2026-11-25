import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { socket } from '../../core/socket';
import { DINOSAURS } from '../../constants/dinosaurs';
import type { DinoModelType } from '../../types/game';

export const LoginScreen: React.FC = () => {
  const setMyName = useGameStore((s) => s.setMyName);
  const selectedModel = useGameStore((s) => s.selectedModel);
  const setSelectedModel = useGameStore((s) => s.setSelectedModel);
  const setJoined = useGameStore((s) => s.setJoined);
  const isConnected = useGameStore((s) => s.isConnected);

  const [nameInput, setNameInput] = useState('Apex Predator');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socket.connect();
  }, []);

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmed = nameInput.trim() || 'Wild Raptor';
    setMyName(trimmed);
    setLoading(true);

    socket.connect(() => {
      socket.join(trimmed, selectedModel);
      setJoined(true);
    });
  };

  const dinoList = Object.values(DINOSAURS);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #111827 0%, #030712 100%)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#f3f4f6',
        zIndex: 100,
        padding: '16px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.15,
          backgroundImage: 'radial-gradient(#22c55e 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 26px',
          background: 'rgba(17, 24, 39, 0.94)',
          border: '1px solid rgba(34, 197, 94, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(34, 197, 94, 0.15)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '38px', lineHeight: '1', marginBottom: '6px' }}>🦖</div>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: '900',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            margin: '0 0 4px 0',
            background: 'linear-gradient(135deg, #4ade80 0%, #10b981 50%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Dino Isle Web
        </h1>
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 12px 0', letterSpacing: '0.5px' }}>
          PREHISTORIC SURVIVAL SIMULATION ({dinoList.length} LOÀI SẴN SÀNG)
        </p>

        <div
          style={{
            alignSelf: 'center',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '9999px',
            fontSize: '12px',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? '#22c55e' : '#eab308',
            }}
          />
          <span style={{ color: isConnected ? '#86efac' : '#fde047' }}>
            {isConnected ? 'Máy chủ Go 8080: Sẵn sàng' : 'Đang kết nối Server Go (8080)...'}
          </span>
        </div>

        <form onSubmit={handleStartGame} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ textAlign: 'left', marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: '#34d399',
                marginBottom: '8px',
                letterSpacing: '1px',
              }}
            >
              CHỌN LOÀI KHỦNG LONG
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                gap: '10px',
                maxHeight: '260px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {dinoList.map((dino) => {
                const isSelected = selectedModel === dino.id;
                const isHerb = dino.diet === 'herbivore';
                return (
                  <div
                    key={dino.id}
                    onClick={() => setSelectedModel(dino.id as DinoModelType)}
                    style={{
                      background: isSelected ? 'rgba(16, 185, 129, 0.16)' : 'rgba(0, 0, 0, 0.4)',
                      border: isSelected ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '5px',
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{dino.icon}</span>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: '800',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          background: isHerb ? 'rgba(34, 197, 94, 0.25)' : 'rgba(249, 115, 22, 0.25)',
                          color: isHerb ? '#86efac' : '#fdba74',
                        }}
                      >
                        {dino.badge}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: isSelected ? '#4ade80' : '#f3f4f6',
                        marginBottom: '3px',
                      }}
                    >
                      {dino.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.3' }}>
                      {dino.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ textAlign: 'left', marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                color: '#9ca3af',
                marginBottom: '6px',
                letterSpacing: '1px',
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
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 14px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px 20px',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(22, 163, 74, 0.4)',
            }}
          >
            {loading ? 'ĐANG VÀO ĐẢO...' : 'VÀO SINH TỒN (ENTER THE ISLE)'}
          </button>
        </form>
      </div>
    </div>
  );
};