package engine

import (
	"fmt"
	"math"
	"time"

	"dino-server-v2/internal/domain"
)

func (e *GameEngine) ProcessPlayerAttack(attackerID, attackType string) {
	e.store.Lock()
	defer e.store.Unlock()

	attacker, exists := e.store.Entities[attackerID]
	if !exists || attacker.IsResting {
		return
	}
	now := time.Now()
	cooldown := 750 * time.Millisecond
	if attackType == "tail" {
		cooldown = 1100 * time.Millisecond
	}
	if now.Sub(attacker.Timers.LastAttack) < cooldown {
		return
	}
	attacker.Timers.LastAttack = now

	spec := e.reg.GetSpecies(attacker.Model)
	baseDamage := float64(spec.BiteDamage)
	attackRange := 7.2 + attacker.Growth*1.5
	bleedSec := spec.BleedSec

	if attackType == "tail" {
		baseDamage *= spec.TailMult
		attackRange += 1.5
	}

	growthScale := 0.55 + 0.55*math.Max(0.35, attacker.Growth)
	baseFinalDamage := baseDamage * growthScale
	attackRangeSq := attackRange * attackRange
	forwardX := math.Sin(attacker.Rotation)
	forwardZ := math.Cos(attacker.Rotation)

	for id, target := range e.store.Entities {
		if id == attackerID || IsSamePack(attacker, target) {
			continue
		}
		dx := target.X - attacker.X
		dz := target.Z - attacker.Z
		distSq := dx*dx + dz*dz
		if distSq > attackRangeSq || distSq < 0.000001 {
			continue
		}
		if attackType != "tail" {
			dist := math.Sqrt(distSq)
			dot := forwardX*(dx/dist) + forwardZ*(dz/dist)
			if dot < 0.25 {
				continue
			}
		}

		attacker.Timers.LastCombat = now
		attacker.CombatTimerLeft = OutOfCombatSeconds
		target.Timers.LastCombat = now
		target.CombatTimerLeft = OutOfCombatSeconds

		dmgFloat := baseFinalDamage
		if target.IsResting {
			dmgFloat *= 1.4
		}
		finalDamage := int(math.Round(dmgFloat))
		hitX, hitY, hitZ := target.X, target.Y, target.Z
		target.HP -= finalDamage

		if bleedSec > 0 && attackType == "bite" {
			target.BleedTimer = math.Max(target.BleedTimer, bleedSec)
		}
		if target.IsAI && target.Diet == domain.DietHerbivore {
			target.AI.ProvokedByID = attacker.ID
			target.AI.ProvokedTimer = 12.0
		}

		isKill := false
		if target.HP <= 0 {
			isKill = true
			e.HandleDeathLocked(target, attacker, attacker.Name, now)
		}

		e.store.AppendCombatEventLocked(domain.CombatEvent{
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

// ProcessPlayerSpecial xử lý chiêu đặc trưng [V] hoàn toàn data-driven từ species.json.
func (e *GameEngine) ProcessPlayerSpecial(attackerID string) {
	e.store.Lock()
	defer e.store.Unlock()

	attacker, exists := e.store.Entities[attackerID]
	if !exists || attacker.IsResting {
		return
	}

	spec := e.reg.GetSpecies(attacker.Model)
	sp := spec.Special
	now := time.Now()
	if !attacker.Timers.LastSpecial.IsZero() && now.Sub(attacker.Timers.LastSpecial).Seconds() < sp.Cooldown {
		return
	}

	attacker.Timers.LastSpecial = now
	attacker.SpecialCDLeft = sp.Cooldown

	forwardX := math.Sin(attacker.Rotation)
	forwardZ := math.Cos(attacker.Rotation)
	if sp.DashDist > 0 {
		dashX, dashZ := e.world.ResolveObstacleCollision(
			attacker.X+forwardX*sp.DashDist,
			attacker.Z+forwardZ*sp.DashDist,
			1.4,
		)
		attacker.X = dashX
		attacker.Z = dashZ
		attacker.Y = e.world.GetEntityGroundHeight(dashX, dashZ)
	}
	if sp.Anim != "" {
		attacker.AnimState = sp.Anim
	} else {
		attacker.AnimState = "bite"
	}

	attackRange := 8.5 + attacker.Growth*1.8 + sp.RangeBonus
	growthScale := 0.55 + 0.55*math.Max(0.35, attacker.Growth)
	baseFinalDamage := sp.Damage * growthScale
	rangeSq := attackRange * attackRange

	for id, target := range e.store.Entities {
		if id == attackerID || IsSamePack(attacker, target) {
			continue
		}
		dx := target.X - attacker.X
		dz := target.Z - attacker.Z
		distSq := dx*dx + dz*dz
		if distSq > rangeSq || distSq < 0.000001 {
			continue
		}
		dist := math.Sqrt(distSq)
		if !sp.Is360 {
			dot := forwardX*(dx/dist) + forwardZ*(dz/dist)
			if dot < 0.15 {
				continue
			}
		}

		attacker.Timers.LastCombat = now
		attacker.CombatTimerLeft = OutOfCombatSeconds
		target.Timers.LastCombat = now
		target.CombatTimerLeft = OutOfCombatSeconds

		dmgFloat := baseFinalDamage
		if target.IsResting {
			dmgFloat *= 1.4
		}
		finalDamage := int(math.Round(dmgFloat))
		hitX, hitY, hitZ := target.X, target.Y, target.Z
		target.HP -= finalDamage

		if sp.BleedSec > 0 {
			target.BleedTimer = math.Max(target.BleedTimer, sp.BleedSec)
		}
		if sp.BoneBreakSec > 0 {
			target.BoneBreakTimer = math.Max(target.BoneBreakTimer, sp.BoneBreakSec)
		}
		if sp.Knockback > 0 {
			kx, kz := e.world.ResolveObstacleCollision(
				target.X+(dx/dist)*sp.Knockback,
				target.Z+(dz/dist)*sp.Knockback,
				1.6,
			)
			target.X = kx
			target.Z = kz
			target.Y = e.world.GetEntityGroundHeight(kx, kz)
		}
		if target.IsAI && target.Diet == domain.DietHerbivore {
			target.AI.ProvokedByID = attacker.ID
			target.AI.ProvokedTimer = 14.0
		}

		isKill := false
		if target.HP <= 0 {
			isKill = true
			e.HandleDeathLocked(target, attacker, attacker.Name, now)
		}

		evtType := "special"
		if sp.BoneBreakSec > 0 && !isKill {
			evtType = "bonebreak"
		}
		e.store.AppendCombatEventLocked(domain.CombatEvent{
			ID:         fmt.Sprintf("spec-%d-%s", now.UnixNano(), target.ID),
			AttackerID: attacker.ID,
			TargetID:   target.ID,
			Damage:     finalDamage,
			TargetHP:   target.HP,
			IsKill:     isKill,
			AttackType: evtType,
			X:          hitX,
			Y:          hitY + 3.2,
			Z:          hitZ,
		})
	}
}