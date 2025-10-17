-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_agentic_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "cost" REAL NOT NULL DEFAULT 0,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cached_tokens" INTEGER NOT NULL DEFAULT 0,
    "tool_calls" TEXT,
    "attachments" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agentic_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "agentic_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_agentic_messages" ("attachments", "content", "cost", "created_at", "id", "input_tokens", "output_tokens", "role", "session_id", "tool_calls") SELECT "attachments", "content", "cost", "created_at", "id", "input_tokens", "output_tokens", "role", "session_id", "tool_calls" FROM "agentic_messages";
DROP TABLE "agentic_messages";
ALTER TABLE "new_agentic_messages" RENAME TO "agentic_messages";
CREATE INDEX "agentic_messages_session_id_idx" ON "agentic_messages"("session_id");
CREATE TABLE "new_agentic_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Agentic Session',
    "model" TEXT NOT NULL,
    "settings" TEXT,
    "total_cost" REAL NOT NULL DEFAULT 0,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cached_tokens" INTEGER NOT NULL DEFAULT 0,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "agentic_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_agentic_sessions" ("created_at", "id", "input_tokens", "message_count", "model", "output_tokens", "settings", "title", "total_cost", "updated_at", "user_id") SELECT "created_at", "id", "input_tokens", "message_count", "model", "output_tokens", "settings", "title", "total_cost", "updated_at", "user_id" FROM "agentic_sessions";
DROP TABLE "agentic_sessions";
ALTER TABLE "new_agentic_sessions" RENAME TO "agentic_sessions";
CREATE INDEX "agentic_sessions_user_id_idx" ON "agentic_sessions"("user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
