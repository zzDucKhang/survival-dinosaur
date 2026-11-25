package ai

import (
	"fmt"
	"math"
	"math/rand"
	"time"

	"dino-server/internal/models"
	"dino-server/internal/world"
)

const (
	StateIdle   = "IDLE"
	StateWander = "WANDER"
	StateGraze  = "GRAZE"
	StateChase  = "CHASE"
	StateAttack = "ATTACK"
	StateFlee   = "FLEE"
)

func StepBots(
	players map[string]*models.Player,
	foods map[string]*models.WorldFood,
	dt float64,
) ([]models.CombatEvent, []models.ChatMessage, bool) {
	var events []models.CombatEvent
	var chats []models.ChatMessage
	foodsChanged := false
	now := time.Now()

	// Thu thập danh sách người chơi thật 1 lần mỗi tick thay vì duyệt lại toàn map cho từng bot
	var humans []*models.Player
	for _, p := range players {
		if !p.IsAI {
			humans = append(humans, p)
		}
	}

	for _, bot := range players {
		if !bot.IsAI {
			continue
		}
		if bot.AIState == "" {
			bot.AIState = StateWander
			pickRandomWaypoint(bot)
		}
		if bot.MaxHP <= 0 {
			bot.MaxHP = 120
			bot.HP = 120
		}

		bot.StateTimer -= dt
		if bot.ProvokedTimer > 0 {
			bot.ProvokedTimer -= dt
			if bot.ProvokedTimer <= 0 {
				bot.ProvokedByID = ""
			}
		}

		nearestPlayer, nearestDist := findNearestHuman(bot, humans)
		hpRatio := float64(bot.HP) / float64(bot.MaxHP)
		isBaby := bot.Growth < 0.50

		if (hpRatio < 0.25 || (isBaby && nearestPlayer != nil && nearestPlayer.Growth > bot.Growth+0.2)) &&
			nearestPlayer != nil && nearestDist < 28.0 {
			if bot.AIState != StateFlee {
				bot.AIState = StateFlee
				bot.StateTimer = 5.0
			}
		} else if bot.Diet == models.DietHerbivore {
			if bot.ProvokedByID != "" {
				aggressor, ok := players[bot.ProvokedByID]
				if ok {
					d := math.Hypot(aggressor.X-bot.X, aggressor.Z-bot.Z)
					if d <= 7.2 {
						bot.AIState = StateAttack
						bot.TargetPlayerID = aggressor.ID
					} else if d <= 28.0 {
						bot.AIState = StateChase
						bot.TargetPlayerID = aggressor.ID
					} else {
						bot.ProvokedByID = ""
						bot.AIState = StateWander
						pickRandomWaypoint(bot)
					}
				} else {
					bot.ProvokedByID = ""
					bot.AIState = StateWander
				}
			} else if bot.AIState == StateChase || bot.AIState == StateAttack {
				bot.AIState = StateWander
				pickRandomWaypoint(bot)
			}
		} else if bot.AIState != StateFlee {
			aggroRange := 26.0
			if bot.Model == "trex" {
				aggroRange = 32.0
			}
			if nearestPlayer != nil && nearestPlayer.IsCrouching {
				aggroRange *= 0.5
			}
			biteRange := 6.0 + bot.Growth*1.2
			if nearestPlayer != nil && nearestDist <= biteRange {
				bot.AIState = StateAttack
				bot.TargetPlayerID = nearestPlayer.ID
			} else if nearestPlayer != nil && nearestDist <= aggroRange {
				bot.AIState = StateChase
				bot.TargetPlayerID = nearestPlayer.ID
			} else if bot.AIState == StateChase || bot.AIState == StateAttack {
				bot.AIState = StateWander
				pickRandomWaypoint(bot)
			}
		}

		switch bot.AIState {
		case StateIdle:
			bot.AnimState = "idle"
			bot.Rotation += math.Sin(float64(now.UnixMilli())*0.001) * 0.2 * dt
			if bot.StateTimer <= 0 {
				desiredFood := "plant"
				if bot.Diet == models.DietCarnivore {
					desiredFood = "meat"
				}
				if rand.Float64() < 0.45 {
					if foodNode := findNearestFood(bot, foods, desiredFood); foodNode != nil {
						bot.TargetX = foodNode.X + (rand.Float64()-0.5)*3.5
						bot.TargetZ = foodNode.Z + (rand.Float64()-0.5)*3.5
						bot.StateTimer = 14.0
						bot.AIState = StateGraze
						break
					}
				}
				bot.AIState = StateWander
				pickRandomWaypoint(bot)
			}

		case StateGraze:
			dx, dz := bot.TargetX-bot.X, bot.TargetZ-bot.Z
			if dx*dx+dz*dz < 12.25 || bot.StateTimer <= 0 {
				bot.AIState = StateIdle
				bot.StateTimer = 3.0 + rand.Float64()*3.0
				bot.AnimState = "idle"
				if bot.HP < bot.MaxHP {
					bot.HP = int(math.Min(float64(bot.MaxHP), float64(bot.HP+15)))
				}
			} else {
				steerAndMove(bot, bot.TargetX, bot.TargetZ, 4.6, 2.0, dt)
				bot.AnimState = "walk"
			}

		case StateWander:
			dx, dz := bot.TargetX-bot.X, bot.TargetZ-bot.Z
			if dx*dx+dz*dz < 20.25 || bot.StateTimer <= 0 {
				bot.AIState = StateIdle
				bot.StateTimer = 2.0 + rand.Float64()*3.0
				bot.AnimState = "idle"
			} else {
				walkSpeed := 5.0
				if bot.Model == "tyranno" {
					walkSpeed = 6.2
				}
				steerAndMove(bot, bot.TargetX, bot.TargetZ, walkSpeed, 2.1, dt)
				bot.AnimState = "walk"
			}

		case StateChase:
			target, ok := players[bot.TargetPlayerID]
			if !ok {
				bot.AIState = StateWander
				pickRandomWaypoint(bot)
				break
			}
			sprintSpeed := 9.2
			if bot.Model == "tyranno" {
				sprintSpeed = 10.8
			} else if bot.Diet == models.DietHerbivore {
				sprintSpeed = 8.0
			}
			steerAndMove(bot, target.X, target.Z, sprintSpeed, 3.5, dt)
			bot.AnimState = "run"

		case StateAttack:
			target, ok := players[bot.TargetPlayerID]
			if !ok {
				bot.AIState = StateWander
				pickRandomWaypoint(bot)
				break
			}
			desiredYaw := math.Atan2(target.X-bot.X, target.Z-bot.Z)
			bot.Rotation = lerpAngle(bot.Rotation, desiredYaw, math.Min(1.0, dt*5.0))
			cooldown := 1650 * time.Millisecond
			if now.Sub(bot.LastAttackTime) >= cooldown {
				bot.LastAttackTime = now
				bot.AnimState = "bite"

				baseDmg := 14.0
				if bot.Model == "trex" || bot.Model == "mammoth" {
					baseDmg = 21.0
				} else if bot.Model == "tricera" || bot.Model == "stego" {
					baseDmg = 17.0
				}

				dmgFloat := baseDmg * (0.55 + 0.55*bot.Growth)
				if target.IsResting {
					dmgFloat *= 1.4
				}
				dmg := int(math.Round(dmgFloat))
				hitX, hitY, hitZ := target.X, target.Y, target.Z

				target.LastCombatTime = now
				target.CombatTimerLeft = 30.0
				bot.LastCombatTime = now

				target.HP -= dmg
				if bot.Diet == models.DietCarnivore {
					target.BleedTimer = math.Max(target.BleedTimer, 5.0)
				}

				isKill := false
				if target.HP <= 0 {
					isKill = true
					foodsChanged = true
					carcassID := fmt.Sprintf("meat-%d-%s", now.UnixNano(), target.ID)
					foods[carcassID] = &models.WorldFood{
						ID:        carcassID,
						Type:      "meat",
						X:         math.Round(hitX*100) / 100,
						Z:         math.Round(hitZ*100) / 100,
						Amount:    100,
						MaxAmount: 100,
						ExpiresAt: now.Add(120 * time.Second).Unix(),
					}
					chats = append(chats, models.ChatMessage{
						ID:        fmt.Sprintf("aikill-%d-%s", now.UnixNano(), target.ID),
						Sender:    "ISLE",
						Text:      fmt.Sprintf("🦖 %s đã săn hạ %s!", bot.Name, target.Name),
						IsSystem:  true,
						Timestamp: now.UnixMilli(),
					})

					target.Growth = 0.45
					target.MaxHP = calcScaledMaxHP(target.BaseMaxHP, target.Growth)
					target.HP = target.MaxHP
					target.Hunger = 85
					target.Thirst = 85
					target.BleedTimer = 0
					target.BleedTickAccum = 0
					target.IsResting = false
					target.RestUnlockLeft = 0
					target.IsCrouching = false
					target.CombatTimerLeft = 0
					target.RegenRate = 0
					target.LastCombatTime = time.Time{}
					target.RespawnSeq++
					target.LastKilledBy = bot.Name

					angle := rand.Float64() * 2 * math.Pi
					spawnR := 55.0 + rand.Float64()*120.0
					rx, rz := world.ResolveObstacleCollision(
						math.Cos(angle)*spawnR,
						math.Sin(angle)*spawnR,
						2.0,
					)
					target.X = rx
					target.Z = rz
					target.Y = world.GetEntityGroundHeight(rx, rz)
					bot.AIState = StateWander
					pickRandomWaypoint(bot)
				}

				events = append(events, models.CombatEvent{
					ID:         fmt.Sprintf("evt-%d-%s", now.UnixNano(), bot.ID),
					AttackerID: bot.ID,
					TargetID:   target.ID,
					Damage:     dmg,
					TargetHP:   target.HP,
					IsKill:     isKill,
					AttackType: "bite",
					X:          hitX,
					Y:          hitY + 2.8,
					Z:          hitZ,
				})
			} else if now.Sub(bot.LastAttackTime) > 550*time.Millisecond {
				bot.AnimState = "idle"
			}

		case StateFlee:
			if nearestPlayer != nil {
				awayX := bot.X + (bot.X - nearestPlayer.X)
				awayZ := bot.Z + (bot.Z - nearestPlayer.Z)
				steerAndMove(bot, awayX, awayZ, 11.2, 4.0, dt)
				bot.AnimState = "run"
			}
			if bot.StateTimer <= 0 {
				bot.AIState = StateWander
				pickRandomWaypoint(bot)
			}
		}

		// Bot hồi máu sau 30s không giao chiến
		if (bot.AIState == StateIdle || bot.AIState == StateWander || bot.AIState == StateGraze) &&
			bot.HP < bot.MaxHP &&
			(bot.LastCombatTime.IsZero() || now.Sub(bot.LastCombatTime).Seconds() >= 30.0) {
			bot.RegenTickAccum += dt
			if bot.RegenTickAccum >= 1.0 {
				bot.RegenTickAccum -= 1.0
				bot.HP = int(math.Min(float64(bot.MaxHP), float64(bot.HP+5)))
			}
		} else {
			bot.RegenTickAccum = 0
		}
	}

	return events, chats, foodsChanged
}

