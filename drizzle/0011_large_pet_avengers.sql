ALTER TABLE "pdr_ai_v2_study_agent_preferences" ADD COLUMN "selected_documents" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_preferences" ADD COLUMN "user_name" text;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_preferences" ADD COLUMN "user_grade" text;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_preferences" ADD COLUMN "user_gender" text;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_preferences" ADD COLUMN "field_of_study" text;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_profile" ADD COLUMN "ai_name" text;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_profile" ADD COLUMN "ai_gender" text;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_profile" ADD COLUMN "ai_extroversion" integer;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_profile" ADD COLUMN "ai_intuition" integer;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_profile" ADD COLUMN "ai_thinking" integer;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_profile" ADD COLUMN "ai_judging" integer;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_sessions" ADD COLUMN "mode" varchar(32) DEFAULT 'teacher' NOT NULL;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_preferences" DROP COLUMN "preferences";--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_profile" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_profile" DROP COLUMN "grade";--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_profile" DROP COLUMN "gender";--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_profile" DROP COLUMN "field_of_study";