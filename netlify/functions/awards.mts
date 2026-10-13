import type { Config } from "@netlify/functions";
import { FESTIVALS } from "../lib/awards-config.js";
import { AWARDS } from "../lib/awards-data.js";

type Row = { tmdb: number; festival: string; group: string; status: "win" | "nom"; year: number };
type Film = {
  id: number; title: string; original_title: string; poster_path: string | null; release_date: string; overview: string;
  vote_average: number; vote_count: number; genres: string[]; countries: string[]; directors: string[];
};
type Binding = Record<string, { value: string } | undefined>;

const UA = "MinimalEgo/2.0 (https://minimalego.netlify.app)";
const TTL = 6 * 3600 * 1000;
const qids = new Map<string, string>();
const filmCache = new Map<number, Film>();
let rowsCache: { at: number; body: Record<string, unknown> } | null = null;

async function getJSON<T>(url: string, accept = "application/json", ms = 9000, extra: Record<string, string> = {}): Promise<T> {
  const response = await fetch(url, { headers: { "User-Agent": UA, Accept: accept, ...extra }, signal: AbortSignal.timeout(ms) });
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 160);
    throw new Error(`${response.status} ${detail}`.trim());
  }
  return await response.json() as T;
}

async function qidFor(label: string): Promise<string | null> {
  const known = qids.get(label);
  if (known) return known;
  try {
    const data = await getJSON<{ search?: { id: string; label?: string }[] }>(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&type=item&language=en&limit=8&search=${encodeURIComponent(label)}`);
    const hit = data.search?.find((item) => item.label?.toLowerCase() === label.toLowerCase());
    if (hit) qids.set(label, hit.id);
    return hit?.id ?? null;
  } catch {
    return null;
  }
}

async function festivalRows(key: string, minYear: number) {
  const fest = FESTIVALS[key];
  const groupOf = new Map<string, string>();
  const unresolved: string[] = [];
  await Promise.all(fest.categories.flatMap((category) => category.labels.map(async (label) => {
    const id = await qidFor(label);
    if (id) groupOf.set(id, category.group); else unresolved.push(label);
  })));
  if (!groupOf.size) throw new Error("nessun premio trovato su Wikidata");
  const values = [...groupOf.keys()].map((id) => `wd:${id}`).join(" ");
  const shapes = [
    "?film p:P166 ?st. ?st ps:P166 ?award.",
    "?film p:P1411 ?st. ?st ps:P1411 ?award.",
    "?x p:P166 ?st. ?st ps:P166 ?award; pq:P1686 ?film.",
    "?x p:P1411 ?st. ?st ps:P1411 ?award; pq:P1686 ?film.",
  ];
  const statuses = ["win", "nom", "win", "nom"] as const;
  const settled = await Promise.allSettled(shapes.map(async (shape, index) => {
    if (statuses[index] === "nom" && !fest.nominations) return [] as Binding[];
    const query = `SELECT ?award ?tmdb ?date ?pub WHERE { VALUES ?award { ${values} } ${shape} OPTIONAL { ?st pq:P585 ?date } ?film wdt:P4947 ?tmdb. OPTIONAL { ?film wdt:P577 ?pub } FILTER(YEAR(COALESCE(?date, ?pub)) >= ${minYear - 1}) }`;
    const data = await getJSON<{ results: { bindings: Binding[] } }>(
      `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, "application/sparql-results+json", 12000);
    return data.results.bindings;
  }));
  const errors = settled.flatMap((result) => result.status === "rejected" ? [String(result.reason?.message ?? result.reason)] : []);
  const best = new Map<string, Row>();
  settled.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const status = statuses[index];
    for (const binding of result.value) {
      const tmdb = Number(binding.tmdb?.value);
      const group = groupOf.get(binding.award?.value.split("/").pop() ?? "");
      if (!Number.isSafeInteger(tmdb) || tmdb < 1 || !group) continue;
      const stamp = binding.date?.value;
      const year = stamp ? Number(stamp.slice(0, 4)) : binding.pub ? Number(binding.pub.value.slice(0, 4)) + fest.yearOffset : 0;
      if (!year || year < minYear) continue;
      const id = `${tmdb}|${group}|${year}`;
      const existing = best.get(id);
      if (!existing || (existing.status === "nom" && status === "win")) best.set(id, { tmdb, festival: key, group, status, year });
    }
  });
  if (!best.size && errors.length) throw new Error(errors[0]);
  return { rows: [...best.values()], unresolved };
}

