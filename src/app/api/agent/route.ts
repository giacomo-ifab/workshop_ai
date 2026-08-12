import { NextResponse } from "next/server";
import { getOpenAI, CHAT_MODEL } from "@/lib/openaiClient";
import { buildStep1SystemPrompt, buildStep2SystemPrompt } from "@/config/block1Frizione";
import { buildBlock2SystemPrompt } from "@/config/block2Form";

/**
 * Tutti gli agenti sono assistenti di supporto alla compilazione: spiegano,
 * chiariscono e aiutano a concretizzare, ma non conducono un'intervista da
 * completare (il token di fine step resta gestito qui per compatibilità).
 */
function systemPromptFor(
  subsection: string,
  context: {
    selectedActivityLabels?: string[];
    processoContext?: string;
    sectionLabel?: string;
  }
): string | null {
  switch (subsection) {
    case "step1":
      return buildStep1SystemPrompt();
    case "step2":
      return buildStep2SystemPrompt(context.selectedActivityLabels ?? []);
    case "block2":
      return buildBlock2SystemPrompt(context.processoContext ?? "", context.sectionLabel);
    default:
      return null;
  }
}

export async function POST(req: Request) {
  try {
    const { subsection, messages, context } = await req.json();

    if (!subsection || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
    }

    const systemPrompt = systemPromptFor(subsection, context ?? {});
    if (!systemPrompt) {
      return NextResponse.json({ error: "subsection non valida" }, { status: 400 });
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: { role: "user" | "assistant"; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      temperature: 0.6,
    });

    // Gli assistenti sono di supporto: non concludono step, quindi `finished`
    // resta sempre false (il campo è mantenuto per il contratto con AgentChat).
    const reply = (response.choices[0]?.message?.content ?? "").trim();
    return NextResponse.json({ reply, finished: false });
  } catch (error) {
    console.error("Errore agente AI:", error);
    const message = error instanceof Error ? error.message : "Errore interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
