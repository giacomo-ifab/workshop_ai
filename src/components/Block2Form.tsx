"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, HelpCircle, Save } from "lucide-react";
import {
  BLOCK2_SECTIONS,
  Block2Field,
  Block2Section,
  INITIAL_MESSAGE_BLOCK2,
} from "@/config/block2Form";
import { Block2FieldValue, Block2Submission, ChatMessage, StepASubmission } from "@/lib/types";
import { submitBlock2 } from "@/lib/clientApi";
import { nowMs } from "@/lib/time";
import AgentChat, { AgentChatHandle } from "./AgentChat";

const TOTAL_FIELDS = BLOCK2_SECTIONS.reduce((n, s) => n + s.fields.length, 0);

function isFilled(value: Block2FieldValue | undefined): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value && value.trim());
}

function asText(value: Block2FieldValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function asList(value: Block2FieldValue | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

export default function Block2Form({
  code,
  participantId,
  stepA,
  block2,
  onSaved,
}: {
  code: string;
  participantId: string;
  stepA?: StepASubmission;
  block2?: Block2Submission;
  onSaved: (data: Block2Submission) => void;
}) {
  const [values, setValues] = useState<Record<string, Block2FieldValue>>(block2?.values ?? {});
  const [chatLog, setChatLog] = useState<ChatMessage[]>(block2?.chatLog ?? []);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(block2?.completedAt ?? null);
  const [draftState, setDraftState] = useState<"idle" | "saving" | "saved">(
    block2?.updatedAt || block2?.completedAt ? "saved" : "idle"
  );
  const [sectionLabel, setSectionLabel] = useState<string | undefined>(undefined);

  // Stessa meccanica dello Step A: la bozza si salva da sola, così chiudere il
  // browser a metà scheda non fa perdere nulla e il rientro riparte da qui.
  const dirtyRef = useRef(false);
  const pendingRef = useRef<Record<string, Block2FieldValue> | null>(null);
  const onSavedRef = useRef(onSaved);
  const chatRef = useRef<AgentChatHandle>(null);

  const processoContext = [stepA?.processo, stepA?.descrizione].filter(Boolean).join(" — ");
  const compiled = BLOCK2_SECTIONS.flatMap((s) => s.fields).filter((f) => isFilled(values[f.id])).length;

  useEffect(() => {
    onSavedRef.current = onSaved;
  });

  useEffect(() => {
    pendingRef.current = values;
    if (!dirtyRef.current) return;

    const timer = setTimeout(async () => {
      dirtyRef.current = false;
      setDraftState("saving");
      try {
        const data: Block2Submission = { values, updatedAt: nowMs() };
        await submitBlock2(code, participantId, data);
        onSavedRef.current(data);
        setDraftState("saved");
      } catch {
        dirtyRef.current = true;
        setDraftState("idle");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [values, code, participantId]);

  useEffect(() => {
    return () => {
      const pending = pendingRef.current;
      if (!dirtyRef.current || !pending) return;
      dirtyRef.current = false;
      void submitBlock2(code, participantId, { values: pending, updatedAt: nowMs() });
    };
  }, [code, participantId]);

  function setValue(id: string, value: Block2FieldValue) {
    dirtyRef.current = true;
    setDraftState("idle");
    setValues((prev) => ({ ...prev, [id]: value }));
  }

  function toggleInList(id: string, option: string) {
    const current = asList(values[id]);
    setValue(id, current.includes(option) ? current.filter((v) => v !== option) : [...current, option]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      dirtyRef.current = false;
      const data: Block2Submission = { values, updatedAt: nowMs(), completedAt: nowMs() };
      await submitBlock2(code, participantId, data);
      onSaved(data);
      setSavedAt(nowMs());
      setDraftState("saved");
    } finally {
      setSaving(false);
    }
  }

  async function handleChatUpdate(newLog: ChatMessage[]) {
    setChatLog(newLog);
    const data: Block2Submission = { chatLog: newLog, updatedAt: nowMs() };
    await submitBlock2(code, participantId, data);
    onSaved(data);
  }

  function askAboutSection(section: Block2Section) {
    setSectionLabel(`${section.number} ${section.title}`);
    chatRef.current?.ask(
      `Aiutami con la sezione "${section.number} ${section.title}": cosa devo scrivere e con che livello di dettaglio?`
    );
  }

  function renderField(field: Block2Field) {
    if (field.type === "textarea") {
      return (
        <textarea
          value={asText(values[field.id])}
          onChange={(e) => setValue(field.id, e.target.value)}
          rows={field.rows ?? 4}
          placeholder={field.placeholder}
          className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue"
        />
      );
    }

    if (field.type === "text") {
      return (
        <input
          value={asText(values[field.id])}
          onChange={(e) => setValue(field.id, e.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue"
          autoComplete="off"
        />
      );
    }

    if (field.type === "radio") {
      const selected = asText(values[field.id]);
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue(field.id, selected === opt.value ? "" : opt.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                selected === opt.value
                  ? "border-ifab-blue bg-ifab-blue text-white"
                  : "border-ifab-border bg-ifab-bg-soft text-ifab-text hover:border-ifab-blue"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    const selectedList = asList(values[field.id]);
    return (
      <div className="flex flex-wrap gap-2">
        {(field.options ?? []).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggleInList(field.id, opt.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              selectedList.includes(opt.value)
                ? "border-ifab-blue bg-ifab-blue text-white"
                : "border-ifab-border bg-ifab-bg-soft text-ifab-text hover:border-ifab-blue"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-ifab-navy">Blocco 2 · Use Case Submission</h2>
        <p className="text-sm text-ifab-text-muted">
          Descrivi il caso d&apos;uso che vuoi portare avanti. Usa l&apos;assistente in fondo alla pagina (o il
          pulsante &quot;Chiedi aiuto&quot; di ogni sezione) se un campo non ti è chiaro.
        </p>
        <p className="mt-2 text-xs text-ifab-text-muted">
          Campi compilati: {compiled}/{TOTAL_FIELDS}
        </p>
      </div>

      {BLOCK2_SECTIONS.map((section) => (
        <section key={section.key} className="rounded-xl border border-ifab-border bg-white p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold text-ifab-blue-dark">
              {section.number} · {section.title}
            </h3>
            <button
              type="button"
              onClick={() => askAboutSection(section)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ifab-border px-2.5 py-1.5 text-xs font-medium text-ifab-navy transition hover:border-ifab-blue hover:text-ifab-blue"
            >
              <HelpCircle size={13} /> Chiedi aiuto
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {section.fields.map((field) => (
              <div key={field.id}>
                <label className="mb-1 block text-xs font-medium text-ifab-text-muted">{field.label}</label>
                {field.hint && <p className="mb-1.5 text-xs text-ifab-text-muted/80">{field.hint}</p>}
                {renderField(field)}
              </div>
            ))}
          </div>
        </section>
      ))}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ifab-navy">Assistente alla compilazione</h3>
        <AgentChat
          ref={chatRef}
          subsection="block2"
          context={{ processoContext, sectionLabel }}
          initialMessage={INITIAL_MESSAGE_BLOCK2}
          initialChatLog={chatLog}
          onUpdate={handleChatUpdate}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-ifab-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-ifab-navy-deep disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Salvataggio..." : "Salva scheda"}
        </button>
        {savedAt && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 size={14} /> Scheda salvata
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
