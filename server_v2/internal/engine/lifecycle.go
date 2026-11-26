package engine

import (
	"fmt"
	"time"

	"dino-server-v2/internal/domain"
)

func (e *GameEngine) SpawnBotLocked(id, name, model string, x, z, rot, growth float64) {
	spec := e.reg.GetSpecies(model)
	scaledHP := domain.ScaleMaxHP(spec.BaseMaxHP, growth)
	y := e.world.GetEntityGroundHeight(x, z)

	e.store.Entities[id] = &domain.Entity{
		ID:        id,
		Name:      name,
		Model:     spec.ID,
		Diet:      spec.Diet,
		IsAI:      true,
		X:         x,
		Y:         y,
		Z:         z,
		Rotation:  rot,
		AnimState: "idle",
		HP:        scaledHP,
		MaxHP:     scaledHP,
		BaseMaxHP: spec.BaseMaxHP,
		Hunger:    90.0,
		Thirst:    90.0,
		Growth:    growth,
		AI: domain.AIControl{
			State: "WANDER",
		},
	}
}

func (e *GameEngine) AddPlayer(id, name, model string) {
	e.store.Lock()
	defer e.store.Unlock()

	spec := e.reg.GetSpecies(model)
	const startGrowth = 0.45
	maxHP := domain.ScaleMaxHP(spec.BaseMaxHP, startGrowth)

	p := &domain.Entity{
		ID:        id,
		Name:      name,
		Model:     spec.ID,
		Diet:      spec.Diet,
		IsAI:      false,
		X:         0.0,
		Y:         e.world.GetEntityGroundHeight(0.0, 0.0),
		Z:         0.0,
		Rotation:  0.0,
		AnimState: "idle",
		HP:        maxHP,
		MaxHP:     maxHP,
		BaseMaxHP: spec.BaseMaxHP,
		Hunger:    90.0,
		Thirst:    90.0,
		Growth:    startGrowth,
	}

	e.store.Entities[p.ID] = p
	e.store.AppendChatLocked(domain.ChatMessage{
		ID:        fmt.Sprintf("join-%d-%s", time.Now().UnixNano(), p.ID),
		Sender:    "ISLE",
		Text:      fmt.Sprintf("🦖 %s vừa tiến vào hòn đảo!", p.Name),
		IsSystem:  true,
		Timestamp: time.Now().UnixMilli(),
	})
}

func (e *GameEngine) RemovePlayer(id string) {
	e.store.Lock()
	defer e.store.Unlock()

	p, ok := e.store.Entities[id]
	if !ok {
		return
	}
	delete(e.store.Entities, id)
	if !p.IsAI && p.Name != "" {
		e.store.AppendChatLocked(domain.ChatMessage{
			ID:        fmt.Sprintf("leave-%d-%s", time.Now().UnixNano(), id),
			Sender:    "ISLE",
			Text:      fmt.Sprintf("👋 %s đã rời khỏi hòn đảo.", p.Name),
			IsSystem:  true,
			Timestamp: time.Now().UnixMilli(),
		})
	}
}

func (e *GameEngine) UpdatePlayerMove(id string, x, z, rot float64, anim string) {
	e.store.Lock()
	defer e.store.Unlock()

	p, exists := e.store.Entities[id]
	if !exists {
		return
	}
	if p.IsResting {
		p.AnimState = "rest"
		return
	}
	cx, cz := e.world.ResolveObstacleCollision(x, z, 1.4)
	p.X = cx
	p.Z = cz
	p.Y = e.world.GetEntityGroundHeight(cx, cz)
	p.Rotation = rot
	p.AnimState = anim
}

// HandleDeathLocked là điểm xử lý chết/hồi sinh duy nhất cho cả Player lẫn AI Bot.
func (e *GameEngine) HandleDeathLocked(target, attacker *domain.Entity, cause string, now time.Time) {
	carcass := e.world.CreateCarcass(target.ID, target.X, target.Z, now)
	e.store.Foods[carcass.ID] = carcass
	e.store.FoodsDirty = true

	killerName := cause
	if attacker != nil {
		attacker.Kills++
		killerName = attacker.Name
		prefix := "⚔️"
		verb := "đã hạ gục"
		if attacker.IsAI {
			prefix = "🦖"
			verb = "đã săn hạ"
		}
		e.store.AppendChatLocked(domain.ChatMessage{
			ID:        fmt.Sprintf("kill-%d-%s", now.UnixNano(), target.ID),
			Sender:    "ISLE",
			Text:      fmt.Sprintf("%s %s %s %s!", prefix, attacker.Name, verb, target.Name),
			IsSystem:  true,
			Timestamp: now.UnixMilli(),
		})
	} else {
		e.store.AppendChatLocked(domain.ChatMessage{
			ID:        fmt.Sprintf("death-%d-%s", now.UnixNano(), target.ID),
			Sender:    "ISLE",
			Text:      fmt.Sprintf("💀 %s đã gục ngã vì %s!", target.Name, cause),
			IsSystem:  true,
			Timestamp: now.UnixMilli(),
		})
	}

	if target.IsAI {
		target.HP = target.MaxHP
	} else {
		target.Growth = 0.45
		target.MaxHP = domain.ScaleMaxHP(target.BaseMaxHP, target.Growth)
		target.HP = target.MaxHP
		target.Hunger = 85.0
		target.Thirst = 85.0
		target.RespawnSeq++
		target.LastKilledBy = killerName
	}

	target.ResetCombatAndStatus()
	target.X, target.Y, target.Z = e.world.PickSafeRespawn(55.0, 195.0, 2.0)
}