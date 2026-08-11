"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createSession, facilitatorLogin } from "@/lib/clientApi";

export default function FacilitatorLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !password) {
      setError("Inserisci nome e password.");
      return;
    }
    setLoading(true);
    try {
      await facilitatorLogin(name.trim(), password);

      const savedCode = localStorage.getItem("ifab_ws_facilitator_code");
      if (savedCode) {
        router.push(`/facilitator/${savedCode}`);
        return;
      }

      const { meta } = await createSession();
      localStorage.setItem("ifab_ws_facilitator_code", meta.code);
      router.push(`/facilitator/${meta.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ifab-navy px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ifab-navy/10">
            <ShieldCheck className="text-ifab-navy" size={22} />
          </div>
          <h1 className="text-xl font-semibold text-ifab-navy">Accesso Facilitatore</h1>
          <p className="mt-1 text-sm text-ifab-text-muted">Workshop AI Adoption — IFAB Foundation</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-ifab-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ifab-navy-deep disabled:opacity-60"
          >
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}
