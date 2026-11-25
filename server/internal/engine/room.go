package engine

import (
	"fmt"
	"math"
	"strings"
	"sync"
	"time"

	"dino-server/internal/ai"
	"dino-server/internal/models"
	"dino-server/internal/world"
)

var (
	Players             = make(map[string]*models.Player)
	Foods               = make(map[string]*models.WorldFood)
	PlayersMutex        = sync.RWMutex{}
	PendingCombatEvents []models.CombatEvent
	PendingChats        []models.ChatMessage
	WorldTime           float64 = 0.36 // ~08:38 sáng
)

func spawnBot(id, name, model string, x, z, rot, growth float64) {
	baseHP, diet := GetSpeciesStats(model)
	scaledHP := ScaleMaxHP(baseHP, growth)
	y := math.Max(-0.2, world.GetTerrainHeight(x, z))
	Players[id] = &models.Player{
		ID:        id,
		Name:      name,
		Model:     model,
		Diet:      diet,
		X:         x,
		Y:         y,
		Z:         z,
		Rotation:  rot,
		AnimState: "idle",
		HP:        scaledHP,
		MaxHP:     scaledHP,
		BaseMaxHP: baseHP,
		Hunger:    90,
		Thirst:    90,
		Growth:    growth,
		IsAI:      true,
		AIState:   ai.StateWander,
	}
}

func init() {
	Foods = world.CreateInitialPlants()

	// 6 Bot Ăn Thịt đủ kích cỡ: Con non -> Mới lớn -> Trưởng thành -> Khổng lồ
	spawnBot("bot-baby-rex", "Baby Rex [Nhỏ]", "tyranno", 26, 22, 0.4, 0.38)
	spawnBot("bot-juvie-hunter", "Juvie Stalker", "t-rex", -36, 30, 1.2, 0.58)
	spawnBot("bot-adult-vicious", "Vicious Hunter", "dino_hunter_deadly_shores_vicious", 95, -25, -0.7, 0.92)
	spawnBot("bot-apex-rex", "Gorgon-Rex [Khổng Lồ]", "trex", -75, -65, 1.5, 1.32)
	spawnBot("bot-roam-tyranno", "Swift Tyranno", "tyranno", 145, 95, 2.2, 0.78)
	spawnBot("bot-valley-rex", "Valley Tyrant", "trex", -155, -105, -1.1, 1.15)

	// 6 Bot Ăn Cỏ đủ kích cỡ: Con non -> Mới lớn -> Trưởng thành -> Khổng lồ
	spawnBot("bot-baby-tricera", "Baby Tricera [Nhỏ]", "tricera", -24, -22, 0.8, 0.40)
	spawnBot("bot-juvie-stego", "Young Stego", "stego", 42, 48, -0.5, 0.65)
	spawnBot("bot-adult-stego", "Stego-Guardian", "stego", -95, 95, 1.9, 1.02)
	spawnBot("bot-adult-tricera", "Tricera-Bull", "tricera", 125, -125, 2.4, 1.08)
	spawnBot("bot-baby-mammoth", "Calf Mammoth [Nhỏ]", "mammoth", -55, 65, 0.2, 0.48)
	spawnBot("bot-titan-mammoth", "Titan Mammoth [Khổng Lồ]", "mammoth", -135, 165, -2.0, 1.30)
}

func GetSpeciesStats(model string) (baseHP int, diet string) {
	switch strings.ToLower(model) {
	case "mammoth":
		return 210, models.DietHerbivore
	case "tricera":
		return 175, models.DietHerbivore
	case "stego":
		return 165, models.DietHerbivore
	case "trex":
		return 150, models.DietCarnivore
	case "t-rex":
		return 135, models.DietCarnivore
	case "dino_hunter_deadly_shores_vicious":
		return 130, models.DietCarnivore
	case "tyranno":
		return 110, models.DietCarnivore
	default:
		return 120, models.DietCarnivore
	}
}

