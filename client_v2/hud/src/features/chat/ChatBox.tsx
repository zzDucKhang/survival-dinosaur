import React, { useEffect, useRef, useState } from "react";
import { ipcSocket } from "../../services/ipcSocket";
import { useGameStore } from "../../store/useGameStore";

export const ChatBox: React.FC = () => {
  const chatMessages = useGameStore((s) => s.chatMessages);
  const isChatVisible = useGameStore((s) => s.isChatVisible);
  const isChatOpen = useGameStore((s) => s.isChatOpen);
  const setChatOpen = useGameStore((s) => s.setChatOpen);

  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  const closeChat = () => {
    inputRef.current?.blur();
    setChatOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed) {
      ipcSocket.sendChat(trimmed);
      setText("");
    }
    closeChat();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      closeChat();
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "64px",
        right: "16px",
        width: "min(300px, calc(100vw - 32px))",
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <div
        ref={listRef}
        style={{
          maxHeight: "155px",
          overflowY: "auto",
          background: isChatOpen
            ? "rgba(15, 23, 42, 0.90)"
            : "rgba(15, 23, 42, 0.58)",
          borderRadius: "10px",
          padding: "8px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          fontSize: "11.5px",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
        }}
      >
        {chatMessages.length === 0 ? (
          <div style={{ color: "#cbd5e1", fontSize: "11px" }}>
            💬 Nhấn <b>[Enter]</b> để chat cùng phòng LAN / Online.
          </div>
        ) : (
          chatMessages.map((m) => (
            <div
              key={m.id}
              style={{ lineHeight: 1.35, wordBreak: "break-word" }}
            >
              {m.isSystem ? (
                <span style={{ color: "#fde047", fontWeight: 600 }}>
                  {m.text}
                </span>
              ) : (
                <>
                  <span style={{ color: "#34d399", fontWeight: 700 }}>
                    {m.sender}:{" "}
                  </span>
                  <span style={{ color: "#f8fafc" }}>{m.text}</span>
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
            onBlur={closeChat}
            placeholder="Nhập tin nhắn (Enter gửi, Esc thoát)..."
            maxLength={140}
            style={{
              width: "100%",
              padding: "8px 10px",
              background: "rgba(15, 23, 42, 0.96)",
              border: "1px solid #10b981",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px",
              outline: "none",
            }}
          />
        </form>
      ) : (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            alignSelf: "flex-end",
            background: "rgba(15, 23, 42, 0.78)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "7px",
            padding: "4px 10px",
            color: "#cbd5e1",
            fontSize: "10.5px",
            cursor: "pointer",
          }}
        >
          💬 Nhấn [Enter] để Chat
        </button>
      )}
    </div>
  );
};
