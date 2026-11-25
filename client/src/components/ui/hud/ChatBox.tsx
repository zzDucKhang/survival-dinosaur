import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { socket } from '../../../core/socket';

export const ChatBox: React.FC = () => {
  const chatMessages = useGameStore((s) => s.chatMessages);
  const isChatVisible = useGameStore((s) => s.isChatVisible);
  const isChatOpen = useGameStore((s) => s.isChatOpen);
  const setChatOpen = useGameStore((s) => s.setChatOpen);

  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const closeAndRefocusCanvas = () => {
    setChatOpen(false);
    const canvas = document.querySelector('canvas');
    if (canvas instanceof HTMLElement) {
      canvas.focus();
    }
  };

  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [chatMessages]);

  if (!isChatVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed) {
      socket.sendChat(trimmed);
      setText('');
    }
    closeAndRefocusCanvas();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      closeAndRefocusCanvas();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '14px',
        right: '16px',
        width: '310px',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div
        ref={listRef}
        style={{
          maxHeight: '150px',
          overflowY: 'auto',
          background: isChatOpen ? 'rgba(15, 23, 42, 0.88)' : 'rgba(15, 23, 42, 0.56)',
          borderRadius: '10px',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '11.5px',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        }}
      >
        {chatMessages.length === 0 ? (
          <div style={{ color: '#cbd5e1', fontSize: '11px' }}>
            💬 Nhấn <b>[Enter]</b> để chat cùng phòng LAN.
          </div>
        ) : (
          chatMessages.map((m) => (
            <div key={m.id} style={{ lineHeight: '1.35', wordBreak: 'break-word' }}>
              {m.isSystem ? (
                <span style={{ color: '#fde047', fontWeight: '600' }}>{m.text}</span>
              ) : (
                <>
                  <span style={{ color: '#34d399', fontWeight: '700' }}>{m.sender}: </span>
                  <span style={{ color: '#f8fafc' }}>{m.text}</span>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {isChatOpen ? (
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={closeAndRefocusCanvas}
            placeholder="Nhập tin nhắn (Enter gửi, Esc thoát)..."
            maxLength={140}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
              outline: 'none',
            }}
          />
        </form>
      ) : (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            alignSelf: 'flex-end',
            background: 'rgba(15, 23, 42, 0.78)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '7px',
            padding: '4px 10px',
            color: '#cbd5e1',
            fontSize: '10.5px',
            cursor: 'pointer',
          }}
        >
          💬 Nhấn [Enter] để Chat
        </button>
      )}
    </div>
  );
};