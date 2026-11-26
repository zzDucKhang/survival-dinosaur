package ai

import (
	"fmt"
	"math"
	"math/rand"
	"time"

	"dino-server-v2/internal/config"
	"dino-server-v2/internal/domain"
	"dino-server-v2/internal/engine"
	"dino-server-v2/internal/world"
)

const (
	StateIdle   = "IDLE"
	StateWander = "WANDER"
	StateGraze  = "GRAZE"
	StateChase  = "CHASE"
	StateAttack = "ATTACK"
	StateFlee   = "FLEE"
)

type Controller struct {
	reg   *config.Registry
	world *world.World
}

func NewController(reg *config.Registry, wld *world.World) *Controller {
	return &Controller{
		reg:   reg,
		world: wld,
	}
}

func (c *Controller) Step(
	entities map[string]*domain.Entity,
	foods map[string]*domain.WorldFood,
	dt float64,
	onDeath engine.DeathCallback,
) []domain.CombatEvent {
	var events []domain.CombatEvent
	now := time.Now()

	humans := make([]*domain.Entity, 0, 8)
	for _, e := range entities {
		if !e.IsAI {
			humans = append(humans, e)
		}
	}

	for _, bot := range entities {
		if !bot.IsAI {
			continue
		}
		if bot.AI.State == "" {
			bot.AI.State = StateWander
			c.pickRandomWaypoint(bot)
		}
		if bot.MaxHP <= 0 {
			bot.MaxHP = 120
			bot.HP = 120
		}

		spec := c.reg.GetSpecies(bot.Model)
		bot.AI.StateTimer -= dt
		if bot.AI.ProvokedTimer > 0 {
			bot.AI.ProvokedTimer -= dt
			if bot.AI.ProvokedTimer <= 0 {
				bot.AI.ProvokedByID = ""
			}
		}

		nearestPlayer, nearestDist := findNearestHuman(bot, humans)
		c.evaluateTransitions(bot, spec, entities, nearestPlayer, nearestDist)

		if evt := c.executeState(bot, spec, entities, foods, nearestPlayer, dt, now, onDeath); evt != nil {
			events = append(events, *evt)
		}

		// Bot tự hồi +5 HP/s sau 30s ngoài giao chiến khi không truy đuổi
		if (bot.AI.State == StateIdle || bot.AI.State == StateWander || bot.AI.State == StateGraze) &&
			bot.HP < bot.MaxHP &&
			(bot.Timers.LastCombat.IsZero() || now.Sub(bot.Timers.LastCombat).Seconds() >= engine.OutOfCombatSeconds) {
			bot.Timers.RegenTickAccum += dt
			if bot.Timers.RegenTickAccum >= 1.0 {
				bot.Timers.RegenTickAccum -= 1.0
				bot.HP = int(math.Min(float64(bot.MaxHP), float64(bot.HP+engine.OutOfCombatHealPS)))
			}
		} else {
			bot.Timers.RegenTickAccum = 0
		}
	}

	return events
}

func (c *Controller) evaluateTransitions(
	bot *domain.Entity,
	spec domain.SpeciesSpec,
	entities map[string]*domain.Entity,
	nearestPlayer *domain.Entity,
	nearestDist float64,
) {
	hpRatio := float64(bot.HP) / float64(bot.MaxHP)
	isBaby := bot.Growth < 0.50

	if (hpRatio < 0.25 || (isBaby && nearestPlayer != nil && nearestPlayer.Growth > bot.Growth+0.2)) &&
		nearestPlayer != nil && nearestDist < 28.0 {
		if bot.AI.State != StateFlee {
			bot.AI.State = StateFlee
			bot.AI.StateTimer = 5.0
		}
		return
	}

	if bot.Diet == domain.DietHerbivore {
		if bot.AI.ProvokedByID != "" {
			if aggressor, ok := entities[bot.AI.ProvokedByID]; ok {
				d := math.Hypot(aggressor.X-bot.X, aggressor.Z-bot.Z)
				if d <= 7.2 {
					bot.AI.State = StateAttack
					bot.AI.TargetPlayerID = aggressor.ID
				} else if d <= 28.0 {
					bot.AI.State = StateChase
					bot.AI.TargetPlayerID = aggressor.ID
				} else {
					bot.AI.ProvokedByID = ""
					bot.AI.State = StateWander
					c.pickRandomWaypoint(bot)
				}
			} else {
				bot.AI.ProvokedByID = ""
				bot.AI.State = StateWander
			}
		} else if bot.AI.State == StateChase || bot.AI.State == StateAttack {
			bot.AI.State = StateWander
			c.pickRandomWaypoint(bot)
		}
		return
	}

	if bot.AI.State == StateFlee {
		return
	}

	aggroRange := spec.Bot.AggroRange
	if nearestPlayer != nil && nearestPlayer.IsCrouching {
		aggroRange *= 0.5
	}
	biteRange := 6.0 + bot.Growth*1.2

	if nearestPlayer != nil && nearestDist <= biteRange {
		bot.AI.State = StateAttack
		bot.AI.TargetPlayerID = nearestPlayer.ID
	} else if nearestPlayer != nil && nearestDist <= aggroRange {
		bot.AI.State = StateChase
		bot.AI.TargetPlayerID = nearestPlayer.ID
	} else if bot.AI.State == StateChase || bot.AI.State == StateAttack {
		bot.AI.State = StateWander
		c.pickRandomWaypoint(bot)
	}
}

