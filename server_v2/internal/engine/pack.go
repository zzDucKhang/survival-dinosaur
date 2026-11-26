package engine

import (
	"fmt"
	"time"

	"dino-server-v2/internal/domain"
)

func IsSamePack(a, b *domain.Entity) bool {
	return !a.IsAI && !b.IsAI && a.PackID != "" && a.PackID == b.PackID
}

func makePackID(leaderID string) string {
	if len(leaderID) > 8 {
		return fmt.Sprintf("pack-%s", leaderID[:8])
	}
	return fmt.Sprintf("pack-%s", leaderID)
}

func (e *GameEngine) InviteToPack(inviterID, targetID string) {
	e.store.Lock()
	defer e.store.Unlock()

	if inviterID == targetID {
		return
	}
	inviter, ok1 := e.store.Entities[inviterID]
	target, ok2 := e.store.Entities[targetID]
	if !ok1 || !ok2 || target.IsAI || inviter.Diet != target.Diet {
		return
	}
	if inviter.PackID == "" {
		inviter.PackID = makePackID(inviter.ID)
	}
	target.PackInviteFrom = inviter.ID
	target.PackInviteName = inviter.Name

	e.store.AppendChatLocked(domain.ChatMessage{
		ID:        fmt.Sprintf("pack-inv-%d", time.Now().UnixNano()),
		Sender:    "ISLE",
		Text:      fmt.Sprintf("🐾 %s đã mời %s gia nhập Bầy Đàn!", inviter.Name, target.Name),
		IsSystem:  true,
		Timestamp: time.Now().UnixMilli(),
	})
}

func (e *GameEngine) AcceptPackInvite(playerID string) {
	e.store.Lock()
	defer e.store.Unlock()

	p, ok := e.store.Entities[playerID]
	if !ok || p.PackInviteFrom == "" {
		return
	}
	inviter, okInv := e.store.Entities[p.PackInviteFrom]
	if !okInv || inviter.Diet != p.Diet {
		p.PackInviteFrom = ""
		p.PackInviteName = ""
		return
	}
	if inviter.PackID == "" {
		inviter.PackID = makePackID(inviter.ID)
	}
	p.PackID = inviter.PackID
	p.PackInviteFrom = ""
	p.PackInviteName = ""

	e.store.AppendChatLocked(domain.ChatMessage{
		ID:        fmt.Sprintf("pack-acc-%d", time.Now().UnixNano()),
		Sender:    "ISLE",
		Text:      fmt.Sprintf("🤝 %s đã gia nhập Bầy Đàn cùng %s!", p.Name, inviter.Name),
		IsSystem:  true,
		Timestamp: time.Now().UnixMilli(),
	})
}

func (e *GameEngine) LeavePack(playerID string) {
	e.store.Lock()
	defer e.store.Unlock()

	p, ok := e.store.Entities[playerID]
	if !ok {
		return
	}
	p.PackInviteFrom = ""
	p.PackInviteName = ""
	if p.PackID != "" {
		p.PackID = ""
		e.store.AppendChatLocked(domain.ChatMessage{
			ID:        fmt.Sprintf("pack-lv-%d", time.Now().UnixNano()),
			Sender:    "ISLE",
			Text:      fmt.Sprintf("🐾 %s đã rời khỏi Bầy Đàn.", p.Name),
			IsSystem:  true,
			Timestamp: time.Now().UnixMilli(),
		})
	}
}