func AddPlayer(p *models.Player) {
	PlayersMutex.Lock()
	defer PlayersMutex.Unlock()

	baseHP, diet := GetSpeciesStats(p.Model)
	p.BaseMaxHP = baseHP
	p.Diet = diet
	p.Growth = 0.45 // Bắt đầu từ con non để thấy rõ quá trình lớn lên
	p.MaxHP = ScaleMaxHP(baseHP, p.Growth)
	p.HP = p.MaxHP
	p.Hunger = 90.0
	p.Thirst = 90.0
	p.Y = math.Max(-0.2, world.GetTerrainHeight(p.X, p.Z))
	Players[p.ID] = p

	PendingChats = append(PendingChats, models.ChatMessage{
		ID:        fmt.Sprintf("join-%d-%s", time.Now().UnixNano(), p.ID),
		Sender:    "ISLE",
		Text:      fmt.Sprintf("🦖 %s vừa tiến vào hòn đảo!", p.Name),
		IsSystem:  true,
		Timestamp: time.Now().UnixMilli(),
	})
}

func RemovePlayer(id string) {
	PlayersMutex.Lock()
	defer PlayersMutex.Unlock()
	if p, ok := Players[id]; ok {
		delete(Players, id)
		if !p.IsAI && p.Name != "" {
			PendingChats = append(PendingChats, models.ChatMessage{
				ID:        fmt.Sprintf("leave-%d-%s", time.Now().UnixNano(), id),
				Sender:    "ISLE",
				Text:      fmt.Sprintf("👋 %s đã rời khỏi hòn đảo.", p.Name),
				IsSystem:  true,
				Timestamp: time.Now().UnixMilli(),
			})
		}
	}
}

func UpdatePlayerMove(id string, x, _ float64, z, rot float64, anim string) {
	PlayersMutex.Lock()
	defer PlayersMutex.Unlock()
	if p, exists := Players[id]; exists {
		cx, cz := world.ResolveObstacleCollision(x, z, 1.4)
		if math.Hypot(cx-p.X, cz-p.Z) > 0.08 {
			p.IsResting = false
		}
		p.X = cx
		p.Z = cz
		p.Y = math.Max(-0.35, world.GetTerrainHeight(cx, cz))
		p.Rotation = rot
		p.AnimState = anim
	}
}

func AddChatMessage(sender, text string, isSystem bool) {
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		return
	}
	if len(trimmed) > 140 {
		trimmed = trimmed[:140]
	}

	PlayersMutex.Lock()
	defer PlayersMutex.Unlock()
	PendingChats = append(PendingChats, models.ChatMessage{
		ID:        fmt.Sprintf("chat-%d", time.Now().UnixNano()),
		Sender:    sender,
		Text:      trimmed,
		IsSystem:  isSystem,
		Timestamp: time.Now().UnixMilli(),
	})
}

func StepSimulation(dt float64) (
	map[string]*models.Player,
	map[string]*models.WorldFood,
	[]models.CombatEvent,
	[]models.ChatMessage,
	float64,
) {
	PlayersMutex.Lock()
	defer PlayersMutex.Unlock()

	WorldTime += dt / 600.0
	if WorldTime >= 1.0 {
		WorldTime -= 1.0
	}

	StepSurvival(dt)

	aiEvents := ai.StepBots(Players, Foods, dt)
	if len(aiEvents) > 0 {
		PendingCombatEvents = append(PendingCombatEvents, aiEvents...)
	}

	pSnap := make(map[string]*models.Player, len(Players))
	for k, v := range Players {
		pCopy := *v
		pSnap[k] = &pCopy
	}

	fSnap := make(map[string]*models.WorldFood, len(Foods))
	for k, v := range Foods {
		fCopy := *v
		fSnap[k] = &fCopy
	}

	events := make([]models.CombatEvent, len(PendingCombatEvents))
	copy(events, PendingCombatEvents)
	PendingCombatEvents = PendingCombatEvents[:0]

	chats := make([]models.ChatMessage, len(PendingChats))
	copy(chats, PendingChats)
	PendingChats = PendingChats[:0]

	return pSnap, fSnap, events, chats, WorldTime
}

func GetSnapshot() (map[string]*models.Player, map[string]*models.WorldFood, float64) {
	PlayersMutex.RLock()
	defer PlayersMutex.RUnlock()

	pSnap := make(map[string]*models.Player, len(Players))
	for k, v := range Players {
		pCopy := *v
		pSnap[k] = &pCopy
	}

	fSnap := make(map[string]*models.WorldFood, len(Foods))
	for k, v := range Foods {
		fCopy := *v
		fSnap[k] = &fCopy
	}

	return pSnap, fSnap, WorldTime
}