// Configurazione dei premi: etichette inglesi usate per trovare gli elementi su Wikidata.
export type Group = "film" | "director" | "acting" | "screenplay" | "international" | "jury";
export type Category = { group: Group; labels: string[] };
export type Festival = { name: string; nominations: boolean; yearOffset: number; categories: Category[] };

export const FESTIVALS: Record<string, Festival> = {
  oscar: {
    name: "Oscar", nominations: true, yearOffset: 1,
    categories: [
      { group: "film", labels: ["Academy Award for Best Picture"] },
      { group: "director", labels: ["Academy Award for Best Director"] },
      { group: "acting", labels: ["Academy Award for Best Actor", "Academy Award for Best Actress"] },
      { group: "screenplay", labels: ["Academy Award for Best Original Screenplay", "Academy Award for Best Adapted Screenplay"] },
      { group: "international", labels: ["Academy Award for Best International Feature Film"] },
    ],
  },
  cannes: {
    name: "Cannes", nominations: false, yearOffset: 0,
    categories: [
      { group: "film", labels: ["Palme d'Or"] },
      { group: "jury", labels: ["Grand Prix", "Jury Prize", "Cannes Film Festival Grand Prix", "Cannes Film Festival Jury Prize"] },
      { group: "director", labels: ["Best Director Award", "Cannes Film Festival Award for Best Director"] },
      { group: "acting", labels: ["Best Actor Award", "Best Actress Award", "Cannes Film Festival Award for Best Actor", "Cannes Film Festival Award for Best Actress"] },
      { group: "screenplay", labels: ["Best Screenplay Award", "Cannes Film Festival Award for Best Screenplay"] },
    ],
  },
  venice: {
    name: "Venezia", nominations: false, yearOffset: 0,
    categories: [
      { group: "film", labels: ["Golden Lion"] },
      { group: "jury", labels: ["Grand Jury Prize", "Silver Lion", "Special Jury Prize"] },
      { group: "director", labels: ["Silver Lion for Best Director", "Silver Lion"] },
      { group: "acting", labels: ["Volpi Cup for Best Actor", "Volpi Cup for Best Actress"] },
      { group: "screenplay", labels: ["Golden Osella for Best Screenplay", "Golden Osella"] },
    ],
  },
  berlin: {
    name: "Berlino", nominations: false, yearOffset: 0,
    categories: [
      { group: "film", labels: ["Golden Bear"] },
      { group: "jury", labels: ["Silver Bear Grand Jury Prize", "Silver Bear Jury Prize"] },
      { group: "director", labels: ["Silver Bear for Best Director"] },
      { group: "acting", labels: ["Silver Bear for Best Leading Performance", "Silver Bear for Best Supporting Performance", "Silver Bear for Best Actor", "Silver Bear for Best Actress"] },
      { group: "screenplay", labels: ["Silver Bear for Best Screenplay"] },
    ],
  },
  donatello: {
    name: "David", nominations: true, yearOffset: 1,
    categories: [
      { group: "film", labels: ["David di Donatello for Best Film"] },
      { group: "director", labels: ["David di Donatello for Best Director"] },
      { group: "acting", labels: ["David di Donatello for Best Actor", "David di Donatello for Best Actress"] },
      { group: "screenplay", labels: ["David di Donatello for Best Screenplay", "David di Donatello for Best Original Screenplay", "David di Donatello for Best Adapted Screenplay"] },
    ],
  },
  sundance: {
    name: "Sundance", nominations: false, yearOffset: 0,
    categories: [
      { group: "film", labels: ["Grand Jury Prize", "Sundance Grand Jury Prize", "Sundance Film Festival Grand Jury Prize"] },
      { group: "jury", labels: ["Audience Award", "Sundance Audience Award"] },
    ],
  },
};
