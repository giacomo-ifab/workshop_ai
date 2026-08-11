// Configurazione del Blocco 1 — "Identificazione Opportunità AI"
// Contenuto ricostruito da "flusso tool.docx" e dall'esempio precompilato
// "Workshop1_Identificazione_Opportunita_AI.docx". Parametrizzato qui in un
// unico punto così i testi/domande possono essere aggiornati senza toccare i componenti.

import { CategoryKey, StepBKey } from "@/lib/types";

export const COMPLETION_TOKEN = "[STEP_COMPLETATO]";

export type Activity = { key: string; label: string };

export type CategoryConfig = {
  key: CategoryKey;
  label: string;
  description: string;
  activities: Activity[];
};

export const CATEGORIES: CategoryConfig[] = [
  {
    key: "ripetitive",
    label: "Attività ripetitive ad alta frequenza e bassa variabilità",
    description:
      "Operazioni che si ripetono con modalità pressoché identiche e assorbono tempo delle persone senza richiedere ogni volta una decisione nuova.",
    activities: [
      { key: "ricopiature", label: "Ricopiature" },
      { key: "inserimento_dati", label: "Inserimento dati" },
      { key: "classificazioni", label: "Classificazioni" },
      { key: "controlli_ricorrenti", label: "Controlli ricorrenti" },
    ],
  },
  {
    key: "analisiDati",
    label: "Processi che richiedono analisi di grandi volumi di dati",
    description:
      "Reportistica ricorrente, riconciliazioni, segmentazioni di clienti o fornitori, individuazione di anomalie e scostamenti, previsioni e correlazioni tra fonti diverse.",
    activities: [
      { key: "reportistica_ricorrente", label: "Reportistica ricorrente" },
      { key: "riconciliazioni", label: "Riconciliazioni" },
      { key: "segmentazioni", label: "Segmentazioni" },
      { key: "individuazione_anomalie", label: "Individuazione di anomalie" },
      { key: "previsioni", label: "Previsioni" },
      { key: "correlazioni", label: "Correlazioni" },
    ],
  },
  {
    key: "documentazione",
    label: "Attività di documentazione e content creation standardizzabili",
    description:
      "Verbali, sintesi, bozze di offerte e risposte, aggiornamenti di knowledge base, traduzioni, prime stesure di testi che seguono uno schema prevedibile.",
    activities: [
      { key: "verbali", label: "Verbali" },
      { key: "sintesi", label: "Sintesi" },
      { key: "offerte", label: "Bozze di offerte/risposte" },
      { key: "traduzioni", label: "Traduzioni" },
      { key: "produzione_testi", label: "Produzione testi" },
    ],
  },
  {
    key: "decisioni",
    label: "Decisioni basate su pattern identificabili o regole definite",
    description:
      "Triage e smistamento di richieste, attribuzioni di priorità, controlli di conformità, approvazioni entro soglie prestabilite.",
    activities: [
      { key: "triage_smistamento", label: "Triage e smistamento richieste" },
      { key: "attribuzione_priorita", label: "Attribuzione di priorità" },
      { key: "controlli_conformita", label: "Controlli di conformità" },
      { key: "approvazioni_soglie", label: "Approvazioni con soglie prestabilite" },
    ],
  },
];

export type StepBConfig = {
  key: StepBKey;
  label: string;
  questions: string[];
  lettura: string;
};

export const STEP_B_CONFIG: Record<StepBKey, StepBConfig> = {
  variabilita: {
    key: "variabilita",
    label: "Variabilità",
    questions: [
      "L'attività segue sempre gli stessi passaggi o varia in funzione del caso, del cliente o della richiesta?",
      "I dati o documenti in ingresso hanno formato costante (stesso modulo, stessi campi) o eterogeneo per fonte, layout e lingua?",
      "Le regole di inserimento/classificazione sono stabili nel tempo o cambiano di frequente?",
      "Quando si presenta un caso nuovo o ambiguo, come viene gestito oggi e con quanta discrezionalità?",
    ],
    lettura:
      "Bassa variabilità + input costanti → automazione deterministica; alta variabilità → soluzioni con capacità interpretativa e human-in-the-loop.",
  },
  dati: {
    key: "dati",
    label: "Disponibilità e qualità dei dati",
    questions: [
      "Quali dati alimentano l'attività e dove risiedono (sistemi gestionali, file, fonti esterne)?",
      "I dati sono accessibili in modo strutturato (database, API) o dispersi in Excel, PDF ed e-mail?",
      "Qual è la profondità storica disponibile ed è sufficiente a cogliere pattern, stagionalità o trend?",
      "I volumi (record, transazioni) giustificano un approccio automatizzato o predittivo?",
    ],
    lettura:
      "Dati strutturati, storicizzati e di buona qualità → ML/analytics e previsione affidabili; dati frammentati → prima un intervento di data readiness.",
  },
  docStandard: {
    key: "docStandard",
    label: "Documenti standard",
    questions: [
      "Esistono modelli, template o format standard per l'output, con struttura e sezioni definite?",
      "Quanta parte del contenuto è ripetitiva o riutilizzabile e quanta richiede rielaborazione originale?",
      "Da quali fonti si attinge per produrre il testo (documenti interni, knowledge base, input del cliente)?",
      "Vanno rispettati vincoli di conformità, terminologia specialistica o linee guida di brand?",
    ],
    lettura:
      "Presenza di template, fonti tracciabili ed esempi di riferimento → GenAI con grounding (RAG); testo altamente creativo o non ancorato → prompting.",
  },
  criteri: {
    key: "criteri",
    label: "Criteri e regole definite",
    questions: [
      "Le decisioni si basano su criteri espliciti e documentati o sull'esperienza e sul giudizio della persona?",
      "Le regole sono formalizzate (procedure, soglie, matrici) e aggiornate, o risiedono nella conoscenza tacita delle persone?",
      "Quali input sono necessari per decidere e sono sempre disponibili al momento della decisione?",
      "Le soglie e le priorità sono quantificabili o restano qualitative?",
    ],
    lettura:
      "Regole esplicite, quantificabili e tracciate → automazione decisionale con supervisione proporzionata al rischio; logica tacita → prima formalizzazione, poi decision support.",
  },
};

