// Formatage des montants en FCFA (utilisable côté serveur et côté client)
export function fcfa(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F";
}

export function dateCourte(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function dateHeure(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return (
    date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) +
    " · " +
    date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
}