// Vincitori del premio principale. year = anno della cerimonia/festival; filmYear = anno di uscita del film.
// Elenco curato a mano: verificare e completare le voci mancanti (es. 2026, David 2022, Sundance 2024-2026).
export type AwardEntry = { award: string; year: number; title: string; filmYear: number };
export const AWARD_LABELS: Record<string, string> = {
  oscar: "Oscar - Miglior film", cannes: "Palma d'Oro", venice: "Leone d'Oro",
  berlin: "Orso d'Oro", donatello: "David - Miglior film", sundance: "Sundance - Grand Jury Prize",
};
export const AWARDS: AwardEntry[] = [
  { award: "oscar", year: 2022, title: "CODA", filmYear: 2021 },
  { award: "oscar", year: 2023, title: "Everything Everywhere All at Once", filmYear: 2022 },
  { award: "oscar", year: 2024, title: "Oppenheimer", filmYear: 2023 },
  { award: "oscar", year: 2025, title: "Anora", filmYear: 2024 },
  { award: "cannes", year: 2022, title: "Triangle of Sadness", filmYear: 2022 },
  { award: "cannes", year: 2023, title: "Anatomy of a Fall", filmYear: 2023 },
  { award: "cannes", year: 2024, title: "Anora", filmYear: 2024 },
  { award: "cannes", year: 2025, title: "It Was Just an Accident", filmYear: 2025 },
  { award: "venice", year: 2022, title: "All the Beauty and the Bloodshed", filmYear: 2022 },
  { award: "venice", year: 2023, title: "Poor Things", filmYear: 2023 },
  { award: "venice", year: 2024, title: "The Room Next Door", filmYear: 2024 },
  { award: "venice", year: 2025, title: "Father Mother Sister Brother", filmYear: 2025 },
  { award: "berlin", year: 2022, title: "Alcarràs", filmYear: 2022 },
  { award: "berlin", year: 2023, title: "On the Adamant", filmYear: 2023 },
  { award: "berlin", year: 2024, title: "Dahomey", filmYear: 2024 },
  { award: "berlin", year: 2025, title: "Dreams", filmYear: 2025 },
  { award: "donatello", year: 2024, title: "C'è ancora domani", filmYear: 2023 },
  { award: "donatello", year: 2025, title: "Vermiglio", filmYear: 2024 },
  { award: "sundance", year: 2022, title: "Nanny", filmYear: 2022 },
  { award: "sundance", year: 2023, title: "A Thousand and One", filmYear: 2023 },
];
