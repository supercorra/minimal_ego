CREATE TABLE "movie_library" (
	"owner_hash" text,
	"movie_id" integer,
	"title" text NOT NULL,
	"poster_path" text,
	"release_date" text DEFAULT '' NOT NULL,
	"overview" text DEFAULT '' NOT NULL,
	"watchlisted" boolean DEFAULT false NOT NULL,
	"score" real,
	"notes" text DEFAULT '' NOT NULL,
	CONSTRAINT "movie_library_pkey" PRIMARY KEY("owner_hash","movie_id"),
	CONSTRAINT "movie_library_score_range" CHECK ("score" IS NULL OR ("score" >= 1 AND "score" <= 10)),
	CONSTRAINT "movie_library_positive_id" CHECK ("movie_id" > 0)
);
