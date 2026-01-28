CREATE TABLE "pdr_ai_v2_ocr_cost_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" bigint NOT NULL,
	"provider" varchar(50) NOT NULL,
	"month" varchar(7) NOT NULL,
	"total_jobs" integer DEFAULT 0 NOT NULL,
	"total_pages" integer DEFAULT 0 NOT NULL,
	"total_cost_cents" integer DEFAULT 0 NOT NULL,
	"average_cost_per_page" integer DEFAULT 0 NOT NULL,
	"average_confidence_score" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_ocr_jobs" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"document_id" bigint,
	"company_id" bigint NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"status" varchar(50) DEFAULT 'queued' NOT NULL,
	"document_url" varchar(1024) NOT NULL,
	"document_name" varchar(256) NOT NULL,
	"page_count" integer,
	"file_size_bytes" bigint,
	"complexity_score" integer,
	"document_type" varchar(50),
	"primary_provider" varchar(50),
	"actual_provider" varchar(50),
	"estimated_cost_cents" integer,
	"actual_cost_cents" integer,
	"confidence_score" integer,
	"quality_flags" jsonb,
	"requires_review" boolean DEFAULT false,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"processing_duration_ms" integer,
	"ocr_result" jsonb,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"webhook_url" varchar(1024),
	"webhook_status" varchar(20),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_ocr_processing_steps" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"job_id" varchar(256) NOT NULL,
	"step_number" integer NOT NULL,
	"step_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"error_message" text,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_document_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" bigint NOT NULL,
	"total_tokens" integer DEFAULT 0,
	"total_sections" integer DEFAULT 0,
	"total_tables" integer DEFAULT 0,
	"total_figures" integer DEFAULT 0,
	"total_pages" integer DEFAULT 0,
	"max_section_depth" integer DEFAULT 0,
	"topic_tags" jsonb,
	"summary" text,
	"outline" jsonb,
	"complexity_score" integer,
	"document_class" varchar(50),
	"entities" jsonb,
	"summary_embedding" vector(1536),
	"date_range_start" timestamp with time zone,
	"date_range_end" timestamp with time zone,
	"language" varchar(10) DEFAULT 'en',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_document_previews" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" bigint NOT NULL,
	"section_id" bigint,
	"structure_id" bigint,
	"preview_type" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_document_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" bigint NOT NULL,
	"structure_id" bigint,
	"content" text NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"char_count" integer DEFAULT 0 NOT NULL,
	"embedding" vector(1536),
	"content_hash" varchar(64),
	"semantic_type" varchar(50),
	"page_number" integer,
	"line_start" integer,
	"line_end" integer,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_document_structure" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" bigint NOT NULL,
	"parent_id" bigint,
	"level" integer DEFAULT 0 NOT NULL,
	"ordering" integer DEFAULT 0 NOT NULL,
	"title" text,
	"content_type" varchar(50) DEFAULT 'section' NOT NULL,
	"path" varchar(256),
	"start_page" integer,
	"end_page" integer,
	"child_count" integer DEFAULT 0 NOT NULL,
	"token_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_workspace_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"company_id" bigint NOT NULL,
	"document_id" bigint,
	"section_id" bigint,
	"structure_id" bigint,
	"result_type" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"parent_result_id" bigint,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_document" ADD COLUMN "ocr_job_id" varchar(256);--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_document" ADD COLUMN "ocr_provider" varchar(50);--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_document" ADD COLUMN "ocr_confidence_score" integer;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_document" ADD COLUMN "ocr_cost_cents" integer;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_pomodoro_settings" ADD COLUMN "phase" text DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_pomodoro_settings" ADD COLUMN "is_running" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_pomodoro_settings" ADD COLUMN "is_paused" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_pomodoro_settings" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_pomodoro_settings" ADD COLUMN "paused_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_pomodoro_settings" ADD COLUMN "ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_pomodoro_settings" ADD COLUMN "completed_pomodoros" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_pomodoro_settings" ADD COLUMN "total_work_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_pomodoro_settings" ADD COLUMN "current_task_id" text;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_study_agent_profile" ADD COLUMN "ai_avatar_url" text;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_ocr_cost_tracking" ADD CONSTRAINT "pdr_ai_v2_ocr_cost_tracking_company_id_pdr_ai_v2_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."pdr_ai_v2_company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_ocr_jobs" ADD CONSTRAINT "pdr_ai_v2_ocr_jobs_document_id_pdr_ai_v2_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."pdr_ai_v2_document"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_ocr_jobs" ADD CONSTRAINT "pdr_ai_v2_ocr_jobs_company_id_pdr_ai_v2_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."pdr_ai_v2_company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_ocr_processing_steps" ADD CONSTRAINT "pdr_ai_v2_ocr_processing_steps_job_id_pdr_ai_v2_ocr_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."pdr_ai_v2_ocr_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_document_metadata" ADD CONSTRAINT "pdr_ai_v2_document_metadata_document_id_pdr_ai_v2_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."pdr_ai_v2_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_document_previews" ADD CONSTRAINT "pdr_ai_v2_document_previews_document_id_pdr_ai_v2_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."pdr_ai_v2_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_document_previews" ADD CONSTRAINT "pdr_ai_v2_document_previews_section_id_pdr_ai_v2_document_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."pdr_ai_v2_document_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_document_previews" ADD CONSTRAINT "pdr_ai_v2_document_previews_structure_id_pdr_ai_v2_document_structure_id_fk" FOREIGN KEY ("structure_id") REFERENCES "public"."pdr_ai_v2_document_structure"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_document_sections" ADD CONSTRAINT "pdr_ai_v2_document_sections_document_id_pdr_ai_v2_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."pdr_ai_v2_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_document_sections" ADD CONSTRAINT "pdr_ai_v2_document_sections_structure_id_pdr_ai_v2_document_structure_id_fk" FOREIGN KEY ("structure_id") REFERENCES "public"."pdr_ai_v2_document_structure"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_document_structure" ADD CONSTRAINT "pdr_ai_v2_document_structure_document_id_pdr_ai_v2_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."pdr_ai_v2_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_workspace_results" ADD CONSTRAINT "pdr_ai_v2_workspace_results_company_id_pdr_ai_v2_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."pdr_ai_v2_company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_workspace_results" ADD CONSTRAINT "pdr_ai_v2_workspace_results_document_id_pdr_ai_v2_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."pdr_ai_v2_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_workspace_results" ADD CONSTRAINT "pdr_ai_v2_workspace_results_section_id_pdr_ai_v2_document_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."pdr_ai_v2_document_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_workspace_results" ADD CONSTRAINT "pdr_ai_v2_workspace_results_structure_id_pdr_ai_v2_document_structure_id_fk" FOREIGN KEY ("structure_id") REFERENCES "public"."pdr_ai_v2_document_structure"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ocr_cost_tracking_company_provider_month_idx" ON "pdr_ai_v2_ocr_cost_tracking" USING btree ("company_id","provider","month");--> statement-breakpoint
