package store

import (
	"sync"

	"dino-server-v2/internal/domain"
	"dino-server-v2/internal/protocol"
)

const MaxBloodTrails = 44

type MemoryStore struct {
	mu                  sync.RWMutex
	Entities            map[string]*domain.Entity
	Foods               map[string]*domain.WorldFood
	BloodTrails         []domain.BloodTrail
	PendingCombatEvents []domain.CombatEvent
	PendingChats        []domain.ChatMessage
	WorldTime           float64
	Weather             string
	WeatherTimer        float64
	FoodsDirty          bool
	BloodDirty          bool
}

func NewMemoryStore(initialFoods map[string]*domain.WorldFood, defaultDay float64) *MemoryStore {
	if initialFoods == nil {
		initialFoods = make(map[string]*domain.WorldFood)
	}
	return &MemoryStore{
		Entities:            make(map[string]*domain.Entity, 32),
		Foods:               initialFoods,
		BloodTrails:         make([]domain.BloodTrail, 0, MaxBloodTrails+4),
		PendingCombatEvents: make([]domain.CombatEvent, 0, 16),
		PendingChats:        make([]domain.ChatMessage, 0, 8),
		WorldTime:           defaultDay,
		Weather:             domain.WeatherClear,
		WeatherTimer:        95.0,
		FoodsDirty:          true,
		BloodDirty:          true,
	}
}

func (s *MemoryStore) Lock()    { s.mu.Lock() }
func (s *MemoryStore) Unlock()  { s.mu.Unlock() }
func (s *MemoryStore) RLock()   { s.mu.RLock() }
func (s *MemoryStore) RUnlock() { s.mu.RUnlock() }

func (s *MemoryStore) AppendChatLocked(msg domain.ChatMessage) {
	s.PendingChats = append(s.PendingChats, msg)
}

func (s *MemoryStore) AppendCombatEventLocked(evt domain.CombatEvent) {
	s.PendingCombatEvents = append(s.PendingCombatEvents, evt)
}

func (s *MemoryStore) AddBloodTrailLocked(bt domain.BloodTrail) {
	s.BloodTrails = append(s.BloodTrails, bt)
	if len(s.BloodTrails) > MaxBloodTrails {
		s.BloodTrails = s.BloodTrails[len(s.BloodTrails)-MaxBloodTrails:]
	}
	s.BloodDirty = true
}

func (s *MemoryStore) StatusSummary() (entitiesCount, foodsCount int, worldTime float64, weather string) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.Entities), len(s.Foods), s.WorldTime, s.Weather
}

func (s *MemoryStore) GetFullSnapshot() (
	map[string]*protocol.PlayerDTO,
	map[string]*protocol.WorldFoodDTO,
	[]protocol.BloodTrailDTO,
	float64,
	string,
) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return protocol.MapPlayersToDTO(s.Entities),
		protocol.MapFoodsToDTO(s.Foods),
		protocol.MapBloodTrailsToDTO(s.BloodTrails),
		s.WorldTime,
		s.Weather
}

func (s *MemoryStore) FlushTickSnapshotLocked(forceAux bool) (
	map[string]*protocol.PlayerDTO,
	map[string]*protocol.WorldFoodDTO,
	[]protocol.BloodTrailDTO,
	[]protocol.CombatEventDTO,
	[]protocol.ChatMessageDTO,
	float64,
	string,
) {
	pSnap := protocol.MapPlayersToDTO(s.Entities)

	var fSnap map[string]*protocol.WorldFoodDTO
	if s.FoodsDirty || forceAux {
		fSnap = protocol.MapFoodsToDTO(s.Foods)
		s.FoodsDirty = false
	}

	var bSnap []protocol.BloodTrailDTO
	if s.BloodDirty || forceAux {
		bSnap = protocol.MapBloodTrailsToDTO(s.BloodTrails)
		s.BloodDirty = false
	}

	var events []protocol.CombatEventDTO
	if len(s.PendingCombatEvents) > 0 {
		events = protocol.MapCombatEventsToDTO(s.PendingCombatEvents)
		s.PendingCombatEvents = s.PendingCombatEvents[:0]
	}

	var chats []protocol.ChatMessageDTO
	if len(s.PendingChats) > 0 {
		chats = protocol.MapChatsToDTO(s.PendingChats)
		s.PendingChats = s.PendingChats[:0]
	}

	return pSnap, fSnap, bSnap, events, chats, s.WorldTime, s.Weather
}