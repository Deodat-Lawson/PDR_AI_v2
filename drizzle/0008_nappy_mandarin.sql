CREATE TABLE "pdr_ai_v2_study_agent_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"session_id" bigint NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"materials" text[] DEFAULT '{}',
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_study_agent_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"session_id" bigint NOT NULL,
	"title" text,
	"content" text,
	"tags" text[] DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_study_agent_pomodoro_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"session_id" bigint NOT NULL,
	"focus_minutes" integer DEFAULT 25 NOT NULL,
	"short_break_minutes" integer DEFAULT 5 NOT NULL,
	"long_break_minutes" integer DEFAULT 15 NOT NULL,
	"remaining_time" integer DEFAULT 0 NOT NULL,
	"sessions_before_long_break" integer DEFAULT 4 NOT NULL,
	"auto_start_breaks" boolean DEFAULT false NOT NULL,
	"auto_start_pomodoros" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_study_agent_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"session_id" bigint NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_study_agent_profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"session_id" bigint NOT NULL,
	"name" text,
	"grade" text,
	"gender" text,
	"field_of_study" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_study_agent_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"name" text DEFAULT 'Default Session' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_users" DROP CONSTRAINT "pdr_ai_v2_users_id_unique";--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_goals" ADD CONSTRAINT "pdr_ai_v2_study_agent_goals_session_id_pdr_ai_v2_study_agent_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pdr_ai_v2_study_agent_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_notes" ADD CONSTRAINT "pdr_ai_v2_study_agent_notes_session_id_pdr_ai_v2_study_agent_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pdr_ai_v2_study_agent_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_pomodoro_settings" ADD CONSTRAINT "pdr_ai_v2_study_agent_pomodoro_settings_session_id_pdr_ai_v2_study_agent_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pdr_ai_v2_study_agent_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_preferences" ADD CONSTRAINT "pdr_ai_v2_study_agent_preferences_session_id_pdr_ai_v2_study_agent_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pdr_ai_v2_study_agent_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_profile" ADD CONSTRAINT "pdr_ai_v2_study_agent_profile_session_id_pdr_ai_v2_study_agent_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pdr_ai_v2_study_agent_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "study_agent_goals_user_idx" ON "pdr_ai_v2_study_agent_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "study_agent_goals_session_idx" ON "pdr_ai_v2_study_agent_goals" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "study_agent_notes_user_idx" ON "pdr_ai_v2_study_agent_notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "study_agent_notes_session_idx" ON "pdr_ai_v2_study_agent_notes" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "study_agent_pomodoro_settings_user_idx" ON "pdr_ai_v2_study_agent_pomodoro_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "study_agent_pomodoro_settings_session_idx" ON "pdr_ai_v2_study_agent_pomodoro_settings" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "study_agent_preferences_user_idx" ON "pdr_ai_v2_study_agent_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "study_agent_preferences_session_idx" ON "pdr_ai_v2_study_agent_preferences" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "study_agent_profile_user_idx" ON "pdr_ai_v2_study_agent_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "study_agent_profile_session_idx" ON "pdr_ai_v2_study_agent_profile" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "study_agent_sessions_user_idx" ON "pdr_ai_v2_study_agent_sessions" USING btree ("user_id");