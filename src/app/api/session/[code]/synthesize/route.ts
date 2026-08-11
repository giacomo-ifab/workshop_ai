import { NextResponse } from "next/server";
import { getOpenAI, CHAT_MODEL } from "@/lib/openaiClient";
import { getSubmission, saveStep4 } from "@/lib/session";
import {
  CHARACTERISTICS,
  answerKey,
  categoryForActivity,
  labelForActivity,
} from "@/config/block1Flow";
import { CATEGORY_TO_CHARACTERISTIC, CharacteristicKey, oreAnnue } from "@/lib/types";

const SYNTHESIS_SYSTEM_PROMPT = `Sei un analista che rielabora quanto raccolto in un workshop di AI Adoption.

Riceverai: il contesto organizzativo del partecipante, le attività che svolge con la stima del tempo che assorbono (ore/anno), e le risposte alle domande sulle caratteristiche delle attività più onerose.

Genera un JSON con questa struttura esatta:
{
  "sintesiGenerale": "sintesi testuale (150-250 parole) nello stile di una scheda di workshop: quali attività assorbono più tempo e perché, e cosa emerge dalle caratteristiche indagate. Puramente descrittiva.",
  "profilo": { "<caratteristica>": punteggio da 1 a 5 }
}

Criteri punteggio 1-5 per caratteristica (puramente descrittivo, NON è una raccomandazione di soluzione):
- variabilita: 1 = molto variabile/imprevedibile, 5 = molto standardizzata/ripetitiva
- dati: 1 = dati frammentati/scarsi, 5 = dati strutturati/storicizzati/di buona qualità
- docStandard: 1 = nessun template, contenuto sempre originale, 5 = template solidi e contenuto ampiamente riutilizzabile
- criteri: 1 = giudizio tacito/non formalizzato, 5 = criteri espliciti, quantificabili e tracciati

REGOLE:
- Rispondi SOLO con JSON valido.
- NON includere raccomandazioni su quale tecnologia/approccio AI adottare: qui serve solo descrivere quanto raccolto. Quella valutazione arriverà in una fase successiva del workshop.
- Metti in "profilo" solo le caratteristiche per cui hai ricevuto risposte.
- Basati esclusivamente sui dati forniti: se una stima manca, dillo invece di inventarla.`;

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const { participantId } = await req.json();

    if (!participantId) {
      return NextResponse.json({ error: "participantId mancante" }, { status: 400 });
    }

    const submission = await getSubmission(code, participantId);
    const step1 = submission.step1;
    if (!step1?.attivitaSelezionate?.length) {
      return NextResponse.json({ error: "Step 1 non ancora compilato" }, { status: 400 });
    }

    const effort = submission.step2?.effort ?? {};
    const top = submission.step2?.topAttivita ?? [];

    const contestoText = [
      `Dipartimento: ${step1.dipartimento || "n/d"}`,
      `Area funzionale: ${step1.areaFunzionale || "n/d"}`,
    ].join("\n");

    const attivitaText = step1.attivitaSelezionate
      .map((key) => {
        const ore = oreAnnue(effort[key]);
        const e = effort[key];
        const dettaglio = e
          ? `durata ${e.durataMinuti ?? "n/d"} min × ${e.frequenzaNumero ?? "n/d"} volte/${e.frequenzaPeriodo ?? "n/d"} × ${e.persone ?? "n/d"} persone`
          : "stima non fornita";
        const oreText = ore !== null ? `${Math.round(ore)} ore/anno` : "ore/anno non calcolabili";
        const flag = top.includes(key) ? " [FRA LE PIÙ ONEROSE]" : "";
        return `- ${labelForActivity(key)}: ${dettaglio} → ${oreText}${flag}`;
      })
      .join("\n");

    // Caratteristiche effettivamente indagate: derivate dalle attività più onerose.
    const caratteristiche = Array.from(
      new Set(
        top
          .map((key) => categoryForActivity(key))
          .filter((c): c is NonNullable<typeof c> => Boolean(c))
          .map((c) => CATEGORY_TO_CHARACTERISTIC[c])
      )
    );

    const risposte = submission.step3?.risposte ?? {};
    const caratteristicheText = caratteristiche
      .map((k: CharacteristicKey) => {
        const cfg = CHARACTERISTICS[k];
        const qa = cfg.questions
          .map((q) => `  D: ${q.text}\n  R: ${risposte[answerKey(k, q.id)] || "(nessuna risposta)"}`)
          .join("\n");
        return `--- Caratteristica: ${k} (${cfg.label}) ---\n${qa}\n  Chiave di lettura: ${cfg.lettura}`;
      })
      .join("\n\n");

    const userContent = `CONTESTO:\n${contestoText}\n\nATTIVITÀ E TEMPO ASSORBITO:\n${attivitaText}\n\nCARATTERISTICHE INDAGATE:\n${
      caratteristicheText || "(nessuna caratteristica ancora indagata)"
    }`;

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
      profilo?: Partial<Record<CharacteristicKey, number>>;
    };

    const updated = await saveStep4(code, participantId, {
      sintesi: parsed.sintesiGenerale,
      profilo: parsed.profilo,
      generatedAt: Date.now(),
    });

    return NextResponse.json({ submission: updated });
  } catch (error) {
    console.error("Errore sintesi Step 4:", error);
    const message = error instanceof Error ? error.message : "Errore interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
