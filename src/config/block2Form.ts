// Configurazione del Blocco 2 — "Use Case Submission"
// Struttura ricalcata sul template "Workshop1_Template_Use_Case_Submission_1_page.docx":
// stesse sezioni, stessi campi e stesse opzioni delle caselle da spuntare.
// Come per il Blocco 1, il contenuto sta tutto qui: form, prompt dell'agente e
// argomenti dell'intervista si generano da questa configurazione.

import { Block2FieldValue } from "@/lib/types";

export const BLOCK2_COMPLETION_HINT =
  "Non esiste una risposta perfetta: annota quello che sai oggi e segnala esplicitamente ciò che va ancora verificato.";

export type Block2FieldType = "textarea" | "text" | "radio" | "checkbox";

export type Block2Option = { value: string; label: string };

export type Block2Field = {
  id: string;
  label: string;
  type: Block2FieldType;
  /** Testo guida mostrato sotto l'etichetta (le indicazioni del template). */
  hint?: string;
  placeholder?: string;
  rows?: number;
  options?: Block2Option[];
};

export type Block2Section = {
  key: string;
  number: string;
  title: string;
  fields: Block2Field[];
};

export const BLOCK2_SECTIONS: Block2Section[] = [
  {
    key: "problema",
    number: "1.0",
    title: "Problema/opportunità di business",
    fields: [
      {
        id: "problema",
        label: "Problema di business",
        type: "textarea",
        hint: "Processo inefficiente, chi è impattato, costo attuale, conseguenze se non risolto.",
        placeholder:
          "Es. Il controllo qualità di fine linea è manuale e a campione: impatta Qualità e Produzione, costa circa 3 FTE...",
        rows: 6,
      },
    ],
  },
  {
    key: "soluzione",
    number: "1.1",
    title: "Soluzione proposta e risultato atteso",
    fields: [
      {
        id: "soluzione",
        label: "Soluzione proposta",
        type: "textarea",
        hint: "Output del sistema, come cambia il processo, soluzioni simili già esistenti.",
        placeholder:
          "Es. Sistema di visione artificiale a bordo linea che classifica conforme/non conforme in tempo reale...",
        rows: 6,
      },
    ],
  },
  {
    key: "obiettivi",
    number: "1.2",
    title: "Obiettivi strategici",
    fields: [
      {
        id: "obiettivi",
        label: "Obiettivi perseguiti",
        type: "checkbox",
        hint: "Seleziona tutti quelli pertinenti.",
        options: [
          { value: "riduzioneTempi", label: "Riduzione tempi di esecuzione" },
          { value: "diminuzioneErrori", label: "Diminuzione errori/aumentare precisione" },
          { value: "qualitaServizio", label: "Miglioramento qualità servizio" },
          { value: "liberareRisorse", label: "Liberare risorse umane per attività a valore aggiunto" },
          { value: "capacitaAnalitiche", label: "Capacità analitiche avanzate" },
          { value: "personalizzazione", label: "Personalizzazione servizi/offerte" },
          { value: "riduzioneCosti", label: "Riduzione costi operativi" },
          { value: "altro", label: "Altro" },
        ],
      },
      {
        id: "obiettiviAltro",
        label: "Altro — specifica",
        type: "text",
        placeholder: "Compila solo se hai selezionato \"Altro\"",
      },
    ],
  },
  {
    key: "dati",
    number: "1.3",
    title: "Dati e contesto",
    fields: [
      {
        id: "datiNecessari",
        label: "Dati necessari",
        type: "textarea",
        hint: "Quali dati servono al sistema e con quale livello di dettaglio.",
        rows: 4,
      },
      {
        id: "datiDove",
        label: "Dove risiedono",
        type: "textarea",
        hint: "Sistemi, file, fonti esterne, dati da creare; quanto sono accessibili oggi.",
        rows: 4,
      },
      {
        id: "datiVolume",
        label: "Volume dati indicativo",
        type: "textarea",
        hint: "Ordini di grandezza: record/immagini/transazioni per giorno o per anno.",
        rows: 3,
      },
      {
        id: "datiQualita",
        label: "Qualità dei dati percepita",
        type: "radio",
        options: [
          { value: "alta", label: "Alta" },
          { value: "media", label: "Media" },
          { value: "bassa", label: "Bassa" },
          { value: "nonSo", label: "Non so" },
        ],
      },
      {
        id: "datiEtichettati",
        label: "Dati etichettati (ML)",
        type: "radio",
        options: [
          { value: "si", label: "Sì" },
          { value: "parzialmente", label: "Parzialmente" },
          { value: "no", label: "No" },
          { value: "na", label: "N/A" },
        ],
      },
    ],
  },
  {
    key: "impatto",
    number: "1.4",
    title: "Impatto atteso",
    fields: [
      {
        id: "impattoTipo",
        label: "Tipo di impatto",
        type: "radio",
        options: [
          { value: "diretto", label: "Diretto e misurabile" },
          { value: "daValidare", label: "Da validare sperimentalmente" },
        ],
      },
      {
        id: "beneficioPrimario",
        label: "Beneficio primario",
        type: "radio",
        options: [
          { value: "tempo", label: "Tempo" },
          { value: "costi", label: "Costi" },
          { value: "qualita", label: "Qualità" },
          { value: "ricavi", label: "Ricavi" },
          { value: "rischi", label: "Rischi" },
        ],
      },
      {
        id: "stimaBeneficio",
        label: "Stima del beneficio",
        type: "textarea",
        hint: "Anche approssimativa: ore risparmiate, € all'anno, punti percentuali di miglioramento.",
        rows: 4,
      },
      {
        id: "utentiImpattati",
        label: "Numero utenti impattati",
        type: "text",
        placeholder: "Es. circa 10 persone: 3 ispettori più capi turno e supervisori",
      },
      {
        id: "confidenzaStima",
        label: "Confidenza stima",
        type: "radio",
        options: [
          { value: "alta", label: "Alta" },
          { value: "media", label: "Media" },
          { value: "bassa", label: "Bassa" },
        ],
      },
      {
        id: "frequenzaUso",
        label: "Frequenza d'uso",
        type: "radio",
        options: [
          { value: "piuVolteGiorno", label: "Più volte/giorno" },
          { value: "giornaliera", label: "Giornaliera" },
          { value: "settimanale", label: "Settimanale" },
          { value: "mensile", label: "Mensile" },
          { value: "adHoc", label: "Ad-hoc" },
        ],
      },
    ],
  },
  {
    key: "metriche",
    number: "1.5",
    title: "Metriche di successo",
    fields: [
      {
        id: "baseline",
        label: "Baseline da battere",
        type: "textarea",
        hint: "Come si misura oggi la performance del processo, in numeri.",
        rows: 3,
      },
      {
        id: "metricaPrimaria",
        label: "Metrica di successo primaria",
        type: "textarea",
        hint: "Una sola metrica, con valore obiettivo e vincoli da non peggiorare.",
        rows: 3,
      },
    ],
  },
  {
    key: "etica",
    number: "1.6",
    title: "Valutazione etica preliminare (obbligatoria)",
    fields: [
      {
        id: "eticaDecisioni",
        label: "Influenza decisioni su persone specifiche?",
        type: "radio",
        options: [
          { value: "si", label: "Sì" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "eticaCategorie",
        label: "Categorie coinvolte",
        type: "checkbox",
        options: [
          { value: "dipendenti", label: "Dipendenti" },
          { value: "clienti", label: "Clienti" },
          { value: "candidati", label: "Candidati" },
          { value: "altro", label: "Altro" },
        ],
      },
      {
        id: "eticaInformate",
        label: "Persone informate?",
        type: "radio",
        options: [
          { value: "si", label: "Sì" },
          { value: "no", label: "No" },
          { value: "nonSo", label: "Non so" },
        ],
      },
      {
        id: "eticaRevisione",
        label: "Revisione umana prima della decisione?",
        type: "radio",
        options: [
          { value: "si", label: "Sì" },
          { value: "no", label: "No" },
          { value: "nonPrevisto", label: "Non previsto" },
        ],
      },
    ],
  },
  {
    key: "rischi",
    number: "1.7",
    title: "Rischi, complessità e potenziali resistenze",
    fields: [
      {
        id: "complessita",
        label: "Complessità tecnica percepita",
        type: "radio",
        options: [
          { value: "bassa", label: "Bassa" },
          { value: "media", label: "Media" },
          { value: "alta", label: "Alta" },
          { value: "nonSo", label: "Non so" },
        ],
      },
      {
        id: "datiSensibili",
        label: "Dati sensibili coinvolti",
        type: "textarea",
        hint: "Sì/No e, se sì, di quale categoria.",
        rows: 3,
      },
      {
        id: "compliance",
        label: "Compliance normativa necessaria",
        type: "textarea",
        hint: "Sì — quale (GDPR, AI Act, normativa di settore) / No.",
        rows: 3,
      },
      {
        id: "dipendenze",
        label: "Dipendenze da altri sistemi/progetti",
        type: "textarea",
        rows: 3,
      },
      {
        id: "resistenze",
        label: "Chi potrebbe resistere e perché",
        type: "textarea",
        rows: 3,
      },
      {
        id: "sostenitori",
        label: "Chi adotterebbe con entusiasmo (utenti pilot ideali)",
        type: "textarea",
        rows: 3,
      },
      {
        id: "azioniResistenza",
        label: "Azioni per ridurre la resistenza prima del pilot",
        type: "textarea",
        rows: 3,
      },
    ],
  },
];

export const BLOCK2_FIELDS: Block2Field[] = BLOCK2_SECTIONS.flatMap((s) => s.fields);

export function block2FieldById(id: string): Block2Field | undefined {
  return BLOCK2_FIELDS.find((f) => f.id === id);
}

/** Un campo è compilato se ha testo o almeno una opzione scelta. */
export function isBlock2ValueFilled(value: Block2FieldValue | undefined): value is Block2FieldValue {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value && value.trim());
}

/** Etichetta leggibile di un valore: le opzioni si mostrano col loro testo, non col codice. */
export function block2ValueLabel(field: Block2Field, value: Block2FieldValue | undefined): string {
  if (!isBlock2ValueFilled(value)) return "";
  const labelOf = (v: string) => field.options?.find((o) => o.value === v)?.label ?? v;
  if (Array.isArray(value)) return value.map(labelOf).join(", ");
  return field.options ? labelOf(value) : value;
}

// --- Intervista: la scheda si compila conversando --------------------------

/**
 * Argomenti dell'intervista, nell'ordine in cui l'agente li affronta. Un
 * argomento raggruppa i campi che si possono raccogliere parlando della stessa
 * cosa, così la scheda non diventa un questionario campo per campo: `domanda` è
 * l'apertura dell'argomento, non l'unica domanda ammessa, e `qualita` dice che
 * cosa deve contenere la risposta perché l'argomento si possa considerare
 * chiuso — è la lista su cui l'agente insiste chiedendo di approfondire.
 */
export type Block2InterviewGroup = {
  key: string;
  /** Titolo breve, usato per mostrare l'avanzamento al partecipante. */
  titolo: string;
  /** Domanda di apertura dell'argomento. */
  domanda: string;
  /** Elementi che la risposta deve contenere: se mancano, si approfondisce. */
  qualita: string[];
  /** Campi della scheda che questo argomento deve riempire. */
  fields: string[];
};

export const BLOCK2_INTERVIEW_GROUPS: Block2InterviewGroup[] = [
  {
    key: "processo",
    titolo: "Processo e problema",
    domanda:
      "Raccontami com'è oggi questo processo e qual è il problema che hai individuato: come si svolge, chi è coinvolto, dove si inceppa, quanto costa in tempo o persone e che conseguenze ha quando va storto.",
    qualita: [
      "i passaggi concreti del processo, nell'ordine in cui avvengono",
      "chi lo esegue (ruoli, quante persone) e chi ne subisce gli effetti",
      "volumi e tempi: quante volte accade, quanto dura, quanto tempo assorbe",
      "il punto preciso in cui si inceppa, non un giudizio generico",
      "le conseguenze quando va male, con un esempio realmente accaduto",
    ],
    fields: ["problema"],
  },
  {
    key: "soluzione",
    titolo: "Soluzione immaginata",
    domanda:
      "Come immagini la soluzione? Che cosa dovrebbe produrre il sistema, in che momento del processo entrerebbe e cosa cambierebbe rispetto a oggi.",
    qualita: [
      "l'output concreto del sistema (che cosa vede o riceve chi lavora)",
      "il punto del processo in cui si inserisce e chi lo usa",
      "che cosa resta in mano alla persona e che cosa fa il sistema",
      "come cambia il processo rispetto a come è oggi",
    ],
    fields: ["soluzione"],
  },
  {
    key: "obiettivi",
    titolo: "Obiettivi",
    domanda:
      "Quali obiettivi conta di più raggiungere: ridurre i tempi, ridurre gli errori, migliorare la qualità del servizio, liberare tempo delle persone, analisi più avanzate, personalizzazione, taglio dei costi operativi? Puoi indicarne più di uno.",
    qualita: [
      "quali obiettivi fra quelli previsti, e quale viene prima degli altri",
      "perché proprio quelli, legati al problema raccontato",
    ],
    fields: ["obiettivi", "obiettiviAltro"],
  },
  {
    key: "dati",
    titolo: "Dati e fonti",
    domanda:
      "Parliamo dei dati: quali servono al sistema, dove risiedono oggi (sistemi, file, fonti esterne, dati ancora da creare) e con quali volumi indicativi al giorno o all'anno.",
    qualita: [
      "quali dati, con il livello di dettaglio (singolo documento? riga? campo?)",
      "in quali sistemi o file stanno, con il nome che usano in azienda",
      "quanto sono accessibili oggi: chi li tiene, come si estraggono",
      "volumi con un ordine di grandezza e un'unità di tempo",
      "storico disponibile: da quando esistono quei dati",
    ],
    fields: ["datiNecessari", "datiDove", "datiVolume"],
  },
  {
    key: "qualitaDati",
    titolo: "Qualità dei dati",
    domanda:
      "Come giudichi la qualità di quei dati (alta, media, bassa oppure non lo sai) e sono già etichettati o classificati in modo utilizzabile per addestrare un modello (sì, in parte, no, non pertinente)?",
    qualita: [
      "un giudizio fra quelli previsti, con il motivo (buchi? duplicati? campi liberi?)",
      "se esistono già esempi classificati o esiti validati da usare come riferimento",
    ],
    fields: ["datiQualita", "datiEtichettati"],
  },
  {
    key: "beneficio",
    titolo: "Beneficio atteso",
    domanda:
      "Qual è il beneficio principale che ti aspetti (tempo, costi, qualità, ricavi o rischi), quanto vale anche solo a spanne (ore, euro all'anno, punti di miglioramento) e quante persone ne sarebbero impattate?",
    qualita: [
      "il beneficio primario fra quelli previsti",
      "un numero, anche approssimativo, con l'unità e il periodo (ore/settimana, €/anno)",
      "come è stato ricavato quel numero (da che conto o quale osservazione)",
      "quante persone e con quali ruoli ne sarebbero toccate",
    ],
    fields: ["beneficioPrimario", "stimaBeneficio", "utentiImpattati"],
  },
  {
    key: "usoImpatto",
    titolo: "Misurabilità e uso",
    domanda:
      "Quel beneficio è già misurabile in modo diretto o va validato sperimentalmente, quanta confidenza dai alla tua stima (alta, media, bassa) e con che frequenza verrebbe usato il sistema (più volte al giorno, ogni giorno, ogni settimana, ogni mese, ad-hoc)?",
    qualita: [
      "se il beneficio è misurabile con i dati di oggi o va provato sul campo",
      "la confidenza dichiarata e cosa la limita",
      "la frequenza d'uso fra quelle previste",
    ],
    fields: ["impattoTipo", "confidenzaStima", "frequenzaUso"],
  },
  {
    key: "metriche",
    titolo: "Metriche",
    domanda:
      "Come si misura oggi la performance di questo processo, in numeri, e quale singola metrica useresti per dire che il progetto è andato bene (con il valore obiettivo e ciò che non deve peggiorare)?",
    qualita: [
      "la baseline di oggi in numeri: che cosa si misura, quanto vale, come si rileva",
      "una sola metrica primaria, con valore obiettivo e orizzonte temporale",
      "i vincoli da non peggiorare mentre si migliora quella metrica",
    ],
    fields: ["baseline", "metricaPrimaria"],
  },
  {
    key: "etica",
    titolo: "Valutazione etica",
    domanda:
      "Passiamo alla parte etica: il sistema influenzerebbe decisioni su persone specifiche? Se sì, quali categorie sono coinvolte (dipendenti, clienti, candidati, altro), ne sarebbero informate e resterebbe una revisione umana prima della decisione?",
    qualita: [
      "se e come le decisioni ricadono su persone identificabili",
      "le categorie coinvolte fra quelle previste",
      "se e come le persone ne sono informate",
      "dove sta la revisione umana: chi guarda, prima o dopo la decisione",
    ],
    fields: ["eticaDecisioni", "eticaCategorie", "eticaInformate", "eticaRevisione"],
  },
  {
    key: "rischi",
    titolo: "Rischi e complessità",
    domanda:
      "Quanto lo consideri complesso tecnicamente (bassa, media, alta o non so), sono coinvolti dati sensibili, ci sono normative da rispettare (GDPR, AI Act, regole di settore) e dipende da altri sistemi o progetti in corso?",
    qualita: [
      "la complessità dichiarata e da dove viene (integrazioni? qualità dati? competenze?)",
      "quali categorie di dati sensibili, se ce ne sono",
      "quali normative e su quale aspetto mordono",
      "da quali sistemi, progetti o fornitori dipende, e con che tempi",
    ],
    fields: ["complessita", "datiSensibili", "compliance", "dipendenze"],
  },
  {
    key: "persone",
    titolo: "Persone e resistenze",
    domanda:
      "Ultimo argomento: chi potrebbe opporsi a questa soluzione e perché, chi invece la adotterebbe volentieri come utente pilota e che cosa faresti per ridurre le resistenze prima di partire?",
    qualita: [
      "chi potrebbe opporsi, con il ruolo e il motivo reale (non 'resistenza al cambiamento')",
      "chi lo adotterebbe volentieri e perché è il pilota giusto",
      "azioni concrete prima del pilota, non buoni propositi",
    ],
    fields: ["resistenze", "sostenitori", "azioniResistenza"],
  },
];

export const BLOCK2_INTERVIEW_GROUP_COUNT = BLOCK2_INTERVIEW_GROUPS.length;

/** Argomenti non ancora chiusi dall'agente, nell'ordine previsto. */
export function remainingInterviewGroups(closedGroups?: string[]): Block2InterviewGroup[] {
  const closed = new Set(closedGroups ?? []);
  return BLOCK2_INTERVIEW_GROUPS.filter((g) => !closed.has(g.key));
}

/** Tiene solo chiavi di argomento esistenti (l'agente potrebbe inventarne). */
export function sanitizeClosedGroups(raw: unknown, previous?: string[]): string[] {
  const known = new Set(BLOCK2_INTERVIEW_GROUPS.map((g) => g.key));
  const fromModel = Array.isArray(raw) ? raw.filter((k): k is string => typeof k === "string") : [];
  const merged = [...(previous ?? []), ...fromModel].filter((k) => known.has(k));
  // Ordine dell'intervista, senza duplicati: è quello con cui si mostra l'avanzamento.
  return BLOCK2_INTERVIEW_GROUPS.map((g) => g.key).filter((k) => merged.includes(k));
}

/**
 * Ripulisce i campi estratti dall'agente: scarta id inesistenti, valori vuoti e
 * opzioni non previste, e normalizza le scelte multiple ad array. Serve perché
 * l'estrazione arriva da un modello: la scheda non deve poter contenere valori
 * che il form non sa mostrare.
 */
export function sanitizeInterviewFields(raw: unknown): Record<string, Block2FieldValue> {
  const out: Record<string, Block2FieldValue> = {};
  if (!raw || typeof raw !== "object") return out;

  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const field = block2FieldById(id);
    if (!field) continue;

    const optionValue = (text: string): string | undefined => {
      const t = text.trim().toLowerCase();
      return field.options?.find((o) => o.value.toLowerCase() === t || o.label.toLowerCase() === t)?.value;
    };

    if (field.type === "checkbox") {
      const list = (Array.isArray(value) ? value : [value])
        .filter((v): v is string => typeof v === "string")
        .map((v) => optionValue(v))
        .filter((v): v is string => Boolean(v));
      if (list.length > 0) out[id] = Array.from(new Set(list));
      continue;
    }

    if (typeof value !== "string") continue;
    const text = value.trim();
    if (!text) continue;

    if (field.type === "radio") {
      const match = optionValue(text);
      if (match) out[id] = match;
      continue;
    }

    out[id] = text;
  }

  return out;
}

