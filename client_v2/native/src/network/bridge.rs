use super::protocol::{build_outbound_json, HudCommand, LocalTelemetryMsg, ServerMessage};
use bevy::prelude::*;
use crossbeam_channel::{bounded, Receiver, Sender};
use std::io::ErrorKind;
use std::net::{TcpListener, TcpStream};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
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

#[derive(Debug)]
enum IpcOutbound {
    ServerRaw(String),
    Telemetry(String),
    ResetSession,
}

#[derive(Resource)]
pub struct NetworkBridge {
    to_server_tx: Sender<String>,
    pub from_server_rx: Receiver<BridgeServerEvent>,
    to_hud_tx: Sender<IpcOutbound>,
    pub from_hud_rx: Receiver<HudCommand>,
    hud_clients: Arc<AtomicUsize>,
}

impl NetworkBridge {
    pub fn start(server_url: String, ipc_bind_addr: String) -> Self {
        let (to_server_tx, to_server_rx) = bounded::<String>(256);
        let (from_server_tx, from_server_rx) = bounded::<BridgeServerEvent>(256);
        let (to_hud_tx, to_hud_rx) = bounded::<IpcOutbound>(512);
        let (from_hud_tx, from_hud_rx) = bounded::<HudCommand>(128);
        let hud_clients = Arc::new(AtomicUsize::new(0));

        let hud_forward_tx = to_hud_tx.clone();
        thread::Builder::new()
            .name("dino-go-ws".into())
            .spawn(move || {
                run_server_ws_loop(server_url, to_server_rx, from_server_tx, hud_forward_tx);
            })
            .expect("Failed to spawn Go WebSocket thread");

        let hud_clients_ipc = Arc::clone(&hud_clients);
        thread::Builder::new()
            .name("dino-ipc-ws".into())
            .spawn(move || {
                run_ipc_ws_loop(ipc_bind_addr, to_hud_rx, from_hud_tx, hud_clients_ipc);
            })
            .expect("Failed to spawn IPC WebSocket thread");

        Self {
            to_server_tx,
            from_server_rx,
            to_hud_tx,
            from_hud_rx,
            hud_clients,
        }
    }

    pub fn hud_client_count(&self) -> usize {
        self.hud_clients.load(Ordering::Relaxed)
    }

    pub fn reset_ipc_session(&self) {
        let _ = self.to_hud_tx.try_send(IpcOutbound::ResetSession);
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

    pub fn send_leave(&self) {
        self.send_raw_server(build_outbound_json("LEAVE", serde_json::json!({})));
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
            let _ = self.to_hud_tx.try_send(IpcOutbound::Telemetry(json));
        }
    }
}

