package engine

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"dino-server-v2/internal/config"
	"dino-server-v2/internal/domain"
	"dino-server-v2/internal/protocol"
	"dino-server-v2/internal/store"
	"dino-server-v2/internal/world"
)

type Broadcaster interface {
	Broadcast(msg []byte)
	ClientCount() int
}

type DeathCallback func(target, attacker *domain.Entity, cause string, now time.Time)

type BotController interface {
	SpawnInitial(spawnFn func(id, name, model string, x, z, rot, growth float64))
	Step(
		entities map[string]*domain.Entity,
		foods map[string]*domain.WorldFood,
		dt float64,
		onDeath DeathCallback,
	) []domain.CombatEvent
}

type GameEngine struct {
	cfg             config.ServerConfig
	reg             *config.Registry
	world           *world.World
	store           *store.MemoryStore
	bots            BotController
	plantRegenAccum float64
	tickCount       uint64
}

func NewGameEngine(
	cfg config.ServerConfig,
	reg *config.Registry,
	wld *world.World,
	st *store.MemoryStore,
	bots BotController,
) *GameEngine {
	eng := &GameEngine{
		cfg:   cfg,
		reg:   reg,
		world: wld,
		store: st,
		bots:  bots,
	}
	if bots != nil {
		st.Lock()
		bots.SpawnInitial(eng.SpawnBotLocked)
		st.Unlock()
	}
	return eng
}

func (e *GameEngine) GetFullSnapshot() (
	map[string]*protocol.PlayerDTO,
	map[string]*protocol.WorldFoodDTO,
	[]protocol.BloodTrailDTO,
	float64,
	string,
) {
	return e.store.GetFullSnapshot()
}

func (e *GameEngine) StatusSummary() (entitiesCount, foodsCount int, worldTime float64, weather string) {
	return e.store.StatusSummary()
}

func (e *GameEngine) AddChatMessage(sender, text string, isSystem bool) {
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		return
	}
	if len(trimmed) > 140 {
		trimmed = trimmed[:140]
	}
	e.store.Lock()
	defer e.store.Unlock()
	e.store.AppendChatLocked(domain.ChatMessage{
		ID:        fmt.Sprintf("chat-%d", time.Now().UnixNano()),
		Sender:    sender,
		Text:      trimmed,
		IsSystem:  isSystem,
		Timestamp: time.Now().UnixMilli(),
	})
}

func (e *GameEngine) Start(ctx context.Context, hub Broadcaster) {
	tickRate := e.cfg.TickRate
	if tickRate <= 0 {
		tickRate = 50 * time.Millisecond
	}
	ticker := time.NewTicker(tickRate)
	lastTime := time.Now()
	log.Printf("[Engine] Loop started at %v/tick (Weather + Skills + BoneBreak + Pack + BloodTrails)", tickRate)

	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				log.Println("[Engine] Loop stopped gracefully")
				return
			case <-ticker.C:
				now := time.Now()
				dt := now.Sub(lastTime).Seconds()
				lastTime = now
				if dt > 0.15 {
					dt = 0.15
				}
				e.stepTick(hub, dt)
			}
		}
	}()
}

func (e *GameEngine) stepTick(hub Broadcaster, dt float64) {
	hasClients := hub.ClientCount() > 0
	e.tickCount++

	e.store.Lock()
	e.store.WorldTime += dt / 600.0
	if e.store.WorldTime >= 1.0 {
		e.store.WorldTime -= 1.0
	}

	e.stepWeatherLocked(dt)
	e.stepSurvivalLocked(dt)

	if e.bots != nil {
		aiEvents := e.bots.Step(e.store.Entities, e.store.Foods, dt, e.HandleDeathLocked)
		for _, ev := range aiEvents {
			e.store.AppendCombatEventLocked(ev)
		}
	}

	if !hasClients {
		e.store.PendingCombatEvents = e.store.PendingCombatEvents[:0]
		e.store.PendingChats = e.store.PendingChats[:0]
		e.store.Unlock()
		return
	}

	forceAux := e.tickCount%100 == 0
	playersSnap, foodsSnap, bloodSnap, events, chats, worldTime, weather :=
		e.store.FlushTickSnapshotLocked(forceAux)
	e.store.Unlock()

	syncMsg := protocol.OutboundMessage{
		Type:        "SYNC",
		Players:     playersSnap,
		Foods:       foodsSnap,
		BloodTrails: bloodSnap,
		Events:      events,
		Chats:       chats,
		WorldTime:   worldTime,
		Weather:     weather,
	}
	payload, err := json.Marshal(syncMsg)
	if err != nil {
		return
	}
	hub.Broadcast(payload)
}