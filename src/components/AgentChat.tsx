"use client";

import { Ref, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Send, Sparkles, CheckCircle2 } from "lucide-react";
import { ChatMessage } from "@/lib/types";

/** Handle per far partire una domanda dall'esterno (vedi Blocco 2: "Chiedi aiuto"). */
export type AgentChatHandle = {
  ask: (question: string) => void;
};

type AgentChatProps = {
  subsection: string;
  context?: {
    selectedActivityLabels?: string[];
    processoContext?: string;
    /** Blocco 2: sezione del form su cui il partecipante sta chiedendo aiuto. */
    sectionLabel?: string;
  };
  initialMessage: string;
  initialChatLog?: ChatMessage[];
  initiallyFinished?: boolean;
  onUpdate: (chatLog: ChatMessage[], finished: boolean) => void;
  disabled?: boolean;
  /**
   * "inline" (default): riquadro dentro il flusso della pagina, con altezza
   * massima propria. "panel": riempie il contenitore, per il pannello laterale
   * fisso che affianca i form.
   */
  variant?: "inline" | "panel";
  ref?: Ref<AgentChatHandle>;
};

export default function AgentChat({
  subsection,
  context,
  initialMessage,
  initialChatLog,
  initiallyFinished,
  onUpdate,
  disabled,
  variant = "inline",
  ref,
}: AgentChatProps) {
  const isPanel = variant === "panel";
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialChatLog && initialChatLog.length > 0
      ? initialChatLog
      : [{ role: "assistant", content: initialMessage }]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(Boolean(initiallyFinished));
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  useImperativeHandle(ref, () => ({
    ask: (question: string) => {
      setInput(question);
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      inputRef.current?.focus();
    },
  }));

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || loading || disabled) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subsection, messages: nextMessages, context }),
      });
      const data = await res.json();

      if (data.error) {
        const errMsgs: ChatMessage[] = [
          ...nextMessages,
          { role: "assistant", content: `Si è verificato un errore: ${data.error}` },
        ];
        setMessages(errMsgs);
        return;
      }

      const finalMessages: ChatMessage[] = [...nextMessages, { role: "assistant", content: data.reply }];
      setMessages(finalMessages);
      if (data.finished) setFinished(true);
      onUpdate(finalMessages, Boolean(data.finished) || finished);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Errore di connessione, riprova." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`flex min-h-0 flex-col overflow-hidden bg-white ${
        isPanel ? "h-full" : "rounded-xl border border-ifab-border"
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ifab-border bg-ifab-bg-soft">
        <Sparkles size={16} className="text-ifab-blue" />
        <span className="text-sm font-medium text-ifab-navy">Assistente AI</span>
        {finished && (
          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle2 size={14} /> completato
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        className={`ifab-scrollbar flex flex-col gap-2 overflow-y-auto px-4 py-3 ${
          isPanel ? "min-h-0 flex-1" : "max-h-72"
        }`}
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-ifab-blue text-white"
                  : "bg-ifab-bg-soft text-ifab-text border border-ifab-border"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-1 pl-1">
            <span className="w-1.5 h-1.5 bg-ifab-blue rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-ifab-blue rounded-full animate-bounce [animation-delay:0.1s]" />
            <span className="w-1.5 h-1.5 bg-ifab-blue rounded-full animate-bounce [animation-delay:0.2s]" />
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-ifab-border p-2.5">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || disabled}
          placeholder={disabled ? "Sezione non ancora sbloccata" : "Scrivi la tua risposta..."}
          className="flex-1 rounded-lg border border-ifab-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifab-blue disabled:bg-ifab-bg-soft"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || disabled || !input.trim()}
          className="flex items-center justify-center rounded-lg bg-ifab-blue px-3 py-2 text-white transition hover:bg-ifab-blue-dark disabled:bg-ifab-text-muted"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
