package ai

import (
	"math"

	"dino-server-v2/internal/domain"
)

func findNearestHuman(bot *domain.Entity, humans []*domain.Entity) (*domain.Entity, float64) {
	var closest *domain.Entity
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

func findNearestFood(
	bot *domain.Entity,
	foods map[string]*domain.WorldFood,
	foodType string,
) *domain.WorldFood {
	var closest *domain.WorldFood
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