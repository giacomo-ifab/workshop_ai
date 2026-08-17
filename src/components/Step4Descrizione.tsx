"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { Step1Submission, Step2Submission, Step4Submission } from "@/lib/types";
import { calcolaEsiti } from "@/lib/frizioneScoring";
import { submitStep4 } from "@/lib/clientApi";
import { nowMs } from "@/lib/time";

/**
 * Step 4 — descrizione libera dell'attività risultata prima per punteggio:
 * com'è il processo oggi e qual è il problema individuato. È il ponte fra
 * l'esito calcolato del Blocco 1 e la scheda Use Case del Blocco 2.
 */
export default function Step4Descrizione({
  code,
  participantId,
  step1,
  step2,
  step4,
  locked,
  onSaved,
}: {
  code: string;
  participantId: string;
  step1?: Step1Submission;
  step2?: Step2Submission;
  step4?: Step4Submission;
  locked: boolean;
  onSaved: (data: Step4Submission) => void;
}) {
  const esiti = calcolaEsiti(step1, step2);
  const vincente = esiti[0];

  const [descrizione, setDescrizione] = useState(step4?.descrizione ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(step4?.completedAt ?? null);
  const [draftState, setDraftState] = useState<"idle" | "saving" | "saved">(
    step4?.updatedAt || step4?.completedAt ? "saved" : "idle"
  );

  const dirtyRef = useRef(false);
  const pendingRef = useRef<string | null>(null);
  const onSavedRef = useRef(onSaved);
  const attivitaId = vincente?.domandaId;

  useEffect(() => {
    onSavedRef.current = onSaved;
  });

  useEffect(() => {
    if (locked) return;
    pendingRef.current = descrizione;
    if (!dirtyRef.current) return;

    const timer = setTimeout(async () => {
      dirtyRef.current = false;
      setDraftState("saving");
      try {
        const payload: Step4Submission = { descrizione, attivitaId, updatedAt: nowMs() };
        await submitStep4(code, participantId, payload);
        onSavedRef.current(payload);
        setDraftState("saved");
      } catch {
        dirtyRef.current = true;
        setDraftState("idle");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [locked, descrizione, attivitaId, code, participantId]);

  useEffect(() => {
    return () => {
      const pending = pendingRef.current;
      if (!dirtyRef.current || pending === null) return;
      dirtyRef.current = false;
      void submitStep4(code, participantId, { descrizione: pending, attivitaId, updatedAt: nowMs() });
    };
  }, [code, participantId, attivitaId]);

  async function handleSave() {
    setSaving(true);
    try {
      dirtyRef.current = false;
      const payload: Step4Submission = {
        descrizione,
        attivitaId,
        updatedAt: nowMs(),
        completedAt: nowMs(),
      };
      await submitStep4(code, participantId, payload);
      onSaved(payload);
      setSavedAt(nowMs());
      setDraftState("saved");
    } finally {
      setSaving(false);
    }
  }

  if (!vincente) {
    return (
      <div className="rounded-xl border border-dashed border-ifab-border bg-white p-8 text-center text-sm text-ifab-text-muted">
        Qui descriverai l&apos;attività con il punteggio più alto: prima concludi lo Step 2 e guarda l&apos;esito
        nello Step 3.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h2 className="mb-1 text-lg font-semibold text-ifab-navy">Step 4 · Descrivi l&apos;attività</h2>
        <p className="text-sm text-ifab-text-muted">
          Racconta com&apos;è oggi il processo e qual è il problema che hai individuato. Servirà come base per la
          scheda del caso d&apos;uso.
        </p>
      </section>

      <section className="rounded-xl border border-ifab-border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="h-8 w-1.5 rounded-full" style={{ backgroundColor: vincente.colore }} />
            <div>
              <p className="text-xs uppercase tracking-wide text-ifab-text-muted">Attività con il punteggio più alto</p>
              <h3 className="text-base font-semibold text-ifab-navy">{vincente.nome}</h3>
            </div>
          </div>
          <p className="text-2xl font-bold text-ifab-navy">{Math.round(vincente.punteggio)}</p>
        </div>

        <label className="mt-5 mb-1 block text-xs font-medium text-ifab-text-muted">
          Il processo e il problema individuato
        </label>
        <textarea
          disabled={locked}
          rows={10}
          value={descrizione}
          onChange={(e) => {
            dirtyRef.current = true;
            setDraftState("idle");
            setDescrizione(e.target.value);
          }}
          placeholder="Come si svolge oggi, chi è coinvolto, dove si inceppa e che conseguenze ha quando va storto."
          className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
        />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={locked || saving || !descrizione.trim()}
          className="flex items-center gap-2 rounded-lg bg-ifab-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-ifab-navy-deep disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Salvataggio..." : "Salva descrizione"}
        </button>
        {savedAt && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 size={14} /> Salvata
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
