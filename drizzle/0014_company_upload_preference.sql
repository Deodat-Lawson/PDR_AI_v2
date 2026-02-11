-- Migration: Add use_uploadthing column to company table
-- This allows per-company configuration of upload storage method

ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "use_uploadthing" BOOLEAN NOT NULL DEFAULT true;

