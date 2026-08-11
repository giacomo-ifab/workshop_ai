"use client";

import { startTransition, use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Users } from "lucide-react";
import { fetchState } from "@/lib/clientApi";
import { StepASubmission, StepBKey, StepBSubmission, StepCSubmission, Submission, UnlockedSteps } from "@/lib/types";
import { DEFAULT_UNLOCKED_STEPS } from "@/lib/types";
import StepA from "@/components/StepA";
import StepB from "@/components/StepB";
import StepC from "@/components/StepC";

type StoredIdentity = { code: string; participantId: string; name: string };

const POLL_MS = 4000;

export default function SessionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [identity, setIdentity] = useState<StoredIdentity | null>(null);
  const [unlockedSteps, setUnlockedSteps] = useState<UnlockedSteps>(DEFAULT_UNLOCKED_STEPS);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [tab, setTab] = useState<"A" | "B" | "C">("A");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("ifab_ws_participant");
    if (!raw) {
      router.replace(`/join?code=${code}`);
      return;
    }
    const parsed: StoredIdentity = JSON.parse(raw);
    if (parsed.code !== code) {
      router.replace(`/join?code=${code}`);
      return;
    }
    startTransition(() => setIdentity(parsed));
  }, [code, router]);

  const poll = useCallback(async () => {
    if (!identity) return;
    try {
      const data = await fetchState(code, identity.participantId);
      setUnlockedSteps(data.meta.unlockedSteps);
      setSubmission(data.ownSubmission ?? { participantId: identity.participantId });
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Sessione non raggiungibile");
    }
  }, [code, identity]);

  useEffect(() => {
    if (!identity) return;
    startTransition(() => {
      void poll();
    });
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [identity, poll]);

  if (!identity) return null;

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ifab-bg px-4 text-center">
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    );
  }

  if (!submission) {
    return <div className="flex min-h-screen items-center justify-center bg-ifab-bg text-sm text-ifab-text-muted">Caricamento...</div>;
  }

  const stepA = submission.stepA;
  const stepB = submission.stepB;
  const stepC = submission.stepC;

  function updateSubmission(patch: Partial<Submission>) {
    setSubmission((prev) => ({ ...(prev as Submission), ...patch }));
  }

  const tabs: { key: "A" | "B" | "C"; label: string; unlocked: boolean }[] = [
    { key: "A", label: "A · Identifica", unlocked: unlockedSteps.A },
    {
      key: "B",
      label: "B · Caratterizza",
      unlocked: unlockedSteps.variabilita || unlockedSteps.dati || unlockedSteps.docStandard || unlockedSteps.criteri,
    },
    { key: "C", label: "C · Output", unlocked: unlockedSteps.C },
  ];

  return (
    <div className="min-h-screen bg-ifab-bg">
      <header className="border-b border-ifab-border bg-white px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-ifab-text-muted">Workshop AI Adoption · IFAB Foundation</p>
            <h1 className="text-base font-semibold text-ifab-navy">Ciao, {identity.name}</h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-ifab-bg-soft px-3 py-1.5 text-xs text-ifab-text-muted">
            <Users size={14} /> Sessione {identity.code}
          </div>
        </div>
      </header>

      <nav className="mx-auto flex max-w-4xl gap-2 px-4 pt-4 sm:px-8">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => t.unlocked && setTab(t.key)}
            disabled={!t.unlocked}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              tab === t.key ? "bg-ifab-navy text-white" : "bg-white text-ifab-navy border border-ifab-border"
            }`}
          >
            {!t.unlocked && <Lock size={13} />}
            {t.label}
          </button>
        ))}
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
        {tab === "A" && (
          <StepA
            code={code}
            participantId={identity.participantId}
            initialData={stepA}
            locked={!unlockedSteps.A}
            onSaved={(data: StepASubmission) => updateSubmission({ stepA: data })}
          />
        )}
        {tab === "B" && (
          <StepB
            code={code}
            participantId={identity.participantId}
            stepA={stepA}
            stepB={stepB}
            unlockedSteps={unlockedSteps}
            onSaved={(dimension: StepBKey, data: NonNullable<StepBSubmission[StepBKey]>) =>
              updateSubmission({ stepB: { ...stepB, [dimension]: { ...stepB?.[dimension], ...data } } })
            }
          />
        )}
        {tab === "C" &&
          (unlockedSteps.C ? (
            <StepC
              code={code}
              participantId={identity.participantId}
              participantName={identity.name}
              stepA={stepA}
              stepB={stepB}
              stepC={stepC}
              onGenerated={(data: StepCSubmission) => updateSubmission({ stepC: data })}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-ifab-border bg-white p-8 text-center text-sm text-ifab-text-muted">
              <Lock className="mx-auto mb-2" size={20} />
              In attesa che il facilitatore sblocchi l&apos;output finale.
            </div>
          ))}
      </main>
    </div>
  );
}
