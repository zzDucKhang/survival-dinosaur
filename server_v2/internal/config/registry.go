package config

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"strings"

	"dino-server-v2/internal/domain"
)

type Registry struct {
	Species     map[string]domain.SpeciesSpec
	DefaultSpec domain.SpeciesSpec
	World       domain.WorldConfig
}

func LoadRegistry(sharedDir string) *Registry {
	reg := &Registry{
		Species: make(map[string]domain.SpeciesSpec),
		World:   defaultWorldConfig(),
	}

	for _, spec := range defaultSpeciesList() {
		reg.Species[strings.ToLower(spec.ID)] = spec
	}

	if sharedDir != "" {
		reg.loadWorldJSON(filepath.Join(sharedDir, "world_config.json"))
		reg.loadSpeciesJSON(filepath.Join(sharedDir, "species.json"))
	}

	if def, ok := reg.Species["trex"]; ok {
		reg.DefaultSpec = def
	} else {
		reg.DefaultSpec = defaultSpeciesList()[0]
	}

	log.Printf("[Config] Loaded %d species (sharedDir=%q)", len(reg.Species), sharedDir)
	return reg
}

func (r *Registry) GetSpecies(modelID string) domain.SpeciesSpec {
	if spec, ok := r.Species[strings.ToLower(strings.TrimSpace(modelID))]; ok {
		return spec
	}
	return r.DefaultSpec
}

func (r *Registry) loadWorldJSON(path string) {
	raw, err := os.ReadFile(path)
	if err != nil {
		log.Printf("[Config] Using fallback world_config (%v)", err)
		return
	}
	var cfg domain.WorldConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		log.Printf("[Config] Invalid world_config.json (%v), using fallback", err)
		return
	}
	if cfg.IslandLimit > 0 {
		r.World = cfg
	}
}

func (r *Registry) loadSpeciesJSON(path string) {
	raw, err := os.ReadFile(path)
	if err != nil {
		log.Printf("[Config] Using fallback species list (%v)", err)
		return
	}
	var list []domain.SpeciesSpec
	if err := json.Unmarshal(raw, &list); err != nil {
		log.Printf("[Config] Invalid species.json (%v), using fallback", err)
		return
	}
	if len(list) == 0 {
		return
	}
	loaded := make(map[string]domain.SpeciesSpec, len(list))
	for _, s := range list {
		if s.ID == "" {
			continue
		}
		if s.TailMult <= 0 {
			s.TailMult = 0.85
		}
		if s.Special.Cooldown <= 0 {
			s.Special.Cooldown = 8.0
		}
		if s.Bot.WalkSpeed <= 0 {
			s.Bot.WalkSpeed = 5.0
		}
		if s.Bot.SprintSpeed <= 0 {
			s.Bot.SprintSpeed = 9.0
		}
		if s.Bot.AggroRange <= 0 {
			s.Bot.AggroRange = 26.0
		}
		if s.Bot.BaseDamage <= 0 {
			s.Bot.BaseDamage = 14.0
		}
		loaded[strings.ToLower(s.ID)] = s
	}
	if len(loaded) > 0 {
		r.Species = loaded
	}
}

func defaultWorldConfig() domain.WorldConfig {
	return domain.WorldConfig{
		OasisX:             60.0,
		OasisZ:             -60.0,
		OasisRadius:        26.0,
		HighlandLakeX:      -160.0,
		HighlandLakeZ:      140.0,
		HighlandLakeRadius: 32.0,
		IslandLimit:        450.0,
		WaterLevel:         -0.35,
		TerrainSize:        1200.0,
		TerrainSegments:    128,
		RockCount:          140,
		InitialPlantCount:  24,
	}
}

func defaultSpeciesList() []domain.SpeciesSpec {
	return []domain.SpeciesSpec{
		{
			ID: "trex", Name: "T-Rex Apex", Diet: domain.DietCarnivore,
			BaseMaxHP: 150, BiteDamage: 26, BleedSec: 4.0, TailMult: 0.85,
			Special: domain.SpecialSkillSpec{Cooldown: 12, Damage: 38, BleedSec: 5, BoneBreakSec: 6, Anim: "bite"},
			Bot:     domain.BotBehaviorSpec{WalkSpeed: 5.0, SprintSpeed: 9.2, AggroRange: 32, BaseDamage: 21},
		},
		{
			ID: "t-rex", Name: "T-Rex Alpha", Diet: domain.DietCarnivore,
			BaseMaxHP: 135, BiteDamage: 24, BleedSec: 4.0, TailMult: 0.85,
			Special: domain.SpecialSkillSpec{Cooldown: 12, Damage: 38, BleedSec: 5, BoneBreakSec: 6, Anim: "bite"},
			Bot:     domain.BotBehaviorSpec{WalkSpeed: 5.2, SprintSpeed: 9.6, AggroRange: 28, BaseDamage: 18},
		},
		{
			ID: "tyranno", Name: "Tyranno Juvie", Diet: domain.DietCarnivore,
			BaseMaxHP: 110, BiteDamage: 17, BleedSec: 5.0, TailMult: 0.85,
			Special: domain.SpecialSkillSpec{Cooldown: 8, Damage: 29, BleedSec: 7.5, DashDist: 10, Anim: "bite"},
			Bot:     domain.BotBehaviorSpec{WalkSpeed: 6.2, SprintSpeed: 10.8, AggroRange: 26, BaseDamage: 14},
		},
		{
			ID: "dino_hunter_deadly_shores_vicious", Name: "Vicious Predator", Diet: domain.DietCarnivore,
			BaseMaxHP: 130, BiteDamage: 21, BleedSec: 6.5, TailMult: 0.85,
			Special: domain.SpecialSkillSpec{Cooldown: 8, Damage: 29, BleedSec: 7.5, DashDist: 10, Anim: "bite"},
			Bot:     domain.BotBehaviorSpec{WalkSpeed: 5.6, SprintSpeed: 10.0, AggroRange: 26, BaseDamage: 16},
		},
		{
			ID: "tricera", Name: "Triceratops", Diet: domain.DietHerbivore,
			BaseMaxHP: 175, BiteDamage: 25, TailMult: 0.85,
			Special: domain.SpecialSkillSpec{Cooldown: 10, Damage: 36, RangeBonus: 1.5, BoneBreakSec: 4.5, Knockback: 7.5, Anim: "bite"},
			Bot:     domain.BotBehaviorSpec{WalkSpeed: 5.0, SprintSpeed: 8.0, AggroRange: 26, BaseDamage: 17},
		},
		{
			ID: "stego", Name: "Stegosaurus", Diet: domain.DietHerbivore,
			BaseMaxHP: 165, BiteDamage: 23, TailMult: 1.25,
			Special: domain.SpecialSkillSpec{Cooldown: 9, Damage: 34, RangeBonus: 2.6, Is360: true, BleedSec: 10, Anim: "tail"},
			Bot:     domain.BotBehaviorSpec{WalkSpeed: 5.0, SprintSpeed: 8.0, AggroRange: 26, BaseDamage: 17},
		},
		{
			ID: "mammoth", Name: "Woolly Mammoth", Diet: domain.DietHerbivore,
			BaseMaxHP: 210, BiteDamage: 28, TailMult: 0.85,
			Special: domain.SpecialSkillSpec{Cooldown: 10, Damage: 36, RangeBonus: 1.5, Is360: true, BoneBreakSec: 4.5, Knockback: 7.5, Anim: "bite"},
			Bot:     domain.BotBehaviorSpec{WalkSpeed: 5.0, SprintSpeed: 8.0, AggroRange: 26, BaseDamage: 21},
		},
	}
}