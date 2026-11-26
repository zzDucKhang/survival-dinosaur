package engine

import (
	"fmt"
	"math"
	"time"

	"dino-server-v2/internal/domain"
)

const (
	OutOfCombatSeconds = 30.0
	RestUnlockSeconds  = 3.0
	OutOfCombatHealPS  = 5
	RestHealPS         = 20
)

func (e *GameEngine) ToggleRest(playerID string) {
	e.store.Lock()
	defer e.store.Unlock()

	p, ok := e.store.Entities[playerID]
	if !ok {
		return
	}
	now := time.Now()
	if !p.IsResting {
		p.IsResting = true
		p.IsCrouching = false
		p.Timers.RestStarted = now
		p.RestUnlockLeft = RestUnlockSeconds
		p.Timers.RegenTickAccum = 0
		p.AnimState = "rest"
		return
	}
	if now.Sub(p.Timers.RestStarted).Seconds() < RestUnlockSeconds {
		return
	}
	p.IsResting = false
	p.RestUnlockLeft = 0
	p.Timers.RegenTickAccum = 0
	p.AnimState = "idle"
}

func (e *GameEngine) SetCrouch(playerID string, crouching bool) {
	e.store.Lock()
	defer e.store.Unlock()

	p, ok := e.store.Entities[playerID]
	if !ok || p.IsResting {
		return
	}
	p.IsCrouching = crouching
}

func (e *GameEngine) stepSurvivalLocked(dt float64) {
	now := time.Now()
	nowUnix := now.Unix()

	// 1. Dọn vệt máu quá 45s
	if len(e.store.BloodTrails) > 0 {
		kept := e.store.BloodTrails[:0]
		for _, bt := range e.store.BloodTrails {
			if nowUnix < bt.ExpiresAt {
				kept = append(kept, bt)
			} else {
				e.store.BloodDirty = true
			}
		}
		e.store.BloodTrails = kept
	}

	// 2. Hồi phục bụi quả & dọn xác thịt hết hạn
	e.plantRegenAccum += dt
	shouldRegenPlants := false
	if e.plantRegenAccum >= 0.5 {
		e.plantRegenAccum -= 0.5
		shouldRegenPlants = true
	}
	for id, food := range e.store.Foods {
		if food.Type == "meat" && (food.Amount <= 0 || (food.ExpiresAt > 0 && nowUnix >= food.ExpiresAt)) {
			delete(e.store.Foods, id)
			e.store.FoodsDirty = true
		} else if food.Type == "plant" && shouldRegenPlants && food.Amount < food.MaxAmount {
			food.Amount++
			e.store.FoodsDirty = true
		}
	}

	isRaining := e.store.Weather == domain.WeatherRain || e.store.Weather == domain.WeatherStorm

	for _, p := range e.store.Entities {
		// Giảm hiệu ứng gãy xương & rải vệt máu cho cả AI và Người chơi
		if p.BoneBreakTimer > 0 {
			decay := dt
			if p.IsResting {
				decay = dt * 1.8
			}
			p.BoneBreakTimer = math.Max(0, p.BoneBreakTimer-decay)
		}

		if p.BleedTimer > 0 {
			p.Timers.BloodTrailAccum += dt
			if p.Timers.BloodTrailAccum >= 2.2 {
				p.Timers.BloodTrailAccum = 0
				e.store.AddBloodTrailLocked(domain.BloodTrail{
					ID:        fmt.Sprintf("bld-%d-%s", now.UnixNano(), p.ID),
					X:         math.Round(p.X*100) / 100,
					Z:         math.Round(p.Z*100) / 100,
					ExpiresAt: nowUnix + 45,
				})
			}
		} else {
			p.Timers.BloodTrailAccum = 0
		}

		if p.IsAI {
			if p.BleedTimer > 0 {
				p.BleedTimer = math.Max(0, p.BleedTimer-dt)
			}
			continue
		}

		e.stepPlayerSurvivalLocked(p, dt, now, isRaining)
	}
}

