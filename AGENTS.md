Markdown
# 🦖 DINO ISLE WEB - PROJECT BLUEPRINT (MVP PHASE 1)

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
- **Tên dự án:** Dino Isle Web (Bản MVP).
- **Tính chất:** Phòng chơi sinh tồn Real-time Multiplayer cơ bản.
- **Tính năng MVP:**
  1. Màn hình Login (Chỉ nhập Tên, không cần DB).
  2. Vào phòng, load model T-Rex 3D.
  3. Di chuyển (W, A, S, D), hoạt ảnh (Idle, Run, Bite).
  4. Nhìn thấy người chơi khác di chuyển (Interpolation).
- **Tech Stack:**
  - **Server:** Go 1.26 (Gorilla WebSocket) - State lưu 100% trên RAM (In-memory). Chưa dùng Database/Prisma.
  - **Client:** Vite + React + TypeScript + React Three Fiber (R3F) + Zustand.

---

## 2. CẤU TRÚC THƯ MỤC MVP

### 2.1. Server (Go)
```text
server/
├── cmd/
│   └── game/
│       └── main.go              # Mở port 8080, route /ws
├── internal/
│   ├── engine/
│   │   ├── room.go              # Quản lý danh sách Players (RAM struct)
│   │   └── loop.go              # Goroutine chạy 20 Tick/s để gửi GameState
│   ├── models/
│   │   └── player.go            # Struct Player (ID, Name, X, Z, Rotation, State)
│   └── network/
│       └── client.go            # Xử lý OnMessage từ WebSocket
├── go.mod
└── go.sum
2.2. Client (Vite + R3F)
Plaintext
client/
├── public/
│   └── models/
│       └── trex.glb             # Model 3D tải từ Sketchfab
|── src/
│   ├── core/
│   │   └── socket.ts            # Quản lý WebSocket connection
│   ├── components/
│   │   ├── 3d/
│   │   │   ├── Scene.tsx        # Bầu trời, Ánh sáng, Mặt đất phẳng
│   │   │   ├── LocalTrex.tsx    # Nhận input phím -> Gửi WS -> Di chuyển mượt
│   │   │   └── RemoteTrex.tsx   # Chỉ nhận tọa độ từ WS -> Lerp (Nội suy)
│   │   └── ui/
│   │       └── LoginScreen.tsx  # Form nhập tên -> Chuyển sang Canvas 3D
│   ├── store/
│   │   └── useGameStore.ts      # Zustand Store lưu GameState từ Server
│   ├── App.tsx                  # Hiển thị LoginScreen hoặc Game Canvas
│   └── main.tsx
├── package.json
└── vite.config.ts
3. STATE MANAGEMENT & GAME LOOP
Phía Server (Go)
Room State: Khai báo một map toàn cục được bảo vệ bởi RWMutex để lưu danh sách người chơi:

Go
var Players = make(map[string]*models.Player)
var PlayersMutex = sync.RWMutex{}
Tick Rate: 20 Hz (Cứ 50ms broadcast toàn bộ Players map về cho tất cả clients).

Phía Client (React)
Zustand Store:

TypeScript
interface GameState {
  players: Record<string, PlayerData>;
  setPlayers: (players: Record<string, PlayerData>) => void;
}
Di chuyển & Nội suy (Lerp):

LocalTrex: Di chuyển lập tức khi bấm phím (Client Prediction) và gửi tọa độ lên Server.

RemoteTrex: Sử dụng mesh.position.lerp() trong useFrame() để di chuyển mượt mà tới tọa độ mà Server gửi về. BẮT BUỘC dùng SkeletonUtils.clone khi load nhiều RemoteTrex.

4. CẤU TRÚC GÓI TIN (JSON)
Client gửi (Input):

JSON
{
  "type": "JOIN",
  "payload": { "name": "Khang" }
}

{
  "type": "MOVE",
  "payload": { "x": 10.5, "z": 2.0, "rotation": 1.57, "animState": "RUN" }
}
Server broadcast (Sync):

JSON
{
  "type": "SYNC",
  "players": {
    "uuid-1": { "name": "Khang", "x": 10.5, "z": 2.0, "rot": 1.57, "anim": "RUN" },
    "uuid-2": { "name": "Bot", "x": 0.0, "z": 0.0, "rot": 0.0, "anim": "IDLE" }
  }
}
[End of Document]


## 3. Quy trình Code cho tuần tới

Vì bạn đã quen với kiến trúc Backend (NestJS), việc hiểu code Go sẽ cực kỳ nhanh. Lộ trình code MVP này nên chia làm 4 giai đoạn nhỏ để dễ quản lý:

1. **Phase 1 (Chỉ Client):** Mở VS Code bên `client`, setup React Three Fiber. Code một cái mặt đất phẳng (Plane), đặt con `trex.glb` lên, gắn WASD để nó đi lại và chạy animation. (Lúc này chưa cần bật Go Server).
2. **Phase 2 (Chỉ Server):** Code Go Server. Viết struct WebSocket, tạo một mảng lưu vài con bot ảo trên RAM (có tọa độ update tự động) và broadcast JSON liên tục ra cổng 8080.
3. **Phase 3 (Ghép nối):** Code file `socket.ts` bên Client. Bắn data JSON từ Server vào Zustand. Vẽ các con bot ảo đó ra bằng component `RemoteTrex.tsx` để xem chúng di chuyển.
4. **Phase 4 (Hoàn thiện):** Code màn hình Login, nhập tên, lấy UUID, và bắt đầu broadcast tọa độ của LocalTrex lên mạng. 

Chỉ cần ném file Blueprint này vào cửa sổ chat của Continue/AI trên VS Code và bảo nó: *"Bắt đầu Phase 1, tạo mặt đất và load con khủng long ra màn hình cho tôi"* là hệ thống sẽ chạy đúng hướng.