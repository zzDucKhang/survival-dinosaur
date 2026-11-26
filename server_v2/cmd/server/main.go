package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"dino-server-v2/internal/ai"
	"dino-server-v2/internal/config"
	"dino-server-v2/internal/engine"
	"dino-server-v2/internal/store"
	"dino-server-v2/internal/transport"
	"dino-server-v2/internal/world"
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
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg := config.LoadServerConfig()
	reg := config.LoadRegistry(cfg.SharedDir)
	wld := world.NewWorld(reg.World)
	memStore := store.NewMemoryStore(wld.CreateInitialPlants(), cfg.DefaultDay)
	botCtrl := ai.NewController(reg, wld)
	gameEngine := engine.NewGameEngine(cfg, reg, wld, memStore, botCtrl)

	router := transport.NewWSRouter(gameEngine)
	hub := transport.NewHub(router)

	go hub.Run(ctx)
	gameEngine.Start(ctx, hub)

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		transport.ServeWs(hub, w, r)
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		entitiesCount, foodsCount, worldTime, weather := gameEngine.StatusSummary()
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		fmt.Fprintf(
			w,
			`{"status":"ok","name":"Dino Isle Server v2","onlineClients":%d,"entitiesCount":%d,"foodsCount":%d,"worldTime":%.2f,"weather":"%s"}`,
			hub.ClientCount(),
			entitiesCount,
			foodsCount,
			worldTime,
			weather,
		)
	})

	srv := &http.Server{
		Addr:              cfg.Port,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("🦖 [DINO ISLE SERVER v2] Local: http://localhost%s\n", cfg.Port)
		for _, ip := range getLocalLANIPs() {
			log.Printf("🌐 [LAN MULTIPLAYER] Máy khác cùng Wi-Fi mở link: http://%s:5173\n", ip)
		}
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Fatal server error: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("[Main] Đang tắt server an toàn...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}