async function curatedRows(token: string, key: string, minYear: number): Promise<Row[]> {
  const entries = AWARDS.filter((entry) => entry.award === key && entry.year >= minYear);
  const rows: (Row | null)[] = await Promise.all(entries.map(async (entry): Promise<Row | null> => {
    try {
      const url = new URL("https://api.themoviedb.org/3/search/movie");
      url.searchParams.set("query", entry.title);
      url.searchParams.set("primary_release_year", String(entry.filmYear));
      const data = await getJSON<{ results?: { id: number }[] }>(url.toString(), "application/json", 8000, { Authorization: `Bearer ${token}` });
      return data.results?.[0] ? { tmdb: data.results[0].id, festival: key, group: "film", status: "win", year: entry.year } : null;
    } catch {
      return null;
    }
  }));
  return rows.filter((row) => row !== null) as Row[];
}

async function tmdbFetch(token: string, path: string) {
  const response = await fetch(`https://api.themoviedb.org/3${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(String(response.status));
  return await response.json() as Record<string, any>;
}

async function loadFilm(token: string, id: number): Promise<Film | null> {
  const cached = filmCache.get(id);
  if (cached) return cached;
  try {
    const d = await tmdbFetch(token, `/movie/${id}?language=it-IT&append_to_response=credits`);
    const film: Film = {
      id, title: d.title ?? "", original_title: d.original_title ?? "", poster_path: d.poster_path ?? null,
      release_date: d.release_date ?? "", overview: d.overview ?? "", vote_average: d.vote_average ?? 0, vote_count: d.vote_count ?? 0,
      genres: (d.genres ?? []).map((g: { name: string }) => g.name),
      countries: (d.production_countries ?? []).map((c: { name: string }) => c.name),
      directors: (d.credits?.crew ?? []).filter((p: { job: string }) => p.job === "Director").map((p: { name: string }) => p.name),
    };
    filmCache.set(id, film);
    return film;
  } catch {
    return null;
  }
}

const cacheHeaders = {
  "Cache-Control": "public, max-age=600",
  "Netlify-CDN-Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
};

export default async function handler(request: Request) {
  if (request.method !== "GET") return Response.json({ error: "Metodo non consentito." }, { status: 405, headers: { Allow: "GET" } });
  const token = Netlify.env.get("TMDB_READ_TOKEN");
  if (!token) return Response.json({ error: "Configura TMDB_READ_TOKEN nelle variabili d'ambiente Netlify." }, { status: 503 });
  const url = new URL(request.url);

  if (url.pathname.endsWith("/films")) {
    const ids = url.searchParams.get("ids") ?? "";
    if (!/^\d{1,9}(,\d{1,9}){0,29}$/.test(ids)) return Response.json({ error: "Elenco film non valido." }, { status: 400 });
    const films = (await Promise.all(ids.split(",").map((id) => loadFilm(token, Number(id))))).filter((film) => film !== null);
    return Response.json({ films }, { headers: cacheHeaders });
  }

  const debug = url.searchParams.has("debug");
  if (rowsCache && !debug && Date.now() - rowsCache.at < TTL) return Response.json(rowsCache.body, { headers: cacheHeaders });
  const minYear = new Date().getFullYear() - 4;
  const rows: Row[] = [];
  const sources: Record<string, string> = {};
  const unresolved: Record<string, string[]> = {};
  const errors: Record<string, string> = {};
  await Promise.all(Object.keys(FESTIVALS).map(async (key) => {
    try {
      const result = await festivalRows(key, minYear);
      unresolved[key] = result.unresolved;
      if (result.rows.length) { rows.push(...result.rows); sources[key] = "wikidata"; return; }
    } catch (error) { errors[key] = error instanceof Error ? error.message : String(error); }
    const fallback = await curatedRows(token, key, minYear);
    rows.push(...fallback);
    sources[key] = fallback.length ? "curated" : "empty";
  }));
  const body = { rows, sources, unresolved, errors };
  if (rows.length) rowsCache = { at: Date.now(), body };
  return Response.json(body, { headers: debug ? { "Cache-Control": "no-store" } : cacheHeaders });
}

export const config: Config = { path: ["/api/awards", "/api/awards/films"] };
