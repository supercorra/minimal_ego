import { boolean, check, integer, pgTable, primaryKey, real, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Dati del film provenienti dal vecchio archivio (TMDB), condivisi da libreria e tabella di appoggio.
const legacyMovieColumns = () => ({
  originalTitle: text("original_title"),
  year: integer("year"),
  director: text("director"),
  genres: text("genres"),
  runtimeMinutes: integer("runtime_minutes"),
  country: text("country"),
  backdropPath: text("backdrop_path"),
  trailerUrl: text("trailer_url"),
  externalRating: real("external_rating"),
  externalVotes: integer("external_votes"),
});

// Dati personali del vecchio archivio: data di visione, preferenza e posizione in classifica.
const legacyPersonalColumns = () => ({
  watchedAt: text("watched_at"),
  preference: text("preference"),
  magicFactor: integer("magic_factor").notNull().default(0),
  pinnedPosition: integer("pinned_position"),
});

export const movieLibrary = pgTable("movie_library", {
  ownerHash: text("owner_hash").notNull(),
  movieId: integer("movie_id").notNull(),
  title: text("title").notNull(),
  posterPath: text("poster_path"),
  releaseDate: text("release_date").notNull().default(""),
  overview: text("overview").notNull().default(""),
  watchlisted: boolean("watchlisted").notNull().default(false),
  score: real("score"),
  notes: text("notes").notNull().default(""),
  ...legacyMovieColumns(),
  ...legacyPersonalColumns(),
  dismissed: boolean("dismissed").notNull().default(false),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.ownerHash, table.movieId] }),
  check("movie_library_score_range", sql`${table.score} IS NULL OR (${table.score} >= 1 AND ${table.score} <= 10)`),
  check("movie_library_positive_id", sql`${table.movieId} > 0`),
]);

// Film importati dal vecchio archivio, in attesa che l'account con questa email li prenda in carico.
export const legacyLibraryImport = pgTable("legacy_library_import", {
  email: text("email").notNull(),
  movieId: integer("movie_id").notNull(),
  title: text("title").notNull(),
  posterPath: text("poster_path"),
  overview: text("overview").notNull().default(""),
  watchlisted: boolean("watchlisted").notNull().default(false),
  score: real("score"),
  notes: text("notes").notNull().default(""),
  ...legacyMovieColumns(),
  ...legacyPersonalColumns(),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.email, table.movieId] }),
]);
