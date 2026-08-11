// Configurazione del Blocco 1 — "Identificazione Opportunità AI"
// Le attività e l'abbinamento attività → caratteristica seguono lo schema del
// workshop (tabella ATTIVITÀ / CARATTERISTICHE); le domande di indagine sono la
// versione ridotta a due per caratteristica del set fornito dai facilitatori.
// Tutto il contenuto sta qui: i componenti degli step e i prompt si generano da
// questa configurazione.

import { CategoryKey, CharacteristicKey } from "@/lib/types";

export const COMPLETION_TOKEN = "[STEP_COMPLETATO]";

/** Quante attività passano allo Step 3 (le più onerose in ore/anno). */
export const TOP_ATTIVITA_COUNT = 3;

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
    ],
  },
  {
    key: "analisiDati",
    label: "Processi che richiedono analisi di grandi volumi di dati",
    description:
      "Controlli ricorrenti, reportistica, riconciliazioni, segmentazioni, individuazione di anomalie, previsioni e correlazioni tra fonti diverse.",
    activities: [
      { key: "controlli_ricorrenti", label: "Controlli ricorrenti" },
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
      "Verbali, sintesi, bozze di offerte e risposte, traduzioni, prime stesure di testi che seguono uno schema prevedibile.",
    activities: [
      { key: "verbali", label: "Verbali" },
      { key: "sintesi", label: "Sintesi" },
      { key: "offerte", label: "Offerte" },
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
      { key: "attribuzione_priorita", label: "Attribuzioni di priorità" },
      { key: "controlli_conformita", label: "Controlli di conformità" },
      { key: "approvazioni_soglie", label: "Approvazioni con soglie prestabilite" },
    ],
  },
];

/** Spiegazione breve di ogni attività, mostrata come tooltip/aiuto nello Step 1. */
export const ACTIVITY_DESCRIPTIONS: Record<string, string> = {
  ricopiature: "Trasferire a mano dati da un documento o sistema a un altro, senza rielaborarli.",
  inserimento_dati: "Digitare dati in un gestionale, un portale o un foglio di calcolo.",
  classificazioni: "Assegnare a documenti, richieste o record una categoria da un elenco predefinito.",
  controlli_ricorrenti: "Verifiche che si ripetono a cadenza fissa su dati o pratiche (quadrature, check di completezza).",
  reportistica_ricorrente: "Produrre report periodici estraendo e aggregando dati da una o più fonti.",
  riconciliazioni: "Confrontare due o più fonti per far quadrare importi, quantità o anagrafiche.",
  segmentazioni: "Raggruppare clienti, fornitori o pratiche per caratteristiche comuni.",
  individuazione_anomalie: "Individuare scostamenti, errori o casi fuori norma dentro un insieme di dati.",
  previsioni: "Stimare valori futuri (domanda, carichi, scadenze) a partire dallo storico.",
  correlazioni: "Mettere in relazione fenomeni o fonti diverse per spiegare un andamento.",
  verbali: "Redigere resoconti di riunioni o incontri a partire da appunti o registrazioni.",
  sintesi: "Riassumere documenti lunghi mantenendo le informazioni rilevanti.",
  offerte: "Preparare bozze di offerte, preventivi o risposte che seguono uno schema ricorrente.",
  traduzioni: "Tradurre documenti o comunicazioni mantenendo la terminologia di settore.",
  produzione_testi: "Scrivere testi che seguono una struttura prevedibile (schede, comunicazioni, procedure).",
  triage_smistamento: "Smistare richieste in arrivo verso la persona o la coda competente.",
  attribuzione_priorita: "Attribuire una priorità o un livello di urgenza a richieste e pratiche.",
  controlli_conformita: "Verificare che una pratica rispetti requisiti, regole o standard definiti.",
  approvazioni_soglie: "Approvare o respingere in base a soglie e criteri stabiliti in anticipo.",
};

export type CharacteristicQuestion = {
  id: string;
  text: string;
  hint?: string;
};

export type CharacteristicConfig = {
  key: CharacteristicKey;
  label: string;
  /** Massimo due domande: l'indagine deve restare snella. */
  questions: CharacteristicQuestion[];
  lettura: string;
};