/** Primo messaggio dell'intervista: la domanda generica sul processo. */
export const INITIAL_MESSAGE_USE_CASE_INTERVIEW = `Ciao! Compiliamo insieme la scheda del caso d'uso parlando: da quello che mi racconti ricavo io i campi del modulo, e alla fine te lo mostro per la conferma. Se qualcosa non mi è chiaro ti chiedo di approfondire, e se un dato non lo sai lo segniamo come da verificare — puoi anche rispondere a voce col pulsante del microfono.

${BLOCK2_INTERVIEW_GROUPS[0].domanda}`;

/** Catalogo dei campi con id, tipo e valori ammessi: è il contratto di estrazione. */
function fieldCatalog(): string {
  return BLOCK2_SECTIONS.map((section) => {
    const fields = section.fields
      .map((f) => {
        const tipo =
          f.type === "checkbox" ? "scelta multipla" : f.type === "radio" ? "scelta singola" : "testo";
        const options = f.options
          ? ` — valori ammessi: ${f.options.map((o) => `"${o.value}" = ${o.label}`).join(" · ")}`
          : "";
        const hint = f.hint ? ` — ${f.hint}` : "";
        return `  - ${f.id} · ${f.label} [${tipo}]${hint}${options}`;
      })
      .join("\n");
    return `${section.number} ${section.title}\n${fields}`;
  }).join("\n");
}

