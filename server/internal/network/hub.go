package network

import (
	"crypto/rand"
	"fmt"
	"log"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 4096
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  2048,
	WriteBufferSize: 4096,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type MessageHandler interface {
	HandleMessage(clientID string, clientName *string, sendFn func([]byte), rawMsg []byte)
	HandleDisconnect(clientID string)
}

func GenerateUUID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

type Client struct {
	Hub    *Hub
	Conn   *websocket.Conn
	Send   chan []byte
	ID     string
	Name   string
	sendMu sync.Mutex
	closed bool
}

func (c *Client) TrySend(msg []byte) bool {
	c.sendMu.Lock()
	defer c.sendMu.Unlock()
	if c.closed {
		return false
	}
	select {
	case c.Send <- msg:
		return true
	default:
		return false
	}
}

func (c *Client) CloseSend() {
	c.sendMu.Lock()
	if !c.closed {
		c.closed = true
		close(c.Send)
	}
	c.sendMu.Unlock()
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	handler    MessageHandler
	mu         sync.Mutex
	count      atomic.Int32
}

func NewHub(handler MessageHandler) *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client, 64),
		unregister: make(chan *Client, 64),
		handler:    handler,
	}
}

func (h *Hub) ClientCount() int {
	return int(h.count.Load())
}

func (h *Hub) Broadcast(msg []byte) {
	if h.count.Load() == 0 {
		return
	}
	select {
	case h.broadcast <- msg:
	default:
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.count.Store(int32(len(h.clients)))
			h.mu.Unlock()
			log.Printf("[Hub] Client connected: %s (online=%d)", client.ID, h.ClientCount())

		case client := <-h.unregister:
			removed := false
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				h.count.Store(int32(len(h.clients)))
				removed = true
			}
			h.mu.Unlock()

			if removed {
				client.CloseSend()
				h.handler.HandleDisconnect(client.ID)
				log.Printf("[Hub] Client disconnected: %s (%s)", client.Name, client.ID)
			}

		case message := <-h.broadcast:
			var dropped []*Client
			h.mu.Lock()
			for client := range h.clients {
				if !client.TrySend(message) {
					delete(h.clients, client)
					dropped = append(dropped, client)
				}
			}
			if len(dropped) > 0 {
				h.count.Store(int32(len(h.clients)))
			}
			h.mu.Unlock()

			for _, client := range dropped {
				client.CloseSend()
				h.handler.HandleDisconnect(client.ID)
				log.Printf("[Hub] Dropped slow client: %s", client.ID)
			}
		}
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		_ = c.Conn.Close()
	}()
	c.Conn.SetReadLimit(maxMessageSize)
	_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	sendFn := func(b []byte) {
		c.TrySend(b)
	}

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[Client %s] Read error: %v", c.ID, err)
			}
			break
		}
		c.Hub.handler.HandleMessage(c.ID, &c.Name, sendFn, message)
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		_ = c.Conn.Close()
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
	client := &Client{
		Hub:  hub,
		Conn: conn,
		Send: make(chan []byte, 256),
		ID:   GenerateUUID(),
	}
	hub.register <- client
	go client.WritePump()
	go client.ReadPump()
}