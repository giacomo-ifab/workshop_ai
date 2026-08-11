"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, HelpCircle, Save } from "lucide-react";
import {
  CHARACTERISTICS,
  INITIAL_MESSAGE_STEP3,
  answerKey,
  categoryForActivity,
  labelForActivity,
} from "@/config/block1Flow";
import {
  CATEGORY_TO_CHARACTERISTIC,
  CharacteristicKey,
  ChatMessage,
  Step2Submission,
  Step3Submission,
} from "@/lib/types";
import { submitStep3 } from "@/lib/clientApi";
import { nowMs } from "@/lib/time";
import AgentChat, { AgentChatHandle } from "./AgentChat";
import AssistantPanel from "./AssistantPanel";

/**
 * Step 3 — per ogni attività più onerosa si indaga UNA caratteristica, decisa
 * dal gruppo a cui l'attività appartiene (schema attività/caratteristiche).
 * Se due attività ricadono sulla stessa caratteristica la si chiede una volta
 * sola, indicando quali attività copre: l'indagine deve restare snella.
 */
export default function Step3Characteristics({
  code,
  participantId,
  step2,
  step3,
  locked,
  onSaved,
}: {
  code: string;
  participantId: string;
  step2?: Step2Submission;
  step3?: Step3Submission;
  locked: boolean;
  onSaved: (data: Step3Submission) => void;
}) {
  // Identità stabile fra un polling e l'altro (vedi Step 2).
  const topKey = (step2?.topAttivita ?? []).join("|");
  const topAttivita = useMemo(() => (topKey ? topKey.split("|") : []), [topKey]);

  const gruppi = useMemo(() => {
    const map = new Map<CharacteristicKey, string[]>();
    for (const activity of topAttivita) {
      const category = categoryForActivity(activity);
      if (!category) continue;
      const characteristic = CATEGORY_TO_CHARACTERISTIC[category];
      map.set(characteristic, [...(map.get(characteristic) ?? []), activity]);
    }
    return Array.from(map.entries()).map(([characteristic, activities]) => ({ characteristic, activities }));
  }, [topAttivita]);

  const [risposte, setRisposte] = useState<Record<string, string>>(step3?.risposte ?? {});
  const [chatLog, setChatLog] = useState<ChatMessage[]>(step3?.chatLog ?? []);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(step3?.completedAt ?? null);
  const [draftState, setDraftState] = useState<"idle" | "saving" | "saved">(
    step3?.updatedAt || step3?.completedAt ? "saved" : "idle"
  );

  const dirtyRef = useRef(false);
  const pendingRef = useRef<Record<string, string> | null>(null);
  const onSavedRef = useRef(onSaved);
  const chatRef = useRef<AgentChatHandle>(null);

  const totalQuestions = gruppi.reduce((n, g) => n + CHARACTERISTICS[g.characteristic].questions.length, 0);
  const answered = gruppi.reduce(
    (n, g) =>
      n +
      CHARACTERISTICS[g.characteristic].questions.filter((q) =>
        (risposte[answerKey(g.characteristic, q.id)] ?? "").trim()
      ).length,
    0
  );

  useEffect(() => {
    onSavedRef.current = onSaved;
  });

  useEffect(() => {
    if (locked) return;
    pendingRef.current = risposte;
    if (!dirtyRef.current) return;

    const timer = setTimeout(async () => {
      dirtyRef.current = false;
      setDraftState("saving");
      try {
        const payload: Step3Submission = { risposte, updatedAt: nowMs() };
        await submitStep3(code, participantId, payload);
        onSavedRef.current(payload);
        setDraftState("saved");
      } catch {
        dirtyRef.current = true;
        setDraftState("idle");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [locked, risposte, code, participantId]);

  useEffect(() => {
    return () => {
      const pending = pendingRef.current;
      if (!dirtyRef.current || !pending) return;
      dirtyRef.current = false;
      void submitStep3(code, participantId, { risposte: pending, updatedAt: nowMs() });
    };
  }, [code, participantId]);

  function setRisposta(key: string, value: string) {
    dirtyRef.current = true;
    setDraftState("idle");
    setRisposte((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      dirtyRef.current = false;
      const payload: Step3Submission = {
        risposte,
        chatLog,
        updatedAt: nowMs(),
        completedAt: nowMs(),
      };
      await submitStep3(code, participantId, payload);
      onSaved(payload);
      setSavedAt(nowMs());
      setDraftState("saved");
    } finally {
      setSaving(false);
    }
  }

  async function handleChatUpdate(newLog: ChatMessage[]) {
    setChatLog(newLog);
    const payload: Step3Submission = { chatLog: newLog, updatedAt: nowMs() };
    await submitStep3(code, participantId, payload);
    onSaved(payload);
  }

  if (gruppi.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ifab-border bg-white p-8 text-center text-sm text-ifab-text-muted">
        Prima conferma nello Step 2 quali sono le attività che assorbono più tempo: qui ne approfondirai le
        caratteristiche.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h2 className="mb-1 text-lg font-semibold text-ifab-navy">Step 3 · Come sono fatte queste attività</h2>
        <p className="text-sm text-ifab-text-muted">
          Per ciascuna attività più onerosa c&apos;è una caratteristica da indagare, con una o due domande. Rispondi
          in poche righe: se una domanda non ti è chiara usa &quot;Chiedi aiuto&quot;.
        </p>
        <p className="mt-2 text-xs text-ifab-text-muted">
          Risposte compilate: {answered}/{totalQuestions}
        </p>
      </section>

      {gruppi.map(({ characteristic, activities }) => {
        const cfg = CHARACTERISTICS[characteristic];
        return (
          <section key={characteristic} className="rounded-xl border border-ifab-border bg-white p-4">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-ifab-blue-dark">{cfg.label}</h3>
                <p className="mt-0.5 text-xs text-ifab-text-muted">
                  Per: {activities.map(labelForActivity).join(", ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  chatRef.current?.ask(
                    `Aiutami con la caratteristica "${cfg.label}" per le attività ${activities
                      .map(labelForActivity)
                      .join(", ")}: che cosa devo raccontare?`
                  )
                }
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ifab-border px-2.5 py-1.5 text-xs font-medium text-ifab-navy transition hover:border-ifab-blue hover:text-ifab-blue"
              >
                <HelpCircle size={13} /> Chiedi aiuto
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-4">
              {cfg.questions.map((q) => {
                const key = answerKey(characteristic, q.id);
                return (
                  <div key={q.id}>
                    <label className="mb-1 block text-xs font-medium text-ifab-text">{q.text}</label>
                    {q.hint && <p className="mb-1.5 text-xs text-ifab-text-muted/80">{q.hint}</p>}
                    <textarea
                      disabled={locked}
                      rows={3}
                      value={risposte[key] ?? ""}
                      onChange={(e) => setRisposta(key, e.target.value)}
                      className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <AssistantPanel title="Assistente AI" subtitle="Aiuto sulle domande e sulle risposte">
        <AgentChat
          ref={chatRef}
          variant="panel"
          subsection="step3"
          context={{
            characteristicLabels: gruppi.map((g) => CHARACTERISTICS[g.characteristic].label),
            attivitaLabels: topAttivita.map(labelForActivity),
          }}
          initialMessage={INITIAL_MESSAGE_STEP3}
          initialChatLog={chatLog}
          onUpdate={handleChatUpdate}
          disabled={locked}
        />
      </AssistantPanel>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={locked || saving || answered === 0}
          className="flex items-center gap-2 rounded-lg bg-ifab-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-ifab-navy-deep disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Salvataggio..." : "Conferma risposte"}
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
