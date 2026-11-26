package engine

import (
	"fmt"
	"math"
	"time"

	"dino-server-v2/internal/domain"
)

func (e *GameEngine) ProcessRoar(playerID string, callType int) {
	e.store.Lock()
	defer e.store.Unlock()

	p, ok := e.store.Entities[playerID]
	if !ok || p.IsResting {
		return
	}
	now := time.Now()
	if now.Sub(p.Timers.LastRoar) < 1200*time.Millisecond {
		return
	}
	if callType < 1 || callType > 4 {
		callType = 1
	}
	p.Timers.LastRoar = now
	p.AnimState = "roar"

	icon := "📢"
	desc := "gầm vang lãnh thổ"
	switch callType {
	case 2:
		icon = "💚"
		desc = "gọi bầy thân thiện"
	case 3:
		icon = "💢"
		desc = "gầm đe dọa"
	case 4:
		icon = "🆘"
		desc = "kêu cứu khẩn cấp"
	}

	e.store.AppendCombatEventLocked(domain.CombatEvent{
		ID:         fmt.Sprintf("roar-%d-%s", now.UnixNano(), p.ID),
		AttackerID: p.ID,
		TargetID:   p.ID,
		Damage:     callType,
		TargetHP:   p.HP,
		IsKill:     false,
		AttackType: "roar",
		X:          p.X,
		Y:          p.Y + 3.0,
		Z:          p.Z,
	})
	e.store.AppendChatLocked(domain.ChatMessage{
		ID:        fmt.Sprintf("roar-msg-%d-%s", now.UnixNano(), p.ID),
		Sender:    "ISLE",
		Text:      fmt.Sprintf("%s %s %s!", icon, p.Name, desc),
		IsSystem:  true,
		Timestamp: now.UnixMilli(),
	})
}

func (e *GameEngine) ProcessInteract(playerID string) {
	e.store.Lock()
	defer e.store.Unlock()

	p, exists := e.store.Entities[playerID]
	if !exists || p.IsResting {
		return
	}
	now := time.Now()
	if now.Sub(p.Timers.LastEat) < 850*time.Millisecond {
		return
	}

	// Ưu tiên uống nước nếu đang ở gần hồ và còn khát
	if e.world.IsNearWater(p.X, p.Z) && p.Thirst < 99 {
		p.Timers.LastEat = now
		p.Thirst = math.Min(100, p.Thirst+35)
		p.BleedTimer = math.Max(0, p.BleedTimer-2.5)
		return
	}

	desiredType := "meat"
	if p.Diet == domain.DietHerbivore {
		desiredType = "plant"
	}

	var bestFood *domain.WorldFood
	bestDistSq := 64.0 // bán kính 8m
	for _, f := range e.store.Foods {
		if f.Type != desiredType || f.Amount <= 0 {
			continue
		}
		dx := f.X - p.X
		dz := f.Z - p.Z
		dSq := dx*dx + dz*dz
		if dSq < bestDistSq {
			bestDistSq = dSq
			bestFood = f
		}
	}

	if bestFood == nil {
		return
	}

	p.Timers.LastEat = now
	biteAmount := 25
	if bestFood.Amount < biteAmount {
		biteAmount = bestFood.Amount
	}
	bestFood.Amount -= biteAmount
	e.store.FoodsDirty = true

	p.Hunger = math.Min(100, p.Hunger+float64(biteAmount)*1.4)
	p.HP = int(math.Min(float64(p.MaxHP), float64(p.HP+16)))

	if p.Growth < 1.25 {
		p.Growth = math.Min(1.25, p.Growth+0.11)
		newMax := domain.ScaleMaxHP(p.BaseMaxHP, p.Growth)
		if newMax > p.MaxHP {
			p.HP += newMax - p.MaxHP
			p.MaxHP = newMax
		}
	}
}