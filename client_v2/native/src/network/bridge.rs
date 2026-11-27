use super::protocol::{build_outbound_json, HudCommand, LocalTelemetryMsg, ServerMessage};
use bevy::prelude::*;
use crossbeam_channel::{bounded, Receiver, Sender};
use std::io::ErrorKind;
use std::net::{TcpListener, TcpStream};
use std::thread;
use std::time::{Duration, Instant};
use tungstenite::stream::MaybeTlsStream;
use tungstenite::{accept, connect, Error as WsError, Message, WebSocket};

#[derive(Debug)]
pub enum BridgeServerEvent {
    Connected,
    Disconnected,
    Message(ServerMessage),
}

#[derive(Resource)]
pub struct NetworkBridge {
    to_server_tx: Sender<String>,
    pub from_server_rx: Receiver<BridgeServerEvent>,
    to_hud_tx: Sender<String>,
    pub from_hud_rx: Receiver<HudCommand>,
}

impl NetworkBridge {
    pub fn start(server_url: String, ipc_bind_addr: String) -> Self {
        let (to_server_tx, to_server_rx) = bounded::<String>(256);
        let (from_server_tx, from_server_rx) = bounded::<BridgeServerEvent>(256);
        let (to_hud_tx, to_hud_rx) = bounded::<String>(512);
        let (from_hud_tx, from_hud_rx) = bounded::<HudCommand>(128);

        let hud_forward_tx = to_hud_tx.clone();
        thread::Builder::new()
            .name("dino-go-ws".into())
            .spawn(move || {
                run_server_ws_loop(server_url, to_server_rx, from_server_tx, hud_forward_tx);
            })
            .expect("Failed to spawn Go WebSocket thread");

        thread::Builder::new()
            .name("dino-ipc-ws".into())
            .spawn(move || {
                run_ipc_ws_loop(ipc_bind_addr, to_hud_rx, from_hud_tx);
            })
            .expect("Failed to spawn IPC WebSocket thread");

        Self {
            to_server_tx,
            from_server_rx,
            to_hud_tx,
            from_hud_rx,
        }
    }

    pub fn send_raw_server(&self, json: String) {
        let _ = self.to_server_tx.try_send(json);
    }

    pub fn send_join(&self, name: &str, model: &str) {
        self.send_raw_server(build_outbound_json(
            "JOIN",
            serde_json::json!({ "name": name, "model": model }),
        ));
    }

    pub fn send_move(&self, x: f64, y: f64, z: f64, rotation: f64, anim_state: &str) {
        self.send_raw_server(build_outbound_json(
            "MOVE",
            serde_json::json!({
                "x": (x * 100.0).round() / 100.0,
                "y": (y * 100.0).round() / 100.0,
                "z": (z * 100.0).round() / 100.0,
                "rotation": (rotation * 1000.0).round() / 1000.0,
                "animState": anim_state,
            }),
        ));
    }

    pub fn send_attack(&self, attack_type: &str) {
        self.send_raw_server(build_outbound_json(
            "ATTACK",
            serde_json::json!({ "attackType": attack_type }),
        ));
    }

    pub fn send_special(&self) {
        self.send_raw_server(build_outbound_json("SPECIAL", serde_json::json!({})));
    }

    pub fn send_interact(&self) {
        self.send_raw_server(build_outbound_json("INTERACT", serde_json::json!({})));
    }

    pub fn send_toggle_rest(&self) {
        self.send_raw_server(build_outbound_json("REST", serde_json::json!({})));
    }

    pub fn send_crouch(&self, crouching: bool) {
        self.send_raw_server(build_outbound_json(
            "CROUCH",
            serde_json::json!({ "crouching": crouching }),
        ));
    }

    pub fn send_roar(&self, call_type: i32) {
        self.send_raw_server(build_outbound_json(
            "ROAR",
            serde_json::json!({ "callType": call_type }),
        ));
    }

    pub fn send_chat(&self, text: &str) {
        self.send_raw_server(build_outbound_json("CHAT", serde_json::json!({ "text": text })));
    }

    pub fn send_pack_invite(&self, target_id: &str) {
        self.send_raw_server(build_outbound_json(
            "PACK_INVITE",
            serde_json::json!({ "targetId": target_id }),
        ));
    }

    pub fn send_pack_accept(&self) {
        self.send_raw_server(build_outbound_json("PACK_ACCEPT", serde_json::json!({})));
    }

    pub fn send_pack_leave(&self) {
        self.send_raw_server(build_outbound_json("PACK_LEAVE", serde_json::json!({})));
    }

    pub fn send_hud_telemetry(&self, msg: &LocalTelemetryMsg) {
        if let Ok(json) = serde_json::to_string(msg) {
            let _ = self.to_hud_tx.try_send(json);
        }
    }
}

