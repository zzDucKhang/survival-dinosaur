package config

import (
	"os"
	"path/filepath"
	"time"
)

type ServerConfig struct {
	Port       string
	TickRate   time.Duration
	SharedDir  string
	DefaultDay float64
}

func LoadServerConfig() ServerConfig {
	port := os.Getenv("DINO_PORT")
	if port == "" {
		port = ":8080"
	}

	sharedDir := os.Getenv("DINO_SHARED_DIR")
	if sharedDir == "" {
		candidates := []string{
			filepath.Join("..", "client_v2", "shared"),
			filepath.Join("client_v2", "shared"),
			filepath.Join("..", "..", "client_v2", "shared"),
		}
		for _, c := range candidates {
			if st, err := os.Stat(c); err == nil && st.IsDir() {
				sharedDir = c
				break
			}
		}
	}

	return ServerConfig{
		Port:       port,
		TickRate:   50 * time.Millisecond, // 20 Hz
		SharedDir:  sharedDir,
		DefaultDay: 0.36,                  // ~08:38 sáng
	}
}