"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Save, TrendingUp } from "lucide-react";
import { INITIAL_MESSAGE_STEP2, TOP_ATTIVITA_COUNT, labelForActivity } from "@/config/block1Flow";
import {
  AttivitaEffort,
  ChatMessage,
  FrequenzaPeriodo,
  Step1Submission,
  Step2Submission,
  oreAnnue,
} from "@/lib/types";
import { submitStep2 } from "@/lib/clientApi";
import { nowMs } from "@/lib/time";
import AgentChat from "./AgentChat";
import AssistantPanel from "./AssistantPanel";

const PERIODI: { value: FrequenzaPeriodo; label: string }[] = [
  { value: "giorno", label: "al giorno" },
  { value: "settimana", label: "a settimana" },
  { value: "mese", label: "al mese" },
  { value: "anno", label: "all'anno" },
];

/** Valori a schermo come stringhe: permette il campo vuoto mentre si digita. */
type EffortDraft = { durata: string; frequenza: string; periodo: FrequenzaPeriodo; persone: string };

function toDraft(effort?: AttivitaEffort): EffortDraft {
  return {
    durata: effort?.durataMinuti != null ? String(effort.durataMinuti) : "",
    frequenza: effort?.frequenzaNumero != null ? String(effort.frequenzaNumero) : "",
    periodo: effort?.frequenzaPeriodo ?? "settimana",
    persone: effort?.persone != null ? String(effort.persone) : "",
  };
}

function toEffort(draft: EffortDraft): AttivitaEffort {
  const num = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  return {
    durataMinuti: num(draft.durata),
    frequenzaNumero: num(draft.frequenza),
    frequenzaPeriodo: draft.periodo,
    persone: num(draft.persone),
  };
}

/**
 * Step 2 — quanto tempo assorbe ciascuna attività. La stima è un form numerico
 * (non una chat) perché il tempo si calcola: durata × frequenza annua × persone.
 * L'assistente resta a fianco per aiutare a stimare i valori mancanti.
 */
