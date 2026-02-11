-- Migration: Add file_uploads table for local file storage when UploadThing is disabled
-- This table stores uploaded files as base64-encoded text data in the database

CREATE TABLE IF NOT EXISTS "file_uploads" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR(256) NOT NULL,
  "filename" VARCHAR(256) NOT NULL,
  "mime_type" VARCHAR(128) NOT NULL,
  "file_data" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS "file_uploads_user_id_idx" ON "file_uploads" ("user_id");

