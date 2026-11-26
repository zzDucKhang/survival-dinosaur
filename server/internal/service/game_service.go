package service

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"strings"
	"time"

	"dino-server/internal/ai"
	"dino-server/internal/models"
	"dino-server/internal/repository"
	"dino-server/internal/world"
)

type Broadcaster interface {
	Broadcast(msg []byte)
	ClientCount() int
}

type GameService struct {
	repo            *repository.WorldRepository
	plantRegenAccum float64
	tickCount       uint64
}

func NewGameService(repo *repository.WorldRepository) *GameService {
	svc := &GameService{repo: repo}
	svc.spawnInitialBots()
	return svc
}

func (s *GameService) spawnBotLocked(id, name, model string, x, z, rot, growth float64) {
	baseHP, diet := s.GetSpeciesStats(model)
	scaledHP := s.ScaleMaxHP(baseHP, growth)
	y := world.GetEntityGroundHeight(x, z)
	s.repo.Players[id] = &models.Player{
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

func (s *GameService) spawnInitialBots() {
	s.repo.Lock()
	defer s.repo.Unlock()

	// 6 Bot Ăn Thịt
	s.spawnBotLocked("bot-baby-rex", "Baby Rex [Nhỏ]", "tyranno", 26, 22, 0.4, 0.38)
	s.spawnBotLocked("bot-juvie-hunter", "Juvie Stalker", "t-rex", -36, 30, 1.2, 0.58)
	s.spawnBotLocked("bot-adult-vicious", "Vicious Hunter", "dino_hunter_deadly_shores_vicious", 95, -25, -0.7, 0.92)
	s.spawnBotLocked("bot-apex-rex", "Gorgon-Rex [Khổng Lồ]", "trex", -75, -65, 1.5, 1.32)
	s.spawnBotLocked("bot-roam-tyranno", "Swift Tyranno", "tyranno", 145, 95, 2.2, 0.78)
	s.spawnBotLocked("bot-valley-rex", "Valley Tyrant", "trex", -155, -105, -1.1, 1.15)

	// 6 Bot Ăn Cỏ
	s.spawnBotLocked("bot-baby-tricera", "Baby Tricera [Nhỏ]", "tricera", -24, -22, 0.8, 0.40)
	s.spawnBotLocked("bot-juvie-stego", "Young Stego", "stego", 42, 48, -0.5, 0.65)
	s.spawnBotLocked("bot-adult-stego", "Stego-Guardian", "stego", -95, 95, 1.9, 1.02)
	s.spawnBotLocked("bot-adult-tricera", "Tricera-Bull", "tricera", 125, -125, 2.4, 1.08)
	s.spawnBotLocked("bot-baby-mammoth", "Calf Mammoth [Nhỏ]", "mammoth", -55, 65, 0.2, 0.48)
	s.spawnBotLocked("bot-titan-mammoth", "Titan Mammoth [Khổng Lồ]", "mammoth", -135, 165, -2.0, 1.30)
}

func (s *GameService) GetSpeciesStats(model string) (baseHP int, diet string) {
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

func (s *GameService) AddPlayer(p *models.Player) {
	s.repo.Lock()
	defer s.repo.Unlock()

	baseHP, diet := s.GetSpeciesStats(p.Model)
	p.BaseMaxHP = baseHP
	p.Diet = diet
	p.Growth = 0.45
	p.MaxHP = s.ScaleMaxHP(baseHP, p.Growth)
	p.HP = p.MaxHP
	p.Hunger = 90.0
	p.Thirst = 90.0
	p.IsResting = false
	p.RestUnlockLeft = 0
	p.CombatTimerLeft = 0
	p.RegenRate = 0
	p.IsCrouching = false
	p.BoneBreakTimer = 0
	p.SpecialCDLeft = 0
	p.Y = world.GetEntityGroundHeight(p.X, p.Z)
	s.repo.Players[p.ID] = p

	s.repo.PendingChats = append(s.repo.PendingChats, models.ChatMessage{
		ID:        fmt.Sprintf("join-%d-%s", time.Now().UnixNano(), p.ID),
		Sender:    "ISLE",
		Text:      fmt.Sprintf("🦖 %s vừa tiến vào hòn đảo!", p.Name),
		IsSystem:  true,
		Timestamp: time.Now().UnixMilli(),
	})
}

func (s *GameService) RemovePlayer(id string) {
	s.repo.Lock()
	defer s.repo.Unlock()

	if p, ok := s.repo.Players[id]; ok {
		delete(s.repo.Players, id)
		if !p.IsAI && p.Name != "" {
			s.repo.PendingChats = append(s.repo.PendingChats, models.ChatMessage{
				ID:        fmt.Sprintf("leave-%d-%s", time.Now().UnixNano(), id),
				Sender:    "ISLE",
				Text:      fmt.Sprintf("👋 %s đã rời khỏi hòn đảo.", p.Name),
				IsSystem:  true,
				Timestamp: time.Now().UnixMilli(),
			})
		}
	}
}

func (s *GameService) UpdatePlayerMove(id string, x, _ float64, z, rot float64, anim string) {
	s.repo.Lock()
	defer s.repo.Unlock()

	if p, exists := s.repo.Players[id]; exists {
		if p.IsResting {
			p.AnimState = "rest"
			return
		}
		cx, cz := world.ResolveObstacleCollision(x, z, 1.4)
		p.X = cx
		p.Z = cz
		p.Y = world.GetEntityGroundHeight(cx, cz)
		p.Rotation = rot
		p.AnimState = anim
	}
}

func (s *GameService) AddChatMessage(sender, text string, isSystem bool) {
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		return
	}
	if len(trimmed) > 140 {
		trimmed = trimmed[:140]
	}

	s.repo.Lock()
	defer s.repo.Unlock()

	s.repo.PendingChats = append(s.repo.PendingChats, models.ChatMessage{
		ID:        fmt.Sprintf("chat-%d", time.Now().UnixNano()),
		Sender:    sender,
		Text:      trimmed,
		IsSystem:  isSystem,
		Timestamp: time.Now().UnixMilli(),
	})
}

// ==========================================
// HỆ THỐNG BẦY ĐÀN (PACK / HERD)
// ==========================================
func (s *GameService) InviteToPack(inviterID, targetID string) {
	s.repo.Lock()
	defer s.repo.Unlock()

	if inviterID == targetID {
		return
	}
	inviter, ok1 := s.repo.Players[inviterID]
	target, ok2 := s.repo.Players[targetID]
	if !ok1 || !ok2 || target.IsAI {
		return
	}
	// Chỉ cho ghép bầy đàn cùng hệ ăn thịt hoặc cùng hệ ăn cỏ
	if inviter.Diet != target.Diet {
		return
	}
	if inviter.PackID == "" {
		inviter.PackID = fmt.Sprintf("pack-%s", inviter.ID[:8])
	}
	target.PackInviteFrom = inviter.ID
	target.PackInviteName = inviter.Name

	s.repo.PendingChats = append(s.repo.PendingChats, models.ChatMessage{
		ID:        fmt.Sprintf("pack-inv-%d", time.Now().UnixNano()),
		Sender:    "ISLE",
		Text:      fmt.Sprintf("🐾 %s đã mời %s gia nhập Bầy Đàn!", inviter.Name, target.Name),
		IsSystem:  true,
		Timestamp: time.Now().UnixMilli(),
	})
}

func (s *GameService) AcceptPackInvite(playerID string) {
	s.repo.Lock()
	defer s.repo.Unlock()

	p, ok := s.repo.Players[playerID]
	if !ok || p.PackInviteFrom == "" {
		return
	}
	inviter, okInv := s.repo.Players[p.PackInviteFrom]
	if !okInv || inviter.Diet != p.Diet {
		p.PackInviteFrom = ""
		p.PackInviteName = ""
		return
	}
	if inviter.PackID == "" {
		inviter.PackID = fmt.Sprintf("pack-%s", inviter.ID[:8])
	}
	p.PackID = inviter.PackID
	p.PackInviteFrom = ""
	p.PackInviteName = ""

	s.repo.PendingChats = append(s.repo.PendingChats, models.ChatMessage{
		ID:        fmt.Sprintf("pack-acc-%d", time.Now().UnixNano()),
		Sender:    "ISLE",
		Text:      fmt.Sprintf("🤝 %s đã gia nhập Bầy Đàn cùng %s!", p.Name, inviter.Name),
		IsSystem:  true,
		Timestamp: time.Now().UnixMilli(),
	})
}

func (s *GameService) LeavePack(playerID string) {
	s.repo.Lock()
	defer s.repo.Unlock()

	p, ok := s.repo.Players[playerID]
	if !ok {
		return
	}
	p.PackInviteFrom = ""
	p.PackInviteName = ""
	if p.PackID != "" {
		p.PackID = ""
		s.repo.PendingChats = append(s.repo.PendingChats, models.ChatMessage{
			ID:        fmt.Sprintf("pack-lv-%d", time.Now().UnixNano()),
			Sender:    "ISLE",
			Text:      fmt.Sprintf("🐾 %s đã rời khỏi Bầy Đàn.", p.Name),
			IsSystem:  true,
			Timestamp: time.Now().UnixMilli(),
		})
	}
}

func (s *GameService) stepWeatherLocked(dt float64) {
	s.repo.WeatherTimer -= dt
	if s.repo.WeatherTimer > 0 {
		return
	}

	prev := s.repo.Weather
	r := rand.Float64()
	switch prev {
	case models.WeatherClear:
		if r < 0.55 {
			s.repo.Weather = models.WeatherFog
			s.repo.WeatherTimer = 65 + rand.Float64()*40
		} else {
			s.repo.Weather = models.WeatherRain
			s.repo.WeatherTimer = 70 + rand.Float64()*45
		}
	case models.WeatherFog:
		if r < 0.5 {
			s.repo.Weather = models.WeatherRain
			s.repo.WeatherTimer = 70 + rand.Float64()*45
		} else {
			s.repo.Weather = models.WeatherClear
			s.repo.WeatherTimer = 95 + rand.Float64()*50
		}
	case models.WeatherRain:
		if r < 0.42 {
			s.repo.Weather = models.WeatherStorm
			s.repo.WeatherTimer = 55 + rand.Float64()*35
		} else {
			s.repo.Weather = models.WeatherClear
			s.repo.WeatherTimer = 95 + rand.Float64()*55
		}
	default:
		s.repo.Weather = models.WeatherFog
		s.repo.WeatherTimer = 55 + rand.Float64()*35
	}

	if s.repo.Weather != prev {
		msg := "☀️ Bầu trời đã quang đãng trở lại."
		switch s.repo.Weather {
		case models.WeatherFog:
			msg = "🌫️ Sương mù dày đặc đang bao phủ khu rừng..."
		case models.WeatherRain:
			msg = "🌧️ Trời bắt đầu đổ mưa rào (giảm tụt khát)."
		case models.WeatherStorm:
			msg = "⛈️ Bão giông tiền sử kéo đến kèm sấm chớp!"
		}
		s.repo.PendingChats = append(s.repo.PendingChats, models.ChatMessage{
			ID:        fmt.Sprintf("weather-%d", time.Now().UnixNano()),
			Sender:    "ISLE",
			Text:      msg,
			IsSystem:  true,
			Timestamp: time.Now().UnixMilli(),
		})
	}
}

func (s *GameService) GetFullSnapshot() (
	map[string]*models.Player,
	map[string]*models.WorldFood,
	[]models.BloodTrail,
	float64,
	string,
) {
	return s.repo.GetFullSnapshot()
}

func (s *GameService) StartGameLoop(hub Broadcaster) {
	ticker := time.NewTicker(50 * time.Millisecond) // 20 Hz
	lastTime := time.Now()
	log.Println("[GameService] 20Hz loop started (Weather + Skills + BoneBreak + Pack + BloodTrails)")

	go func() {
		defer ticker.Stop()
		for range ticker.C {
			now := time.Now()
			dt := now.Sub(lastTime).Seconds()
			lastTime = now
			if dt > 0.15 {
				dt = 0.15
			}

			hasClients := hub.ClientCount() > 0
			s.tickCount++

			s.repo.Lock()
			s.repo.WorldTime += dt / 600.0
			if s.repo.WorldTime >= 1.0 {
				s.repo.WorldTime -= 1.0
			}

			s.stepWeatherLocked(dt)
			s.stepSurvivalLocked(dt)

			aiEvents, aiChats, aiFoodsChanged := ai.StepBots(s.repo.Players, s.repo.Foods, dt)
			if aiFoodsChanged {
				s.repo.FoodsDirty = true
			}
			if len(aiEvents) > 0 {
				s.repo.PendingCombatEvents = append(s.repo.PendingCombatEvents, aiEvents...)
			}
			if len(aiChats) > 0 {
				s.repo.PendingChats = append(s.repo.PendingChats, aiChats...)
			}

			if !hasClients {
				s.repo.PendingCombatEvents = s.repo.PendingCombatEvents[:0]
				s.repo.PendingChats = s.repo.PendingChats[:0]
				s.repo.Unlock()
				continue
			}

			forceAux := s.tickCount%100 == 0
			playersSnap, foodsSnap, bloodSnap, events, chats, worldTime, weather :=
				s.repo.FlushTickSnapshotLocked(forceAux)
			s.repo.Unlock()

			syncMsg := models.OutboundMessage{
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
				continue
			}
			hub.Broadcast(payload)
		}
	}()
}