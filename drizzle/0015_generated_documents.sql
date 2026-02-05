-- Migration: Add generated_documents table for Document Generator feature
-- This table stores AI-generated documents with their metadata and citations

CREATE TABLE IF NOT EXISTS "pdr_ai_v2_generated_documents" (
    "id" SERIAL PRIMARY KEY,
    "user_id" VARCHAR(256) NOT NULL,
    "company_id" BIGINT NOT NULL REFERENCES "pdr_ai_v2_company"("id") ON DELETE CASCADE,
    "title" VARCHAR(512) NOT NULL,
    "content" TEXT NOT NULL,
    "template_id" VARCHAR(64),
    "metadata" JSONB,
    "citations" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS "generated_documents_user_id_idx" ON "pdr_ai_v2_generated_documents" ("user_id");
CREATE INDEX IF NOT EXISTS "generated_documents_company_id_idx" ON "pdr_ai_v2_generated_documents" ("company_id");
CREATE INDEX IF NOT EXISTS "generated_documents_company_user_idx" ON "pdr_ai_v2_generated_documents" ("company_id", "user_id");
