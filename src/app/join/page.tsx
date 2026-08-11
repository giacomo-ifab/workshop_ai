"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { joinSession } from "@/lib/clientApi";
import { Users } from "lucide-react";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code")?.toUpperCase() ?? "");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim() || !name.trim()) {
      setError("Inserisci sia il codice sessione che il tuo nome.");
      return;
    }
    setLoading(true);
    try {
      const normalizedCode = code.trim().toUpperCase();
      const { participant } = await joinSession(normalizedCode, name.trim());
      localStorage.setItem(
        "ifab_ws_participant",
        JSON.stringify({ code: normalizedCode, participantId: participant.participantId, name: participant.name })
      );
      router.push(`/session/${normalizedCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ifab-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ifab-border bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ifab-blue/10">
            <Users className="text-ifab-blue" size={22} />
          </div>
          <h1 className="text-xl font-semibold text-ifab-navy">Workshop AI Adoption</h1>
          <p className="mt-1 text-sm text-ifab-text-muted">
            Inserisci il codice sessione fornito dal facilitatore e il tuo nome per partecipare.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">Codice sessione</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Es. K7P2QX"
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-ifab-blue"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">Il tuo nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome e cognome"
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue"
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-ifab-text-muted">
              Se rientri con lo stesso nome ritroverai i dati già inseriti.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-ifab-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ifab-blue-dark disabled:opacity-60"
          >
            {loading ? "Accesso in corso..." : "Entra nel workshop"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
