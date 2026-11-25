package repository

import (
	"math"
	"sync"

	"dino-server/internal/models"
	"dino-server/internal/world"
)

// WorldRepository lưu trữ toàn bộ trạng thái thế giới trong RAM, bảo vệ bởi RWMutex.
// Sau này có thể mở rộng lưu tiến độ người chơi xuống SQLite/Postgres ngay tại tầng này.
type WorldRepository struct {
	mu                  sync.RWMutex
	Players             map[string]*models.Player
	Foods               map[string]*models.WorldFood
	PendingCombatEvents []models.CombatEvent
	PendingChats        []models.ChatMessage
	WorldTime           float64
	FoodsDirty          bool
}

func NewWorldRepository() *WorldRepository {
	return &WorldRepository{
		Players:             make(map[string]*models.Player, 32),
		Foods:               world.CreateInitialPlants(),
		PendingCombatEvents: make([]models.CombatEvent, 0, 16),
		PendingChats:        make([]models.ChatMessage, 0, 8),
		WorldTime:           0.88, // ~08:38 sáng
		FoodsDirty:          true,
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
	return &cp
}

// GetFullSnapshot trả về bản sao đầy đủ (dùng cho INIT và HTTP health check)
func (r *WorldRepository) GetFullSnapshot() (map[string]*models.Player, map[string]*models.WorldFood, float64) {
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
	return pSnap, fSnap, r.WorldTime
}

// FlushTickSnapshotLocked xuất dữ liệu đồng bộ cho 1 tick 20Hz (phải gọi khi đang giữ r.Lock()).
// Tối ưu: chỉ kèm Foods khi FoodsDirty = true hoặc forceFoods = true.
func (r *WorldRepository) FlushTickSnapshotLocked(forceFoods bool) (
	map[string]*models.Player,
	map[string]*models.WorldFood,
	[]models.CombatEvent,
	[]models.ChatMessage,
	float64,
) {
	pSnap := make(map[string]*models.Player, len(r.Players))
	for k, v := range r.Players {
		pSnap[k] = copyPlayerOptimized(v)
	}

	var fSnap map[string]*models.WorldFood
	if r.FoodsDirty || forceFoods {
		fSnap = make(map[string]*models.WorldFood, len(r.Foods))
		for k, v := range r.Foods {
			fCopy := *v
			fSnap[k] = &fCopy
		}
		r.FoodsDirty = false
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

	return pSnap, fSnap, events, chats, r.WorldTime
}