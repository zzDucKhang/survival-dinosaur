pub mod bridge;
pub mod protocol;
pub mod sync;

use crate::core::config::GameConfig;
use bevy::prelude::*;
use bridge::NetworkBridge;
use sync::{
    poll_hud_commands, poll_server_messages, push_telemetry_to_hud, CombatEventMsg,
    HudSpecialRequestEvent, WorldNetState,
};

pub struct NetworkPlugin;

impl Plugin for NetworkPlugin {
    fn build(&self, app: &mut App) {
        let cfg = app.world().resource::<GameConfig>().clone();
        let bridge = NetworkBridge::start(cfg.server_url, cfg.ipc_bind_addr);

        app.insert_resource(bridge)
            .init_resource::<WorldNetState>()
            .add_event::<CombatEventMsg>()
            .add_event::<HudSpecialRequestEvent>()
            .add_systems(
                Update,
                (
                    poll_server_messages,
                    poll_hud_commands,
                    push_telemetry_to_hud,
                )
                    .chain(),
            );
    }
}