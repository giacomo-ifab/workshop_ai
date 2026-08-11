"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import {
  ACTIVITY_DESCRIPTIONS,
  AREE_FUNZIONALI,
  CATEGORIES,
  INITIAL_MESSAGE_STEP1,
  labelForActivity,
} from "@/config/block1Flow";
import { ChatMessage, Step1Submission } from "@/lib/types";
import { submitStep1 } from "@/lib/clientApi";
import { nowMs } from "@/lib/time";
import AgentChat from "./AgentChat";
import AssistantPanel from "./AssistantPanel";

/**
 * Step 1 — l'utente sceglie, da un elenco raggruppato per tipologia, le attività
 * che svolge nei propri processi. Selezione multipla; l'assistente a fianco
 * spiega che cosa si intende per ciascuna voce.
 */
export default function Step1Activities({
  code,
  participantId,
  data,
  locked,
  onSaved,
}: {
  code: string;
  participantId: string;
  data?: Step1Submission;
  locked: boolean;
  onSaved: (data: Step1Submission) => void;
}) {
  const [dipartimento, setDipartimento] = useState(data?.dipartimento ?? "");
  const [areaFunzionale, setAreaFunzionale] = useState(data?.areaFunzionale ?? "");
  const [selected, setSelected] = useState<string[]>(data?.attivitaSelezionate ?? []);
  const [chatLog, setChatLog] = useState<ChatMessage[]>(data?.chatLog ?? []);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(data?.completedAt ?? null);
  const [draftState, setDraftState] = useState<"idle" | "saving" | "saved">(
    data?.updatedAt || data?.completedAt ? "saved" : "idle"
  );

  const dirtyRef = useRef(false);
  const pendingRef = useRef<Step1Submission | null>(null);
  const onSavedRef = useRef(onSaved);

  useEffect(() => {
    onSavedRef.current = onSaved;
  });

  // Autosalvataggio della bozza: al rientro nella sessione si ritrova tutto.
  useEffect(() => {
    if (locked) return;
    const draft: Step1Submission = { dipartimento, areaFunzionale, attivitaSelezionate: selected, chatLog };
    pendingRef.current = draft;
    if (!dirtyRef.current) return;

    const timer = setTimeout(async () => {
      dirtyRef.current = false;
      setDraftState("saving");
      try {
        const payload: Step1Submission = { ...draft, updatedAt: nowMs() };
        await submitStep1(code, participantId, payload);
        onSavedRef.current(payload);
        setDraftState("saved");
      } catch {
        dirtyRef.current = true;
        setDraftState("idle");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [locked, dipartimento, areaFunzionale, selected, chatLog, code, participantId]);

  useEffect(() => {
    return () => {
      const pending = pendingRef.current;
      if (!dirtyRef.current || !pending) return;
      dirtyRef.current = false;
      void submitStep1(code, participantId, { ...pending, updatedAt: nowMs() });
    };
  }, [code, participantId]);

  function markDirty() {
    dirtyRef.current = true;
    setDraftState("idle");
  }

  function toggleActivity(key: string) {
    if (locked) return;
    markDirty();
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function handleSave() {
    setSaving(true);
    try {
      dirtyRef.current = false;
      const payload: Step1Submission = {
        dipartimento,
        areaFunzionale,
        attivitaSelezionate: selected,
        chatLog,
        updatedAt: nowMs(),
        completedAt: nowMs(),
      };
      await submitStep1(code, participantId, payload);
      onSaved(payload);
      setSavedAt(nowMs());
      setDraftState("saved");
    } finally {
      setSaving(false);
    }
  }

  async function handleChatUpdate(newLog: ChatMessage[]) {
    setChatLog(newLog);
    const payload: Step1Submission = { chatLog: newLog, updatedAt: nowMs() };
    await submitStep1(code, participantId, payload);
    onSaved(payload);
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-1 text-lg font-semibold text-ifab-navy">Step 1 · Quali attività svolgi?</h2>
        <p className="text-sm text-ifab-text-muted">
          Seleziona tutte le attività che riconosci nel tuo lavoro quotidiano: puoi sceglierne più di una. Se una
          voce non ti è chiara, chiedi all&apos;assistente nel pannello a destra.
        </p>
        <p className="mt-2 text-xs text-ifab-text-muted">Attività selezionate: {selected.length}</p>
      </section>

      <section className="rounded-xl border border-ifab-border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-ifab-blue-dark">Contesto</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">Nome dipartimento</label>
            <input
              disabled={locked}
              value={dipartimento}
              onChange={(e) => {
                markDirty();
                setDipartimento(e.target.value);
              }}
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">Area funzionale</label>
            <select
              disabled={locked}
              value={areaFunzionale}
              onChange={(e) => {
                markDirty();
                setAreaFunzionale(e.target.value);
              }}
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
            >
              <option value="">Seleziona...</option>
              {AREE_FUNZIONALI.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="rounded-xl border border-ifab-border bg-white p-4">
            <h3 className="text-sm font-semibold text-ifab-blue-dark">{cat.label}</h3>
            <p className="mt-1 text-xs text-ifab-text-muted">{cat.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cat.activities.map((act) => {
                const isSelected = selected.includes(act.key);
                return (
                  <button
                    key={act.key}
                    type="button"
                    disabled={locked}
                    title={ACTIVITY_DESCRIPTIONS[act.key]}
                    onClick={() => toggleActivity(act.key)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                      isSelected
                        ? "border-ifab-blue bg-ifab-blue text-white"
                        : "border-ifab-border bg-ifab-bg-soft text-ifab-text hover:border-ifab-blue"
                    }`}
                  >
                    {act.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AssistantPanel title="Assistente AI" subtitle="Che cosa si intende per ciascuna attività">
        <AgentChat
          variant="panel"
          subsection="step1"
          context={{ selectedActivityLabels: selected.map(labelForActivity) }}
          initialMessage={INITIAL_MESSAGE_STEP1}
          initialChatLog={chatLog}
          onUpdate={handleChatUpdate}
          disabled={locked}
        />
      </AssistantPanel>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={locked || saving || selected.length === 0}
          className="flex items-center gap-2 rounded-lg bg-ifab-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-ifab-navy-deep disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Salvataggio..." : "Conferma selezione"}
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
