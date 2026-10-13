import type { Config } from "@netlify/functions";

export default async function handler(request: Request) {
  if (request.method !== "GET") {
    return Response.json({ error: "Metodo non consentito." }, { status: 405, headers: { Allow: "GET" } });
  }

  const incoming = new URL(request.url);
  const endpoint = incoming.pathname.replace(/^\/api\/tmdb/, "");
  const isDetail = /^\/movie\/\d{1,9}$/.test(endpoint);
  const isVideos = /^\/movie\/\d{1,9}\/videos$/.test(endpoint);
  const isProviders = /^\/movie\/\d{1,9}\/watch\/providers$/.test(endpoint);
  if (!isDetail && !isVideos && !isProviders && !["/trending/movie/week", "/search/movie", "/discover/movie", "/movie/upcoming"].includes(endpoint)) {
    return Response.json({ error: "Percorso TMDB non consentito." }, { status: 404 });
  }

  const token = Netlify.env.get("TMDB_READ_TOKEN");
  if (!token) {
    return Response.json({ error: "Configura TMDB_READ_TOKEN nelle variabili d'ambiente Netlify per caricare i film." }, { status: 503 });
  }

  const upstream = new URL(`https://api.themoviedb.org/3${endpoint}`);
  upstream.searchParams.set("language", "it-IT");
  upstream.searchParams.set("include_adult", "false");
  if (endpoint === "/search/movie") {
    const query = incoming.searchParams.get("query")?.trim();
    if (!query || query.length > 200) {
      return Response.json({ error: "Inserisci una ricerca di massimo 200 caratteri." }, { status: 400 });
    }
    upstream.searchParams.set("query", query);
    const year = incoming.searchParams.get("year");
    if (year) {
      if (!/^\d{4}$/.test(year)) {
        return Response.json({ error: "Anno non valido." }, { status: 400 });
      }
      upstream.searchParams.set("primary_release_year", year);
    }
  }

  if (isVideos) {
    const lang = incoming.searchParams.get("include_video_language") ?? "en";
    if (!/^[a-z]{2}(,[a-z]{2}|,null){0,3}$/.test(lang)) return Response.json({ error: "Lingua non valida." }, { status: 400 });
    upstream.searchParams.set("include_video_language", lang);
  }
  if (isDetail) {
    upstream.searchParams.set("append_to_response", "credits,videos");
    upstream.searchParams.set("include_video_language", "it,en,null");
  }
  if (endpoint === "/discover/movie") {
    const allowed: Record<string, RegExp> = {
      "primary_release_date.gte": /^\d{4}-\d{2}-\d{2}$/,
      "primary_release_date.lte": /^\d{4}-\d{2}-\d{2}$/,
      sort_by: /^(primary_release_date|popularity|vote_average)\.(asc|desc)$/,
      page: /^\d{1,3}$/,
      "vote_count.gte": /^\d{1,6}$/,
      with_genres: /^\d{1,5}([,|]\d{1,5}){0,10}$/,
      "vote_average.gte": /^(10(\.0)?|[0-9](\.[0-9])?)$/,
    };
    for (const [key, pattern] of Object.entries(allowed)) {
      const value = incoming.searchParams.get(key);
      if (value === null) continue;
      if (!pattern.test(value)) return Response.json({ error: "Parametro non valido." }, { status: 400 });
      upstream.searchParams.set(key, value);
    }
  }

  try {
    const response = await fetch(upstream, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      return Response.json({ error: response.status === 401 || response.status === 403
        ? "Credenziale TMDB non valida. Verifica la configurazione Netlify."
        : "TMDB non è disponibile. Riprova più tardi." }, { status: 502 });
    }
    const data = await response.json();
    return Response.json(data, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch {
    return Response.json({ error: "Impossibile contattare TMDB. Riprova più tardi." }, { status: 502 });
  }
}

export const config: Config = { path: "/api/tmdb/*" };
