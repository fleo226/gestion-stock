// Formatage des montants en FCFA (utilisable côté serveur et côté client)
export function fcfa(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F";
}

// Alias pour compatibilité
export const formatFCFA = fcfa;

export function formatPhone(phone: string): string {
  // Format: +226 70 12 34 56 ou 22670123456 -> +226 70 12 34 56
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('226') && cleaned.length === 11) {
    return `+226 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
  }
  if (cleaned.length === 8) {
    return `+226 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
  }
  return phone;
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