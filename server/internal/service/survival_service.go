package service

import (
	"fmt"
	"math"
	"math/rand"
	"time"

	"dino-server/internal/models"
	"dino-server/internal/world"
)

const (
	OutOfCombatSeconds = 30.0 // Không giao chiến 30s -> hồi +5 HP/s
	RestUnlockSeconds  = 3.0  // Sau 3s mới mở khóa nút Hết nghỉ ngơi
	OutOfCombatHealPS  = 5
	RestHealPS         = 20
)

func (s *GameService) ScaleMaxHP(baseHP int, growth float64) int {
	if baseHP <= 0 {
		baseHP = 100
	}
	return int(math.Round(float64(baseHP) * (0.45 + 0.65*growth)))
}

func (s *GameService) ToggleRest(playerID string) {
	s.repo.Lock()
	defer s.repo.Unlock()

	p, ok := s.repo.Players[playerID]
	if !ok {
		return
	}

	now := time.Now()
	if !p.IsResting {
		p.IsResting = true
		p.IsCrouching = false
		p.RestStartedAt = now
		p.RestUnlockLeft = RestUnlockSeconds
		p.RegenTickAccum = 0
		p.AnimState = "rest"
		return
	}

	// Đang nghỉ ngơi: chỉ cho đứng dậy sau đủ 3 giây
	if now.Sub(p.RestStartedAt).Seconds() < RestUnlockSeconds {
		return
	}
	p.IsResting = false
	p.RestUnlockLeft = 0
	p.RegenTickAccum = 0
	p.AnimState = "idle"
}

func (s *GameService) SetCrouch(playerID string, crouching bool) {
	s.repo.Lock()
	defer s.repo.Unlock()

	p, ok := s.repo.Players[playerID]
	if !ok || p.IsResting {
		return
	}
	p.IsCrouching = crouching
}

