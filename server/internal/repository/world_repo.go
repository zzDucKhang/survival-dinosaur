package repository

import (
	"math"
	"sync"

	"dino-server/internal/models"
	"dino-server/internal/world"
)

type WorldRepository struct {
	mu                  sync.RWMutex
	Players             map[string]*models.Player
	Foods               map[string]*models.WorldFood
	BloodTrails         []models.BloodTrail
	PendingCombatEvents []models.CombatEvent
	PendingChats        []models.ChatMessage
	WorldTime           float64
	Weather             string
	WeatherTimer        float64
	FoodsDirty          bool
	BloodDirty          bool
}

func NewWorldRepository() *WorldRepository {
	return &WorldRepository{
		Players:             make(map[string]*models.Player, 32),
		Foods:               world.CreateInitialPlants(),
		BloodTrails:         make([]models.BloodTrail, 0, 48),
		PendingCombatEvents: make([]models.CombatEvent, 0, 16),
		PendingChats:        make([]models.ChatMessage, 0, 8),
		WorldTime:           0.36, // ~08:38 sáng
		Weather:             models.WeatherClear,
		WeatherTimer:        95.0,
		FoodsDirty:          true,
		BloodDirty:          true,
	}
}

func (r *WorldRepository) Lock()    { r.mu.Lock() }
func (r *WorldRepository) Unlock()  { r.mu.Unlock() }
func (r *WorldRepository) RLock()   { r.mu.RLock() }
func (r *WorldRepository) RUnlock() { r.mu.RUnlock() }

func round2(v float64) float64 { return math.Round(v*100) / 100 }
func round3(v float64) float64 { return math.Round(v*1000) / 1000 }

func copyPlayerOptimized(src *models.Player) *models.Player {
	cp := *src
	cp.X = round2(cp.X)
	cp.Y = round2(cp.Y)
	cp.Z = round2(cp.Z)
	cp.Rotation = round3(cp.Rotation)
	cp.Hunger = round2(cp.Hunger)
	cp.Thirst = round2(cp.Thirst)
	cp.Growth = round3(cp.Growth)
	cp.BleedTimer = round2(cp.BleedTimer)
	cp.BoneBreakTimer = round2(cp.BoneBreakTimer)
	cp.SpecialCDLeft = round2(cp.SpecialCDLeft)
	return &cp
}

func (r *WorldRepository) GetFullSnapshot() (
	map[string]*models.Player,
	map[string]*models.WorldFood,
	[]models.BloodTrail,
	float64,
	string,
) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	pSnap := make(map[string]*models.Player, len(r.Players))
	for k, v := range r.Players {
		pSnap[k] = copyPlayerOptimized(v)
	}
	fSnap := make(map[string]*models.WorldFood, len(r.Foods))
	for k, v := range r.Foods {
		fCopy := *v
		fSnap[k] = &fCopy
	}
	bSnap := make([]models.BloodTrail, len(r.BloodTrails))
	copy(bSnap, r.BloodTrails)

	return pSnap, fSnap, bSnap, r.WorldTime, r.Weather
}

func (r *WorldRepository) FlushTickSnapshotLocked(forceAux bool) (
	map[string]*models.Player,
	map[string]*models.WorldFood,
	[]models.BloodTrail,
	[]models.CombatEvent,
	[]models.ChatMessage,
	float64,
	string,
) {
	pSnap := make(map[string]*models.Player, len(r.Players))
	for k, v := range r.Players {
		pSnap[k] = copyPlayerOptimized(v)
	}

	var fSnap map[string]*models.WorldFood
	if r.FoodsDirty || forceAux {
		fSnap = make(map[string]*models.WorldFood, len(r.Foods))
		for k, v := range r.Foods {
			fCopy := *v
			fSnap[k] = &fCopy
		}
		r.FoodsDirty = false
	}

	var bSnap []models.BloodTrail
	if r.BloodDirty || forceAux {
		bSnap = make([]models.BloodTrail, len(r.BloodTrails))
		copy(bSnap, r.BloodTrails)
		r.BloodDirty = false
	}

	var events []models.CombatEvent
	if len(r.PendingCombatEvents) > 0 {
		events = make([]models.CombatEvent, len(r.PendingCombatEvents))
		copy(events, r.PendingCombatEvents)
		r.PendingCombatEvents = r.PendingCombatEvents[:0]
	}

	var chats []models.ChatMessage
	if len(r.PendingChats) > 0 {
		chats = make([]models.ChatMessage, len(r.PendingChats))
		copy(chats, r.PendingChats)
		r.PendingChats = r.PendingChats[:0]
	}

	return pSnap, fSnap, bSnap, events, chats, r.WorldTime, r.Weather
}