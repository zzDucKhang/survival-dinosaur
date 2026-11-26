package ai

import (
	"math"
	"math/rand"

	"dino-server-v2/internal/domain"
)

func (c *Controller) pickRandomWaypoint(bot *domain.Entity) {
	for i := 0; i < 10; i++ {
		angle := rand.Float64() * 2 * math.Pi
		step := 30.0 + rand.Float64()*85.0
		wx := bot.X + math.Cos(angle)*step
		wz := bot.Z + math.Sin(angle)*step
		if math.Abs(wx) < 350.0 && math.Abs(wz) < 350.0 &&
			!c.world.IsNearWater(wx, wz) &&
			c.world.GetEntityGroundHeight(wx, wz) < 22.0 {
			bot.AI.TargetX = wx
			bot.AI.TargetZ = wz
			bot.AI.StateTimer = 10.0 + rand.Float64()*10.0
			return
		}
	}
	bot.AI.TargetX = (rand.Float64() - 0.5) * 140.0
	bot.AI.TargetZ = (rand.Float64() - 0.5) * 140.0
	bot.AI.StateTimer = 12.0
}

func (c *Controller) steerAndMove(bot *domain.Entity, targetX, targetZ, speed, turnRate, dt float64) {
	if bot.BoneBreakTimer > 0 {
		speed *= 0.45
		turnRate *= 0.70
	}
	dx := targetX - bot.X
	dz := targetZ - bot.Z
	desiredYaw := math.Atan2(dx, dz)
	bot.Rotation = lerpAngle(bot.Rotation, desiredYaw, math.Min(1.0, dt*turnRate))

	nextX := bot.X + math.Sin(bot.Rotation)*speed*dt
	nextZ := bot.Z + math.Cos(bot.Rotation)*speed*dt
	if c.world.GetEntityGroundHeight(nextX, nextZ) > 26.0 {
		c.pickRandomWaypoint(bot)
		return
	}

	bot.X, bot.Z = c.world.ResolveObstacleCollision(nextX, nextZ, 2.0)
	bot.Y = c.world.GetEntityGroundHeight(bot.X, bot.Z)
	if math.Abs(bot.X) >= 380.0 || math.Abs(bot.Z) >= 380.0 {
		c.pickRandomWaypoint(bot)
	}
}

func lerpAngle(a, b, t float64) float64 {
	diff := math.Mod(b-a, 2*math.Pi)
	if diff > math.Pi {
		diff -= 2 * math.Pi
	}
	if diff < -math.Pi {
		diff += 2 * math.Pi
	}
	return a + diff*t
}