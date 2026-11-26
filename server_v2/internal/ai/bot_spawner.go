package ai

type botSpawnDef struct {
	id     string
	name   string
	model  string
	x      float64
	z      float64
	rot    float64
	growth float64
}

var initialBotRoster = []botSpawnDef{
	// 6 Bot Ăn Thịt
	{"bot-baby-rex", "Baby Rex [Nhỏ]", "tyranno", 26, 22, 0.4, 0.38},
	{"bot-juvie-hunter", "Juvie Stalker", "t-rex", -36, 30, 1.2, 0.58},
	{"bot-adult-vicious", "Vicious Hunter", "dino_hunter_deadly_shores_vicious", 95, -25, -0.7, 0.92},
	{"bot-apex-rex", "Gorgon-Rex [Khổng Lồ]", "trex", -75, -65, 1.5, 1.32},
	{"bot-roam-tyranno", "Swift Tyranno", "tyranno", 145, 95, 2.2, 0.78},
	{"bot-valley-rex", "Valley Tyrant", "trex", -155, -105, -1.1, 1.15},

	// 6 Bot Ăn Cỏ
	{"bot-baby-tricera", "Baby Tricera [Nhỏ]", "tricera", -24, -22, 0.8, 0.40},
	{"bot-juvie-stego", "Young Stego", "stego", 42, 48, -0.5, 0.65},
	{"bot-adult-stego", "Stego-Guardian", "stego", -95, 95, 1.9, 1.02},
	{"bot-adult-tricera", "Tricera-Bull", "tricera", 125, -125, 2.4, 1.08},
	{"bot-baby-mammoth", "Calf Mammoth [Nhỏ]", "mammoth", -55, 65, 0.2, 0.48},
	{"bot-titan-mammoth", "Titan Mammoth [Khổng Lồ]", "mammoth", -135, 165, -2.0, 1.30},
}

func (c *Controller) SpawnInitial(spawnFn func(id, name, model string, x, z, rot, growth float64)) {
	for _, b := range initialBotRoster {
		spawnFn(b.id, b.name, b.model, b.x, b.z, b.rot, b.growth)
	}
}