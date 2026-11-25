package world

import (
	"fmt"
	"math"

	"dino-server/internal/models"
)

const (
	OasisX      = 60.0
	OasisZ      = -60.0
	OasisRadius = 26.0

	HighlandLakeX      = -160.0
	HighlandLakeZ      = 140.0
	HighlandLakeRadius = 32.0

	IslandLimit = 450.0
)

type RockObstacle struct {
	X      float64
	Z      float64
	Radius float64
}

var Rocks []RockObstacle

func clamp(v, minV, maxV float64) float64 {
	if v < minV {
		return minV
	}
	if v > maxV {
		return maxV
	}
	return v
}

// GetTerrainHeight trả về độ cao Y tại (x, z) — khớp 100% với client/src/constants/terrain.ts
func GetTerrainHeight(x, z float64) float64 {
	distOrigin := math.Hypot(x, z)

	// Đồi núi & thung lũng tự nhiên (O(1), không tốn RAM)
	hills := math.Sin(x*0.011)*math.Cos(z*0.011)*11.0 +
		math.Sin(x*0.024+z*0.017)*4.5 +
		math.Cos(x*0.0055-z*0.0065)*9.0

	// 2 đỉnh núi lớn phía Đông Bắc & Tây Nam
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

	// Thung lũng sâu phía Tây Bắc
	dValley := math.Hypot(x+140.0, z-20.0)
	if dValley < 110.0 {
		t := 1.0 - dValley/110.0
		hills -= t * t * 8.0
	}

	// Giữ vùng trung tâm (0,0) bằng phẳng làm bãi cỏ xuất phát
	spawnWeight := clamp((distOrigin-32.0)/55.0, 0.0, 1.0)
	h := 0.8 + hills*spawnWeight

	// Lòng chảo Hồ Oasis (60, -60)
	dOasis := math.Hypot(x-OasisX, z-OasisZ)
	if dOasis < OasisRadius+18.0 {
		t := clamp((dOasis-OasisRadius)/18.0, 0.0, 1.0)
		t = t * t * (3.0 - 2.0*t)
		h = -2.2*(1.0-t) + h*t
	}

	// Lòng chảo Hồ Cao Nguyên (-160, 140)
	dLake2 := math.Hypot(x-HighlandLakeX, z-HighlandLakeZ)
	if dLake2 < HighlandLakeRadius+22.0 {
		t := clamp((dLake2-HighlandLakeRadius)/22.0, 0.0, 1.0)
		t = t * t * (3.0 - 2.0*t)
		h = -2.2*(1.0-t) + h*t
	}

	// Vòng núi bao quanh chân trời (dist > 370)
	if distOrigin > 370.0 {
		angle := math.Atan2(z, x)
		edgeT := (distOrigin - 370.0) / 140.0
		ridge := 0.72 + 0.28*math.Sin(angle*7.0) + 0.14*math.Cos(angle*13.0)
		h += edgeT * edgeT * 62.0 * ridge
	}

	return h
}

func IsNearWater(x, z float64) bool {
	if math.Hypot(x-OasisX, z-OasisZ) <= OasisRadius+6.0 {
		return true
	}
	if math.Hypot(x-HighlandLakeX, z-HighlandLakeZ) <= HighlandLakeRadius+6.0 {
		return true
	}
	return false
}

func init() {
	for i := 0; i < 140; i++ {
		angle := float64(i)*2.3999632 + float64(i%5)*0.11
		dist := 30.0 + math.Mod(float64(i)*19.37, 360.0)
		x := math.Cos(angle) * dist
		z := math.Sin(angle) * dist

		if math.Hypot(x-OasisX, z-OasisZ) < OasisRadius+10.0 {
			continue
		}
		if math.Hypot(x-HighlandLakeX, z-HighlandLakeZ) < HighlandLakeRadius+10.0 {
			continue
		}
		if GetTerrainHeight(x, z) > 24.0 {
			continue
		}

		sx := 1.6 + float64(i%4)*1.35
		sz := 1.6 + float64(i%3)*1.45
		radius := math.Max(sx, sz) * 1.15
		Rocks = append(Rocks, RockObstacle{X: x, Z: z, Radius: radius})
	}
}

func ResolveObstacleCollision(x, z, entityRadius float64) (float64, float64) {
	for _, rock := range Rocks {
		dx := x - rock.X
		dz := z - rock.Z
		dist := math.Hypot(dx, dz)
		minDist := rock.Radius + entityRadius
		if dist < minDist {
			if dist < 0.001 {
				x += minDist
			} else {
				push := minDist - dist
				x += (dx / dist) * push
				z += (dz / dist) * push
			}
		}
	}
	x = clamp(x, -IslandLimit, IslandLimit)
	z = clamp(z, -IslandLimit, IslandLimit)
	return x, z
}

func CreateInitialPlants() map[string]*models.WorldFood {
	foods := make(map[string]*models.WorldFood)
	for i := 0; i < 24; i++ {
		angle := float64(i) * 2.3999632
		dist := 35.0 + math.Mod(float64(i)*31.7, 310.0)
		x := math.Cos(angle) * dist
		z := math.Sin(angle) * dist
		if IsNearWater(x, z) || GetTerrainHeight(x, z) > 20.0 {
			x = math.Cos(angle) * 48.0
			z = math.Sin(angle) * 48.0
		}
		id := fmt.Sprintf("plant-%d", i+1)
		foods[id] = &models.WorldFood{
			ID:        id,
			Type:      "plant",
			X:         x,
			Z:         z,
			Amount:    100,
			MaxAmount: 100,
			ExpiresAt: 0,
		}
	}
	return foods
}