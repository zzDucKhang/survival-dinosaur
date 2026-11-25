package controller

import (
	"encoding/json"
	"log"
	"strings"

	"dino-server/internal/models"
	"dino-server/internal/service"
)

type WSController struct {
	gameService *service.GameService
}

func NewWSController(gs *service.GameService) *WSController {
	return &WSController{gameService: gs}
}

func (ctrl *WSController) HandleMessage(
	clientID string,
	clientName *string,
	sendFn func([]byte),
	rawMsg []byte,
) {
	var inbound models.InboundMessage
	if err := json.Unmarshal(rawMsg, &inbound); err != nil {
		return
	}

	switch inbound.Type {
	case "JOIN":
		var payload models.JoinPayload
		if err := json.Unmarshal(inbound.Payload, &payload); err != nil {
			return
		}
		name := strings.TrimSpace(payload.Name)
		if name == "" {
			name = "Wild Raptor"
		}
		*clientName = name

		modelType := payload.Model
		if modelType == "" {
			modelType = "trex"
		}

		player := &models.Player{
			ID:        clientID,
			Name:      name,
			Model:     modelType,
			X:         0.0,
			Y:         0.0,
			Z:         0.0,
			Rotation:  0.0,
			AnimState: "idle",
			IsAI:      false,
		}
		ctrl.gameService.AddPlayer(player)

		playersSnap, foodsSnap, worldTime := ctrl.gameService.GetFullSnapshot()
		initResp := models.OutboundMessage{
			Type:      "INIT",
			ID:        clientID,
			Players:   playersSnap,
			Foods:     foodsSnap,
			WorldTime: worldTime,
		}
		if respBytes, err := json.Marshal(initResp); err == nil {
			sendFn(respBytes)
		}
		log.Printf("[Controller] Player joined: %s (%s) model=%s", name, clientID, modelType)

	case "MOVE":
		var payload models.MovePayload
		if err := json.Unmarshal(inbound.Payload, &payload); err == nil {
			ctrl.gameService.UpdatePlayerMove(
				clientID,
				payload.X,
				payload.Y,
				payload.Z,
				payload.Rotation,
				payload.AnimState,
			)
		}

	case "ATTACK":
		var payload models.AttackPayload
		if err := json.Unmarshal(inbound.Payload, &payload); err == nil {
			ctrl.gameService.ProcessPlayerAttack(clientID, payload.AttackType)
		}

	case "INTERACT":
		ctrl.gameService.ProcessInteract(clientID)

	case "CHAT":
		var payload models.ChatPayload
		if err := json.Unmarshal(inbound.Payload, &payload); err == nil {
			sender := *clientName
			if sender == "" {
				sender = "Dino"
			}
			ctrl.gameService.AddChatMessage(sender, payload.Text, false)
		}

	case "REST":
		ctrl.gameService.ToggleRest(clientID)

	case "CROUCH":
		var payload models.CrouchPayload
		if err := json.Unmarshal(inbound.Payload, &payload); err == nil {
			ctrl.gameService.SetCrouch(clientID, payload.Crouching)
		}

	case "ROAR":
		var payload models.RoarPayload
		if err := json.Unmarshal(inbound.Payload, &payload); err == nil {
			ctrl.gameService.ProcessRoar(clientID, payload.CallType)
		}
	}
}

func (ctrl *WSController) HandleDisconnect(clientID string) {
	ctrl.gameService.RemovePlayer(clientID)
}