import { eq } from "drizzle-orm";
import { getUser } from "@netlify/identity";
import type { Config } from "@netlify/functions";
import { createDatabase } from "../../db/index.js";
import { movieLibrary } from "../../db/schema.js";

const noStore = { "Cache-Control": "no-store" };
const respond = (body: unknown, status = 200) => Response.json(body, { status, headers: noStore });

type Row = typeof movieLibrary.$inferSelect;

const GENRES: Record<number, [string, string]> = {
  28: ["azione", "action"], 12: ["avventura", "adventure"], 16: ["animazione", "animation"],
  35: ["commedia", "comedy"], 80: ["crime", "crime"], 99: ["documentario", "documentary"],
  18: ["dramma", "drama"], 10751: ["famiglia", "family"], 14: ["fantasy", "fantasy"],
  36: ["storia", "history"], 27: ["horror", "horror"], 10402: ["musica", "music"],
  9648: ["mistero", "mystery"], 10749: ["romance", "romance"], 878: ["fantascienza", "science fiction"],
  53: ["thriller", "thriller"], 10752: ["guerra", "war"], 37: ["western", "western"],
};

const split = (v: string | null) => (v ?? "").split(/[,/|]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
const decade = (y: number | null) => (y ? `${Math.floor(y / 10) * 10}s` : "");

function weight(r: Row, mean: number) {
  let w = ((r.score ?? mean) - mean) / 2.5;
  const p = (r.preference ?? "").toLowerCase();
  if (p.includes("amat") || p.includes("love")) w += 0.6;
  if (p.includes("non piaciut") || p.includes("dislike")) w -= 0.6;
  return w;
}

function buildProfile(rated: Row[]) {
  const mean = rated.reduce((s, r) => s + (r.score ?? 0), 0) / Math.max(rated.length, 1);
  const sum = new Map<string, number>();
  const count = new Map<string, number>();
  for (const r of rated) {
    const w = weight(r, mean);
    const keys = [...split(r.genres).map((g) => `g:${g}`), ...(r.year ? [`y:${decade(r.year)}`] : [])];
    for (const k of keys) {
      sum.set(k, (sum.get(k) ?? 0) + w);
      count.set(k, (count.get(k) ?? 0) + 1);
    }
  }
  const profile = new Map<string, number>();
  for (const [k, s] of sum) profile.set(k, s / (count.get(k)! + 2));
  return profile;
}

const recoCache = new Map<number, { at: number; results: any[] }>();
const RECO_TTL_MS = 6 * 60 * 60 * 1000;

async function recommendationsFor(movieId: number, token: string): Promise<{ results: any[] } | null> {
  const hit = recoCache.get(movieId);
  if (hit && Date.now() - hit.at < RECO_TTL_MS) return { results: hit.results };
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/recommendations?language=it-IT`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    recoCache.set(movieId, { at: Date.now(), results });
    if (recoCache.size > 500) recoCache.delete(recoCache.keys().next().value as number);
    return { results };
  } catch {
    return null;
  }
}

export default async function handler(request: Request) {
  if (request.method !== "GET") return respond({ error: "Metodo non consentito." }, 405);
  const user = await getUser();
  if (!user) return respond({ error: "Accedi per vedere i suggerimenti." }, 401);

  const library = await createDatabase().select().from(movieLibrary).where(eq(movieLibrary.ownerHash, user.id));
  const rated = library.filter((r) => r.score !== null);
  const known = new Set(library.map((r) => r.movieId));
  const profile = buildProfile(rated);

  const url = new URL(request.url);
  const genre = url.searchParams.get("genre")?.toLowerCase() ?? "";
  const dec = url.searchParams.get("decade") ?? "";
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 25);

  const seeds = rated.filter((r) => (r.score ?? 0) >= 8).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 10);
  const token = Netlify.env.get("TMDB_READ_TOKEN");
  if (!token) return respond({ error: "TMDB_READ_TOKEN mancante." }, 503);

  const pool = new Map<number, any>();
  await Promise.all(seeds.map(async (s) => {
    const data = await recommendationsFor(s.movieId, token);
    if (!data) return;
    for (const m of data.results ?? []) {
      if (known.has(m.id)) continue;
      const hit = pool.get(m.id);
      if (hit) hit.hits += 1;
      else pool.set(m.id, { ...m, via: s.title, hits: 1 });
    }
  }));

  const list = [...pool.values()].map((m) => {
    const year = Number((m.release_date ?? "").slice(0, 4)) || null;
    const names: string[] = (m.genre_ids ?? []).flatMap((id: number) => GENRES[id] ?? []);
    let taste = 0;
    for (const id of m.genre_ids ?? []) {
      const [it, en] = GENRES[id] ?? ["", ""];
      taste += Math.max(profile.get(`g:${it}`) ?? 0, profile.get(`g:${en}`) ?? 0);
    }
    taste += profile.get(`y:${decade(year)}`) ?? 0;
    const quality = m.vote_average ? (m.vote_average - 6) / 4 : 0;
    const affinity = taste + 0.5 * quality + 0.15 * (m.hits - 1);
    return { id: m.id, title: m.title, poster_path: m.poster_path, release_date: m.release_date, year, tmdb_rating: m.vote_average, vote_average: m.vote_average, genre_ids: m.genre_ids, overview: m.overview, affinity, why: `Come ${m.via}`, names };
  })
    .filter((m) => (!dec || decade(m.year) === dec) && (!genre || m.names.includes(genre)))
    .sort((a, b) => b.affinity - a.affinity)
    .slice(0, 100);

  return respond({ total: list.length, rated_count: rated.length, results: list.slice(offset, offset + limit).map(({ names, ...r }) => r) });
}

export const config: Config = { path: "/api/discover" };
