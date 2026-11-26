package world

import "math"

type RockObstacle struct {
	X      float64
	Z      float64
	Radius float64
}

func (w *World) buildRocks() []RockObstacle {
	count := w.Cfg.RockCount
	if count <= 0 {
		count = 140
	}
	rocks := make([]RockObstacle, 0, count)
	for i := 0; i < count; i++ {
		angle := float64(i)*2.3999632 + float64(i%5)*0.11
		dist := 30.0 + math.Mod(float64(i)*19.37, 360.0)
		x := math.Cos(angle) * dist
		z := math.Sin(angle) * dist

		if math.Hypot(x-w.Cfg.OasisX, z-w.Cfg.OasisZ) < w.Cfg.OasisRadius+10.0 {
			continue
		}
		if math.Hypot(x-w.Cfg.HighlandLakeX, z-w.Cfg.HighlandLakeZ) < w.Cfg.HighlandLakeRadius+10.0 {
			continue
		}
		if w.GetTerrainHeight(x, z) > 24.0 {
			continue
		}

		sx := 1.6 + float64(i%4)*1.35
		sz := 1.6 + float64(i%3)*1.45
		radius := math.Max(sx, sz) * 1.15
		rocks = append(rocks, RockObstacle{X: x, Z: z, Radius: radius})
	}
	return rocks
}

// ResolveObstacleCollision dùng bình phương khoảng cách để loại bỏ sqrt ở đa số tảng đá.
func (w *World) ResolveObstacleCollision(x, z, entityRadius float64) (float64, float64) {
	for i := range w.Rocks {
		rock := &w.Rocks[i]
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
	limit := w.Cfg.IslandLimit
	x = clamp(x, -limit, limit)
	z = clamp(z, -limit, limit)
	return x, z
}