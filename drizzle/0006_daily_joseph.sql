CREATE TABLE "pdr_ai_v2_chatHistory" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"document_id" bigint NOT NULL,
	"document_title" varchar(256) NOT NULL,
	"question" text NOT NULL,
	"response" text NOT NULL,
	"chat_id" varchar(256),
	"query_type" varchar(20) DEFAULT 'simple',
	"pages" integer[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"company_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_company" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"employerPasskey" varchar(256) NOT NULL,
	"employeePasskey" varchar(256) NOT NULL,
	"numberOfEmployees" varchar(256) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_document" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" varchar(256) NOT NULL,
	"category" varchar(256) NOT NULL,
	"title" varchar(256) NOT NULL,
	"company_id" bigint NOT NULL,
	"ocr_enabled" boolean DEFAULT false,
	"ocr_processed" boolean DEFAULT false,
	"ocr_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_document_reference_resolutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" bigint NOT NULL,
	"reference_name" varchar(256) NOT NULL,
	"resolved_in_document_id" integer,
	"resolution_details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_pdf_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" bigint NOT NULL,
	"page" integer NOT NULL,
	"chunk_index" integer DEFAULT 0 NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_predictive_document_analysis_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" bigint NOT NULL,
	"analysis_type" varchar(256) NOT NULL,
	"include_related_docs" boolean DEFAULT false,
	"result_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"userId" varchar(256) NOT NULL,
	"company_id" bigint NOT NULL,
	"role" varchar(256) NOT NULL,
	"status" varchar(256) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "pdr_ai_v2_users_id_unique" UNIQUE("id"),
	CONSTRAINT "pdr_ai_v2_users_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_agent_ai_chatbot_chat" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"title" text NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"visibility" varchar(20) DEFAULT 'private' NOT NULL,
	"agent_mode" varchar(50) DEFAULT 'interactive' NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"ai_style" varchar(50) DEFAULT 'concise',
	"ai_persona" varchar(50) DEFAULT 'general',
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_agent_ai_chatbot_document" (
	"id" varchar(256) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"kind" varchar(20) DEFAULT 'text' NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"chat_id" varchar(256),
	"task_id" varchar(256),
	CONSTRAINT "pdr_ai_v2_agent_ai_chatbot_document_id_created_at_pk" PRIMARY KEY("id","created_at")
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_agent_ai_chatbot_execution_step" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"task_id" varchar(256) NOT NULL,
	"step_number" integer NOT NULL,
	"step_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"reasoning" text,
	"input" jsonb,
	"output" jsonb,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_agent_ai_chatbot_memory" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"chat_id" varchar(256) NOT NULL,
	"memory_type" varchar(50) NOT NULL,
	"key" varchar(256) NOT NULL,
	"value" jsonb NOT NULL,
	"importance" integer DEFAULT 5 NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"accessed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_agent_ai_chatbot_message" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"chat_id" varchar(256) NOT NULL,
	"role" varchar(50) NOT NULL,
	"content" jsonb NOT NULL,
	"message_type" varchar(50) DEFAULT 'text' NOT NULL,
	"parent_message_id" varchar(256),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_agent_ai_chatbot_suggestion" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"document_id" varchar(256) NOT NULL,
	"document_created_at" timestamp with time zone NOT NULL,
	"original_text" text NOT NULL,
	"suggested_text" text NOT NULL,
	"description" text,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_agent_ai_chatbot_task" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"chat_id" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"objective" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"result" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_agent_ai_chatbot_tool_call" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"message_id" varchar(256) NOT NULL,
	"task_id" varchar(256),
	"tool_name" varchar(256) NOT NULL,
	"tool_input" jsonb NOT NULL,
	"tool_output" jsonb,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"execution_time_ms" integer,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_agent_ai_chatbot_tool_registry" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"schema" jsonb NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"required_permissions" jsonb,
	"rate_limit" integer,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "pdr_ai_v2_agent_ai_chatbot_tool_registry_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "pdr_ai_v2_agent_ai_chatbot_vote" (
	"chat_id" varchar(256) NOT NULL,
	"message_id" varchar(256) NOT NULL,
	"is_upvoted" boolean NOT NULL,
	"feedback" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "pdr_ai_v2_agent_ai_chatbot_vote_chat_id_message_id_pk" PRIMARY KEY("chat_id","message_id")
);
--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_chatHistory" ADD CONSTRAINT "pdr_ai_v2_chatHistory_document_id_pdr_ai_v2_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."pdr_ai_v2_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_category" ADD CONSTRAINT "pdr_ai_v2_category_company_id_pdr_ai_v2_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."pdr_ai_v2_company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_document" ADD CONSTRAINT "pdr_ai_v2_document_company_id_pdr_ai_v2_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."pdr_ai_v2_company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_document_reference_resolutions" ADD CONSTRAINT "pdr_ai_v2_document_reference_resolutions_company_id_pdr_ai_v2_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."pdr_ai_v2_company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_pdf_chunks" ADD CONSTRAINT "pdr_ai_v2_pdf_chunks_document_id_pdr_ai_v2_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."pdr_ai_v2_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_predictive_document_analysis_results" ADD CONSTRAINT "pdr_ai_v2_predictive_document_analysis_results_document_id_pdr_ai_v2_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."pdr_ai_v2_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_users" ADD CONSTRAINT "pdr_ai_v2_users_company_id_pdr_ai_v2_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."pdr_ai_v2_company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_agent_ai_chatbot_document" ADD CONSTRAINT "pdr_ai_v2_agent_ai_chatbot_document_chat_id_pdr_ai_v2_agent_ai_chatbot_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."pdr_ai_v2_agent_ai_chatbot_chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_agent_ai_chatbot_document" ADD CONSTRAINT "pdr_ai_v2_agent_ai_chatbot_document_task_id_pdr_ai_v2_agent_ai_chatbot_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."pdr_ai_v2_agent_ai_chatbot_task"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_agent_ai_chatbot_execution_step" ADD CONSTRAINT "pdr_ai_v2_agent_ai_chatbot_execution_step_task_id_pdr_ai_v2_agent_ai_chatbot_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."pdr_ai_v2_agent_ai_chatbot_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_agent_ai_chatbot_memory" ADD CONSTRAINT "pdr_ai_v2_agent_ai_chatbot_memory_chat_id_pdr_ai_v2_agent_ai_chatbot_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."pdr_ai_v2_agent_ai_chatbot_chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_agent_ai_chatbot_message" ADD CONSTRAINT "pdr_ai_v2_agent_ai_chatbot_message_chat_id_pdr_ai_v2_agent_ai_chatbot_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."pdr_ai_v2_agent_ai_chatbot_chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_agent_ai_chatbot_suggestion" ADD CONSTRAINT "pdr_ai_v2_agent_ai_chatbot_suggestion_document_id_document_created_at_pdr_ai_v2_agent_ai_chatbot_document_id_created_at_fk" FOREIGN KEY ("document_id","document_created_at") REFERENCES "public"."pdr_ai_v2_agent_ai_chatbot_document"("id","created_at") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_agent_ai_chatbot_task" ADD CONSTRAINT "pdr_ai_v2_agent_ai_chatbot_task_chat_id_pdr_ai_v2_agent_ai_chatbot_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."pdr_ai_v2_agent_ai_chatbot_chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_agent_ai_chatbot_tool_call" ADD CONSTRAINT "pdr_ai_v2_agent_ai_chatbot_tool_call_message_id_pdr_ai_v2_agent_ai_chatbot_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."pdr_ai_v2_agent_ai_chatbot_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_agent_ai_chatbot_tool_call" ADD CONSTRAINT "pdr_ai_v2_agent_ai_chatbot_tool_call_task_id_pdr_ai_v2_agent_ai_chatbot_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."pdr_ai_v2_agent_ai_chatbot_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_agent_ai_chatbot_vote" ADD CONSTRAINT "pdr_ai_v2_agent_ai_chatbot_vote_chat_id_pdr_ai_v2_agent_ai_chatbot_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."pdr_ai_v2_agent_ai_chatbot_chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_agent_ai_chatbot_vote" ADD CONSTRAINT "pdr_ai_v2_agent_ai_chatbot_vote_message_id_pdr_ai_v2_agent_ai_chatbot_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."pdr_ai_v2_agent_ai_chatbot_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_history_user_id_idx" ON "pdr_ai_v2_chatHistory" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_history_user_id_created_at_idx" ON "pdr_ai_v2_chatHistory" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_history_document_id_idx" ON "pdr_ai_v2_chatHistory" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "category_company_id_idx" ON "pdr_ai_v2_category" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "document_company_id_idx" ON "pdr_ai_v2_document" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "document_company_id_id_idx" ON "pdr_ai_v2_document" USING btree ("company_id","id");--> statement-breakpoint
CREATE INDEX "document_company_id_category_idx" ON "pdr_ai_v2_document" USING btree ("company_id","category");--> statement-breakpoint
CREATE INDEX "document_reference_resolutions_company_ref_idx" ON "pdr_ai_v2_document_reference_resolutions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "pdf_chunks_document_id_idx" ON "pdr_ai_v2_pdf_chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "pdf_chunks_document_id_page_idx" ON "pdr_ai_v2_pdf_chunks" USING btree ("document_id","page");--> statement-breakpoint
CREATE INDEX "pdf_chunks_document_id_page_chunk_idx" ON "pdr_ai_v2_pdf_chunks" USING btree ("document_id","page","chunk_index");--> statement-breakpoint
CREATE INDEX "predictive_analysis_document_id_idx" ON "pdr_ai_v2_predictive_document_analysis_results" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "users_company_id_idx" ON "pdr_ai_v2_users" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "users_user_id_idx" ON "pdr_ai_v2_users" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "agent_execution_step_task_step_idx" ON "pdr_ai_v2_agent_ai_chatbot_execution_step" USING btree ("task_id","step_number");--> statement-breakpoint
CREATE INDEX "agent_memory_chat_idx" ON "pdr_ai_v2_agent_ai_chatbot_memory" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "agent_memory_chat_type_idx" ON "pdr_ai_v2_agent_ai_chatbot_memory" USING btree ("chat_id","memory_type");