package service

import (
	"fmt"
	"math"
	"strings"
	"time"

	"dino-server/internal/models"
	"dino-server/internal/world"
)

func isSamePack(a, b *models.Player) bool {
	return !a.IsAI && !b.IsAI && a.PackID != "" && a.PackID == b.PackID
}

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
		if id == attackerID || isSamePack(attacker, target) {
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

		attacker.LastCombatTime = now
		attacker.CombatTimerLeft = OutOfCombatSeconds
		target.LastCombatTime = now
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

// ProcessPlayerSpecial xử lý kỹ năng đặc trưng của từng loài (Phím V)
func (s *GameService) ProcessPlayerSpecial(attackerID string) {
	s.repo.Lock()
	defer s.repo.Unlock()

	attacker, exists := s.repo.Players[attackerID]
	if !exists || attacker.IsResting {
		return
	}

	now := time.Now()
	cd := s.GetSpecialCooldown(attacker.Model)
	if !attacker.LastSpecialTime.IsZero() && now.Sub(attacker.LastSpecialTime).Seconds() < cd {
		return
	}
	attacker.LastSpecialTime = now
	attacker.SpecialCDLeft = cd

	modelLower := strings.ToLower(attacker.Model)
	forwardX := math.Sin(attacker.Rotation)
	forwardZ := math.Cos(attacker.Rotation)

	baseDamage := 30.0
	attackRange := 8.5 + attacker.Growth*1.8
	is360 := false
	bleedSec := 0.0
	boneBreakSec := 0.0
	knockbackDist := 0.0

	switch modelLower {
	case "trex", "t-rex":
		// Ngoạm Nghiền Xương (Bone Crusher)
		baseDamage = 38.0
		bleedSec = 5.0
		boneBreakSec = 6.0
		attacker.AnimState = "bite"
	case "tricera", "mammoth":
		// Húc Văng / Giẫm Chấn Động
		baseDamage = 36.0
		attackRange += 1.5
		is360 = modelLower == "mammoth"
		boneBreakSec = 4.5
		knockbackDist = 7.5
		attacker.AnimState = "bite"
	case "stego":
		// Quất Gai Đuôi Siêu Chảy Máu (360°)
		baseDamage = 34.0
		attackRange += 2.6
		is360 = true
		bleedSec = 10.0
		attacker.AnimState = "tail"
	default:
		// Tyranno / Vicious: Vồ Săn Mồi (lướt tiến 10m + chảy máu nặng)
		baseDamage = 29.0
		bleedSec = 7.5
		dashX, dashZ := world.ResolveObstacleCollision(
			attacker.X+forwardX*10.0,
			attacker.Z+forwardZ*10.0,
			1.4,
		)
		attacker.X = dashX
		attacker.Z = dashZ
		attacker.Y = world.GetEntityGroundHeight(dashX, dashZ)
		attacker.AnimState = "bite"
	}

	growthScale := 0.55 + 0.55*math.Max(0.35, attacker.Growth)
	baseFinalDamage := baseDamage * growthScale
	rangeSq := attackRange * attackRange

	for id, target := range s.repo.Players {
		if id == attackerID || isSamePack(attacker, target) {
			continue
		}
		dx := target.X - attacker.X
		dz := target.Z - attacker.Z
		distSq := dx*dx + dz*dz
		if distSq > rangeSq || distSq < 0.000001 {
			continue
		}

		dist := math.Sqrt(distSq)
		if !is360 {
			dot := forwardX*(dx/dist) + forwardZ*(dz/dist)
			if dot < 0.15 {
				continue
			}
		}

		attacker.LastCombatTime = now
		attacker.CombatTimerLeft = OutOfCombatSeconds
		target.LastCombatTime = now
		target.CombatTimerLeft = OutOfCombatSeconds

		dmgFloat := baseFinalDamage
		if target.IsResting {
			dmgFloat *= 1.4
		}
		finalDamage := int(math.Round(dmgFloat))
		hitX, hitY, hitZ := target.X, target.Y, target.Z
		target.HP -= finalDamage

		if bleedSec > 0 {
			target.BleedTimer = math.Max(target.BleedTimer, bleedSec)
		}
		if boneBreakSec > 0 {
			target.BoneBreakTimer = math.Max(target.BoneBreakTimer, boneBreakSec)
		}
		if knockbackDist > 0 {
			kx, kz := world.ResolveObstacleCollision(
				target.X+(dx/dist)*knockbackDist,
				target.Z+(dz/dist)*knockbackDist,
				1.6,
			)
			target.X = kx
			target.Z = kz
			target.Y = world.GetEntityGroundHeight(kx, kz)
		}
		if target.IsAI && target.Diet == models.DietHerbivore {
			target.ProvokedByID = attacker.ID
			target.ProvokedTimer = 14.0
		}

		isKill := false
		if target.HP <= 0 {
			isKill = true
			s.handlePlayerDeathLocked(target, attacker, attacker.Name, now)
		}

		evtType := "special"
		if boneBreakSec > 0 && !isKill {
			evtType = "bonebreak"
		}

		s.repo.PendingCombatEvents = append(s.repo.PendingCombatEvents, models.CombatEvent{
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