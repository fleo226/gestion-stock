// Type pour les valeurs de classe acceptées par cn()
export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

/**
 * Fusionne des classes CSS conditionnelles.
 * Usage : cn("base", isActive && "active", { "text-red": hasError })
 *
 * Implémentation sans dépendance externe (pas de clsx ni tailwind-merge).
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  const process = (input: ClassValue) => {
    if (!input) return;

    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input));
      return;
    }

    if (Array.isArray(input)) {
      input.forEach(process);
      return;
    }

    if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  };

  inputs.forEach(process);
  return classes.join(" ");
}