package world

import (
	"math"

	"dino-server-v2/internal/domain"
)

type World struct {
	Cfg   domain.WorldConfig
	Rocks []RockObstacle
}

func NewWorld(cfg domain.WorldConfig) *World {
	w := &World{Cfg: cfg}
	w.Rocks = w.buildRocks()
	return w
}

func clamp(v, minV, maxV float64) float64 {
	if v < minV {
		return minV
	}
	if v > maxV {
		return maxV
	}
	return v
}

// GetTerrainHeight khớp 100% với công thức mặt đất ở Client Native (Rust) & HUD Map.
func (w *World) GetTerrainHeight(x, z float64) float64 {
	distOrigin := math.Hypot(x, z)
	hills := math.Sin(x*0.011)*math.Cos(z*0.011)*11.0 +
		math.Sin(x*0.024+z*0.017)*4.5 +
		math.Cos(x*0.0055-z*0.0065)*9.0

	dPeak1 := math.Hypot(x-210.0, z-170.0)
	if dPeak1 < 120.0 {
		t := 1.0 - dPeak1/120.0
		hills += t * t * 34.0
	}

	dPeak2 := math.Hypot(x+220.0, z+160.0)
	if dPeak2 < 130.0 {
		t := 1.0 - dPeak2/130.0
		hills += t * t * 38.0
	}

	dValley := math.Hypot(x+140.0, z-20.0)
	if dValley < 110.0 {
		t := 1.0 - dValley/110.0
		hills -= t * t * 8.0
	}

	spawnWeight := clamp((distOrigin-32.0)/55.0, 0.0, 1.0)
	h := 0.8 + hills*spawnWeight

	dOasis := math.Hypot(x-w.Cfg.OasisX, z-w.Cfg.OasisZ)
	if dOasis < w.Cfg.OasisRadius+18.0 {
		t := clamp((dOasis-w.Cfg.OasisRadius)/18.0, 0.0, 1.0)
		t = t * t * (3.0 - 2.0*t)
		h = -2.2*(1.0-t) + h*t
	}

	dLake2 := math.Hypot(x-w.Cfg.HighlandLakeX, z-w.Cfg.HighlandLakeZ)
	if dLake2 < w.Cfg.HighlandLakeRadius+22.0 {
		t := clamp((dLake2-w.Cfg.HighlandLakeRadius)/22.0, 0.0, 1.0)
		t = t * t * (3.0 - 2.0*t)
		h = -2.2*(1.0-t) + h*t
	}

	if distOrigin > 370.0 {
		angle := math.Atan2(z, x)
		edgeT := (distOrigin - 370.0) / 140.0
		ridge := 0.72 + 0.28*math.Sin(angle*7.0) + 0.14*math.Cos(angle*13.0)
		h += edgeT * edgeT * 62.0 * ridge
	}

	return h
}

func (w *World) IsInsideLake(x, z float64) bool {
	dx1, dz1 := x-w.Cfg.OasisX, z-w.Cfg.OasisZ
	r1 := w.Cfg.OasisRadius + 4.0
	if dx1*dx1+dz1*dz1 <= r1*r1 {
		return true
	}
	dx2, dz2 := x-w.Cfg.HighlandLakeX, z-w.Cfg.HighlandLakeZ
	r2 := w.Cfg.HighlandLakeRadius + 5.0
	return dx2*dx2+dz2*dz2 <= r2*r2
}

func (w *World) IsNearWater(x, z float64) bool {
	dx1, dz1 := x-w.Cfg.OasisX, z-w.Cfg.OasisZ
	r1 := w.Cfg.OasisRadius + 6.0
	if dx1*dx1+dz1*dz1 <= r1*r1 {
		return true
	}
	dx2, dz2 := x-w.Cfg.HighlandLakeX, z-w.Cfg.HighlandLakeZ
	r2 := w.Cfg.HighlandLakeRadius + 6.0
	return dx2*dx2+dz2*dz2 <= r2*r2
}

// GetEntityGroundHeight trả về độ cao chân chạm đất (giữ mực lội nước khi đi vào lòng hồ).
func (w *World) GetEntityGroundHeight(x, z float64) float64 {
	h := w.GetTerrainHeight(x, z)
	if w.IsInsideLake(x, z) {
		return math.Max(w.Cfg.WaterLevel-0.85, h)
	}
	return h
}