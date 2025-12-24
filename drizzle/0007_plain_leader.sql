CREATE TABLE "pdr_ai_v2_chat_history" (
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
DROP TABLE "pdr_ai_v2_chatHistory" CASCADE;--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_chat_history" ADD CONSTRAINT "pdr_ai_v2_chat_history_document_id_pdr_ai_v2_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."pdr_ai_v2_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_history_user_id_idx" ON "pdr_ai_v2_chat_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_history_user_id_created_at_idx" ON "pdr_ai_v2_chat_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_history_document_id_idx" ON "pdr_ai_v2_chat_history" USING btree ("document_id");