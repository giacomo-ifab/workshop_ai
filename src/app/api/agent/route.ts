import { NextResponse } from "next/server";
import { getOpenAI, CHAT_MODEL } from "@/lib/openaiClient";
import { COMPLETION_TOKEN, buildStepASystemPrompt, buildStepBSystemPrompt } from "@/config/block1Flow";
import { buildBlock2SystemPrompt } from "@/config/block2Form";
import { StepBKey } from "@/lib/types";

const STEP_B_KEYS = ["variabilita", "dati", "docStandard", "criteri"];

export async function POST(req: Request) {
  try {
    const { subsection, messages, context } = await req.json();

    if (!subsection || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
    }

    let systemPrompt: string;
    if (subsection === "stepA") {
      systemPrompt = buildStepASystemPrompt(context?.selectedActivityLabels ?? []);
    } else if (STEP_B_KEYS.includes(subsection)) {
      systemPrompt = buildStepBSystemPrompt(subsection as StepBKey, context?.processoContext ?? "");
    } else if (subsection === "block2") {
      // Agente di supporto alla compilazione: nessuna intervista da completare,
      // quindi non emette il token di fine step.
      systemPrompt = buildBlock2SystemPrompt(context?.processoContext ?? "", context?.sectionLabel);
    } else {
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

    const reply = response.choices[0]?.message?.content ?? "";
    const finished = reply.includes(COMPLETION_TOKEN);
    const cleanReply = reply.replace(COMPLETION_TOKEN, "").trim();

    return NextResponse.json({ reply: cleanReply, finished });
  } catch (error) {
    console.error("Errore agente AI:", error);
    const message = error instanceof Error ? error.message : "Errore interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