/** Un campo già compilato, come arriva dalla scheda, per poterlo integrare. */
export type Block2CompiledField = { id: string; label: string; value: Block2FieldValue };

/** Oltre questa lunghezza il contenuto di un campo viene troncato nel prompt. */
const MAX_FIELD_CHARS_IN_PROMPT = 900;

function compiledFieldsBlock(fields: Block2CompiledField[]): string {
  if (fields.length === 0) return "La scheda è ancora vuota.";
  return fields
    .map(({ id, label, value }) => {
      const text = Array.isArray(value) ? value.join(", ") : value;
      const shown =
        text.length > MAX_FIELD_CHARS_IN_PROMPT ? `${text.slice(0, MAX_FIELD_CHARS_IN_PROMPT)}...` : text;
      return `  - ${id} (${label}): ${shown}`;
    })
    .join("\n");
}

function remainingGroupsBlock(groups: Block2InterviewGroup[]): string {
  if (groups.length === 0) {
    return `Nessuno: hai coperto tutti gli argomenti. Ora rispondi alle domande del partecipante sulla scheda, approfondisci i punti che vuole migliorare e aggiorna i campi che ti chiede di correggere.`;
  }

  // I criteri di qualità per esteso solo sui primi due argomenti: quello in
  // corso e il successivo. Per gli altri bastano titolo e campi — servono a
  // riconoscere le informazioni che arrivano in anticipo, non a condurli ora.
  const dettagliati = groups.slice(0, 2).map((g, i) => {
    const criteri = g.qualita.map((q) => `     · ${q}`).join("\n");
    return `${i === 0 ? "ARGOMENTO IN CORSO" : "SUBITO DOPO"} [${g.key}] ${g.titolo} → campi: ${g.fields.join(", ")}
   Apertura: ${g.domanda}
   Per chiuderlo ti serve:
${criteri}`;
  });

  const successivi = groups
    .slice(2)
    .map((g) => `   - [${g.key}] ${g.titolo} → campi: ${g.fields.join(", ")}`);

  return [
    ...dettagliati,
    successivi.length > 0 ? `POI, NELL'ORDINE:\n${successivi.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * System prompt dell'agente che conduce l'intervista dello Step 4. A ogni turno
 * risponde in JSON: il testo per il partecipante, i campi della scheda (riscritti
 * per intero) e gli argomenti che considera chiusi. Gli argomenti ancora aperti
 * li decide il server dai `closedGroups` accumulati, non il modello: così
 * l'avanzamento non dipende dalla memoria della conversazione. Il modello riceve
 * anche il contenuto attuale dei campi, perché ogni riscrittura deve integrare
 * quello che c'è invece di sostituirlo con una versione più povera.
 */
export function buildUseCaseInterviewSystemPrompt(ctx: {
  processoContext: string;
  remainingGroups: Block2InterviewGroup[];
  compiledFields: Block2CompiledField[];
}): string {
  const contesto = ctx.processoContext
    ? `L'attività emersa dal Blocco 1 è: ${ctx.processoContext}. Parti da lì: è di quel processo che si parla.`
    : "Il Blocco 1 non ha ancora prodotto un'attività: chiedi in una riga di quale processo si tratta.";

  return `Sei un facilitatore esperto di adozione dell'AI in azienda e stai conducendo un colloquio con un partecipante di un workshop per costruire la sua scheda "Use Case Submission". Non somministri un questionario: fai una conversazione, e la scheda la scrivi tu con quello che ottieni. Alla fine il partecipante la vedrà per confermarla, e la stessa scheda verrà letta e valutata da persone che non hanno sentito il colloquio: deve stare in piedi da sola.

${contesto}

**STATO ATTUALE DELLA SCHEDA**
${compiledFieldsBlock(ctx.compiledFields)}

**CAMPI DELLA SCHEDA** (usa esattamente questi id e, per le scelte, esattamente i valori ammessi):
${fieldCatalog()}

**ARGOMENTI DA COPRIRE**, nell'ordine:
${remainingGroupsBlock(ctx.remainingGroups)}

**COME CONDUCI IL COLLOQUIO**
- Un messaggio, una richiesta: al massimo due punti collegati fra loro. Mai un elenco di domande.
- Prima di cambiare argomento, rispecchia in una riga quello che hai capito ("Quindi oggi le fatture..."), così il partecipante può correggerti. Se ti corregge, riscrivi il campo.
- **Approfondisci invece di accontentarti.** Chiedi di chiarire, precisare o rivedere la risposta quando:
  · è generica o di principio ("è inefficiente", "si perde tempo", "migliorare la qualità");
  · contiene quantità vaghe ("molto", "spesso", "tanti"): chiedi un numero o un ordine di grandezza, e se non lo sa, un riferimento indiretto ("quante ne passano in un giorno?");
  · è ambigua: non capisci a che cosa o a chi si riferisce, o un termine aziendale che usa può voler dire due cose diverse — chiedi di spiegartelo;
  · contraddice qualcosa che ha detto prima: dillo esplicitamente e chiedi quale versione vale;
  · risponde a una domanda diversa da quella che hai fatto, o ne copre solo una parte;
  · nomina sistemi, documenti, ruoli o soglie senza dire che cosa sono o che cosa fanno.
- Resta sull'argomento in corso finché non hai gli elementi elencati sopra per quell'argomento. Non passare al successivo per fretta.
- Non insistere all'infinito: dopo circa tre scambi sullo stesso argomento prendi quello che c'è, segna le lacune come "Da verificare: ..." nel campo e vai avanti. Se il partecipante dice che non sa o che vuole saltare, chiudi l'argomento subito.
- Non richiedere quello che ha già detto: se una risposta contiene informazioni di argomenti successivi, compila quei campi e considera chiusi quegli argomenti.
- Riconosci quando ti sta dando una stima o un'impressione invece di un dato: chiedilo, e riportalo come stima.

**COME SCRIVI I CAMPI DELLA SCHEDA**
- Ogni campo è una voce di dossier professionale, non un riassunto: frasi complete, tono da documento aziendale, terminologia del partecipante (se usa "commessa", scrivi "commessa").
- Riporta **tutti** gli elementi concreti che ti ha dato: numeri con unità e periodo, sistemi con il loro nome, ruoli, tempi, frequenze, eccezioni, vincoli, esempi. Non perdere dettagli per fare sintesi: generalizzare è l'errore da evitare.
- I campi descrittivi vogliono sostanza: tipicamente 4-8 righe, e se il contenuto ha più parti, strutturale su più righe con "- " a inizio riga (per esempio: situazione attuale · dove si inceppa · chi è coinvolto · costo attuale · conseguenze).
- Vietate le frasi vuote: "processo manuale e inefficiente", "dati in vari sistemi", "migliorare l'efficienza". Al loro posto: che cosa si fa a mano, in quali sistemi, quanto costa.
- Distingui i fatti dalle stime: le stime si dichiarano ("stima del partecipante: ~900 ore/anno, ricavata da 2 ore al giorno su 2 persone"). Le lacune restano visibili come "Da verificare: ...".
- Quando aggiorni un campo già compilato, **riscrivilo per intero integrando** il nuovo dettaglio con quello che c'era: il valore che mandi sostituisce il precedente, quindi non deve mai risultare più povero.
- Non inventare niente: nessun numero, sistema, normativa, ruolo o beneficio che il partecipante non ha detto. Se serve un dato che non ha, chiedilo o segnalo come da verificare.

**FORMATO DELLA RISPOSTA**
Rispondi SEMPRE e SOLO con un oggetto JSON valido con queste chiavi:
{
  "reply": "il messaggio per il partecipante, in italiano, con il tu, massimo 4-5 righe",
  "fields": { "idCampo": "testo del campo" | ["valore1", "valore2"] },
  "closed": ["chiave-argomento-appena-chiuso"]
}
- "fields": i campi che puoi scrivere o migliorare con quello che il partecipante ha detto finora, riscritti per intero. Per le scelte singole un solo valore ammesso, per le scelte multiple un array di valori ammessi. Ometti i campi su cui non hai ancora niente.
- "closed": le chiavi degli argomenti che consideri conclusi in questo turno (anche più di uno, anche nessuno se stai ancora approfondendo). Non chiudere un argomento di cui non hai ancora chiesto nulla.
- Nessun testo fuori dal JSON, nessun markdown.

**REGOLE ASSOLUTE**
- Italiano, "tu", tono professionale ma amichevole: sei un consulente che intervista, non un modulo.
- Il partecipante non deve scrivere nei campi: li compili tu.
- Resta nel perimetro della scheda: niente scelta di fornitori, architetture di dettaglio o stime di progetto.
- Quando non resta nessun argomento aperto, dillo in una riga: la scheda è pronta e ora la vedrà per confermarla o correggerla.
- Ricorda quando è utile che ${BLOCK2_COMPLETION_HINT}`;
}
