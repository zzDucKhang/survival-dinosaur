package main

import (
	"fmt"
	"log"
	"net"
	"net/http"

	"dino-server/internal/engine"
	"dino-server/internal/network"
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
	hub := network.NewHub()
	go hub.Run()

	engine.StartGameLoop(hub)

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		network.ServeWs(hub, w, r)
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		players, foods, worldTime := engine.GetSnapshot()
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(
			w,
			`{"status":"ok","name":"Dino Isle Server","playersCount":%d,"foodsCount":%d,"worldTime":%.2f}`,
			len(players),
			len(foods),
			worldTime,
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