export const AREE_FUNZIONALI = [
  "Amministrativa",
  "Dati",
  "Gare e bandi",
  "Giuslavoristica",
  "Servizi alle associate",
  "Tecnico-segretariale",
  "Altro",
];

function baseAgentRules() {
  return `**REGOLE ASSOLUTE**:
- Fai UNA SOLA domanda alla volta, breve e concreta. Niente elenchi lunghi.
- Usa il "tu", tono amichevole e professionale.
- Se l'utente fornisce più informazioni insieme, deducile e salta le domande già coperte.
- Quando ritieni di avere risposte sufficienti su tutti i punti richiesti, chiudi il messaggio con il token ${COMPLETION_TOKEN} (l'utente non lo vedrà).
- Resta sempre in italiano.`;
}

/** System prompt per l'agente di Step A (form di descrizione del processo). */
export function buildStepASystemPrompt(selectedActivityLabels: string[]): string {
  const attivitaText =
    selectedActivityLabels.length > 0
      ? `Le attività che l'utente ha indicato come svolte nel proprio lavoro sono: ${selectedActivityLabels.join(", ")}.`
      : "L'utente non ha ancora selezionato attività specifiche: chiedi prima di quale processo vuole parlare.";

  return `Sei un facilitatore esperto che aiuta i partecipanti di un workshop di AI Adoption a descrivere un processo di lavoro candidato all'automazione con l'AI.

${attivitaText}

**IL TUO OBIETTIVO**: aiutare l'utente a compilare questi campi, con domande mirate se una risposta è vaga o incompleta:
1. Processo (nome/area del processo)
2. Attività svolte, inclusi gli strumenti usati oggi
3. Descrizione e caratteristiche del processo (come si svolge, chi è coinvolto)
4. FTE stimati: durata media per esecuzione × frequenza × numero di persone coinvolte

${baseAgentRules()}
- Non uscire dal perimetro della descrizione del processo: non valutare ancora se/come l'AI dovrebbe intervenire, ci sarà una fase successiva dedicata.`;
}

/** System prompt per l'agente di una sottosezione di Step B (una delle 4 dimensioni). */
export function buildStepBSystemPrompt(dimension: StepBKey, processoContext: string): string {
  const cfg = STEP_B_CONFIG[dimension];
  const questionsList = cfg.questions.map((q, i) => `${i + 1}. ${q}`).join("\n");

  return `Sei un facilitatore esperto che aiuta un partecipante di un workshop di AI Adoption ad approfondire la dimensione "${cfg.label}" del processo che sta descrivendo.

Contesto del processo (da Step A): ${processoContext || "non ancora specificato"}.

**DOMANDE GUIDA DA COPRIRE** (falle una alla volta, nell'ordine che ha più senso in base a cosa risponde l'utente):
${questionsList}

${baseAgentRules()}
- Non anticipare raccomandazioni di soluzioni AI: quello avverrà in una fase finale del workshop, fuori da questa sezione. Qui limitati a raccogliere informazioni chiare su "${cfg.label}".`;
}

/** Messaggio iniziale mostrato dall'agente all'apertura di ciascuna sottosezione. */
export function initialMessageForStepB(dimension: StepBKey): string {
  const cfg = STEP_B_CONFIG[dimension];
  return `Parliamo di "${cfg.label}" per il tuo processo. ${cfg.questions[0]}`;
}

export const INITIAL_MESSAGE_STEP_A =
  "Ciao! Iniziamo a descrivere il tuo processo: qual è il processo o l'attività che vuoi raccontare, e con quali strumenti lo svolgi oggi?";

/** Data una chiave di attività (es. "ricopiature"), risale alla categoria che la contiene. */
export function categoryForActivity(activityKey: string): CategoryKey | undefined {
  return CATEGORIES.find((c) => c.activities.some((a) => a.key === activityKey))?.key;
}
