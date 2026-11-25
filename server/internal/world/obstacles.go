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
	WaterLevel  = -0.35
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

// GetTerrainHeight khớp 100% với client/src/constants/terrain.ts
func GetTerrainHeight(x, z float64) float64 {
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

	dOasis := math.Hypot(x-OasisX, z-OasisZ)
	if dOasis < OasisRadius+18.0 {
		t := clamp((dOasis-OasisRadius)/18.0, 0.0, 1.0)
		t = t * t * (3.0 - 2.0*t)
		h = -2.2*(1.0-t) + h*t
	}

	dLake2 := math.Hypot(x-HighlandLakeX, z-HighlandLakeZ)
	if dLake2 < HighlandLakeRadius+22.0 {
		t := clamp((dLake2-HighlandLakeRadius)/22.0, 0.0, 1.0)
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

func IsInsideLake(x, z float64) bool {
	dx1, dz1 := x-OasisX, z-OasisZ
	r1 := OasisRadius + 4.0
	if dx1*dx1+dz1*dz1 <= r1*r1 {
		return true
	}
	dx2, dz2 := x-HighlandLakeX, z-HighlandLakeZ
	r2 := HighlandLakeRadius + 5.0
	return dx2*dx2+dz2*dz2 <= r2*r2
}

func IsNearWater(x, z float64) bool {
	dx1, dz1 := x-OasisX, z-OasisZ
	r1 := OasisRadius + 6.0
	if dx1*dx1+dz1*dz1 <= r1*r1 {
		return true
	}
	dx2, dz2 := x-HighlandLakeX, z-HighlandLakeZ
	r2 := HighlandLakeRadius + 6.0
	return dx2*dx2+dz2*dz2 <= r2*r2
}

// GetEntityGroundHeight trả về đúng độ cao chân chạm mặt đất (kể cả vùng trũng âm),
// chỉ giới hạn độ sâu lội nước khi ở trong 2 hồ.
func GetEntityGroundHeight(x, z float64) float64 {
	h := GetTerrainHeight(x, z)
	if IsInsideLake(x, z) {
		return math.Max(WaterLevel-0.85, h)
	}
	return h
}

func init() {
	Rocks = make([]RockObstacle, 0, 140)
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

// ResolveObstacleCollision tối ưu dùng bình phương khoảng cách để bỏ sqrt ở phần lớn tảng đá
func ResolveObstacleCollision(x, z, entityRadius float64) (float64, float64) {
	for i := range Rocks {
		rock := &Rocks[i]
		dx := x - rock.X
		dz := z - rock.Z
		minDist := rock.Radius + entityRadius
		distSq := dx*dx + dz*dz
		if distSq < minDist*minDist {
			if distSq < 0.000001 {
				x += minDist
			} else {
				dist := math.Sqrt(distSq)
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
	foods := make(map[string]*models.WorldFood, 24)
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
			X:         math.Round(x*100) / 100,
			Z:         math.Round(z*100) / 100,
			Amount:    100,
			MaxAmount: 100,
			ExpiresAt: 0,
		}
	}
	return foods
}