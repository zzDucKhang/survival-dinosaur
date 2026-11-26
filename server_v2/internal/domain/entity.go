package domain

import "time"

type Timers struct {
	LastAttack  time.Time
	LastSpecial time.Time
	LastEat     time.Time
	LastCombat  time.Time
	RestStarted time.Time
	LastRoar    time.Time

	BleedTickAccum  float64
	BloodTrailAccum float64
	StarveTickAccum float64
	RegenTickAccum  float64
}

type AIControl struct {
	State          string
	TargetX        float64
	TargetZ        float64
	TargetPlayerID string
	ProvokedByID   string
	ProvokedTimer  float64
	StateTimer     float64
}

type Entity struct {
	ID        string
	Name      string
	Model     string
	Diet      string
	IsAI      bool

	X         float64
	Y         float64
	Z         float64
	Rotation  float64
	AnimState string

	HP              int
	MaxHP           int
	BaseMaxHP       int
	Hunger          float64
	Thirst          float64
	Growth          float64
	BleedTimer      float64
	BoneBreakTimer  float64
	SpecialCDLeft   float64
	Kills           int
	IsResting       bool
	RestUnlockLeft  float64
	CombatTimerLeft float64
	RegenRate       int
	IsCrouching     bool

	PackID         string
	PackInviteFrom string
	PackInviteName string

	RespawnSeq   int
	LastKilledBy string

	Timers Timers
	AI     AIControl
}

// ResetCombatAndStatus dọn sạch toàn bộ debuff/timer dùng chung cho cả AI & Player khi hồi sinh.
func (e *Entity) ResetCombatAndStatus() {
	e.IsResting = false
	e.RestUnlockLeft = 0
	e.IsCrouching = false
	e.CombatTimerLeft = 0
	e.RegenRate = 0
	e.BleedTimer = 0
	e.BoneBreakTimer = 0
	e.SpecialCDLeft = 0
	e.AnimState = "idle"

	e.Timers.LastCombat = time.Time{}
	e.Timers.LastSpecial = time.Time{}
	e.Timers.RestStarted = time.Time{}
	e.Timers.BleedTickAccum = 0
	e.Timers.BloodTrailAccum = 0
	e.Timers.StarveTickAccum = 0
	e.Timers.RegenTickAccum = 0

	e.AI.ProvokedByID = ""
	e.AI.ProvokedTimer = 0
	e.AI.TargetPlayerID = ""
	e.AI.TargetX = 0
	e.AI.TargetZ = 0
}