func (e *GameEngine) stepPlayerSurvivalLocked(p *domain.Entity, dt float64, now time.Time, isRaining bool) {
	// Cooldown chiêu đặc trưng [V]
	if !p.Timers.LastSpecial.IsZero() {
		cd := e.reg.GetSpecies(p.Model).Special.Cooldown
		elapsed := now.Sub(p.Timers.LastSpecial).Seconds()
		if elapsed < cd {
			p.SpecialCDLeft = math.Round((cd-elapsed)*10) / 10
		} else {
			p.SpecialCDLeft = 0
		}
	} else {
		p.SpecialCDLeft = 0
	}

	// Khóa đứng dậy 3s đầu khi nghỉ ngơi
	if p.IsResting {
		elapsedRest := now.Sub(p.Timers.RestStarted).Seconds()
		if elapsedRest < RestUnlockSeconds {
			p.RestUnlockLeft = math.Round((RestUnlockSeconds-elapsedRest)*10) / 10
		} else {
			p.RestUnlockLeft = 0
		}
		p.AnimState = "rest"
	} else {
		p.RestUnlockLeft = 0
	}

	// Đếm ngược 30s ngoài giao chiến
	if !p.Timers.LastCombat.IsZero() {
		sinceCombat := now.Sub(p.Timers.LastCombat).Seconds()
		if sinceCombat < OutOfCombatSeconds {
			p.CombatTimerLeft = math.Round((OutOfCombatSeconds-sinceCombat)*10) / 10
		} else {
			p.CombatTimerLeft = 0
		}
	} else {
		p.CombatTimerLeft = 0
	}

	// Tiêu hao Đói / Khát (mưa/bão giảm 55% tốc độ tụt khát)
	drainMult := 1.0
	if p.IsResting {
		drainMult = 0.5
	} else if p.IsCrouching {
		drainMult = 0.8
	}
	thirstWeatherMult := 1.0
	if isRaining {
		thirstWeatherMult = 0.45
	}
	p.Hunger = math.Max(0, p.Hunger-dt*0.34*drainMult)
	p.Thirst = math.Max(0, p.Thirst-dt*0.44*drainMult*thirstWeatherMult)

	// Tăng trưởng tự nhiên tới Apex Titan (125%)
	if p.Growth < 1.25 && p.Hunger > 20 && p.Thirst > 20 {
		growRate := 0.0065
		if p.IsResting {
			growRate = 0.0105
		}
		p.Growth = math.Min(1.25, p.Growth+dt*growRate)
		newMax := domain.ScaleMaxHP(p.BaseMaxHP, p.Growth)
		if newMax > p.MaxHP {
			diff := newMax - p.MaxHP
			p.MaxHP = newMax
			p.HP = int(math.Min(float64(p.MaxHP), float64(p.HP+diff)))
		}
	}

	// Sát thương chảy máu
	if p.BleedTimer > 0 {
		bleedDecay := dt
		if p.IsResting {
			bleedDecay = dt * 3.0
		}
		p.BleedTimer = math.Max(0, p.BleedTimer-bleedDecay)
		p.Timers.BleedTickAccum += dt
		if p.Timers.BleedTickAccum >= 1.0 {
			p.Timers.BleedTickAccum -= 1.0
			bleedDmg := 3
			if p.AnimState == "run" {
				bleedDmg = 5
			} else if p.IsResting {
				bleedDmg = 1
			}
			hitX, hitY, hitZ := p.X, p.Y, p.Z
			p.HP -= bleedDmg
			isKill := p.HP <= 0
			if isKill {
				e.HandleDeathLocked(p, nil, "Mất máu", now)
			}
			e.store.AppendCombatEventLocked(domain.CombatEvent{
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
				return
			}
		}
	} else {
		p.Timers.BleedTickAccum = 0
	}

	// Chết đói/khát hoặc Hồi máu (+20 HP/s nghỉ | +5 HP/s sau 30s không giao chiến)
	p.RegenRate = 0
	if p.Hunger <= 0 || p.Thirst <= 0 {
		p.Timers.RegenTickAccum = 0
		p.Timers.StarveTickAccum += dt
		if p.Timers.StarveTickAccum >= 2.0 {
			p.Timers.StarveTickAccum -= 2.0
			p.HP -= 4
			if p.HP <= 0 {
				cause := "Đói lả"
				if p.Thirst <= 0 {
					cause = "Khát nước"
				}
				e.HandleDeathLocked(p, nil, cause, now)
			}
		}
		return
	}

	p.Timers.StarveTickAccum = 0
	healPerSec := 0
	if p.IsResting {
		healPerSec = RestHealPS
	} else if p.CombatTimerLeft <= 0 && p.BleedTimer <= 0 {
		healPerSec = OutOfCombatHealPS
	}

	if healPerSec > 0 && p.HP < p.MaxHP {
		p.RegenRate = healPerSec
		p.Timers.RegenTickAccum += dt
		if p.Timers.RegenTickAccum >= 1.0 {
			p.Timers.RegenTickAccum -= 1.0
			actualHeal := healPerSec
			if p.HP+actualHeal > p.MaxHP {
				actualHeal = p.MaxHP - p.HP
			}
			p.HP += actualHeal
			if actualHeal > 0 {
				e.store.AppendCombatEventLocked(domain.CombatEvent{
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
		p.Timers.RegenTickAccum = 0
	}
}