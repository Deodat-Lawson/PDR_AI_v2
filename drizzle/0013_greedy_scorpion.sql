CREATE TABLE "pdr_ai_v2_company_service_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" bigint NOT NULL,
	"key_type" varchar(100) NOT NULL,
	"key_value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "company_service_keys_company_key_unique" UNIQUE("company_id","key_type")
);
--> statement-breakpoint
ALTER TABLE "pdr_ai_v2_company_service_keys" ADD CONSTRAINT "pdr_ai_v2_company_service_keys_company_id_pdr_ai_v2_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."pdr_ai_v2_company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_service_keys_company_id_idx" ON "pdr_ai_v2_company_service_keys" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_service_keys_key_type_idx" ON "pdr_ai_v2_company_service_keys" USING btree ("company_id","key_type");