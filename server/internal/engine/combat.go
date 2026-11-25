package engine

import (
	"fmt"
	"math"
	"math/rand"
	"strings"
	"time"

	"dino-server/internal/models"
	"dino-server/internal/world"
)

func ProcessPlayerAttack(attackerID string, attackType string) {
	PlayersMutex.Lock()
	defer PlayersMutex.Unlock()

	attacker, exists := Players[attackerID]
	if !exists {
		return
	}
	attacker.IsResting = false

	now := time.Now()
	cooldown := 750 * time.Millisecond
	if attackType == "tail" {
		cooldown = 1100 * time.Millisecond
	}
	if now.Sub(attacker.LastAttackTime) < cooldown {
		return
	}
	attacker.LastAttackTime = now

	baseDamage := 22
	attackRange := 7.2 + attacker.Growth*1.5
	bleedSec := 0.0

	switch strings.ToLower(attacker.Model) {
	case "tyranno":
		baseDamage = 17
		bleedSec = 5.0
	case "dino_hunter_deadly_shores_vicious":
		baseDamage = 21
		bleedSec = 6.5
	case "trex":
		baseDamage = 26
		bleedSec = 4.0
	case "mammoth":
		baseDamage = 28
	case "tricera":
		baseDamage = 25
	case "stego":
		baseDamage = 23
	}

	if attackType == "tail" {
		if strings.ToLower(attacker.Model) == "stego" {
			baseDamage = int(float64(baseDamage) * 1.25)
		} else {
			baseDamage = int(float64(baseDamage) * 0.85)
		}
		attackRange += 1.5
	}

	growthScale := 0.55 + 0.55*math.Max(0.35, attacker.Growth)
	finalDamage := int(math.Round(float64(baseDamage) * growthScale))

	forwardX := math.Sin(attacker.Rotation)
	forwardZ := math.Cos(attacker.Rotation)

	for id, target := range Players {
		if id == attackerID {
			continue
		}

		dx := target.X - attacker.X
		dz := target.Z - attacker.Z
		dist := math.Hypot(dx, dz)

		if dist > attackRange || dist < 0.001 {
			continue
		}

		if attackType != "tail" {
			dirX := dx / dist
			dirZ := dz / dist
			dot := forwardX*dirX + forwardZ*dirZ
			if dot < 0.25 {
				continue
			}
		}

		hitX, hitY, hitZ := target.X, target.Y, target.Z
		target.HP -= finalDamage
		target.IsResting = false

		if bleedSec > 0 && attackType == "bite" {
			target.BleedTimer = math.Max(target.BleedTimer, bleedSec)
		}

		if target.IsAI && target.Diet == models.DietHerbivore {
			target.ProvokedByID = attacker.ID
			target.ProvokedTimer = 12.0
		}

		isKill := false
		if target.HP <= 0 {
			isKill = true
			attacker.Kills++

			carcassID := fmt.Sprintf("meat-%d-%s", now.UnixNano(), target.ID)
			Foods[carcassID] = &models.WorldFood{
				ID:        carcassID,
				Type:      "meat",
				X:         hitX,
				Z:         hitZ,
				Amount:    100,
				MaxAmount: 100,
				ExpiresAt: now.Add(120 * time.Second).Unix(),
			}

			PendingChats = append(PendingChats, models.ChatMessage{
				ID:        fmt.Sprintf("kill-%d-%s", now.UnixNano(), target.ID),
				Sender:    "ISLE",
				Text:      fmt.Sprintf("⚔️ %s đã hạ gục %s!", attacker.Name, target.Name),
				IsSystem:  true,
				Timestamp: now.UnixMilli(),
			})

			if target.IsAI {
				target.HP = target.MaxHP
			} else {
				target.Growth = 0.45
				target.MaxHP = ScaleMaxHP(target.BaseMaxHP, target.Growth)
				target.HP = target.MaxHP
				target.Hunger = 85
				target.Thirst = 85
			}
			target.BleedTimer = 0
			target.ProvokedByID = ""

			angle := rand.Float64() * 2 * math.Pi
			spawnRadius := 55.0 + rand.Float64()*140.0
			rx, rz := world.ResolveObstacleCollision(
				math.Cos(angle)*spawnRadius,
				math.Sin(angle)*spawnRadius,
				2.0,
			)
			target.X = rx
			target.Z = rz
			target.Y = math.Max(-0.2, world.GetTerrainHeight(rx, rz))
			target.TargetX = 0
			target.TargetZ = 0
		}

		PendingCombatEvents = append(PendingCombatEvents, models.CombatEvent{
			ID:         fmt.Sprintf("hit-%d-%s", now.UnixNano(), target.ID),
			AttackerID: attacker.ID,
			TargetID:   target.ID,
			Damage:     finalDamage,
			TargetHP:   target.HP,
			IsKill:     isKill,
			AttackType: attackType,
			X:          hitX,
			Y:          hitY + 3.0,
			Z:          hitZ,
		})
	}
}