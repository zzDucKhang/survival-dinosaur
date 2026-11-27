# AGENTS.md — Dino Isle v2

Tài liệu ngữ cảnh kỹ thuật dành cho AI Agent và lập trình viên làm việc trên repository **Dino Isle v2** (game sinh tồn khủng long 3D multiplayer).

---

## 1. Kiến trúc tổng thể (3 tiến trình độc lập)

Dự án tách biệt hoàn toàn **Logic máy chủ**, **Lõi đồ họa 3D Native**, và **Giao diện HUD** để tối ưu FPS trên GPU tích hợp (**Intel HD Graphics 520 / Vulkan**, Windows):

```text
[Go Authoritative Server :8080]  <-- WebSocket (/ws, 20Hz) -->  [Rust Bevy 0.15 Native 3D Engine]
                                                                          ^
                                                                          | Local IPC WebSocket
                                                                          | (ws://127.0.0.1:9001, NDJSON)
                                                                          v
                                                                 [React + TS + Vite HUD :5173]
```

1. **Backend (`server_v2/`) — Go:**
   - Máy chủ vật lý & trạng thái gốc chạy tickrate **20Hz**, quản lý người chơi, **12 Bot AI** (ăn cỏ & ăn thịt), chu kỳ ngày/đêm, thời tiết (`clear`, `fog`, `rain`, `storm`), thức ăn/nước, vệt máu, hệ thống bầy đàn (`pack`), và chiến đấu (cắn, quất đuôi, kỹ năng đặc trưng loài, chảy máu, gãy xương, hồi máu khi nghỉ ngơi/ngoài giao chiến).
2. **Lõi 3D Native (`client_v2/native/`) — Rust + Bevy 0.15:**
   - Render địa hình 900m × 900m, mặt nước, bầu trời ngày/đêm, hiệu ứng mưa/bão, mô hình 3D `.glb` có animation, điều khiển nhân vật & camera 360°, đánh hơi (`Q`), tầm nhìn đêm (`N`), và cột sáng dẫn đường (`Waypoint`).
   - Đóng vai trò **Bridge** kết nối lên Go Server (`:8080`) đồng thời mở **IPC WebSocket Server (`ws://127.0.0.1:9001`)** phát dữ liệu sang React HUD.
3. **Giao diện HUD (`client_v2/hud/`) — React 18 + TypeScript + Zustand 5 + Vite:**
   - Thuần 2D DOM/Canvas (tuyệt đối **không** cài Three.js hay `@react-three/fiber`).
   - Hiển thị màn hình chọn loài, thanh sinh tồn (HP, Stamina, Đói, Khát, Trưởng thành), Chat, Bảng xếp hạng & Bầy đàn (`Tab`), Radar Minimap, và Bản đồ toàn đảo 900×900m (`M`).

---

## 2. Cấu trúc thư mục chuẩn