fn run_server_ws_loop(
    server_url: String,
    to_server_rx: Receiver<String>,
    from_server_tx: Sender<BridgeServerEvent>,
    to_hud_tx: Sender<IpcOutbound>,
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
                    let mut disconnected = false;

                    // Đẩy nốt frame còn kẹt trong write buffer (nếu lần trước gặp WouldBlock)
                    if let Err(err) = ws.flush() {
                        if !is_would_block(&err) {
                            warn!("[Bridge] Server flush error: {}", err);
                            break;
                        }
                    }

                    // 1. Gửi các gói tin chờ từ Bevy/HUD lên Go Server
                    while let Ok(raw) = to_server_rx.try_recv() {
                        did_work = true;
                        if let Err(err) = ws.send(Message::Text(raw.into())) {
                            if !is_would_block(&err) {
                                warn!("[Bridge] Server write error: {}", err);
                                disconnected = true;
                                break;
                            }
                        }
                    }

                    if disconnected {
                        break;
                    }

                    // 2. Đọc gói tin INIT / SYNC từ Go Server
                    loop {
                        match ws.read() {
                            Ok(Message::Text(txt)) => {
                                did_work = true;
                                let raw: &str = txt.as_ref();
                                let _ = to_hud_tx.try_send(IpcOutbound::ServerRaw(raw.to_string()));
                                if let Ok(parsed) = serde_json::from_str::<ServerMessage>(raw) {
                                    let _ = from_server_tx
                                        .try_send(BridgeServerEvent::Message(parsed));
                                }
                            }
                            Ok(Message::Ping(p)) => {
                                did_work = true;
                                if let Err(err) = ws.send(Message::Pong(p)) {
                                    if !is_would_block(&err) {
                                        disconnected = true;
                                        break;
                                    }
                                }
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
                let _ = to_hud_tx.try_send(IpcOutbound::ResetSession);
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

fn bind_with_retry(bind_addr: &str) -> Option<TcpListener> {
    for attempt in 1..=10 {
        match TcpListener::bind(bind_addr) {
            Ok(l) => {
                let _ = l.set_nonblocking(true);
                return Some(l);
            }
            Err(e) => {
                error!(
                    "[IPC] Failed to bind {} (attempt {}/10): {}",
                    bind_addr, attempt, e
                );
                thread::sleep(Duration::from_secs(1));
            }
        }
    }
    None
}

fn accept_pending_clients(
    listener: &TcpListener,
    clients: &mut Vec<WebSocket<TcpStream>>,
    cached_init: &Option<String>,
    latest_telemetry: &Option<String>,
    hud_clients: &Arc<AtomicUsize>,
) -> bool {
    let mut accepted_any = false;
    loop {
        match listener.accept() {
            Ok((stream, addr)) => {
                accepted_any = true;
                // Windows: TcpStream kế thừa non-blocking từ TcpListener, cần bật blocking tạm thời để bắt tay WS.
                let _ = stream.set_nonblocking(false);
                let _ = stream.set_read_timeout(Some(Duration::from_millis(1000)));
                let _ = stream.set_write_timeout(Some(Duration::from_millis(1000)));
                let _ = stream.set_nodelay(true);

                match accept(stream) {
                    Ok(mut ws) => {
                        let _ = ws.get_mut().set_nonblocking(true);
                        let _ = ws.get_mut().set_read_timeout(None);
                        let _ = ws.get_mut().set_write_timeout(None);
                        let _ = ws.get_mut().set_nodelay(true);

                        if let Some(ref telemetry) = latest_telemetry {
                            if let Err(err) = ws.send(Message::Text(telemetry.clone().into())) {
                                if !is_would_block(&err) {
                                    warn!("[IPC] Initial telemetry send failed ({}): {}", addr, err);
                                    continue;
                                }
                            }
                        }
                        if let Some(ref init_raw) = cached_init {
                            if let Err(err) = ws.send(Message::Text(init_raw.clone().into())) {
                                if !is_would_block(&err) {
                                    warn!("[IPC] Initial INIT send failed ({}): {}", addr, err);
                                    continue;
                                }
                            }
                        }

                        clients.push(ws);
                        hud_clients.store(clients.len(), Ordering::Relaxed);
                        info!("[IPC] React HUD connected from {} (total={})", addr, clients.len());
                    }
                    Err(err) => {
                        warn!("[IPC] WebSocket handshake failed from {}: {}", addr, err);
                    }
                }
            }
            Err(ref e) if e.kind() == ErrorKind::WouldBlock => break,
            Err(err) => {
                warn!("[IPC] Accept error: {}", err);
                break;
            }
        }
    }
    accepted_any
}

fn broadcast_ipc_message(
    clients: &mut Vec<WebSocket<TcpStream>>,
    raw: String,
    hud_clients: &Arc<AtomicUsize>,
) {
    if clients.is_empty() {
        return;
    }
    let msg = Message::Text(raw.into());
    let before = clients.len();
    clients.retain_mut(|ws| match ws.send(msg.clone()) {
        Ok(()) => true,
        Err(err) if is_would_block(&err) => true,
        Err(_) => false,
    });
    if clients.len() != before {
        hud_clients.store(clients.len(), Ordering::Relaxed);
        info!("[IPC] React HUD disconnected (total={})", clients.len());
    }
}

fn run_ipc_ws_loop(
    bind_addr: String,
    to_hud_rx: Receiver<IpcOutbound>,
    from_hud_tx: Sender<HudCommand>,
    hud_clients: Arc<AtomicUsize>,
) {
    let Some(listener) = bind_with_retry(&bind_addr) else {
        error!("[IPC] Giving up binding {}", bind_addr);
        return;
    };
    info!("[IPC] HUD WebSocket server listening on ws://{}", bind_addr);

    // Nếu bind IPv4 loopback (127.0.0.1:PORT), thử lắng nghe thêm [::1]:PORT để hỗ trợ ?ipc=ws://localhost:PORT
    let ipv6_listener = bind_addr
        .strip_prefix("127.0.0.1:")
        .and_then(|port| TcpListener::bind(format!("[::1]:{port}")).ok())
        .inspect(|l| {
            let _ = l.set_nonblocking(true);
            info!("[IPC] Also listening on IPv6 loopback [::1]");
        });

    let mut clients: Vec<WebSocket<TcpStream>> = Vec::new();
    let mut cached_init: Option<String> = None;
    let mut latest_telemetry: Option<String> = None;

    loop {
        let mut did_work = false;

        // 1. Chấp nhận kết nối mới từ React HUD
        if accept_pending_clients(
            &listener,
            &mut clients,
            &cached_init,
            &latest_telemetry,
            &hud_clients,
        ) {
            did_work = true;
        }
        if let Some(ref l6) = ipv6_listener {
            if accept_pending_clients(
                l6,
                &mut clients,
                &cached_init,
                &latest_telemetry,
                &hud_clients,
            ) {
                did_work = true;
            }
        }

        // 2. Xả các frame đang chờ gửi trên socket non-blocking
        if !clients.is_empty() {
            let before = clients.len();
            clients.retain_mut(|ws| match ws.flush() {
                Ok(()) => true,
                Err(err) if is_would_block(&err) => true,
                Err(_) => false,
            });
            if clients.len() != before {
                hud_clients.store(clients.len(), Ordering::Relaxed);
                info!("[IPC] React HUD disconnected during flush (total={})", clients.len());
            }
        }

        // 3. Phát dữ liệu từ Rust/Server xuống toàn bộ HUD đang mở
        while let Ok(item) = to_hud_rx.try_recv() {
            did_work = true;
            match item {
                IpcOutbound::ServerRaw(raw) => {
                    if raw.starts_with("{\"type\":\"INIT\"") {
                        cached_init = Some(raw.clone());
                    }
                    broadcast_ipc_message(&mut clients, raw, &hud_clients);
                }
                IpcOutbound::Telemetry(json) => {
                    latest_telemetry = Some(json.clone());
                    broadcast_ipc_message(&mut clients, json, &hud_clients);
                }
                IpcOutbound::ResetSession => {
                    cached_init = None;
                }
            }
        }

        // 4. Đọc lệnh từ React HUD đẩy vào Bevy
        if !clients.is_empty() {
            let before = clients.len();
            clients.retain_mut(|ws| loop {
                match ws.read() {
                    Ok(Message::Text(txt)) => {
                        did_work = true;
                        let raw: &str = txt.as_ref();
                        match serde_json::from_str::<HudCommand>(raw) {
                            Ok(cmd) => {
                                let _ = from_hud_tx.try_send(cmd);
                            }
                            Err(err) => {
                                warn!("[IPC] Invalid HUD command ({}): {}", err, raw);
                            }
                        }
                    }
                    Ok(Message::Ping(p)) => {
                        did_work = true;
                        if let Err(err) = ws.send(Message::Pong(p)) {
                            if !is_would_block(&err) {
                                return false;
                            }
                        }
                    }
                    Ok(Message::Close(_)) => return false,
                    Ok(_) => {}
                    Err(err) if is_would_block(&err) => return true,
                    Err(_) => return false,
                }
            });
            if clients.len() != before {
                hud_clients.store(clients.len(), Ordering::Relaxed);
                info!("[IPC] React HUD closed (total={})", clients.len());
            }
        }

        if !did_work {
            thread::sleep(Duration::from_millis(5));
        }
    }
}

fn is_would_block(err: &WsError) -> bool {
    match err {
        WsError::Io(io_err) => matches!(
            io_err.kind(),
            ErrorKind::WouldBlock | ErrorKind::TimedOut | ErrorKind::Interrupted
        ),
        _ => false,
    }
}
