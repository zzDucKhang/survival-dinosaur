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

func StepBots(players map[string]*models.Player, foods map[string]*models.WorldFood, dt float64) []models.CombatEvent {
	var events []models.CombatEvent
	now := time.Now()

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

		nearestPlayer, nearestDist := findNearestHuman(bot, players)
		hpRatio := float64(bot.HP) / float64(bot.MaxHP)

		// Con non (< 0.50) gặp người chơi lớn hơn sẽ chủ động bỏ chạy
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
				if bot.Diet == models.DietHerbivore && rand.Float64() < 0.45 {
					if plant := findNearestFood(bot, foods, "plant"); plant != nil {
						bot.TargetX = plant.X + (rand.Float64()-0.5)*4.0
						bot.TargetZ = plant.Z + (rand.Float64()-0.5)*4.0
						bot.StateTimer = 14.0
						bot.AIState = StateGraze
						break
					}
				}
				bot.AIState = StateWander
				pickRandomWaypoint(bot)
			}

		case StateGraze:
			dist := math.Hypot(bot.TargetX-bot.X, bot.TargetZ-bot.Z)
			if dist < 3.5 || bot.StateTimer <= 0 {
				bot.AIState = StateIdle
				bot.StateTimer = 3.0 + rand.Float64()*3.0
				bot.AnimState = "idle"
			} else {
				steerAndMove(bot, bot.TargetX, bot.TargetZ, 4.4, 2.0, dt)
				bot.AnimState = "walk"
			}

		case StateWander:
			dist := math.Hypot(bot.TargetX-bot.X, bot.TargetZ-bot.Z)
			if dist < 4.5 || bot.StateTimer <= 0 {
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
				dmg := int(math.Round(baseDmg * (0.55 + 0.55*bot.Growth)))

				hitX, hitY, hitZ := target.X, target.Y, target.Z
				target.HP -= dmg
				target.IsResting = false
				if bot.Diet == models.DietCarnivore {
					target.BleedTimer = math.Max(target.BleedTimer, 5.0)
				}

				isKill := false
				if target.HP <= 0 {
					isKill = true
					carcassID := fmt.Sprintf("meat-%d", now.UnixNano())
					foods[carcassID] = &models.WorldFood{
						ID:        carcassID,
						Type:      "meat",
						X:         hitX,
						Z:         hitZ,
						Amount:    100,
						MaxAmount: 100,
						ExpiresAt: now.Add(120 * time.Second).Unix(),
					}

					target.Growth = 0.45
					target.MaxHP = calcScaledMaxHP(target.BaseMaxHP, target.Growth)
					target.HP = target.MaxHP
					target.Hunger = 85
					target.Thirst = 85
					target.BleedTimer = 0
					target.X = (rand.Float64() - 0.5) * 36.0
					target.Z = (rand.Float64() - 0.5) * 36.0
					target.Y = math.Max(-0.2, world.GetTerrainHeight(target.X, target.Z))
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

		if (bot.AIState == StateIdle || bot.AIState == StateWander || bot.AIState == StateGraze) && bot.HP < bot.MaxHP {
			if rand.Float64() < dt*0.9 {
				bot.HP++
			}
		}
	}

	return events
}

func calcScaledMaxHP(base int, growth float64) int {
	if base <= 0 {
		base = 100
	}
	return int(math.Round(float64(base) * (0.45 + 0.65*growth)))
}

func findNearestHuman(bot *models.Player, players map[string]*models.Player) (*models.Player, float64) {
	var closest *models.Player
	minDist := math.MaxFloat64
	for _, p := range players {
		if p.IsAI || p.ID == bot.ID {
			continue
		}
		d := math.Hypot(p.X-bot.X, p.Z-bot.Z)
		if d < minDist {
			minDist = d
			closest = p
		}
	}
	return closest, minDist
}

func findNearestFood(bot *models.Player, foods map[string]*models.WorldFood, foodType string) *models.WorldFood {
	var closest *models.WorldFood
	minDist := math.MaxFloat64
	for _, f := range foods {
		if f.Type != foodType || f.Amount <= 0 {
			continue
		}
		d := math.Hypot(f.X-bot.X, f.Z-bot.Z)
		if d < minDist {
			minDist = d
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
			world.GetTerrainHeight(wx, wz) < 22.0 {
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

	// Tránh leo vách núi quá cao
	if world.GetTerrainHeight(nextX, nextZ) > 26.0 {
		pickRandomWaypoint(bot)
		return
	}

	bot.X, bot.Z = world.ResolveObstacleCollision(nextX, nextZ, 2.0)
	bot.Y = math.Max(-0.35, world.GetTerrainHeight(bot.X, bot.Z))

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