export default function Step2Effort({
  code,
  participantId,
  step1,
  step2,
  locked,
  onSaved,
}: {
  code: string;
  participantId: string;
  step1?: Step1Submission;
  step2?: Step2Submission;
  locked: boolean;
  onSaved: (data: Step2Submission) => void;
}) {
  // Identità stabile fra un polling e l'altro: senza questo ogni aggiornamento
  // di stato dal server farebbe ripartire il timer dell'autosalvataggio.
  const attivitaKey = (step1?.attivitaSelezionate ?? []).join("|");
  const attivita = useMemo(() => (attivitaKey ? attivitaKey.split("|") : []), [attivitaKey]);

  const [drafts, setDrafts] = useState<Record<string, EffortDraft>>(() => {
    const initial: Record<string, EffortDraft> = {};
    for (const key of attivita) initial[key] = toDraft(step2?.effort?.[key]);
    return initial;
  });
  const [manualTop, setManualTop] = useState<string[]>(step2?.topAttivita ?? []);
  const [touchedTop, setTouchedTop] = useState((step2?.topAttivita ?? []).length > 0);
  const [chatLog, setChatLog] = useState<ChatMessage[]>(step2?.chatLog ?? []);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(step2?.completedAt ?? null);
  const [draftState, setDraftState] = useState<"idle" | "saving" | "saved">(
    step2?.updatedAt || step2?.completedAt ? "saved" : "idle"
  );

  const dirtyRef = useRef(false);
  const pendingRef = useRef<Step2Submission | null>(null);
  const onSavedRef = useRef(onSaved);

  // Classifica per ore/anno: è la proposta automatica delle attività più onerose.
  const ranked = useMemo(
    () =>
      attivita
        .map((key) => ({ key, ore: oreAnnue(toEffort(drafts[key] ?? toDraft())) }))
        .sort((a, b) => (b.ore ?? -1) - (a.ore ?? -1)),
    [attivita, drafts]
  );
  const computedTop = useMemo(
    () =>
      ranked
        .filter((r) => r.ore !== null)
        .slice(0, TOP_ATTIVITA_COUNT)
        .map((r) => r.key),
    [ranked]
  );
  const effectiveTop = useMemo(
    () => (touchedTop ? manualTop : computedTop),
    [touchedTop, manualTop, computedTop]
  );

  function buildPayload(extra?: Partial<Step2Submission>): Step2Submission {
    const effort: Record<string, AttivitaEffort> = {};
    for (const key of attivita) effort[key] = toEffort(drafts[key] ?? toDraft());
    return { effort, topAttivita: effectiveTop, chatLog, ...extra };
  }

  useEffect(() => {
    onSavedRef.current = onSaved;
  });

  useEffect(() => {
    if (locked) return;
    const effort: Record<string, AttivitaEffort> = {};
    for (const key of attivita) effort[key] = toEffort(drafts[key] ?? toDraft());
    const draft: Step2Submission = { effort, topAttivita: effectiveTop, chatLog };
    pendingRef.current = draft;
    if (!dirtyRef.current) return;

    const timer = setTimeout(async () => {
      dirtyRef.current = false;
      setDraftState("saving");
      try {
        const payload: Step2Submission = { ...draft, updatedAt: nowMs() };
        await submitStep2(code, participantId, payload);
        onSavedRef.current(payload);
        setDraftState("saved");
      } catch {
        dirtyRef.current = true;
        setDraftState("idle");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [locked, drafts, effectiveTop, chatLog, attivita, code, participantId]);

  useEffect(() => {
    return () => {
      const pending = pendingRef.current;
      if (!dirtyRef.current || !pending) return;
      dirtyRef.current = false;
      void submitStep2(code, participantId, { ...pending, updatedAt: nowMs() });
    };
  }, [code, participantId]);

  function updateDraft(key: string, patch: Partial<EffortDraft>) {
    dirtyRef.current = true;
    setDraftState("idle");
    setDrafts((prev) => ({ ...prev, [key]: { ...toDraft(), ...prev[key], ...patch } }));
  }

  function toggleTop(key: string) {
    dirtyRef.current = true;
    setDraftState("idle");
    setTouchedTop(true);
    setManualTop((prev) => {
      const base = touchedTop ? prev : computedTop;
      if (base.includes(key)) return base.filter((k) => k !== key);
      if (base.length >= TOP_ATTIVITA_COUNT) return base;
      return [...base, key];
    });
  }

  function resetTop() {
    dirtyRef.current = true;
    setTouchedTop(false);
    setManualTop([]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      dirtyRef.current = false;
      const payload = buildPayload({ updatedAt: nowMs(), completedAt: nowMs() });
      await submitStep2(code, participantId, payload);
      onSaved(payload);
      setSavedAt(nowMs());
      setDraftState("saved");
    } finally {
      setSaving(false);
    }
  }

  async function handleChatUpdate(newLog: ChatMessage[]) {
    setChatLog(newLog);
    const payload: Step2Submission = { chatLog: newLog, updatedAt: nowMs() };
    await submitStep2(code, participantId, payload);
    onSaved(payload);
  }

  if (attivita.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ifab-border bg-white p-8 text-center text-sm text-ifab-text-muted">
        Prima seleziona le tue attività nello Step 1: qui stimerai quanto tempo assorbono.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h2 className="mb-1 text-lg font-semibold text-ifab-navy">Step 2 · Quanto tempo assorbono?</h2>
        <p className="text-sm text-ifab-text-muted">
          Per ogni attività indica durata media di una esecuzione, ogni quanto si ripete e quante persone la
          svolgono. Il tempo assorbito dall&apos;organizzazione è il prodotto dei tre: durata × frequenza ×
          persone. Se non hai i dati precisi, stima un ordine di grandezza con l&apos;assistente.
        </p>
      </section>

      <div className="overflow-x-auto rounded-xl border border-ifab-border bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ifab-border text-xs text-ifab-text-muted">
              <th className="px-4 py-2.5">Attività</th>
              <th className="px-3 py-2.5">Durata (min)</th>
              <th className="px-3 py-2.5">Frequenza</th>
              <th className="px-3 py-2.5">Persone</th>
              <th className="px-4 py-2.5 text-right">Ore/anno</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map(({ key, ore }) => {
              const draft = drafts[key] ?? toDraft();
              const isTop = effectiveTop.includes(key);
              return (
                <tr key={key} className={`border-b border-ifab-border last:border-0 ${isTop ? "bg-ifab-blue/5" : ""}`}>
                  <td className="px-4 py-2.5 font-medium text-ifab-text">
                    {labelForActivity(key)}
                    {isTop && (
                      <span className="ml-2 rounded-full bg-ifab-blue/10 px-2 py-0.5 text-[10px] font-medium text-ifab-blue">
                        fra le più onerose
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      disabled={locked}
                      inputMode="decimal"
                      value={draft.durata}
                      onChange={(e) => updateDraft(key, { durata: e.target.value })}
                      placeholder="es. 20"
                      className="w-24 rounded-lg border border-ifab-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        disabled={locked}
                        inputMode="decimal"
                        value={draft.frequenza}
                        onChange={(e) => updateDraft(key, { frequenza: e.target.value })}
                        placeholder="es. 30"
                        className="w-20 rounded-lg border border-ifab-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
                      />
                      <select
                        disabled={locked}
                        value={draft.periodo}
                        onChange={(e) => updateDraft(key, { periodo: e.target.value as FrequenzaPeriodo })}
                        className="rounded-lg border border-ifab-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
                      >
                        {PERIODI.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      disabled={locked}
                      inputMode="decimal"
                      value={draft.persone}
                      onChange={(e) => updateDraft(key, { persone: e.target.value })}
                      placeholder="es. 3"
                      className="w-20 rounded-lg border border-ifab-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-ifab-navy">
                    {ore !== null ? `${Math.round(ore).toLocaleString("it-IT")} h` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="rounded-xl border border-ifab-border bg-white p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ifab-blue-dark">
          <TrendingUp size={15} /> Le {TOP_ATTIVITA_COUNT} attività che assorbono più tempo
        </h3>
        <p className="mt-1 text-xs text-ifab-text-muted">
          {touchedTop
            ? "Selezione manuale: tocca le attività per cambiarla."
            : "Proposta calcolata dalle ore/anno. Puoi cambiarla toccando le attività."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ranked.map(({ key }) => {
            const isTop = effectiveTop.includes(key);
            return (
              <button
                key={key}
                type="button"
                disabled={locked}
                onClick={() => toggleTop(key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                  isTop
                    ? "border-ifab-blue bg-ifab-blue text-white"
                    : "border-ifab-border bg-ifab-bg-soft text-ifab-text hover:border-ifab-blue"
                }`}
              >
                {labelForActivity(key)}
              </button>
            );
          })}
        </div>
        {touchedTop && (
          <button
            type="button"
            onClick={resetTop}
            className="mt-3 text-xs text-ifab-text-muted underline transition hover:text-ifab-navy"
          >
            Torna alla proposta calcolata
          </button>
        )}
        <p className="mt-3 text-xs text-ifab-text-muted">
          Queste attività sono quelle di cui approfondirai le caratteristiche nello Step 3.
        </p>
      </section>

      <AssistantPanel title="Assistente AI" subtitle="Aiuto a stimare durata, frequenza e persone">
        <AgentChat
          variant="panel"
          subsection="step2"
          context={{ selectedActivityLabels: attivita.map(labelForActivity) }}
          initialMessage={INITIAL_MESSAGE_STEP2}
          initialChatLog={chatLog}
          onUpdate={handleChatUpdate}
          disabled={locked}
        />
      </AssistantPanel>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={locked || saving || effectiveTop.length === 0}
          className="flex items-center gap-2 rounded-lg bg-ifab-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-ifab-navy-deep disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Salvataggio..." : "Conferma le attività più onerose"}
        </button>
        {savedAt && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 size={14} /> Salvato
          </span>
        )}
        {!savedAt && draftState !== "idle" && (
          <span className="text-xs text-ifab-text-muted">
            {draftState === "saving" ? "Salvataggio bozza..." : "Bozza salvata — la ritrovi al rientro"}
          </span>
        )}
      </div>
    </div>
  );
}
