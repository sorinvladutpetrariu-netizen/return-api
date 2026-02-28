CREATE TABLE "daily_practices" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"date" varchar(10) NOT NULL,
	"orientation_text" text NOT NULL,
	"orientation_author" varchar(255) NOT NULL,
	"insight_text" text NOT NULL,
	"reflection_prompt" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_practices_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "return_followups" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"return_id" varchar(50) NOT NULL,
	"note_text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "return_reactions" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"return_id" varchar(50) NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"reaction_type" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"practice_date" varchar(10) NOT NULL,
	"reflection_text" text NOT NULL,
	"commitment_text" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"delete_allowed_until" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"user_id" varchar(50) PRIMARY KEY NOT NULL,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"status" varchar(50) NOT NULL,
	"plan" varchar(50) NOT NULL,
	"current_period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "timezone" varchar(64) DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "interests" text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "founding_member" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "founding_discount_percent" integer DEFAULT 0 NOT NULL;