CREATE INDEX "ocr_jobs_company_id_idx" ON "pdr_ai_v2_ocr_jobs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "ocr_jobs_user_id_idx" ON "pdr_ai_v2_ocr_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ocr_jobs_status_idx" ON "pdr_ai_v2_ocr_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ocr_jobs_created_at_idx" ON "pdr_ai_v2_ocr_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ocr_jobs_company_status_idx" ON "pdr_ai_v2_ocr_jobs" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "ocr_processing_steps_job_id_idx" ON "pdr_ai_v2_ocr_processing_steps" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "ocr_processing_steps_job_id_step_idx" ON "pdr_ai_v2_ocr_processing_steps" USING btree ("job_id","step_number");--> statement-breakpoint
CREATE UNIQUE INDEX "doc_metadata_document_id_unique" ON "pdr_ai_v2_document_metadata" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "doc_metadata_complexity_idx" ON "pdr_ai_v2_document_metadata" USING btree ("complexity_score");--> statement-breakpoint
CREATE INDEX "doc_metadata_class_idx" ON "pdr_ai_v2_document_metadata" USING btree ("document_class");--> statement-breakpoint
CREATE INDEX "doc_metadata_total_tokens_idx" ON "pdr_ai_v2_document_metadata" USING btree ("total_tokens");--> statement-breakpoint
CREATE INDEX "doc_previews_document_id_idx" ON "pdr_ai_v2_document_previews" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "doc_previews_section_id_idx" ON "pdr_ai_v2_document_previews" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "doc_previews_document_type_idx" ON "pdr_ai_v2_document_previews" USING btree ("document_id","preview_type");--> statement-breakpoint
CREATE INDEX "doc_sections_document_id_idx" ON "pdr_ai_v2_document_sections" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "doc_sections_structure_id_idx" ON "pdr_ai_v2_document_sections" USING btree ("structure_id");--> statement-breakpoint
CREATE INDEX "doc_sections_document_page_idx" ON "pdr_ai_v2_document_sections" USING btree ("document_id","page_number");--> statement-breakpoint
CREATE INDEX "doc_sections_content_hash_idx" ON "pdr_ai_v2_document_sections" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "doc_sections_semantic_type_idx" ON "pdr_ai_v2_document_sections" USING btree ("document_id","semantic_type");--> statement-breakpoint
CREATE INDEX "doc_structure_document_id_idx" ON "pdr_ai_v2_document_structure" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "doc_structure_parent_id_idx" ON "pdr_ai_v2_document_structure" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "doc_structure_document_level_idx" ON "pdr_ai_v2_document_structure" USING btree ("document_id","level");--> statement-breakpoint
CREATE INDEX "doc_structure_document_path_idx" ON "pdr_ai_v2_document_structure" USING btree ("document_id","path");--> statement-breakpoint
CREATE INDEX "doc_structure_document_ordering_idx" ON "pdr_ai_v2_document_structure" USING btree ("document_id","parent_id","ordering");--> statement-breakpoint
CREATE INDEX "workspace_session_id_idx" ON "pdr_ai_v2_workspace_results" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "workspace_user_id_idx" ON "pdr_ai_v2_workspace_results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_company_id_idx" ON "pdr_ai_v2_workspace_results" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "workspace_document_id_idx" ON "pdr_ai_v2_workspace_results" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "workspace_session_type_idx" ON "pdr_ai_v2_workspace_results" USING btree ("session_id","result_type");--> statement-breakpoint
CREATE INDEX "workspace_status_idx" ON "pdr_ai_v2_workspace_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workspace_expires_at_idx" ON "pdr_ai_v2_workspace_results" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "workspace_parent_result_idx" ON "pdr_ai_v2_workspace_results" USING btree ("parent_result_id");