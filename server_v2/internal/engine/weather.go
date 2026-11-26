package engine

import (
	"fmt"
	"math/rand"
	"time"

	"dino-server-v2/internal/domain"
)

func (e *GameEngine) stepWeatherLocked(dt float64) {
	e.store.WeatherTimer -= dt
	if e.store.WeatherTimer > 0 {
		return
	}

	prev := e.store.Weather
	r := rand.Float64()

	switch prev {
	case domain.WeatherClear:
		if r < 0.55 {
			e.store.Weather = domain.WeatherFog
			e.store.WeatherTimer = 65 + rand.Float64()*40
		} else {
			e.store.Weather = domain.WeatherRain
			e.store.WeatherTimer = 70 + rand.Float64()*45
		}
	case domain.WeatherFog:
		if r < 0.50 {
			e.store.Weather = domain.WeatherRain
			e.store.WeatherTimer = 70 + rand.Float64()*45
		} else {
			e.store.Weather = domain.WeatherClear
			e.store.WeatherTimer = 95 + rand.Float64()*50
		}
	case domain.WeatherRain:
		if r < 0.42 {
			e.store.Weather = domain.WeatherStorm
			e.store.WeatherTimer = 55 + rand.Float64()*35
		} else {
			e.store.Weather = domain.WeatherClear
			e.store.WeatherTimer = 95 + rand.Float64()*55
		}
	default:
		e.store.Weather = domain.WeatherFog
		e.store.WeatherTimer = 55 + rand.Float64()*35
	}

	if e.store.Weather == prev {
		return
	}

	msg := "☀️ Bầu trời đã quang đãng trở lại."
	switch e.store.Weather {
	case domain.WeatherFog:
		msg = "🌫️ Sương mù dày đặc đang bao phủ khu rừng..."
	case domain.WeatherRain:
		msg = "🌧️ Trời bắt đầu đổ mưa rào (giảm tụt khát)."
	case domain.WeatherStorm:
		msg = "⛈️ Bão giông tiền sử kéo đến kèm sấm chớp!"
	}

	e.store.AppendChatLocked(domain.ChatMessage{
		ID:        fmt.Sprintf("weather-%d", time.Now().UnixNano()),
		Sender:    "ISLE",
		Text:      msg,
		IsSystem:  true,
		Timestamp: time.Now().UnixMilli(),
	})
}