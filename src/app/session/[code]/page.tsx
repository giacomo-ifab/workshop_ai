"use client";

import { Fragment, startTransition, use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Lock, RotateCcw, Users, X } from "lucide-react";
import { ApiError, fetchState, resumeSession, saveProgress } from "@/lib/clientApi";
import {
  clearStoredIdentity,
  readStoredIdentity,
  saveStoredIdentity,
  StoredIdentity,
} from "@/lib/participantStorage";
import {
  Block2Submission,
  StepASubmission,
  StepBKey,
  StepBSubmission,
  StepCSubmission,
  Submission,
  UnlockedSteps,
} from "@/lib/types";
import { DEFAULT_UNLOCKED_STEPS } from "@/lib/types";
import { nowMs } from "@/lib/time";
import StepA from "@/components/StepA";
import StepB from "@/components/StepB";
import StepC from "@/components/StepC";
import Block2Form from "@/components/Block2Form";

type Tab = "A" | "B" | "C" | "UC";

const POLL_MS = 4000;

function isTabUnlocked(tab: Tab, steps: UnlockedSteps): boolean {
  if (tab === "A") return steps.A;
  if (tab === "B") return steps.variabilita || steps.dati || steps.docStandard || steps.criteri;
  if (tab === "UC") return steps.useCase;
  return steps.C;
}

function hasWork(submission: Submission): boolean {
  return Boolean(
    submission.stepA?.processo ||
      submission.stepA?.completedAt ||
      submission.stepA?.updatedAt ||
      (submission.stepB && Object.keys(submission.stepB).length > 0) ||
      submission.stepC?.sintesi ||
      submission.block2?.updatedAt
  );
}

