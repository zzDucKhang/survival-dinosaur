package transport

import (
	"context"
	"crypto/rand"
	"fmt"
	"log"
	"net/http"
	"sync"
	"sync/atomic"

	"github.com/gorilla/websocket"
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

func (h *Hub) Unregister(c *Client) {
	select {
	case h.unregister <- c:
	default:
	}
}

func (h *Hub) Run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			h.closeAllClients()
			return

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

func (h *Hub) closeAllClients() {
	h.mu.Lock()
	all := make([]*Client, 0, len(h.clients))
	for c := range h.clients {
		all = append(all, c)
		delete(h.clients, c)
	}
	h.count.Store(0)
	h.mu.Unlock()

	for _, c := range all {
		c.CloseSend()
		_ = c.Conn.Close()
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