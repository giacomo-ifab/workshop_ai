"use client";

import { useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { CATEGORIES, AREE_FUNZIONALI, INITIAL_MESSAGE_STEP_A } from "@/config/block1Flow";
import { ChatMessage, StepASubmission } from "@/lib/types";
import { submitStepA } from "@/lib/clientApi";
import { nowMs } from "@/lib/time";
import AgentChat from "./AgentChat";

const ALL_ACTIVITIES = CATEGORIES.flatMap((c) => c.activities);

function labelForActivity(key: string): string {
  return ALL_ACTIVITIES.find((a) => a.key === key)?.label ?? key;
}

export default function StepA({
  code,
  participantId,
  initialData,
  locked,
  onSaved,
}: {
  code: string;
  participantId: string;
  initialData?: StepASubmission;
  locked: boolean;
  onSaved: (data: StepASubmission) => void;
}) {
  const [dipartimento, setDipartimento] = useState(initialData?.dipartimento ?? "");
  const [areaFunzionale, setAreaFunzionale] = useState(initialData?.areaFunzionale ?? "");
  const [selected, setSelected] = useState<string[]>(initialData?.attivitaSelezionate ?? []);
  const [processo, setProcesso] = useState(initialData?.processo ?? "");
  const [attivitaStrumenti, setAttivitaStrumenti] = useState(initialData?.attivitaStrumenti ?? "");
  const [descrizione, setDescrizione] = useState(initialData?.descrizione ?? "");
  const [fteDurata, setFteDurata] = useState(initialData?.fteDurata ?? "");
  const [fteFrequenza, setFteFrequenza] = useState(initialData?.fteFrequenza ?? "");
  const [ftePersone, setFtePersone] = useState(initialData?.ftePersone ?? "");
  const [chatLog, setChatLog] = useState<ChatMessage[]>(initialData?.chatLog ?? []);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(initialData?.completedAt ?? null);

  function toggleActivity(key: string) {
    if (locked) return;
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function persist(extra?: Partial<StepASubmission>) {
    const data: StepASubmission = {
      dipartimento,
      areaFunzionale,
      attivitaSelezionate: selected,
      processo,
      attivitaStrumenti,
      descrizione,
      fteDurata,
      fteFrequenza,
      ftePersone,
      chatLog,
      ...extra,
    };
    await submitStepA(code, participantId, data);
    onSaved(data);
    return data;
  }

  async function handleSave() {
    setSaving(true);
    try {
      await persist({ completedAt: nowMs() });
      setSavedAt(nowMs());
    } finally {
      setSaving(false);
    }
  }

  async function handleChatUpdate(newLog: ChatMessage[]) {
    setChatLog(newLog);
    await persist({ chatLog: newLog });
  }

  const selectedLabels = selected.map(labelForActivity);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-1 text-lg font-semibold text-ifab-navy">A1 · Quali attività svolgi nei tuoi processi?</h2>
        <p className="mb-4 text-sm text-ifab-text-muted">
          Seleziona tutte le attività concrete che riconosci nel tuo lavoro quotidiano, raggruppate per tipologia.
        </p>

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
      </section>

      <section className="rounded-xl border border-ifab-border bg-white p-4">
        <h2 className="mb-1 text-lg font-semibold text-ifab-navy">A2 · Descrivi il processo</h2>
        <p className="mb-4 text-sm text-ifab-text-muted">
          Usa l&apos;assistente qui sotto se hai dubbi su come rispondere, poi compila i campi.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">Nome dipartimento</label>
            <input
              disabled={locked}
              value={dipartimento}
              onChange={(e) => setDipartimento(e.target.value)}
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">Area funzionale</label>
            <select
              disabled={locked}
              value={areaFunzionale}
              onChange={(e) => setAreaFunzionale(e.target.value)}
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
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">Processo</label>
            <input
              disabled={locked}
              value={processo}
              onChange={(e) => setProcesso(e.target.value)}
              placeholder="Es. Controllo qualità visivo a fine linea"
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">
              Attività (inclusi strumenti utilizzati)
            </label>
            <textarea
              disabled={locked}
              value={attivitaStrumenti}
              onChange={(e) => setAttivitaStrumenti(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">Descrizione e caratteristiche</label>
            <textarea
              disabled={locked}
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">FTE — Durata</label>
            <input
              disabled={locked}
              value={fteDurata}
              onChange={(e) => setFteDurata(e.target.value)}
              placeholder="Es. 20 min"
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">FTE — Frequenza</label>
            <input
              disabled={locked}
              value={fteFrequenza}
              onChange={(e) => setFteFrequenza(e.target.value)}
              placeholder="Es. 30 volte/giorno"
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted"># Persone coinvolte</label>
            <input
              disabled={locked}
              value={ftePersone}
              onChange={(e) => setFtePersone(e.target.value)}
              placeholder="Es. 3"
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
            />
          </div>
        </div>

        <div className="mt-4">
          <AgentChat
            subsection="stepA"
            context={{ selectedActivityLabels: selectedLabels }}
            initialMessage={INITIAL_MESSAGE_STEP_A}
            initialChatLog={chatLog}
            onUpdate={handleChatUpdate}
            disabled={locked}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={locked || saving}
            className="flex items-center gap-2 rounded-lg bg-ifab-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-ifab-navy-deep disabled:opacity-50"
          >
            <Save size={16} /> {saving ? "Salvataggio..." : "Salva"}
          </button>
          {savedAt && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 size={14} /> Salvato
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