fn run_server_ws_loop(
    server_url: String,
    to_server_rx: Receiver<String>,
    from_server_tx: Sender<BridgeServerEvent>,
    to_hud_tx: Sender<String>,
) {
    loop {
        match connect(&server_url) {
            Ok((mut ws, _)) => {
                if let MaybeTlsStream::Plain(stream) = ws.get_mut() {
                    let _ = stream.set_nonblocking(true);
                    let _ = stream.set_nodelay(true);
                }
                let _ = from_server_tx.try_send(BridgeServerEvent::Connected);
                info!("[Bridge] Connected to Go server: {}", server_url);

                let mut last_ping = Instant::now();
                loop {
                    let mut did_work = false;

                    // 1. Gửi các gói tin chờ từ Bevy/HUD lên Go Server
                    while let Ok(raw) = to_server_rx.try_recv() {
                        did_work = true;
                        if let Err(err) = ws.send(Message::Text(raw.into())) {
                            if !is_would_block(&err) {
                                warn!("[Bridge] Server write error: {}", err);
                                break;
                            }
                        }
                    }

                    // 2. Đọc gói tin INIT / SYNC từ Go Server
                    let mut disconnected = false;
                    loop {
                        match ws.read() {
                            Ok(Message::Text(txt)) => {
                                did_work = true;
                                let raw: &str = txt.as_ref();
                                let _ = to_hud_tx.try_send(raw.to_string());
                                if let Ok(parsed) = serde_json::from_str::<ServerMessage>(raw) {
                                    let _ = from_server_tx
                                        .try_send(BridgeServerEvent::Message(parsed));
                                }
                            }
                            Ok(Message::Ping(p)) => {
                                did_work = true;
                                let _ = ws.send(Message::Pong(p));
                            }
                            Ok(Message::Close(_)) => {
                                disconnected = true;
                                break;
                            }
                            Ok(_) => {}
                            Err(err) if is_would_block(&err) => break,
                            Err(err) => {
                                warn!("[Bridge] Server read error: {}", err);
                                disconnected = true;
                                break;
                            }
                        }
                    }

                    if disconnected {
                        break;
                    }

                    if last_ping.elapsed() >= Duration::from_secs(20) {
                        last_ping = Instant::now();
                        if let Err(err) = ws.send(Message::Ping(Vec::new().into())) {
                            if !is_would_block(&err) {
                                break;
                            }
                        }
                    }

                    if !did_work {
                        thread::sleep(Duration::from_millis(5));
                    }
                }

                let _ = from_server_tx.try_send(BridgeServerEvent::Disconnected);
                warn!("[Bridge] Disconnected from Go server, retrying in 2s...");
            }
            Err(_) => {
                // Xả các gói cũ tránh nghẽn queue khi server chưa mở
                while to_server_rx.try_recv().is_ok() {}
            }
        }
        thread::sleep(Duration::from_secs(2));
    }
}

fn run_ipc_ws_loop(
    bind_addr: String,
    to_hud_rx: Receiver<String>,
    from_hud_tx: Sender<HudCommand>,
) {
    let listener = match TcpListener::bind(&bind_addr) {
        Ok(l) => l,
        Err(e) => {
            error!("[IPC] Failed to bind {}: {}", bind_addr, e);
            return;
        }
    };
    let _ = listener.set_nonblocking(true);
    info!("[IPC] HUD WebSocket server listening on ws://{}", bind_addr);

    let mut clients: Vec<WebSocket<TcpStream>> = Vec::new();
    let mut cached_init: Option<String> = None;

    loop {
        let mut did_work = false;

        // 1. Chấp nhận kết nối mới từ React HUD
        while let Ok((stream, _addr)) = listener.accept() {
            did_work = true;
            let _ = stream.set_nonblocking(false);
            let _ = stream.set_read_timeout(Some(Duration::from_secs(2)));
            let _ = stream.set_write_timeout(Some(Duration::from_secs(2)));
            if let Ok((stream, _addr)) = listener.accept() {
                let _ = stream.set_nonblocking(false);
                let _ = stream.set_read_timeout(Some(std::time::Duration::from_millis(500)));
                let _ = stream.set_write_timeout(Some(std::time::Duration::from_millis(500)));

                if let Ok(mut ws) = tungstenite::accept(stream) {
                    let _ = ws.get_mut().set_nonblocking(true);
                    let _ = ws.get_mut().set_read_timeout(None);
                    let _ = ws.get_mut().set_write_timeout(None);
                    // giữ nguyên phần thêm ws vào danh sách clients và log [IPC] React HUD connected
                }
            }
        }

        // 2. Phát dữ liệu từ Rust/Server xuống toàn bộ HUD đang mở
        while let Ok(msg) = to_hud_rx.try_recv() {
            did_work = true;
            if msg.contains("\"type\":\"INIT\"") {
                cached_init = Some(msg.clone());
            }
            clients.retain_mut(|ws| match ws.send(Message::Text(msg.clone().into())) {
                Ok(()) => true,
                Err(err) if is_would_block(&err) => true,
                Err(_) => false,
            });
        }

        // 3. Đọc lệnh từ React HUD đẩy vào Bevy
        clients.retain_mut(|ws| loop {
            match ws.read() {
                Ok(Message::Text(txt)) => {
                    did_work = true;
                    let raw: &str = txt.as_ref();
                    if let Ok(cmd) = serde_json::from_str::<HudCommand>(raw) {
                        let _ = from_hud_tx.try_send(cmd);
                    }
                }
                Ok(Message::Ping(p)) => {
                    did_work = true;
                    let _ = ws.send(Message::Pong(p));
                }
                Ok(Message::Close(_)) => return false,
                Ok(_) => {}
                Err(err) if is_would_block(&err) => return true,
                Err(_) => return false,
            }
        });

        if !did_work {
            thread::sleep(Duration::from_millis(5));
        }
    }
}

fn is_would_block(err: &WsError) -> bool {
    matches!(
        err,
        WsError::Io(io_err)
            if io_err.kind() == ErrorKind::WouldBlock || io_err.kind() == ErrorKind::TimedOut
    )
}