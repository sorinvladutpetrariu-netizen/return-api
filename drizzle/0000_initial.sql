CREATE TABLE "articles" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"price" integer NOT NULL,
	"category" varchar(100) NOT NULL,
	"author" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"author" varchar(255) NOT NULL,
	"price" integer NOT NULL,
	"category" varchar(100) NOT NULL,
	"cover_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "purchases" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"article_id" varchar(50),
	"book_id" varchar(50),
	"amount" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"stripe_payment_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"author" varchar(255) NOT NULL,
	"source" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"date_scheduled" varchar(10) NOT NULL
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
CREATE TABLE "users" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" varchar(255),
	"verification_token_expires" timestamp,
	"reset_token" varchar(255),
	"reset_token_expires" timestamp,
	"social_provider" varchar(50),
	"social_id" varchar(255),
	"timezone" varchar(64) DEFAULT 'UTC' NOT NULL,
	"interests" text DEFAULT '[]' NOT NULL,
	"founding_member" boolean DEFAULT false NOT NULL,
	"founding_discount_percent" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
