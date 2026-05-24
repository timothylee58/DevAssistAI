CREATE INDEX IF NOT EXISTS "Chat_userId_idx" ON "Chat" ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Message_v2_chatId_idx" ON "Message_v2" ("chatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Message_v2_createdAt_idx" ON "Message_v2" ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Suggestion_documentId_idx" ON "Suggestion" ("documentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Stream_chatId_idx" ON "Stream" ("chatId");
