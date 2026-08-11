"use client";

import { startTransition, use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Lock, LockOpen, LogOut, Users, Copy, FileDown } from "lucide-react";
import { facilitatorMe, facilitatorLogout, fetchState, fetchAggregate, unlockStep } from "@/lib/clientApi";
import { clearFacilitatorCode, saveFacilitatorCode } from "@/lib/participantStorage";
import { CATEGORIES, STEP_B_CONFIG } from "@/config/block1Flow";
import { Participant, Submission, StepBKey, UnlockedSteps, DEFAULT_UNLOCKED_STEPS } from "@/lib/types";

const POLL_MS = 4000;

const STEP_ORDER: { key: keyof UnlockedSteps; label: string }[] = [
  { key: "A", label: "A · Identifica il processo" },
  { key: "variabilita", label: "B1 · Variabilità" },
  { key: "dati", label: "B2 · Disponibilità e qualità dei dati" },
  { key: "docStandard", label: "B3 · Documenti standard" },
  { key: "criteri", label: "B4 · Criteri e regole definite" },
  { key: "C", label: "C · Output" },
];

export default function FacilitatorDashboard({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [facilitatorName, setFacilitatorName] = useState("");
  const [unlockedSteps, setUnlockedSteps] = useState<UnlockedSteps>(DEFAULT_UNLOCKED_STEPS);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [rows, setRows] = useState<{ participant: Participant; submission: Submission }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionMissing, setSessionMissing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    facilitatorMe()
      .then((me) => {
        if (!me.authenticated) throw new Error("not-auth");
        setFacilitatorName(me.name);
        setAuthChecked(true);
        // Sessione effettivamente aperta: diventa quella proposta al prossimo rientro,
        // anche se ci si è arrivati da un link invece che dal selettore.
        saveFacilitatorCode(code);
      })
      .catch(() => router.replace("/facilitator/login"));
  }, [router, code]);

  const poll = useCallback(async () => {
    try {
      const state = await fetchState(code);
      setUnlockedSteps(state.meta.unlockedSteps);
      const agg = await fetchAggregate(code);
      setParticipants(agg.rows.map((r) => r.participant));
      setRows(agg.rows);
      setError(null);
      setSessionMissing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore di caricamento";
      // Sessione scaduta o codice non più valido: da qui si torna al selettore
      // invece di restare su una dashboard che non aggiornerà mai nulla.
      setSessionMissing(/non valido|scadut/i.test(message));
      setError(message);
    }
  }, [code]);

  useEffect(() => {
    if (!authChecked) return;
    startTransition(() => {
      void poll();
    });
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [authChecked, poll]);

  async function toggleStep(step: keyof UnlockedSteps) {
    const next = !unlockedSteps[step];
    setUnlockedSteps((prev) => ({ ...prev, [step]: next }));
    await unlockStep(code, step, next);
  }

  async function handleLogout() {
    await facilitatorLogout();
    clearFacilitatorCode();
    router.replace("/facilitator/login");
  }

  function copyJoinLink() {
    const url = `${window.location.origin}/join?code=${code}`;
    navigator.clipboard.writeText(url);
  }

  async function handleExportPdf() {
    if (!printRef.current) return;
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);
    const canvas = await html2canvas(printRef.current, { backgroundColor: "#ffffff", scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 48;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.text(`Workshop AI Adoption — Sessione ${code}`, 24, 28);
    pdf.addImage(imgData, "PNG", 24, 40, imgWidth, imgHeight);
    pdf.save(`workshop-ai-adoption-sessione-${code}.pdf`);
  }

  if (!authChecked) return null;

  const activityCounts = CATEGORIES.flatMap((c) => c.activities).map((act) => ({
    attivita: act.label,
    conteggio: rows.filter((r) => r.submission.stepA?.attivitaSelezionate?.includes(act.key)).length,
  }));

  return (
    <div className="min-h-screen bg-ifab-navy">
      <header className="border-b border-white/10 bg-ifab-navy-deep px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/60">Facilitatore · {facilitatorName}</p>
            <h1 className="text-lg font-semibold text-white">Workshop AI Adoption — Blocco 1</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={copyJoinLink}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              title="Copia link di partecipazione"
            >
              <Copy size={15} /> Codice: <span className="font-mono tracking-widest">{code}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition hover:text-white"
            >
              <LogOut size={15} /> Esci
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        {error && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
            <span>{error}</span>
            {sessionMissing && (
              <button
                onClick={() => {
                  clearFacilitatorCode();
                  router.replace("/facilitator/login");
                }}
                className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-800"
              >
                Scegli un&apos;altra sessione
              </button>
            )}
          </div>
        )}

        <section className="mb-6 rounded-xl bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-ifab-navy">Sblocca gli step</h2>
          <div className="flex flex-wrap gap-2">
            {STEP_ORDER.map((s) => {
              const unlocked = unlockedSteps[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => toggleStep(s.key)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    unlocked
                      ? "border-ifab-blue bg-ifab-blue text-white"
                      : "border-ifab-border bg-white text-ifab-text hover:border-ifab-blue"
                  }`}
                >
                  {unlocked ? <LockOpen size={14} /> : <Lock size={14} />}
                  {s.label}
                </button>
              );
            })}
          </div>
        </section>

        <div ref={printRef} className="rounded-xl bg-white p-5">
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ifab-navy">
                <Users size={16} /> Partecipanti ({participants.length})
              </h2>
              <button
                onClick={handleExportPdf}
                className="flex items-center gap-2 rounded-lg border border-ifab-navy px-3 py-1.5 text-xs font-semibold text-ifab-navy transition hover:bg-ifab-navy hover:text-white"
              >
                <FileDown size={14} /> Esporta PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ifab-border text-ifab-text-muted">
                    <th className="py-2 pr-4">Nome</th>
                    <th className="py-2 pr-4">Processo</th>
                    <th className="py-2 pr-4">Step A</th>
                    <th className="py-2 pr-4">Step B</th>
                    <th className="py-2 pr-4">Output</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ participant, submission }) => {
                    const bDone = (Object.keys(STEP_B_CONFIG) as StepBKey[]).filter(
                      (k) => submission.stepB?.[k]?.completedAt
                    ).length;
                    return (
                      <tr key={participant.participantId} className="border-b border-ifab-border">
                        <td className="py-2 pr-4 font-medium text-ifab-text">{participant.name}</td>
                        <td className="py-2 pr-4 text-ifab-text-muted">{submission.stepA?.processo || "—"}</td>
                        <td className="py-2 pr-4">{submission.stepA?.completedAt ? "✅" : "—"}</td>
                        <td className="py-2 pr-4">{bDone}/4</td>
                        <td className="py-2 pr-4">{submission.stepC?.sintesi ? "✅" : "—"}</td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-ifab-text-muted">
                        Nessun partecipante ancora connesso.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-ifab-navy">Distribuzione attività selezionate</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityCounts} layout="vertical" margin={{ left: 24, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="attivita" width={180} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="conteggio" fill="#1b98e0" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
