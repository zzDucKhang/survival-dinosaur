package models

import (
	"encoding/json"
	"time"
)

const (
	DietCarnivore = "carnivore"
	DietHerbivore = "herbivore"
)

type Player struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Model          string    `json:"model"`
	Diet           string    `json:"diet"`
	X              float64   `json:"x"`
	Y              float64   `json:"y"`
	Z              float64   `json:"z"`
	Rotation       float64   `json:"rot"`
	AnimState      string    `json:"anim"`
	HP             int       `json:"hp"`
	MaxHP          int       `json:"maxHp"`
	BaseMaxHP      int       `json:"-"`
	Hunger         float64   `json:"hunger"`
	Thirst         float64   `json:"thirst"`
	Growth         float64   `json:"growth"` // 0.35 (Con non) -> 1.0 (Trưởng thành) -> 1.25 (Apex)
	BleedTimer     float64   `json:"bleed"`
	Kills          int       `json:"kills"`
	IsResting      bool      `json:"isResting"`
	IsAI           bool      `json:"isAi"`
	AIState        string    `json:"aiState,omitempty"`
	LastAttackTime time.Time `json:"-"`
	LastEatTime    time.Time `json:"-"`

	// Internal AI navigation & timers
	TargetX         float64 `json:"-"`
	TargetZ         float64 `json:"-"`
	TargetPlayerID  string  `json:"-"`
	ProvokedByID    string  `json:"-"`
	ProvokedTimer   float64 `json:"-"`
	StateTimer      float64 `json:"-"`
	BleedTickAccum  float64 `json:"-"`
	StarveTickAccum float64 `json:"-"`
	RegenTickAccum  float64 `json:"-"`
}

type WorldFood struct {
	ID        string  `json:"id"`
	Type      string  `json:"type"` // "meat" | "plant"
	X         float64 `json:"x"`
	Z         float64 `json:"z"`
	Amount    int     `json:"amount"`
	MaxAmount int     `json:"maxAmount"`
	ExpiresAt int64   `json:"-"`
}

type CombatEvent struct {
	ID         string  `json:"id"`
	AttackerID string  `json:"attackerId"`
	TargetID   string  `json:"targetId"`
	Damage     int     `json:"damage"`
	TargetHP   int     `json:"targetHp"`
	IsKill     bool    `json:"isKill"`
	AttackType string  `json:"attackType"`
	X          float64 `json:"x"`
	Y          float64 `json:"y"`
	Z          float64 `json:"z"`
}

type ChatMessage struct {
	ID        string `json:"id"`
	Sender    string `json:"sender"`
	Text      string `json:"text"`
	IsSystem  bool   `json:"isSystem,omitempty"`
	Timestamp int64  `json:"ts"`
}

type InboundMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type JoinPayload struct {
	Name  string `json:"name"`
	Model string `json:"model,omitempty"`
}

type MovePayload struct {
	X         float64 `json:"x"`
	Y         float64 `json:"y,omitempty"`
	Z         float64 `json:"z"`
	Rotation  float64 `json:"rotation"`
	AnimState string  `json:"animState"`
}

type AttackPayload struct {
	AttackType string `json:"attackType"`
}

type ChatPayload struct {
	Text string `json:"text"`
}

type OutboundMessage struct {
	Type      string                `json:"type"`
	ID        string                `json:"id,omitempty"`
	Players   map[string]*Player    `json:"players,omitempty"`
	Foods     map[string]*WorldFood `json:"foods,omitempty"`
	Events    []CombatEvent         `json:"events,omitempty"`
	Chats     []ChatMessage         `json:"chats,omitempty"`
	WorldTime float64               `json:"worldTime"` // 0.0 -> 1.0
	Message   string                `json:"message,omitempty"`
}