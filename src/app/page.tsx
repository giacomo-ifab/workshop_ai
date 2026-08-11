import Link from "next/link";
import { Users, ShieldCheck } from "lucide-react";
import ResumeCard from "@/components/ResumeCard";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-ifab-bg px-4">
      <div className="w-full max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-ifab-blue">IFAB Foundation</p>
        <h1 className="mt-2 text-3xl font-bold text-ifab-navy">Workshop AI Adoption</h1>
        <p className="mt-3 text-sm text-ifab-text-muted">
          Blocco 1 — Identificazione Opportunità: scopri e caratterizza i processi candidati all&apos;adozione dell&apos;AI.
        </p>

        <ResumeCard />

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/join"
            className="flex flex-col items-center gap-3 rounded-2xl border border-ifab-border bg-white p-8 shadow-sm transition hover:border-ifab-blue hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ifab-blue/10">
              <Users className="text-ifab-blue" size={22} />
            </div>
            <span className="text-base font-semibold text-ifab-navy">Sono un partecipante</span>
            <span className="text-xs text-ifab-text-muted">Entra con il codice sessione e il tuo nome</span>
          </Link>

          <Link
            href="/facilitator/login"
            className="flex flex-col items-center gap-3 rounded-2xl border border-ifab-border bg-white p-8 shadow-sm transition hover:border-ifab-navy hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ifab-navy/10">
              <ShieldCheck className="text-ifab-navy" size={22} />
            </div>
            <span className="text-base font-semibold text-ifab-navy">Sono il facilitatore</span>
            <span className="text-xs text-ifab-text-muted">Crea la sessione e guida il workshop passo a passo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
