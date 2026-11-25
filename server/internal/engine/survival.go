package engine

import (
	"fmt"
	"math"
	"time"

	"dino-server/internal/models"
	"dino-server/internal/world"
)

func ScaleMaxHP(baseHP int, growth float64) int {
	if baseHP <= 0 {
		baseHP = 100
	}
	return int(math.Round(float64(baseHP) * (0.45 + 0.65*growth)))
}

func ToggleRest(playerID string) {
	PlayersMutex.Lock()
	defer PlayersMutex.Unlock()
	if p, ok := Players[playerID]; ok {
		p.IsResting = !p.IsResting
		if p.IsResting {
			p.AnimState = "idle"
		}
	}
}

func StepSurvival(dt float64) {
	now := time.Now()
	nowUnix := now.Unix()

	for id, food := range Foods {
		if food.Type == "meat" && (food.Amount <= 0 || (food.ExpiresAt > 0 && nowUnix >= food.ExpiresAt)) {
			delete(Foods, id)
		} else if food.Type == "plant" && food.Amount < food.MaxAmount {
			if now.UnixMilli()%500 < 55 {
				food.Amount++
			}
		}
	}

	for _, p := range Players {
		if p.IsAI {
			continue
		}

		drainMult := 1.0
		if p.IsResting {
			drainMult = 0.55
		}
		p.Hunger = math.Max(0, p.Hunger-dt*0.36*drainMult)
		p.Thirst = math.Max(0, p.Thirst-dt*0.48*drainMult)

		// Tăng trưởng liên tục từ 0.45 -> 1.25 (Apex Khổng Lồ)
		if p.Growth < 1.25 && p.Hunger > 20 && p.Thirst > 20 {
			growRate := 0.0065
			if p.IsResting {
				growRate = 0.0095
			}
			p.Growth = math.Min(1.25, p.Growth+dt*growRate)
			newMax := ScaleMaxHP(p.BaseMaxHP, p.Growth)
			if newMax > p.MaxHP {
				diff := newMax - p.MaxHP
				p.MaxHP = newMax
				p.HP = int(math.Min(float64(p.MaxHP), float64(p.HP+diff)))
			}
		}

		// Chảy máu (nghỉ ngơi giúp cầm máu nhanh gấp 2.5 lần)
		if p.BleedTimer > 0 {
			bleedDecay := dt
			if p.IsResting {
				bleedDecay = dt * 2.5
			}
			p.BleedTimer = math.Max(0, p.BleedTimer-bleedDecay)
			p.BleedTickAccum += dt
			if p.BleedTickAccum >= 1.0 {
				p.BleedTickAccum -= 1.0
				bleedDmg := 3
				if p.AnimState == "run" {
					bleedDmg = 5
				} else if p.IsResting {
					bleedDmg = 1
				}
				p.HP = int(math.Max(1, float64(p.HP-bleedDmg)))
				PendingCombatEvents = append(PendingCombatEvents, models.CombatEvent{
					ID:         fmt.Sprintf("bleed-%d-%s", now.UnixNano(), p.ID),
					AttackerID: "bleed",
					TargetID:   p.ID,
					Damage:     bleedDmg,
					TargetHP:   p.HP,
					IsKill:     false,
					AttackType: "bleed",
					X:          p.X,
					Y:          p.Y + 2.6,
					Z:          p.Z,
				})
			}
		} else {
			p.BleedTickAccum = 0
		}

		if p.Hunger <= 0 || p.Thirst <= 0 {
			p.StarveTickAccum += dt
			if p.StarveTickAccum >= 2.0 {
				p.StarveTickAccum = 0
				p.HP = int(math.Max(1, float64(p.HP-4)))
			}
		} else if p.Hunger > 50 && p.Thirst > 50 && p.BleedTimer <= 0 && p.HP < p.MaxHP {
			p.RegenTickAccum += dt
			interval := 1.5
			healAmt := 3
			if p.IsResting {
				interval = 0.8
				healAmt = 6
			}
			if p.RegenTickAccum >= interval {
				p.RegenTickAccum = 0
				p.HP = int(math.Min(float64(p.MaxHP), float64(p.HP+healAmt)))
			}
		}
	}
}

func ProcessInteract(playerID string) {
	PlayersMutex.Lock()
	defer PlayersMutex.Unlock()

	p, exists := Players[playerID]
	if !exists {
		return
	}
	now := time.Now()
	if now.Sub(p.LastEatTime) < 850*time.Millisecond {
		return
	}

	// 1. Uống nước tại Hồ Oasis hoặc Hồ Cao Nguyên
	if world.IsNearWater(p.X, p.Z) && p.Thirst < 99 {
		p.LastEatTime = now
		p.Thirst = math.Min(100, p.Thirst+35)
		p.BleedTimer = math.Max(0, p.BleedTimer-2.5)
		return
	}

	// 2. Ăn thịt hoặc bụi quả mọng (+11% tăng trưởng mỗi miếng)
	desiredType := "meat"
	if p.Diet == models.DietHerbivore {
		desiredType = "plant"
	}

	var bestFood *models.WorldFood
	bestDist := 8.0
	for _, f := range Foods {
		if f.Type != desiredType || f.Amount <= 0 {
			continue
		}
		d := math.Hypot(f.X-p.X, f.Z-p.Z)
		if d < bestDist {
			bestDist = d
			bestFood = f
		}
	}

	if bestFood != nil {
		p.LastEatTime = now
		biteAmount := 25
		if bestFood.Amount < biteAmount {
			biteAmount = bestFood.Amount
		}
		bestFood.Amount -= biteAmount
		p.Hunger = math.Min(100, p.Hunger+float64(biteAmount)*1.4)
		p.HP = int(math.Min(float64(p.MaxHP), float64(p.HP+16)))

		if p.Growth < 1.25 {
			p.Growth = math.Min(1.25, p.Growth+0.11)
			newMax := ScaleMaxHP(p.BaseMaxHP, p.Growth)
			if newMax > p.MaxHP {
				p.HP += newMax - p.MaxHP
				p.MaxHP = newMax
			}
		}
	}
}