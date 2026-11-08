CREATE TABLE "site_enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site" text DEFAULT 'davecore' NOT NULL,
	"kind" text DEFAULT 'contact' NOT NULL,
	"name" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"subject" text DEFAULT '' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"plan_ref" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "site_enquiries_created_idx" ON "site_enquiries" USING btree ("created_at");