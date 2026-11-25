package engine

import (
	"encoding/json"
	"log"
	"time"

	"dino-server/internal/models"
)

type Broadcaster interface {
	Broadcast(msg []byte)
}

func StartGameLoop(hub Broadcaster) {
	ticker := time.NewTicker(50 * time.Millisecond) // 20 Hz
	lastTime := time.Now()
	log.Println("[Engine] Game loop started at 20 Hz (Survival + Growth + Day/Night + AI Ecosystem)")

	go func() {
		defer ticker.Stop()
		for range ticker.C {
			now := time.Now()
			dt := now.Sub(lastTime).Seconds()
			lastTime = now

			playersSnap, foodsSnap, events, chats, worldTime := StepSimulation(dt)

			syncMsg := models.OutboundMessage{
				Type:      "SYNC",
				Players:   playersSnap,
				Foods:     foodsSnap,
				Events:    events,
				Chats:     chats,
				WorldTime: worldTime,
			}
			payload, err := json.Marshal(syncMsg)
			if err != nil {
				continue
			}
			hub.Broadcast(payload)
		}
	}()
}