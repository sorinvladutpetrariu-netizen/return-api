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
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
