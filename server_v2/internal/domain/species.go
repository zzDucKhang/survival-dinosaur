package domain

import "math"

const (
	DietCarnivore = "carnivore"
	DietHerbivore = "herbivore"
)

type SpecialSkillSpec struct {
	Name         string  `json:"name"`
	Desc         string  `json:"desc"`
	Cooldown     float64 `json:"cooldown"`
	Damage       float64 `json:"damage"`
	RangeBonus   float64 `json:"rangeBonus"`
	Is360        bool    `json:"is360"`
	BleedSec     float64 `json:"bleedSec"`
	BoneBreakSec float64 `json:"boneBreakSec"`
	Knockback    float64 `json:"knockback"`
	DashDist     float64 `json:"dashDist"`
	Anim         string  `json:"anim"`
}

type BotBehaviorSpec struct {
	WalkSpeed   float64 `json:"walkSpeed"`
	SprintSpeed float64 `json:"sprintSpeed"`
	AggroRange  float64 `json:"aggroRange"`
	BaseDamage  float64 `json:"baseDamage"`
}

type SpeciesSpec struct {
	ID         string           `json:"id"`
	Name       string           `json:"name"`
	Species    string           `json:"species"`
	Diet       string           `json:"diet"`
	BaseMaxHP  int              `json:"baseMaxHp"`
	BiteDamage int              `json:"biteDamage"`
	BleedSec   float64          `json:"bleedSec"`
	TailMult   float64          `json:"tailMult"`
	Special    SpecialSkillSpec `json:"special"`
	Bot        BotBehaviorSpec  `json:"bot"`
}

func ScaleMaxHP(baseHP int, growth float64) int {
	if baseHP <= 0 {
		baseHP = 100
	}
	return int(math.Round(float64(baseHP) * (0.45 + 0.65*growth)))
}