-- CreateTable
CREATE TABLE "groq_models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "display_name" TEXT NOT NULL,
    "context_window" INTEGER NOT NULL,
    "input_pricing" REAL NOT NULL,
    "output_pricing" REAL NOT NULL,
    "is_vision" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
