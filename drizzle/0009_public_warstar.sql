CREATE TABLE "pdr_ai_v2_study_agent_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"original_id" varchar(64),
	"user_id" varchar(256) NOT NULL,
	"session_id" bigint NOT NULL,
	"role" varchar(32) NOT NULL,
	"content" text NOT NULL,
	"tts_content" text,
	"attached_document" text,
	"attached_document_id" text,
	"attached_document_url" text,
	"is_voice" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_messages" ADD CONSTRAINT "pdr_ai_v2_study_agent_messages_session_id_pdr_ai_v2_study_agent_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pdr_ai_v2_study_agent_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "study_agent_messages_user_id_idx" ON "pdr_ai_v2_study_agent_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "study_agent_messages_session_id_idx" ON "pdr_ai_v2_study_agent_messages" USING btree ("session_id");