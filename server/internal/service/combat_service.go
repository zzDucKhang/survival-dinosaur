package service

import (
	"fmt"
	"math"
	"strings"
	"time"

	"dino-server/internal/models"
)

func (s *GameService) ProcessPlayerAttack(attackerID string, attackType string) {
	s.repo.Lock()
	defer s.repo.Unlock()

	attacker, exists := s.repo.Players[attackerID]
	if !exists || attacker.IsResting {
		return
	}

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
	baseFinalDamage := float64(baseDamage) * growthScale
	attackRangeSq := attackRange * attackRange

	forwardX := math.Sin(attacker.Rotation)
	forwardZ := math.Cos(attacker.Rotation)

	for id, target := range s.repo.Players {
		if id == attackerID {
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

		// Ghi nhận trạng thái giao chiến (reset đồng hồ 30s)
		attacker.LastCombatTime = now
		attacker.CombatTimerLeft = OutOfCombatSeconds
		target.LastCombatTime = now
		target.CombatTimerLeft = OutOfCombatSeconds

		// Phục kích khi mục tiêu đang nghỉ ngơi gây 1.4x sát thương
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
		if target.IsAI && target.Diet == models.DietHerbivore {
			target.ProvokedByID = attacker.ID
			target.ProvokedTimer = 12.0
		}

		isKill := false
		if target.HP <= 0 {
			isKill = true
			s.handlePlayerDeathLocked(target, attacker, attacker.Name, now)
		}

		s.repo.PendingCombatEvents = append(s.repo.PendingCombatEvents, models.CombatEvent{
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