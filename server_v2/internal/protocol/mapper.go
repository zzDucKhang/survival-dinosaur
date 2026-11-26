package protocol

import (
	"math"

	"dino-server-v2/internal/domain"
)

func round2(v float64) float64 { return math.Round(v*100) / 100 }
func round3(v float64) float64 { return math.Round(v*1000) / 1000 }

func EntityToDTO(src *domain.Entity) *PlayerDTO {
	return &PlayerDTO{
		ID:              src.ID,
		Name:            src.Name,
		Model:           src.Model,
		Diet:            src.Diet,
		X:               round2(src.X),
		Y:               round2(src.Y),
		Z:               round2(src.Z),
		Rotation:        round3(src.Rotation),
		AnimState:       src.AnimState,
		HP:              src.HP,
		MaxHP:           src.MaxHP,
		Hunger:          round2(src.Hunger),
		Thirst:          round2(src.Thirst),
		Growth:          round3(src.Growth),
		BleedTimer:      round2(src.BleedTimer),
		BoneBreakTimer:  round2(src.BoneBreakTimer),
		SpecialCDLeft:   round2(src.SpecialCDLeft),
		Kills:           src.Kills,
		IsResting:       src.IsResting,
		RestUnlockLeft:  src.RestUnlockLeft,
		CombatTimerLeft: src.CombatTimerLeft,
		RegenRate:       src.RegenRate,
		IsCrouching:     src.IsCrouching,
		PackID:          src.PackID,
		PackInviteFrom:  src.PackInviteFrom,
		PackInviteName:  src.PackInviteName,
		RespawnSeq:      src.RespawnSeq,
		LastKilledBy:    src.LastKilledBy,
		IsAI:            src.IsAI,
		AIState:         src.AI.State,
	}
}

func MapPlayersToDTO(entities map[string]*domain.Entity) map[string]*PlayerDTO {
	out := make(map[string]*PlayerDTO, len(entities))
	for id, e := range entities {
		out[id] = EntityToDTO(e)
	}
	return out
}

func MapFoodsToDTO(foods map[string]*domain.WorldFood) map[string]*WorldFoodDTO {
	out := make(map[string]*WorldFoodDTO, len(foods))
	for id, f := range foods {
		out[id] = &WorldFoodDTO{
			ID:        f.ID,
			Type:      f.Type,
			X:         round2(f.X),
			Z:         round2(f.Z),
			Amount:    f.Amount,
			MaxAmount: f.MaxAmount,
		}
	}
	return out
}

func MapBloodTrailsToDTO(trails []domain.BloodTrail) []BloodTrailDTO {
	if len(trails) == 0 {
		return nil
	}
	out := make([]BloodTrailDTO, len(trails))
	for i, bt := range trails {
		out[i] = BloodTrailDTO{
			ID: bt.ID,
			X:  round2(bt.X),
			Z:  round2(bt.Z),
		}
	}
	return out
}

func MapCombatEventsToDTO(events []domain.CombatEvent) []CombatEventDTO {
	if len(events) == 0 {
		return nil
	}
	out := make([]CombatEventDTO, len(events))
	for i, ev := range events {
		out[i] = CombatEventDTO{
			ID:         ev.ID,
			AttackerID: ev.AttackerID,
			TargetID:   ev.TargetID,
			Damage:     ev.Damage,
			TargetHP:   ev.TargetHP,
			IsKill:     ev.IsKill,
			AttackType: ev.AttackType,
			X:          round2(ev.X),
			Y:          round2(ev.Y),
			Z:          round2(ev.Z),
		}
	}
	return out
}

func MapChatsToDTO(chats []domain.ChatMessage) []ChatMessageDTO {
	if len(chats) == 0 {
		return nil
	}
	out := make([]ChatMessageDTO, len(chats))
	for i, c := range chats {
		out[i] = ChatMessageDTO{
			ID:        c.ID,
			Sender:    c.Sender,
			Text:      c.Text,
			IsSystem:  c.IsSystem,
			Timestamp: c.Timestamp,
		}
	}
	return out
}