func (c *Controller) executeState(
	bot *domain.Entity,
	spec domain.SpeciesSpec,
	entities map[string]*domain.Entity,
	foods map[string]*domain.WorldFood,
	nearestPlayer *domain.Entity,
	dt float64,
	now time.Time,
	onDeath engine.DeathCallback,
) *domain.CombatEvent {
	switch bot.AI.State {
	case StateIdle:
		bot.AnimState = "idle"
		bot.Rotation += math.Sin(float64(now.UnixMilli())*0.001) * 0.2 * dt
		if bot.AI.StateTimer <= 0 {
			desiredFood := "plant"
			if bot.Diet == domain.DietCarnivore {
				desiredFood = "meat"
			}
			if rand.Float64() < 0.45 {
				if foodNode := findNearestFood(bot, foods, desiredFood); foodNode != nil {
					bot.AI.TargetX = foodNode.X + (rand.Float64()-0.5)*3.5
					bot.AI.TargetZ = foodNode.Z + (rand.Float64()-0.5)*3.5
					bot.AI.StateTimer = 14.0
					bot.AI.State = StateGraze
					return nil
				}
			}
			bot.AI.State = StateWander
			c.pickRandomWaypoint(bot)
		}

	case StateGraze:
		dx, dz := bot.AI.TargetX-bot.X, bot.AI.TargetZ-bot.Z
		if dx*dx+dz*dz < 12.25 || bot.AI.StateTimer <= 0 {
			bot.AI.State = StateIdle
			bot.AI.StateTimer = 3.0 + rand.Float64()*3.0
			bot.AnimState = "idle"
			if bot.HP < bot.MaxHP {
				bot.HP = int(math.Min(float64(bot.MaxHP), float64(bot.HP+15)))
			}
		} else {
			c.steerAndMove(bot, bot.AI.TargetX, bot.AI.TargetZ, 4.6, 2.0, dt)
			bot.AnimState = "walk"
		}

	case StateWander:
		dx, dz := bot.AI.TargetX-bot.X, bot.AI.TargetZ-bot.Z
		if dx*dx+dz*dz < 20.25 || bot.AI.StateTimer <= 0 {
			bot.AI.State = StateIdle
			bot.AI.StateTimer = 2.0 + rand.Float64()*3.0
			bot.AnimState = "idle"
		} else {
			c.steerAndMove(bot, bot.AI.TargetX, bot.AI.TargetZ, spec.Bot.WalkSpeed, 2.1, dt)
			bot.AnimState = "walk"
		}

	case StateChase:
		target, ok := entities[bot.AI.TargetPlayerID]
		if !ok {
			bot.AI.State = StateWander
			c.pickRandomWaypoint(bot)
			return nil
		}
		c.steerAndMove(bot, target.X, target.Z, spec.Bot.SprintSpeed, 3.5, dt)
		bot.AnimState = "run"

	case StateAttack:
		target, ok := entities[bot.AI.TargetPlayerID]
		if !ok {
			bot.AI.State = StateWander
			c.pickRandomWaypoint(bot)
			return nil
		}
		desiredYaw := math.Atan2(target.X-bot.X, target.Z-bot.Z)
		bot.Rotation = lerpAngle(bot.Rotation, desiredYaw, math.Min(1.0, dt*5.0))

		const cooldown = 1650 * time.Millisecond
		if now.Sub(bot.Timers.LastAttack) >= cooldown {
			bot.Timers.LastAttack = now
			bot.AnimState = "bite"

			dmgFloat := spec.Bot.BaseDamage * (0.55 + 0.55*bot.Growth)
			if target.IsResting {
				dmgFloat *= 1.4
			}
			dmg := int(math.Round(dmgFloat))
			hitX, hitY, hitZ := target.X, target.Y, target.Z

			target.Timers.LastCombat = now
			target.CombatTimerLeft = engine.OutOfCombatSeconds
			bot.Timers.LastCombat = now
			target.HP -= dmg

			if bot.Diet == domain.DietCarnivore {
				target.BleedTimer = math.Max(target.BleedTimer, 5.0)
			}

			isKill := false
			if target.HP <= 0 {
				isKill = true
				if onDeath != nil {
					onDeath(target, bot, bot.Name, now)
				}
				bot.AI.State = StateWander
				c.pickRandomWaypoint(bot)
			}

			return &domain.CombatEvent{
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
			}
		} else if now.Sub(bot.Timers.LastAttack) > 550*time.Millisecond {
			bot.AnimState = "idle"
		}

	case StateFlee:
		if nearestPlayer != nil {
			awayX := bot.X + (bot.X - nearestPlayer.X)
			awayZ := bot.Z + (bot.Z - nearestPlayer.Z)
			c.steerAndMove(bot, awayX, awayZ, 11.2, 4.0, dt)
			bot.AnimState = "run"
		}
		if bot.AI.StateTimer <= 0 {
			bot.AI.State = StateWander
			c.pickRandomWaypoint(bot)
		}
	}

	return nil
}