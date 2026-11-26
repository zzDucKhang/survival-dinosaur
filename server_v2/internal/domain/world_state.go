package domain

const (
	WeatherClear = "clear"
	WeatherFog   = "fog"
	WeatherRain  = "rain"
	WeatherStorm = "storm"
)

type WorldConfig struct {
	OasisX             float64 `json:"oasisX"`
	OasisZ             float64 `json:"oasisZ"`
	OasisRadius        float64 `json:"oasisRadius"`
	HighlandLakeX      float64 `json:"highlandLakeX"`
	HighlandLakeZ      float64 `json:"highlandLakeZ"`
	HighlandLakeRadius float64 `json:"highlandLakeRadius"`
	IslandLimit        float64 `json:"islandLimit"`
	WaterLevel         float64 `json:"waterLevel"`
	TerrainSize        float64 `json:"terrainSize"`
	TerrainSegments    int     `json:"terrainSegments"`
	RockCount          int     `json:"rockCount"`
	InitialPlantCount  int     `json:"initialPlantCount"`
}

type WorldFood struct {
	ID        string
	Type      string // "meat" | "plant"
	X         float64
	Z         float64
	Amount    int
	MaxAmount int
	ExpiresAt int64
}

type BloodTrail struct {
	ID        string
	X         float64
	Z         float64
	ExpiresAt int64
}

type CombatEvent struct {
	ID         string
	AttackerID string
	TargetID   string
	Damage     int
	TargetHP   int
	IsKill     bool
	AttackType string // "bite" | "tail" | "special" | "bleed" | "heal" | "roar" | "bonebreak"
	X          float64
	Y          float64
	Z          float64
}

type ChatMessage struct {
	ID        string
	Sender    string
	Text      string
	IsSystem  bool
	Timestamp int64
}