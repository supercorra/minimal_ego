CREATE TABLE "legacy_library_import" (
	"email" text,
	"movie_id" integer,
	"title" text NOT NULL,
	"poster_path" text,
	"overview" text DEFAULT '' NOT NULL,
	"watchlisted" boolean DEFAULT false NOT NULL,
	"score" real,
	"notes" text DEFAULT '' NOT NULL,
	"original_title" text,
	"year" integer,
	"director" text,
	"genres" text,
	"runtime_minutes" integer,
	"country" text,
	"backdrop_path" text,
	"trailer_url" text,
	"external_rating" real,
	"external_votes" integer,
	"watched_at" text,
	"preference" text,
	"magic_factor" integer DEFAULT 0 NOT NULL,
	"pinned_position" integer,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legacy_library_import_pkey" PRIMARY KEY("email","movie_id")
);
--> statement-breakpoint
ALTER TABLE "movie_library" ADD COLUMN "original_title" text;--> statement-breakpoint
ALTER TABLE "movie_library" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "movie_library" ADD COLUMN "director" text;--> statement-breakpoint
ALTER TABLE "movie_library" ADD COLUMN "genres" text;--> statement-breakpoint
ALTER TABLE "movie_library" ADD COLUMN "runtime_minutes" integer;--> statement-breakpoint
ALTER TABLE "movie_library" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "movie_library" ADD COLUMN "backdrop_path" text;--> statement-breakpoint
ALTER TABLE "movie_library" ADD COLUMN "trailer_url" text;--> statement-breakpoint
ALTER TABLE "movie_library" ADD COLUMN "external_rating" real;--> statement-breakpoint
ALTER TABLE "movie_library" ADD COLUMN "external_votes" integer;--> statement-breakpoint
ALTER TABLE "movie_library" ADD COLUMN "watched_at" text;--> statement-breakpoint
ALTER TABLE "movie_library" ADD COLUMN "preference" text;--> statement-breakpoint
ALTER TABLE "movie_library" ADD COLUMN "magic_factor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "movie_library" ADD COLUMN "pinned_position" integer;--> statement-breakpoint
ALTER TABLE "movie_library" ADD COLUMN "added_at" timestamp with time zone DEFAULT now() NOT NULL;