export default function SessionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [identity, setIdentity] = useState<StoredIdentity | null>(null);
  const [unlockedSteps, setUnlockedSteps] = useState<UnlockedSteps>(DEFAULT_UNLOCKED_STEPS);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [tab, setTab] = useState<Tab>("A");
  const [stepBDimension, setStepBDimension] = useState<StepBKey | undefined>(undefined);
  const [resumedBanner, setResumedBanner] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  /** L'identità salvata non vale più (sessione scaduta, nuova sessione, dati ripuliti). */
  const backToJoin = useCallback(() => {
    clearStoredIdentity();
    router.replace(`/join?code=${code}&expired=1`);
  }, [code, router]);

  // Rientro: valida l'identità salvata nel browser e ripristina dati e posizione.
  useEffect(() => {
    const stored = readStoredIdentity();
    if (!stored || stored.code !== code) {
      router.replace(`/join?code=${code}`);
      return;
    }

    let cancelled = false;
    resumeSession(code, stored.participantId)
      .then(({ participant, submission: restored, meta }) => {
        if (cancelled) return;
        const refreshed: StoredIdentity = {
          code,
          participantId: participant.participantId,
          name: participant.name,
        };
        saveStoredIdentity(refreshed);

        const savedTab = restored.progress?.tab;
        startTransition(() => {
          setIdentity(refreshed);
          setUnlockedSteps(meta.unlockedSteps);
          setSubmission(restored);
          setStepBDimension(restored.progress?.stepBDimension);
          if (savedTab && isTabUnlocked(savedTab, meta.unlockedSteps)) setTab(savedTab);
          setResumedBanner(hasWork(restored));
        });
      })
      .catch((err) => {
        if (cancelled) return;
        // Solo un "non esiste più" lato server fa ripartire dal form: un errore
        // di rete deve poter essere superato ricaricando la pagina.
        if (err instanceof ApiError && err.status === 404) {
          backToJoin();
          return;
        }
        setLoadError("Sessione non raggiungibile. Controlla la connessione e ricarica la pagina.");
      });

    return () => {
      cancelled = true;
    };
  }, [code, router, backToJoin]);

  const poll = useCallback(async () => {
    if (!identity) return;
    try {
      const data = await fetchState(code, identity.participantId);
      if (!data.participantValid) {
        backToJoin();
        return;
      }
      setUnlockedSteps(data.meta.unlockedSteps);
      setSubmission(data.ownSubmission ?? { participantId: identity.participantId });
      setLoadError(null);
    } catch (err) {
      // Sessione eliminata dal facilitatore o scaduta mentre si lavorava:
      // meglio riportare al form di ingresso che lasciare un errore secco.
      if (err instanceof ApiError && err.status === 404) {
        backToJoin();
        return;
      }
      setLoadError(err instanceof Error ? err.message : "Sessione non raggiungibile");
    }
  }, [code, identity, backToJoin]);

  useEffect(() => {
    if (!identity) return;
    startTransition(() => {
      void poll();
    });
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [identity, poll]);

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ifab-bg px-4 text-center">
        <p className="text-sm text-red-600">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-ifab-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-ifab-blue-dark"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (!identity) return null;

  if (!submission) {
    return <div className="flex min-h-screen items-center justify-center bg-ifab-bg text-sm text-ifab-text-muted">Caricamento...</div>;
  }

  const stepA = submission.stepA;
  const stepB = submission.stepB;
  const stepC = submission.stepC;
  const block2 = submission.block2;

  function updateSubmission(patch: Partial<Submission>) {
    setSubmission((prev) => ({ ...(prev as Submission), ...patch }));
  }

  /**
   * Ogni cambio di step viene memorizzato lato server: al rientro (anche da un
   * altro dispositivo) si riparte da qui invece che sempre dallo Step A.
   */
  function rememberPosition(nextTab: Tab, dimension?: StepBKey) {
    const current = identity;
    if (!current) return;
    void saveProgress(code, current.participantId, {
      tab: nextTab,
      stepBDimension: dimension,
      updatedAt: nowMs(),
    }).catch(() => {
      // La posizione è un comfort, non un dato del workshop: se fallisce si prosegue.
    });
  }

  function handleTabChange(nextTab: Tab) {
    setTab(nextTab);
    setResumedBanner(false);
    rememberPosition(nextTab, stepBDimension);
  }

  function handleStepBDimension(dimension: StepBKey) {
    setStepBDimension(dimension);
    rememberPosition("B", dimension);
  }

  function handleExit() {
    clearStoredIdentity();
    router.replace("/join");
  }

  const tabs: { key: Tab; label: string; unlocked: boolean }[] = [
    { key: "A", label: "A · Identifica", unlocked: unlockedSteps.A },
    {
      key: "B",
      label: "B · Caratterizza",
      unlocked: unlockedSteps.variabilita || unlockedSteps.dati || unlockedSteps.docStandard || unlockedSteps.criteri,
    },
    { key: "C", label: "C · Output", unlocked: unlockedSteps.C },
    { key: "UC", label: "2 · Use Case", unlocked: unlockedSteps.useCase },
  ];

  return (
    // Quando il pannello dell'assistente è aperto (Step A e scheda Use Case),
    // da lg in su la pagina si restringe per non finirgli sotto.
    <div className="min-h-screen bg-ifab-bg transition-[padding] lg:has-[aside[data-assistant=open]]:pr-[380px]">
      <header className="border-b border-ifab-border bg-white px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-ifab-text-muted">Workshop AI Adoption · IFAB Foundation</p>
            <h1 className="text-base font-semibold text-ifab-navy">Ciao, {identity.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-ifab-bg-soft px-3 py-1.5 text-xs text-ifab-text-muted">
              <Users size={14} /> Sessione {identity.code}
            </div>
            <button
              onClick={handleExit}
              title="Esci da questa sessione su questo dispositivo"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-ifab-text-muted transition hover:bg-ifab-bg-soft hover:text-ifab-navy"
            >
              <LogOut size={14} /> Esci
            </button>
          </div>
        </div>
      </header>

      {resumedBanner && (
        <div className="mx-auto mt-4 flex max-w-4xl items-center justify-between gap-3 rounded-xl border border-ifab-blue/30 bg-ifab-blue/5 px-4 py-3 text-sm text-ifab-navy sm:px-5">
          <span className="flex items-center gap-2">
            <RotateCcw size={15} className="text-ifab-blue" />
            Sessione ripresa: i dati che avevi inserito sono stati ripristinati.
          </span>
          <button
            onClick={() => setResumedBanner(false)}
            className="rounded-lg p-1 text-ifab-text-muted transition hover:text-ifab-navy"
            title="Chiudi"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 pt-4 sm:px-8">
        {tabs.map((t) => (
          <Fragment key={t.key}>
            {/* Separatore fra gli step del Blocco 1 e la scheda del Blocco 2 */}
            {t.key === "UC" && <span className="mx-1 hidden h-6 w-px bg-ifab-border sm:block" />}
            <button
              onClick={() => t.unlocked && handleTabChange(t.key)}
              disabled={!t.unlocked}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                tab === t.key ? "bg-ifab-navy text-white" : "bg-white text-ifab-navy border border-ifab-border"
              }`}
            >
              {!t.unlocked && <Lock size={13} />}
              {t.label}
            </button>
          </Fragment>
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
            initialDimension={stepBDimension}
            onDimensionChange={handleStepBDimension}
            onSaved={(dimension: StepBKey, data: NonNullable<StepBSubmission[StepBKey]>) =>
              updateSubmission({ stepB: { ...stepB, [dimension]: { ...stepB?.[dimension], ...data } } })
            }
          />
        )}
        {tab === "UC" &&
          (unlockedSteps.useCase ? (
            <Block2Form
              code={code}
              participantId={identity.participantId}
              stepA={stepA}
              block2={block2}
              onSaved={(data: Block2Submission) =>
                updateSubmission({ block2: { ...block2, ...data, values: { ...block2?.values, ...data.values } } })
              }
            />
          ) : (
            <div className="rounded-xl border border-dashed border-ifab-border bg-white p-8 text-center text-sm text-ifab-text-muted">
              <Lock className="mx-auto mb-2" size={20} />
              In attesa che il facilitatore sblocchi la scheda Use Case.
            </div>
          ))}
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