func (s *GameService) ProcessRoar(playerID string, callType int) {
	s.repo.Lock()
	defer s.repo.Unlock()

	p, ok := s.repo.Players[playerID]
	if !ok || p.IsResting {
		return
	}

	now := time.Now()
	if now.Sub(p.LastRoarTime) < 1200*time.Millisecond {
		return
	}
	if callType < 1 || callType > 4 {
		callType = 1
	}

	p.LastRoarTime = now
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

	s.repo.PendingCombatEvents = append(s.repo.PendingCombatEvents, models.CombatEvent{
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

	s.repo.PendingChats = append(s.repo.PendingChats, models.ChatMessage{
		ID:        fmt.Sprintf("roar-msg-%d-%s", now.UnixNano(), p.ID),
		Sender:    "ISLE",
		Text:      fmt.Sprintf("%s %s %s!", icon, p.Name, desc),
		IsSystem:  true,
		Timestamp: now.UnixMilli(),
	})
}

func (s *GameService) ProcessInteract(playerID string) {
	s.repo.Lock()
	defer s.repo.Unlock()

	p, exists := s.repo.Players[playerID]
	if !exists || p.IsResting {
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
	bestDistSq := 64.0 // 8.0 * 8.0
	for _, f := range s.repo.Foods {
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

	if bestFood != nil {
		p.LastEatTime = now
		biteAmount := 25
		if bestFood.Amount < biteAmount {
			biteAmount = bestFood.Amount
		}
		bestFood.Amount -= biteAmount
		s.repo.FoodsDirty = true

		p.Hunger = math.Min(100, p.Hunger+float64(biteAmount)*1.4)
		p.HP = int(math.Min(float64(p.MaxHP), float64(p.HP+16)))
		if p.Growth < 1.25 {
			p.Growth = math.Min(1.25, p.Growth+0.11)
			newMax := s.ScaleMaxHP(p.BaseMaxHP, p.Growth)
			if newMax > p.MaxHP {
				p.HP += newMax - p.MaxHP
				p.MaxHP = newMax
			}
		}
	}
}

func (s *GameService) handlePlayerDeathLocked(target *models.Player, attacker *models.Player, cause string, now time.Time) {
	hitX, hitZ := target.X, target.Z
	carcassID := fmt.Sprintf("meat-%d-%s", now.UnixNano(), target.ID)
	s.repo.Foods[carcassID] = &models.WorldFood{
		ID:        carcassID,
		Type:      "meat",
		X:         math.Round(hitX*100) / 100,
		Z:         math.Round(hitZ*100) / 100,
		Amount:    100,
		MaxAmount: 100,
		ExpiresAt: now.Add(120 * time.Second).Unix(),
	}
	s.repo.FoodsDirty = true

	killerName := cause
	if attacker != nil {
		attacker.Kills++
		killerName = attacker.Name
		s.repo.PendingChats = append(s.repo.PendingChats, models.ChatMessage{
			ID:        fmt.Sprintf("kill-%d-%s", now.UnixNano(), target.ID),
			Sender:    "ISLE",
			Text:      fmt.Sprintf("⚔️ %s đã hạ gục %s!", attacker.Name, target.Name),
			IsSystem:  true,
			Timestamp: now.UnixMilli(),
		})
	} else {
		s.repo.PendingChats = append(s.repo.PendingChats, models.ChatMessage{
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
		target.MaxHP = s.ScaleMaxHP(target.BaseMaxHP, target.Growth)
		target.HP = target.MaxHP
		target.Hunger = 85
		target.Thirst = 85
		target.RespawnSeq++
		target.LastKilledBy = killerName
	}

	target.IsResting = false
	target.RestUnlockLeft = 0
	target.IsCrouching = false
	target.CombatTimerLeft = 0
	target.RegenRate = 0
	target.LastCombatTime = time.Time{}
	target.BleedTimer = 0
	target.BleedTickAccum = 0
	target.StarveTickAccum = 0
	target.RegenTickAccum = 0
	target.ProvokedByID = ""
	target.ProvokedTimer = 0
	target.AnimState = "idle"

	angle := rand.Float64() * 2 * math.Pi
	spawnRadius := 55.0 + rand.Float64()*140.0
	rx, rz := world.ResolveObstacleCollision(
		math.Cos(angle)*spawnRadius,
		math.Sin(angle)*spawnRadius,
		2.0,
	)
	target.X = rx
	target.Z = rz
	target.Y = world.GetEntityGroundHeight(rx, rz)
	target.TargetX = 0
	target.TargetZ = 0
}

func (s *GameService) stepSurvivalLocked(dt float64) {
	now := time.Now()
	nowUnix := now.Unix()

	s.plantRegenAccum += dt
	shouldRegenPlants := false
	if s.plantRegenAccum >= 0.5 {
		s.plantRegenAccum -= 0.5
		shouldRegenPlants = true
	}

	for id, food := range s.repo.Foods {
		if food.Type == "meat" && (food.Amount <= 0 || (food.ExpiresAt > 0 && nowUnix >= food.ExpiresAt)) {
			delete(s.repo.Foods, id)
			s.repo.FoodsDirty = true
		} else if food.Type == "plant" && shouldRegenPlants && food.Amount < food.MaxAmount {
			food.Amount++
			s.repo.FoodsDirty = true
		}
	}

	for _, p := range s.repo.Players {
		if p.IsAI {
			continue
		}

		// 1. Đếm ngược 3s mở khóa nút Hết nghỉ ngơi
		if p.IsResting {
			elapsedRest := now.Sub(p.RestStartedAt).Seconds()
			if elapsedRest < RestUnlockSeconds {
				p.RestUnlockLeft = math.Round((RestUnlockSeconds-elapsedRest)*10) / 10
			} else {
				p.RestUnlockLeft = 0
			}
			p.AnimState = "rest"
		} else {
			p.RestUnlockLeft = 0
		}

		// 2. Đếm ngược 30s không giao chiến
		if !p.LastCombatTime.IsZero() {
			sinceCombat := now.Sub(p.LastCombatTime).Seconds()
			if sinceCombat < OutOfCombatSeconds {
				p.CombatTimerLeft = math.Round((OutOfCombatSeconds-sinceCombat)*10) / 10
			} else {
				p.CombatTimerLeft = 0
			}
		} else {
			p.CombatTimerLeft = 0
		}

		// 3. Tiêu hao Đói / Khát
		drainMult := 1.0
		if p.IsResting {
			drainMult = 0.5
		} else if p.IsCrouching {
			drainMult = 0.8
		}
		p.Hunger = math.Max(0, p.Hunger-dt*0.34*drainMult)
		p.Thirst = math.Max(0, p.Thirst-dt*0.44*drainMult)

		// 4. Tăng trưởng liên tục 0.45 -> 1.25
		if p.Growth < 1.25 && p.Hunger > 20 && p.Thirst > 20 {
			growRate := 0.0065
			if p.IsResting {
				growRate = 0.0105
			}
			p.Growth = math.Min(1.25, p.Growth+dt*growRate)
			newMax := s.ScaleMaxHP(p.BaseMaxHP, p.Growth)
			if newMax > p.MaxHP {
				diff := newMax - p.MaxHP
				p.MaxHP = newMax
				p.HP = int(math.Min(float64(p.MaxHP), float64(p.HP+diff)))
			}
		}

		// 5. Chảy máu (nghỉ ngơi cầm máu nhanh gấp 3 lần)
		if p.BleedTimer > 0 {
			bleedDecay := dt
			if p.IsResting {
				bleedDecay = dt * 3.0
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
				p.HP -= bleedDmg
				isKill := p.HP <= 0
				hitX, hitY, hitZ := p.X, p.Y, p.Z
				if isKill {
					s.handlePlayerDeathLocked(p, nil, "Mất máu", now)
				}
				s.repo.PendingCombatEvents = append(s.repo.PendingCombatEvents, models.CombatEvent{
					ID:         fmt.Sprintf("bleed-%d-%s", now.UnixNano(), p.ID),
					AttackerID: "bleed",
					TargetID:   p.ID,
					Damage:     bleedDmg,
					TargetHP:   p.HP,
					IsKill:     isKill,
					AttackType: "bleed",
					X:          hitX,
					Y:          hitY + 2.6,
					Z:          hitZ,
				})
				if isKill {
					continue
				}
			}
		} else {
			p.BleedTickAccum = 0
		}

		// 6. Chết đói/khát HOẶC Hồi máu (+20 HP/s khi nghỉ | +5 HP/s khi hết giao chiến 30s)
		p.RegenRate = 0
		if p.Hunger <= 0 || p.Thirst <= 0 {
			p.RegenTickAccum = 0
			p.StarveTickAccum += dt
			if p.StarveTickAccum >= 2.0 {
				p.StarveTickAccum -= 2.0
				p.HP -= 4
				if p.HP <= 0 {
					cause := "Đói lả"
					if p.Thirst <= 0 {
						cause = "Khát nước"
					}
					s.handlePlayerDeathLocked(p, nil, cause, now)
					continue
				}
			}
		} else {
			p.StarveTickAccum = 0
			healPerSec := 0
			if p.IsResting {
				healPerSec = RestHealPS // +20 HP/s
			} else if p.CombatTimerLeft <= 0 && p.BleedTimer <= 0 {
				healPerSec = OutOfCombatHealPS // +5 HP/s
			}

			if healPerSec > 0 && p.HP < p.MaxHP {
				p.RegenRate = healPerSec
				p.RegenTickAccum += dt
				if p.RegenTickAccum >= 1.0 {
					p.RegenTickAccum -= 1.0
					actualHeal := healPerSec
					if p.HP+actualHeal > p.MaxHP {
						actualHeal = p.MaxHP - p.HP
					}
					p.HP += actualHeal
					if actualHeal > 0 {
						s.repo.PendingCombatEvents = append(s.repo.PendingCombatEvents, models.CombatEvent{
							ID:         fmt.Sprintf("heal-%d-%s", now.UnixNano(), p.ID),
							AttackerID: p.ID,
							TargetID:   p.ID,
							Damage:     actualHeal,
							TargetHP:   p.HP,
							IsKill:     false,
							AttackType: "heal",
							X:          p.X,
							Y:          p.Y + 2.8,
							Z:          p.Z,
						})
					}
				}
			} else {
				p.RegenTickAccum = 0
			}
		}
	}
}