func calcScaledMaxHP(base int, growth float64) int {
	if base <= 0 {
		base = 100
	}
	return int(math.Round(float64(base) * (0.45 + 0.65*growth)))
}

func findNearestHuman(bot *models.Player, humans []*models.Player) (*models.Player, float64) {
	var closest *models.Player
	minDistSq := math.MaxFloat64
	for _, p := range humans {
		dx := p.X - bot.X
		dz := p.Z - bot.Z
		dSq := dx*dx + dz*dz
		if dSq < minDistSq {
			minDistSq = dSq
			closest = p
		}
	}
	if closest == nil {
		return nil, math.MaxFloat64
	}
	return closest, math.Sqrt(minDistSq)
}

func findNearestFood(bot *models.Player, foods map[string]*models.WorldFood, foodType string) *models.WorldFood {
	var closest *models.WorldFood
	minDistSq := math.MaxFloat64
	for _, f := range foods {
		if f.Type != foodType || f.Amount <= 0 {
			continue
		}
		dx := f.X - bot.X
		dz := f.Z - bot.Z
		dSq := dx*dx + dz*dz
		if dSq < minDistSq {
			minDistSq = dSq
			closest = f
		}
	}
	return closest
}

func pickRandomWaypoint(bot *models.Player) {
	for i := 0; i < 10; i++ {
		angle := rand.Float64() * 2 * math.Pi
		step := 30.0 + rand.Float64()*85.0
		wx := bot.X + math.Cos(angle)*step
		wz := bot.Z + math.Sin(angle)*step
		if math.Abs(wx) < 350.0 && math.Abs(wz) < 350.0 &&
			!world.IsNearWater(wx, wz) &&
			world.GetEntityGroundHeight(wx, wz) < 22.0 {
			bot.TargetX = wx
			bot.TargetZ = wz
			bot.StateTimer = 10.0 + rand.Float64()*10.0
			return
		}
	}
	bot.TargetX = (rand.Float64() - 0.5) * 140.0
	bot.TargetZ = (rand.Float64() - 0.5) * 140.0
	bot.StateTimer = 12.0
}

func steerAndMove(bot *models.Player, targetX, targetZ, speed, turnRate, dt float64) {
	dx := targetX - bot.X
	dz := targetZ - bot.Z
	desiredYaw := math.Atan2(dx, dz)
	bot.Rotation = lerpAngle(bot.Rotation, desiredYaw, math.Min(1.0, dt*turnRate))
	nextX := bot.X + math.Sin(bot.Rotation)*speed*dt
	nextZ := bot.Z + math.Cos(bot.Rotation)*speed*dt
	if world.GetEntityGroundHeight(nextX, nextZ) > 26.0 {
		pickRandomWaypoint(bot)
		return
	}
	bot.X, bot.Z = world.ResolveObstacleCollision(nextX, nextZ, 2.0)
	bot.Y = world.GetEntityGroundHeight(bot.X, bot.Z)
	if math.Abs(bot.X) >= 380.0 || math.Abs(bot.Z) >= 380.0 {
		pickRandomWaypoint(bot)
	}
}

func lerpAngle(a, b, t float64) float64 {
	diff := math.Mod(b-a, 2*math.Pi)
	if diff > math.Pi {
		diff -= 2 * math.Pi
	}
	if diff < -math.Pi {
		diff += 2 * math.Pi
	}
	return a + diff*t
}