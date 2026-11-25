package network

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"dino-server/internal/engine"
	"dino-server/internal/models"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 4096
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func GenerateUUID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

type Client struct {
	Hub  *Hub
	Conn *websocket.Conn
	Send chan []byte
	ID   string
	Name string
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("[Hub] Client connected: %s", client.ID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
				engine.RemovePlayer(client.ID)
				log.Printf("[Hub] Client disconnected: %s (%s)", client.Name, client.ID)
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.Lock()
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
					engine.RemovePlayer(client.ID)
				}
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) Broadcast(msg []byte) {
	select {
	case h.broadcast <- msg:
	default:
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()
	c.Conn.SetReadLimit(maxMessageSize)
	_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[Client %s] Read error: %v", c.ID, err)
			}
			break
		}

		var inbound models.InboundMessage
		if err := json.Unmarshal(message, &inbound); err != nil {
			continue
		}

		switch inbound.Type {
		case "JOIN":
			var payload models.JoinPayload
			if err := json.Unmarshal(inbound.Payload, &payload); err == nil {
				c.Name = strings.TrimSpace(payload.Name)
				if c.Name == "" {
					c.Name = "Wild Raptor"
				}
				modelType := payload.Model
				if modelType == "" {
					modelType = "trex"
				}

				player := &models.Player{
					ID:        c.ID,
					Name:      c.Name,
					Model:     modelType,
					X:         0.0,
					Y:         0.0,
					Z:         0.0,
					Rotation:  0.0,
					AnimState: "idle",
					IsAI:      false,
				}
				engine.AddPlayer(player)

				playersSnap, foodsSnap, worldTime := engine.GetSnapshot()
				initResp := models.OutboundMessage{
					Type:      "INIT",
					ID:        c.ID,
					Players:   playersSnap,
					Foods:     foodsSnap,
					WorldTime: worldTime,
				}
				if respBytes, err := json.Marshal(initResp); err == nil {
					select {
					case c.Send <- respBytes:
					default:
					}
				}
				log.Printf("[Client] Player joined: %s (%s) model=%s", c.Name, c.ID, modelType)
			}

		case "MOVE":
			var payload models.MovePayload
			if err := json.Unmarshal(inbound.Payload, &payload); err == nil {
				engine.UpdatePlayerMove(c.ID, payload.X, payload.Y, payload.Z, payload.Rotation, payload.AnimState)
			}

		case "ATTACK":
			var payload models.AttackPayload
			if err := json.Unmarshal(inbound.Payload, &payload); err == nil {
				engine.ProcessPlayerAttack(c.ID, payload.AttackType)
			}

		case "INTERACT":
			engine.ProcessInteract(c.ID)

		case "CHAT":
			var payload models.ChatPayload
			if err := json.Unmarshal(inbound.Payload, &payload); err == nil {
				engine.AddChatMessage(c.Name, payload.Text, false)
			}

		case "REST":
			engine.ToggleRest(c.ID)
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.Send:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("[ServeWs] Upgrade error:", err)
		return
	}
	clientID := GenerateUUID()
	client := &Client{
		Hub:  hub,
		Conn: conn,
		Send: make(chan []byte, 256),
		ID:   clientID,
	}
	hub.register <- client
	go client.WritePump()
	go client.ReadPump()
}