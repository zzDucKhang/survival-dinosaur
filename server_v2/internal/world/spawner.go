package world

import (
	"fmt"
	"math"
	"math/rand"
	"time"

	"dino-server-v2/internal/domain"
)

func (w *World) CreateInitialPlants() map[string]*domain.WorldFood {
	count := w.Cfg.InitialPlantCount
	if count <= 0 {
		count = 24
	}
	foods := make(map[string]*domain.WorldFood, count)
	for i := 0; i < count; i++ {
		angle := float64(i) * 2.3999632
		dist := 35.0 + math.Mod(float64(i)*31.7, 310.0)
		x := math.Cos(angle) * dist
		z := math.Sin(angle) * dist
		if w.IsNearWater(x, z) || w.GetTerrainHeight(x, z) > 20.0 {
			x = math.Cos(angle) * 48.0
			z = math.Sin(angle) * 48.0
		}
		id := fmt.Sprintf("plant-%d", i+1)
		foods[id] = &domain.WorldFood{
			ID:        id,
			Type:      "plant",
			X:         math.Round(x*100) / 100,
			Z:         math.Round(z*100) / 100,
			Amount:    100,
			MaxAmount: 100,
			ExpiresAt: 0,
		}
	}
	return foods
}

func (w *World) CreateCarcass(targetID string, x, z float64, now time.Time) *domain.WorldFood {
	return &domain.WorldFood{
		ID:        fmt.Sprintf("meat-%d-%s", now.UnixNano(), targetID),
		Type:      "meat",
		X:         math.Round(x*100) / 100,
		Z:         math.Round(z*100) / 100,
		Amount:    100,
		MaxAmount: 100,
		ExpiresAt: now.Add(120 * time.Second).Unix(),
	}
}

func (w *World) PickSafeRespawn(minR, maxR, entityRadius float64) (float64, float64, float64) {
	span := maxR - minR
	if span <= 0 {
		span = 100.0
	}
	for attempt := 0; attempt < 8; attempt++ {
		angle := rand.Float64() * 2 * math.Pi
		r := minR + rand.Float64()*span
		rx, rz := w.ResolveObstacleCollision(math.Cos(angle)*r, math.Sin(angle)*r, entityRadius)
		if !w.IsInsideLake(rx, rz) && w.GetTerrainHeight(rx, rz) < 22.0 {
			return rx, w.GetEntityGroundHeight(rx, rz), rz
		}
	}
	angle := rand.Float64() * 2 * math.Pi
	r := minR + rand.Float64()*span
	rx, rz := w.ResolveObstacleCollision(math.Cos(angle)*r, math.Sin(angle)*r, entityRadius)
	return rx, w.GetEntityGroundHeight(rx, rz), rz
}