```text
KhungLong/
├── .github/workflows/
│   └── build-windows.yml        # CI/CD biên dịch dino-isle-native.exe trên Windows Runner
├
│── public/                  # [GITIGNORED] Thư mục tài nguyên 3D dùng chung
│       ├── models/
│       │   ├── dino/            # 7 file .glb khủng long (trex, t-rex, tyranno, tricera, stego, mammoth, dino_hunter_deadly_shores_vicious)
│       │   └── env/             # 6 file .glb môi trường (spruce_tree, pine_sapling_small_1k, fern_02_1k, weed_plant_02_1k, rock_moss_set_01_1k, rock_pitted_mossy_1k)
│       └── textures/            # Texture địa hình (ground/forrest_ground_01_diff_1k.jpg, rock/...)
├── client_v2/
│   ├── shared/                  # Single Source of Truth (Rust include_str! & TS import trực tiếp)
│   │   ├── species.json         # Chỉ số 7 loài khủng long, sát thương, kỹ năng đặc trưng
│   │   ├── world_config.json    # Tham số địa hình, kích thước đảo, tọa độ hồ nước
│   │   └── env_manifest.json    # Danh sách asset môi trường & tỷ lệ phân bố
│   ├── native/                  # Mã nguồn Rust Bevy 0.15
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── main.rs
│   │       ├── core/            # AppState (Lobby/Playing), RuntimeSettings, cấu hình shared
│   │       ├── network/         # protocol.rs (Serde IPC), bridge.rs (WS Go + IPC 9001), sync.rs
│   │       ├── world/           # terrain.rs (hàm độ cao toán học khớp server & map), water.rs, sky.rs, props.rs
│   │       ├── entities/        # camera.rs, player_input.rs, player_movement.rs, remote_sync.rs, animation.rs, world_items.rs
│   │       ├── vfx/             # weather_fx.rs (hạt mưa/bão), scent_fx.rs, waypoint_fx.rs
│   │       └── ui_fallback/     # HUD chữ tối giản trực tiếp trên Bevy (ẩn/hiện bằng F3)
│   └── hud/                     # Mã nguồn React TypeScript HUD
│       ├── package.json
│       ├── vite.config.ts
│       └── src/
│           ├── config/          # Nạp dữ liệu từ ../../shared/
│           ├── services/        # ipcSocket.ts (WS :9001), soundEngine.ts (Web Audio API)
│           ├── store/           # Zustand store tách slice + mutableCache.ts cho Radar/Map 20fps
│           ├── features/        # login, topbar, vitals, chat, map, radar, leaderboard, settings, overlays
│           └── types/
├── server_v2/                   # Backend Go Authoritative Server (:8080)
│   ├── cmd/server/main.go
│   └── internal/
├── dino-isle-native.exe         # Đặt tại thư mục gốc để tự tìm thấy client/public/
├── AGENTS.md
└── .gitignore
```


---

## 3. Quy ước giao tiếp IPC (`ws://127.0.0.1:9001`)

- Định dạng truyền tải: **NDJSON** (mỗi gói tin JSON cách nhau bằng `\n`).
- **Bevy -> HUD:**
  - Chuyển tiếp nguyên văn gói `INIT` và `SYNC` từ Go Server.
  - Gửi gói `LOCAL_TELEMETRY` chứa trạng thái cục bộ: `serverConnected`, `isJoined`, `myId`, `myName`, `myModel`, `x`, `y`, `z`, `rot`, `stamina`, `fps`, `nightVision`, `scentRemaining`, `quality`, `brightness`, `dinoScale`, `actionHint`, `waypoint`.
- **HUD -> Bevy (`client_v2/native/src/network/protocol.rs`):**
  - Rust sử dụng `#[serde(tag = "type", content = "payload")]`.
  - **Các lệnh có tham số** bắt buộc gửi kèm `payload`: `JOIN`, `CHAT`, `PACK_INVITE`, `SET_QUALITY`, `SET_BRIGHTNESS`, `SET_DINO_SCALE`, `SET_WAYPOINT`, `SET_UI_FOCUS`.
  - **Các lệnh Unit (không tham số)** chỉ gửi `{"type": "<TEN_LENH>"}` và **tuyệt đối không kèm key `payload`**: `LEAVE`, `REST`, `SPECIAL`, `PACK_ACCEPT`, `PACK_LEAVE`, `ROTATE_MODEL_90`, `TOGGLE_NIGHT_VISION`, `TRIGGER_SCENT`, `CLEAR_WAYPOINT`.
  - Khi HUD mở modal (`isMapOpen`, `isSettingsOpen`) hoặc khung nhập chat (`isChatOpen`), HUD phải gửi `SET_UI_FOCUS` với `{"blocked": true}` để Bevy khóa phím điều khiển di chuyển/tấn công.

---

## 4. Ràng buộc kỹ thuật & các lỗi cần tránh