export const CHARACTERISTICS: Record<CharacteristicKey, CharacteristicConfig> = {
  variabilita: {
    key: "variabilita",
    label: "Variabilità",
    questions: [
      {
        id: "passaggi",
        text: "L'attività segue sempre gli stessi passaggi o varia in funzione del caso, del cliente o della richiesta?",
        hint: "Se varia, indica da cosa dipende la variazione e quanto è frequente.",
      },
      {
        id: "input",
        text: "I dati o documenti in ingresso hanno formato costante (stesso modulo, stessi campi) o eterogeneo per fonte, layout e lingua?",
      },
    ],
    lettura:
      "Bassa variabilità + input costanti → automazione deterministica; alta variabilità → soluzioni con capacità interpretativa e human-in-the-loop.",
  },
  dati: {
    key: "dati",
    label: "Disponibilità e qualità dei dati",
    questions: [
      {
        id: "fonti",
        text: "Quali dati alimentano l'attività e dove risiedono (gestionali, file, fonti esterne)?",
      },
      {
        id: "accessibilita",
        text: "Sono accessibili in modo strutturato (database, API) o dispersi in Excel, PDF ed e-mail?",
        hint: "Se utile, aggiungi profondità storica e volumi indicativi.",
      },
    ],
    lettura:
      "Dati strutturati, storicizzati e di buona qualità → ML/analytics e previsione affidabili; dati frammentati → prima un intervento di data readiness.",
  },
  docStandard: {
    key: "docStandard",
    label: "Documenti standard",
    questions: [
      {
        id: "template",
        text: "Esistono modelli, template o format standard per l'output, con struttura e sezioni definite?",
      },
      {
        id: "riuso",
        text: "Quanta parte del contenuto è ripetitiva o riutilizzabile e quanta richiede rielaborazione originale?",
        hint: "Indica anche da quali fonti si attinge e se ci sono vincoli di terminologia o conformità.",
      },
    ],
    lettura:
      "Presenza di template, fonti tracciabili ed esempi di riferimento → GenAI con grounding (RAG); testo altamente creativo o non ancorato → prompting.",
  },
  criteri: {
    key: "criteri",
    label: "Criteri e regole definite",
    questions: [
      {
        id: "criteri",
        text: "Le decisioni si basano su criteri espliciti e documentati o sull'esperienza e sul giudizio della persona?",
      },
      {
        id: "formalizzazione",
        text: "Le regole sono formalizzate (procedure, soglie, matrici) e aggiornate, o risiedono nella conoscenza tacita delle persone?",
        hint: "Se ci sono soglie, indica se sono quantificabili.",
      },
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

const ALL_ACTIVITIES: (Activity & { category: CategoryKey })[] = CATEGORIES.flatMap((c) =>
  c.activities.map((a) => ({ ...a, category: c.key }))
);

/** Data una chiave di attività (es. "ricopiature"), risale al gruppo che la contiene. */
export function categoryForActivity(activityKey: string): CategoryKey | undefined {
  return ALL_ACTIVITIES.find((a) => a.key === activityKey)?.category;
}

export function labelForActivity(activityKey: string): string {
  return ALL_ACTIVITIES.find((a) => a.key === activityKey)?.label ?? activityKey;
}

/** Chiave della risposta di Step 3 per una domanda di una caratteristica. */
export function answerKey(characteristic: CharacteristicKey, questionId: string): string {
  return `${characteristic}:${questionId}`;
}

function supportAgentRules() {
  return `**REGOLE ASSOLUTE**
- Rispondi in italiano, con il "tu", tono amichevole e concreto.
- Risposte brevi: massimo 5-6 righe o 3-4 punti elenco. Una sola domanda di chiarimento alla volta.
- Non compilare i campi al posto del partecipante e non inventare dati aziendali: proponi formulazioni e chiedi conferma.
- Resta nel perimetro dello step in corso: non anticipare raccomandazioni di soluzioni AI, arrivano più avanti nel workshop.`;
}

function activityCatalogue(): string {
  return CATEGORIES.map((c) => {
    const attivita = c.activities
      .map((a) => `   - ${a.label}: ${ACTIVITY_DESCRIPTIONS[a.key] ?? ""}`)
      .join("\n");
    return `${c.label}\n${attivita}`;
  }).join("\n");
}

/** Step 1 — l'agente spiega che cosa si intende per ciascuna attività. */
export function buildStep1SystemPrompt(selectedActivityLabels: string[]): string {
  const selezione =
    selectedActivityLabels.length > 0
      ? `Al momento il partecipante ha selezionato: ${selectedActivityLabels.join(", ")}.`
      : "Il partecipante non ha ancora selezionato nulla.";

  return `Sei un facilitatore esperto di adozione dell'AI. Un partecipante sta scegliendo, da un elenco, le attività che svolge nei propri processi di lavoro. Può selezionarne più di una.

${selezione}

**ELENCO DELLE ATTIVITÀ** (raggruppate per tipologia):
${activityCatalogue()}

**COSA FAI**
- Spieghi che cosa si intende con una certa voce dell'elenco, con un esempio concreto di ufficio o di reparto.
- Aiuti a capire se una attività che il partecipante descrive a parole rientra in una delle voci, e in quale.
- Se un'attività raccontata non rientra in nessuna voce, dillo con franchezza e suggerisci la voce più vicina.

${supportAgentRules()}`;
}

/** Step 2 — l'agente aiuta a stimare durata, frequenza e persone coinvolte. */
export function buildStep2SystemPrompt(selectedActivityLabels: string[]): string {
  const selezione =
    selectedActivityLabels.length > 0
      ? `Le attività su cui sta lavorando sono: ${selectedActivityLabels.join(", ")}.`
      : "Il partecipante non ha ancora selezionato attività nello Step 1.";

  return `Sei un facilitatore esperto di adozione dell'AI. Un partecipante sta stimando quanto tempo assorbono le attività che ha selezionato, per capire quali pesano di più sull'organizzazione.

${selezione}

Per ogni attività il form chiede tre numeri: durata media di una esecuzione (in minuti), frequenza (quante volte per giorno/settimana/mese/anno) e numero di persone che la svolgono. Il tempo assorbito viene calcolato come durata × frequenza annua × persone e mostrato in ore/anno.

**COSA FAI**
- Aiuti a stimare quando il partecipante non ha il dato preciso: suggerisci di ragionare su una giornata tipo, su un intervallo (minimo–massimo) e di prendere il valore centrale.
- Fai notare gli ordini di grandezza sospetti (una durata di 8 ore per un'attività dichiarata "più volte al giorno", frequenze incompatibili fra loro).
- Ricordi che conta il tempo complessivo dell'organizzazione, non quello della singola persona: un'attività breve ma svolta da molti può pesare più di una lunga e rara.

${supportAgentRules()}`;
}

/** Step 3 — l'agente spiega le domande sulle caratteristiche e aiuta a rispondere. */
export function buildStep3SystemPrompt(
  characteristicLabels: string[],
  attivitaLabels: string[]
): string {
  const caratteristiche = characteristicLabels.length > 0 ? characteristicLabels.join(", ") : "nessuna";
  const attivita = attivitaLabels.length > 0 ? attivitaLabels.join(", ") : "non ancora individuate";

  const domande = CHARACTERISTIC_LIST.map((c) => {
    const qs = c.questions.map((q) => `   - ${q.text}`).join("\n");
    return `${c.label}\n${qs}\n   Lettura: ${c.lettura}`;
  }).join("\n");

  return `Sei un facilitatore esperto di adozione dell'AI. Un partecipante sta descrivendo le caratteristiche delle attività che assorbono più tempo nella sua organizzazione: ${attivita}. Le caratteristiche da indagare, determinate dal tipo di attività, sono: ${caratteristiche}.

**DOMANDE DEL FORM E CHIAVE DI LETTURA**
${domande}

**COSA FAI**
- Spieghi che cosa vuole sapere una domanda e perché è rilevante per capire se e come l'AI può intervenire.
- Se il partecipante ti incolla una risposta abbozzata, gliela restituisci più chiara e specifica, mantenendo le sue informazioni.
- Chiedi esempi concreti quando la risposta resta generica ("dipende", "a volte"): un caso tipico vale più di un aggettivo.

${supportAgentRules()}`;
}

const CHARACTERISTIC_LIST: CharacteristicConfig[] = Object.values(CHARACTERISTICS);

export const INITIAL_MESSAGE_STEP1 =
  "Ciao! Se una voce dell'elenco non ti è chiara, chiedimi pure che cosa significa: ti faccio un esempio concreto. Puoi anche raccontarmi un'attività che svolgi e ti dico in quale voce rientra.";

export const INITIAL_MESSAGE_STEP2 =
  "Qui servono tre numeri per attività: durata media, frequenza e quante persone la svolgono. Se non hai i dati precisi aiutami a ragionarci: partiamo da una giornata tipo e stimiamo insieme un ordine di grandezza.";

export const INITIAL_MESSAGE_STEP3 =
  "Per ogni attività più onerosa c'è una caratteristica da approfondire, con una o due domande. Se una domanda non ti è chiara chiedimi pure, oppure incollami la tua risposta e te la aiuto a rendere più concreta.";
