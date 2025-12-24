-- Add mode column to study_agent_sessions table
ALTER TABLE "study_agent_sessions" ADD COLUMN "mode" varchar(32) NOT NULL DEFAULT 'teacher';