### A. Rust & Bevy 0.15 (`client_v2/native`)
1. **Feature GLTF Animation:** Trong `Cargo.toml`, bắt buộc bật đồng thời `"animation"`, `"bevy_gltf"`, và `"bevy_animation"` thì `bevy::gltf::Gltf` mới có trường `animations` và `named_animations`.
2. **Windows Winsock Non-Blocking Handshake:** Trên Windows, `TcpListener` đặt `set_nonblocking(true)` sẽ khiến `TcpStream` từ `listener.accept()` kế thừa non-blocking và làm `tungstenite::accept(stream)` thất bại ngay bước bắt tay HTTP Upgrade. Luôn chuyển `stream.set_nonblocking(false)` (kèm `read_timeout` / `write_timeout` ~500ms) trước `tungstenite::accept`, sau đó mới bật lại `set_nonblocking(true)`.
3. **Go Server Ping/Pong:** Vòng đọc WebSocket tới Go Server cần phản hồi `Message::Pong(data)` khi nhận `Message::Ping(data)` để tránh bị ngắt kết nối sau ~45 giây.
4. **Tối ưu GPU tích hợp (Intel HD Graphics 520):** Luôn đặt `Msaa::Off` trên `Camera3d` và mặc định `GraphicsQuality::Low`.
5. **Biên dịch qua GitHub Actions:** Không chạy `cargo build` cục bộ trên laptop yếu. Push code lên nhánh `main` để `.github/workflows/build-windows.yml` biên dịch và tải `dino-isle-native.exe` từ mục **Artifacts**.

### B. Tài nguyên 3D (`client/public/models/`)
- `GltfLoader` mặc định của Bevy 0.15 **không hỗ trợ** `EXT_meshopt_compression`, `KHR_mesh_quantization`, `EXT_texture_webp`, hoặc `accessor` thiếu `bufferView`.
- Mọi file `.glb` trong `client/public/models/dino/` và `client/public/models/env/` phải ở định dạng **GLB v2 tiêu chuẩn** (buffer nhúng liền, texture PNG/JPEG, không dùng meshopt/quantization).
- Biến môi trường `DINO_ASSETS_DIR` có thể dùng để trỏ thủ công tới thư mục chứa `models/` và `textures/` nếu đặt file `.exe` ở thư mục khác.

### C. Quy tắc Git
- Tuyệt đối không commit lên GitHub các thư mục/file sau (giới hạn 100 MB/file của GitHub):
  - `client_v2/native/target/`
  - `client_v2/hud/node_modules/`, `client_v2/hud/dist/`
  - `client/public/` (`*.glb`, `*.bin`, `*.webp`, `*.hdr`)
  - `*.exe`, `*.pdb`

---

## 5. Lệnh khởi chạy dự án (Windows `cmd.exe`)

Mở 3 cửa sổ Command Prompt theo thứ tự:

1. **Khởi chạy Server Go (`:8080`):**
   ```cmd
   cd /d C:\Programing\Game\KhungLong\server_v2
   go run ./cmd/server
   ```

2. **Khởi chạy Lõi 3D Native (`:9001`):**
   ```cmd
   cd /d C:\Programing\Game\KhungLong
   dino-isle-native.exe
   ```
   *(Có thể nhấn `Enter` trực tiếp trên cửa sổ 3D để vào test nhanh mà không cần mở trình duyệt, hoặc nhấn `F3` để ẩn/hiện HUD debug.)*

3. **Khởi chạy React HUD (`:5173`):**
   ```cmd
   cd /d C:\Programing\Game\KhungLong\client_v2\hud
   npm run dev
   ```
   Mở trình duyệt tại `http://localhost:5173` (thêm `?overlay=1` nếu muốn nền trong suốt).

## 6. Quy trình tự động kiểm tra & Commit (Auto-Commit)

Sau khi hoàn thành mỗi yêu cầu chỉnh sửa mã nguồn, AI Agent **tự động** thực hiện các bước sau mà không cần hỏi xác nhận:
1. Kiểm tra lỗi biên dịch trước khi lưu phiên bản:
   - Nếu sửa `client_v2/hud/`: chạy `npm run build` trong `client_v2/hud`.
   - Nếu sửa `server_v2/`: chạy `go build ./...` trong `server_v2`.
   - Nếu sửa `client_v2/native/`: chỉ kiểm tra cú pháp/logic, **không** chạy `cargo build` cục bộ.
2. Chạy `git status` để chắc chắn **không** có file nào trong `public/`, `*.exe`, `node_modules/`, hoặc `target/` lọt vào danh sách thay đổi.
3. Chạy `git add -A`, `git commit -m "<type>(<scope>): <mô tả ngắn gọn>"`, và `git push origin main` (nếu có sửa `client_v2/native/`, việc push lên `main` sẽ tự kích hoạt GitHub Actions build file `.exe` mới).