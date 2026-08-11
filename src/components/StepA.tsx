"use client";

import { useEffect, useRef, useState } from "react";
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
  const [draftState, setDraftState] = useState<"idle" | "saving" | "saved">(
    initialData?.updatedAt || initialData?.completedAt ? "saved" : "idle"
  );

  // Salvataggio automatico della bozza: senza questo, chiudere il browser prima
  // di premere "Salva" farebbe perdere tutto quanto scritto, e il rientro nella
  // sessione ripartirebbe da campi vuoti.
  const dirtyRef = useRef(false);
  const pendingDraftRef = useRef<StepASubmission | null>(null);
  // onSaved è una closure nuova a ogni render del genitore: passandola per ref
  // il timer di autosalvataggio non viene riavviato dai render del polling.
  const onSavedRef = useRef(onSaved);

  function markDirty() {
    dirtyRef.current = true;
    setDraftState("idle");
  }

  function toggleActivity(key: string) {
    if (locked) return;
    markDirty();
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

  useEffect(() => {
    onSavedRef.current = onSaved;
  });

  useEffect(() => {
    if (locked) return;
    const draft: StepASubmission = {
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
    };
    pendingDraftRef.current = draft;
    if (!dirtyRef.current) return;

    const timer = setTimeout(async () => {
      dirtyRef.current = false;
      setDraftState("saving");
      try {
        const data: StepASubmission = { ...draft, updatedAt: nowMs() };
        await submitStepA(code, participantId, data);
        onSavedRef.current(data);
        setDraftState("saved");
      } catch {
        // Riproveremo alla modifica successiva: la bozza resta comunque a schermo.
        dirtyRef.current = true;
        setDraftState("idle");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    locked,
    dipartimento,
    areaFunzionale,
    selected,
    processo,
    attivitaStrumenti,
    descrizione,
    fteDurata,
    fteFrequenza,
    ftePersone,
    chatLog,
    code,
    participantId,
  ]);

  // Uscita dallo step (cambio tab): la bozza in attesa del timer viene salvata
  // subito, così al rientro non manca l'ultima riga scritta.
  useEffect(() => {
    return () => {
      const draft = pendingDraftRef.current;
      if (!dirtyRef.current || !draft) return;
      dirtyRef.current = false;
      void submitStepA(code, participantId, { ...draft, updatedAt: nowMs() });
    };
  }, [code, participantId]);

  async function handleSave() {
    setSaving(true);
    try {
      dirtyRef.current = false;
      await persist({ updatedAt: nowMs(), completedAt: nowMs() });
      setSavedAt(nowMs());
      setDraftState("saved");
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
              onChange={(e) => {
                markDirty();
                setDipartimento(e.target.value);
              }}
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
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
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">Processo</label>
            <input
              disabled={locked}
              value={processo}
              onChange={(e) => {
                markDirty();
                setProcesso(e.target.value);
              }}
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
              onChange={(e) => {
                markDirty();
                setAttivitaStrumenti(e.target.value);
              }}
              rows={2}
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">Descrizione e caratteristiche</label>
            <textarea
              disabled={locked}
              value={descrizione}
              onChange={(e) => {
                markDirty();
                setDescrizione(e.target.value);
              }}
              rows={3}
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">FTE — Durata</label>
            <input
              disabled={locked}
              value={fteDurata}
              onChange={(e) => {
                markDirty();
                setFteDurata(e.target.value);
              }}
              placeholder="Es. 20 min"
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted">FTE — Frequenza</label>
            <input
              disabled={locked}
              value={fteFrequenza}
              onChange={(e) => {
                markDirty();
                setFteFrequenza(e.target.value);
              }}
              placeholder="Es. 30 volte/giorno"
              className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ifab-text-muted"># Persone coinvolte</label>
            <input
              disabled={locked}
              value={ftePersone}
              onChange={(e) => {
                markDirty();
                setFtePersone(e.target.value);
              }}
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
          {!savedAt && draftState !== "idle" && (
            <span className="text-xs text-ifab-text-muted">
              {draftState === "saving" ? "Salvataggio bozza..." : "Bozza salvata — la ritrovi al rientro"}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
