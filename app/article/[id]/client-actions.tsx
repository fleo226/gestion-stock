"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supprimerArticle } from "@/lib/actions";

export default function SupprimerBouton({ id }: { id: string }) {
  const [confirmation, setConfirmation] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!confirmation) {
    return (
      <button
        onClick={() => setConfirmation(true)}
        className="p-2 rounded-lg text-ink-soft hover:text-danger hover:bg-danger/10"
        aria-label="Supprimer"
        title="Supprimer l'article"
      >
        <Trash2 size={18} />
      </button>
    );
  }

  return (
    <div className="flex gap-1 items-center">
      <button
        onClick={() => startTransition(async () => {
          await supprimerArticle(id);
          router.push("/");
        })}
        disabled={pending}
        className="px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-semibold active:scale-95 disabled:opacity-60"
      >
        {pending ? <Loader2 size={13} className="animate-spin" /> : "Confirmer"}
      </button>
      <button
        onClick={() => setConfirmation(false)}
        className="px-3 py-1.5 rounded-lg text-ink-soft text-xs font-medium hover:bg-black/5"
      >
        Annuler
      </button>
    </div>
  );
}