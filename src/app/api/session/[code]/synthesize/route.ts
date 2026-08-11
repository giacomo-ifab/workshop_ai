import { NextResponse } from "next/server";
import { getOpenAI, CHAT_MODEL } from "@/lib/openaiClient";
import { getSubmission, saveStepC, saveStepBAnswer } from "@/lib/session";
import { CATEGORIES, STEP_B_CONFIG } from "@/config/block1Flow";
import { STEP_B_KEYS, StepBKey } from "@/lib/types";

const ALL_ACTIVITIES = CATEGORIES.flatMap((c) => c.activities);

function labelForActivity(key: string): string {
  return ALL_ACTIVITIES.find((a) => a.key === key)?.label ?? key;
}

const SYNTHESIS_SYSTEM_PROMPT = `Sei un analista che rielabora quanto raccolto in un workshop di AI Adoption su un processo di lavoro candidato.

Riceverai: la descrizione del processo (Step A) e, per ciascuna dimensione valutata (Step B), la trascrizione della conversazione con il partecipante.

Genera un JSON con questa struttura esatta:
{
  "sintesiGenerale": "sintesi testuale (150-250 parole) del processo candidato, nello stile di una scheda di workshop: cosa fa oggi il processo, con quali strumenti, e cosa emerge dalle dimensioni analizzate. Puramente descrittiva.",
  "stepBSummaries": { "<dimensione>": "riassunto in 2-3 frasi di quanto emerso per quella dimensione, basato SOLO sulla conversazione" },
  "profilo": { "<dimensione>": punteggio da 1 a 5 }
}

Criteri punteggio 1-5 per dimensione (puramente descrittivo, NON è una raccomandazione di soluzione):
- variabilita: 1 = molto variabile/imprevedibile, 5 = molto standardizzata/ripetitiva
- dati: 1 = dati frammentati/scarsi, 5 = dati strutturati/storicizzati/di buona qualità
- docStandard: 1 = nessun template, contenuto sempre originale, 5 = template solidi e contenuto ampiamente riutilizzabile
- criteri: 1 = giudizio tacito/non formalizzato, 5 = criteri espliciti, quantificabili e tracciati

REGOLE:
- Rispondi SOLO con JSON valido.
- NON includere raccomandazioni su quale tecnologia/approccio AI adottare: qui serve solo descrivere quanto raccolto. Quella valutazione arriverà in una fase successiva del workshop.
- Se una dimensione non è stata trattata, omettila da "stepBSummaries" e "profilo".
- Basati esclusivamente su quanto detto nelle conversazioni fornite.`;

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const { participantId } = await req.json();

    if (!participantId) {
      return NextResponse.json({ error: "participantId mancante" }, { status: 400 });
    }

    const submission = await getSubmission(code, participantId);
    const stepA = submission.stepA;
    if (!stepA) {
      return NextResponse.json({ error: "Step A non ancora compilato" }, { status: 400 });
    }

    const attivitaLabels = (stepA.attivitaSelezionate ?? []).map(labelForActivity);

    const stepAText = [
      `Processo: ${stepA.processo ?? "n/d"}`,
      `Attività selezionate: ${attivitaLabels.join(", ") || "nessuna"}`,
      `Attività e strumenti: ${stepA.attivitaStrumenti ?? "n/d"}`,
      `Descrizione e caratteristiche: ${stepA.descrizione ?? "n/d"}`,
      `FTE: durata ${stepA.fteDurata ?? "n/d"} × frequenza ${stepA.fteFrequenza ?? "n/d"} × persone ${stepA.ftePersone ?? "n/d"}`,
    ].join("\n");

    const answeredDimensions = STEP_B_KEYS.filter((k) => submission.stepB?.[k]?.chatLog?.length);

    const stepBText = answeredDimensions
      .map((dim) => {
        const chatLog = submission.stepB?.[dim]?.chatLog ?? [];
        const transcript = chatLog.map((m) => `${m.role === "user" ? "PARTECIPANTE" : "FACILITATORE AI"}: ${m.content}`).join("\n");
        return `--- Dimensione: ${dim} (${STEP_B_CONFIG[dim].label}) ---\n${transcript}`;
      })
      .join("\n\n");

    const userContent = `STEP A - DESCRIZIONE PROCESSO:\n${stepAText}\n\nSTEP B - CONVERSAZIONI PER DIMENSIONE:\n${stepBText || "(nessuna dimensione approfondita)"}`;

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: SYNTHESIS_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as {
      sintesiGenerale?: string;
      stepBSummaries?: Partial<Record<StepBKey, string>>;
      profilo?: Partial<Record<StepBKey, number>>;
    };

    // Backfill sintesi + lettura statica per ciascuna dimensione trattata
    await Promise.all(
      answeredDimensions.map((dim) =>
        saveStepBAnswer(code, participantId, dim, {
          chatLog: submission.stepB?.[dim]?.chatLog ?? [],
          sintesi: parsed.stepBSummaries?.[dim],
          lettura: STEP_B_CONFIG[dim].lettura,
        })
      )
    );

    const updated = await saveStepC(code, participantId, {
      sintesi: parsed.sintesiGenerale,
      profilo: parsed.profilo,
      generatedAt: Date.now(),
    });

    return NextResponse.json({ submission: updated });
  } catch (error) {
    console.error("Errore sintesi Step C:", error);
    const message = error instanceof Error ? error.message : "Errore interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
