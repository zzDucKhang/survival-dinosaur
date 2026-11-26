package main

import (
	"fmt"
	"log"
	"net"
	"net/http"

	"dino-server/internal/controller"
	"dino-server/internal/network"
	"dino-server/internal/repository"
	"dino-server/internal/service"
)

func getLocalLANIPs() []string {
	var ips []string
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return ips
	}
	for _, addr := range addrs {
		if ipNet, ok := addr.(*net.IPNet); ok && !ipNet.IP.IsLoopback() {
			if ip4 := ipNet.IP.To4(); ip4 != nil {
				ips = append(ips, ip4.String())
			}
		}
	}
	return ips
}

func main() {
	worldRepo := repository.NewWorldRepository()
	gameService := service.NewGameService(worldRepo)
	wsController := controller.NewWSController(gameService)
	hub := network.NewHub(wsController)

	go hub.Run()
	gameService.StartGameLoop(hub)

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		network.ServeWs(hub, w, r)
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		players, foods, _, worldTime, weather := gameService.GetFullSnapshot()
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(
			w,
			`{"status":"ok","name":"Dino Isle Server","onlineClients":%d,"entitiesCount":%d,"foodsCount":%d,"worldTime":%.2f,"weather":"%s"}`,
			hub.ClientCount(),
			len(players),
			len(foods),
			worldTime,
			weather,
		)
	})

	port := ":8080"
	log.Printf("🦖 [DINO ISLE SERVER] Local: http://localhost%s\n", port)
	for _, ip := range getLocalLANIPs() {
		log.Printf("🌐 [LAN MULTIPLAYER] Máy khác cùng Wi-Fi mở link: http://%s:5173\n", ip)
	}
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("Fatal server error: %v", err)
	}
}