"use client";

import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { STEP_B_CONFIG, categoryForActivity, initialMessageForStepB } from "@/config/block1Flow";
import { CATEGORY_TO_STEP_B, ChatMessage, StepASubmission, StepBKey, StepBSubmission, UnlockedSteps } from "@/lib/types";
import { submitStepB } from "@/lib/clientApi";
import { nowMs } from "@/lib/time";
import AgentChat from "./AgentChat";

export default function StepB({
  code,
  participantId,
  stepA,
  stepB,
  unlockedSteps,
  onSaved,
}: {
  code: string;
  participantId: string;
  stepA?: StepASubmission;
  stepB?: StepBSubmission;
  unlockedSteps: UnlockedSteps;
  onSaved: (dimension: StepBKey, data: NonNullable<StepBSubmission[StepBKey]>) => void;
}) {
  const relevantDimensions = useMemo(() => {
    const categories = new Set((stepA?.attivitaSelezionate ?? []).map(categoryForActivity).filter(Boolean));
    const dims = Array.from(categories).map((c) => CATEGORY_TO_STEP_B[c!]);
    // Fallback: se per qualche motivo nessuna attività è stata selezionata,
    // mostra comunque tutte e 4 le dimensioni per non bloccare il partecipante.
    return dims.length > 0 ? dims : (Object.keys(STEP_B_CONFIG) as StepBKey[]);
  }, [stepA]);

  const [active, setActive] = useState<StepBKey>(relevantDimensions[0] ?? "variabilita");

  const processoContext = [stepA?.processo, stepA?.descrizione].filter(Boolean).join(" — ");

  async function handleChatUpdate(dimension: StepBKey, newLog: ChatMessage[], finished: boolean) {
    const data = { chatLog: newLog, completedAt: finished ? nowMs() : undefined };
    await submitStepB(code, participantId, dimension, data);
    onSaved(dimension, data);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-ifab-navy">B · Caratterizza il processo</h2>
        <p className="text-sm text-ifab-text-muted">
          In base alle attività selezionate in Step A, approfondiamo insieme queste dimensioni.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {relevantDimensions.map((dim) => {
          const cfg = STEP_B_CONFIG[dim];
          const unlocked = unlockedSteps[dim];
          const done = Boolean(stepB?.[dim]?.completedAt);
          return (
            <button
              key={dim}
              type="button"
              onClick={() => unlocked && setActive(dim)}
              disabled={!unlocked}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                active === dim && unlocked
                  ? "border-ifab-blue bg-ifab-blue text-white"
                  : "border-ifab-border bg-white text-ifab-text hover:border-ifab-blue"
              }`}
            >
              {!unlocked && <Lock size={12} />}
              {cfg.label}
              {done && <span className="text-emerald-500">●</span>}
            </button>
          );
        })}
      </div>

      {relevantDimensions.map((dim) => {
        if (dim !== active) return null;
        const cfg = STEP_B_CONFIG[dim];
        const unlocked = unlockedSteps[dim];

        if (!unlocked) {
          return (
            <div key={dim} className="rounded-xl border border-dashed border-ifab-border bg-white p-6 text-center text-sm text-ifab-text-muted">
              <Lock className="mx-auto mb-2" size={20} />
              In attesa che il facilitatore sblocchi &quot;{cfg.label}&quot;.
            </div>
          );
        }

        return (
          <div key={dim} className="rounded-xl border border-ifab-border bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-ifab-blue-dark">{cfg.label}</h3>
            <AgentChat
              subsection={dim}
              context={{ processoContext }}
              initialMessage={initialMessageForStepB(dim)}
              initialChatLog={stepB?.[dim]?.chatLog}
              initiallyFinished={Boolean(stepB?.[dim]?.completedAt)}
              onUpdate={(log, finished) => handleChatUpdate(dim, log, finished)}
            />
          </div>
        );
      })}
    </div>
  );
}
