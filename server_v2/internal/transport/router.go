package transport

import (
	"encoding/json"
	"log"
	"strings"

	"dino-server-v2/internal/engine"
	"dino-server-v2/internal/protocol"
)

type WSRouter struct {
	engine *engine.GameEngine
}

func NewWSRouter(eng *engine.GameEngine) *WSRouter {
	return &WSRouter{engine: eng}
}

func (r *WSRouter) HandleMessage(
	clientID string,
	clientName *string,
	sendFn func([]byte),
	rawMsg []byte,
) {
	var inbound protocol.InboundMessage
	if err := json.Unmarshal(rawMsg, &inbound); err != nil {
		return
	}

	switch inbound.Type {
	case "JOIN":
		var payload protocol.JoinPayload
		if err := json.Unmarshal(inbound.Payload, &payload); err != nil {
			return
		}
		name := strings.TrimSpace(payload.Name)
		if name == "" {
			name = "Wild Raptor"
		}
		*clientName = name
		modelType := strings.TrimSpace(payload.Model)
		if modelType == "" {
			modelType = "trex"
		}

		r.engine.AddPlayer(clientID, name, modelType)
		playersSnap, foodsSnap, bloodSnap, worldTime, weather := r.engine.GetFullSnapshot()
		initResp := protocol.OutboundMessage{
			Type:        "INIT",
			ID:          clientID,
			Players:     playersSnap,
			Foods:       foodsSnap,
			BloodTrails: bloodSnap,
			WorldTime:   worldTime,
			Weather:     weather,
		}
		if respBytes, err := json.Marshal(initResp); err == nil {
			sendFn(respBytes)
		}
		log.Printf("[Router] Player joined: %s (%s) model=%s", name, clientID, modelType)

	case "MOVE":
		var payload protocol.MovePayload
		if err := json.Unmarshal(inbound.Payload, &payload); err == nil {
			r.engine.UpdatePlayerMove(clientID, payload.X, payload.Z, payload.Rotation, payload.AnimState)
		}

	case "ATTACK":
		var payload protocol.AttackPayload
		if err := json.Unmarshal(inbound.Payload, &payload); err == nil {
			r.engine.ProcessPlayerAttack(clientID, payload.AttackType)
		}

	case "SPECIAL":
		r.engine.ProcessPlayerSpecial(clientID)

	case "INTERACT":
		r.engine.ProcessInteract(clientID)

	case "CHAT":
		var payload protocol.ChatPayload
		if err := json.Unmarshal(inbound.Payload, &payload); err == nil {
			sender := *clientName
			if sender == "" {
				sender = "Dino"
			}
			r.engine.AddChatMessage(sender, payload.Text, false)
		}

	case "REST":
		r.engine.ToggleRest(clientID)

	case "CROUCH":
		var payload protocol.CrouchPayload
		if err := json.Unmarshal(inbound.Payload, &payload); err == nil {
			r.engine.SetCrouch(clientID, payload.Crouching)
		}

	case "ROAR":
		var payload protocol.RoarPayload
		if err := json.Unmarshal(inbound.Payload, &payload); err == nil {
			r.engine.ProcessRoar(clientID, payload.CallType)
		}

	case "PACK_INVITE":
		var payload protocol.PackPayload
		if err := json.Unmarshal(inbound.Payload, &payload); err == nil {
			r.engine.InviteToPack(clientID, payload.TargetID)
		}

	case "PACK_ACCEPT":
		r.engine.AcceptPackInvite(clientID)

	case "PACK_LEAVE":
		r.engine.LeavePack(clientID)
	}
}

func (r *WSRouter) HandleDisconnect(clientID string) {
	r.engine.RemovePlayer(clientID)
}