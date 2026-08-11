// Tipi condivisi per il modello dati del workshop.
// Blocco 1 — Identificazione Opportunità, in 4 step:
//   1. selezione delle attività svolte
//   2. stima del tempo assorbito (durata × frequenza × persone) e top 3
//   3. caratteristiche delle attività più onerose (una caratteristica per gruppo)
//   4. output: sintesi AI, profilo e PDF
// Blocco 2 — Use Case Submission (form su una pagina).

/** Gruppo di attività: a ogni gruppo corrisponde una sola caratteristica da indagare. */
export type CategoryKey = "ripetitive" | "analisiDati" | "documentazione" | "decisioni";

/** Caratteristica indagata nello Step 3. */
export type CharacteristicKey = "variabilita" | "dati" | "docStandard" | "criteri";

export const CHARACTERISTIC_KEYS: CharacteristicKey[] = [
  "variabilita",
  "dati",
  "docStandard",
  "criteri",
];

// Mappa 1:1 gruppo di attività → caratteristica (schema attività/caratteristiche del workshop)
export const CATEGORY_TO_CHARACTERISTIC: Record<CategoryKey, CharacteristicKey> = {
  ripetitive: "variabilita",
  analisiDati: "dati",
  documentazione: "docStandard",
  decisioni: "criteri",
};

export type UnlockedSteps = {
  step1: boolean;
  step2: boolean;
  step3: boolean;
  step4: boolean;
  // Blocco 2 — Use Case Submission (un unico form, sbloccato in blocco).
  useCase: boolean;
};

export const DEFAULT_UNLOCKED_STEPS: UnlockedSteps = {
  step1: false,
  step2: false,
  step3: false,
  step4: false,
  useCase: false,
};

export type SessionMeta = {
  code: string;
  facilitatorName: string;
  createdAt: number;
  unlockedSteps: UnlockedSteps;
};

export type Participant = {
  participantId: string;
  name: string; // nome visualizzato (come inserito dall'utente)
  normalizedName: string; // chiave di match per il rientro/recupero dati
  joinedAt: number;
  lastSeenAt: number;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Step 1 — quali attività svolgo (più di una) e in quale contesto organizzativo. */
export type Step1Submission = {
  dipartimento?: string;
  areaFunzionale?: string;
  attivitaSelezionate?: string[]; // chiavi delle attività scelte (es. "ricopiature")
  chatLog?: ChatMessage[];
  updatedAt?: number; // ultimo salvataggio automatico della bozza
  completedAt?: number;
};

export type FrequenzaPeriodo = "giorno" | "settimana" | "mese" | "anno";

/**
 * Step 2 — stima dell'impegno per una singola attività. I valori restano
 * separati (non pre-moltiplicati) così la stima si può correggere e il calcolo
 * ore/anno resta trasparente e ricalcolabile ovunque serva.
 */
export type AttivitaEffort = {
  durataMinuti?: number; // durata media di una esecuzione
  frequenzaNumero?: number; // quante volte per periodo
  frequenzaPeriodo?: FrequenzaPeriodo;
  persone?: number; // persone che svolgono l'attività
};

export type Step2Submission = {
  effort?: Record<string, AttivitaEffort>; // per chiave attività
  /** Le (massimo) 3 attività più onerose, confermate dal partecipante. */
  topAttivita?: string[];
  chatLog?: ChatMessage[];
  updatedAt?: number;
  completedAt?: number;
};

/**
 * Step 3 — risposte alle domande sulle caratteristiche. Chiave della risposta:
 * `${caratteristica}:${idDomanda}` (le domande vivono in `config/block1Flow.ts`).
 */
export type Step3Submission = {
  risposte?: Record<string, string>;
  chatLog?: ChatMessage[];
  updatedAt?: number;
  completedAt?: number;
};

export type ProfiloScores = Partial<Record<CharacteristicKey, number>>; // punteggi 1-5 solo descrittivi, non prescrittivi

/** Step 4 — output del Blocco 1. */
export type Step4Submission = {
  sintesi?: string;
  profilo?: ProfiloScores;
  generatedAt?: number;
};

/**
 * Blocco 2 — Use Case Submission. I campi non sono elencati uno per uno: la
 * struttura del form (sezioni, campi, opzioni) vive in `config/block2Form.ts`
 * e qui si conservano i valori indicizzati per id di campo, così aggiornare il
 * template non richiede modifiche al modello dati né alle API.
 */
export type Block2FieldValue = string | string[];

export type Block2Submission = {
  values?: Record<string, Block2FieldValue>;
  chatLog?: ChatMessage[];
  updatedAt?: number;
  completedAt?: number;
};

export type ParticipantTab = "1" | "2" | "3" | "4" | "UC";

/**
 * Punto in cui il partecipante stava lavorando: salvato lato server insieme
 * alla submission così che il rientro (anche da un altro dispositivo) riapra
 * esattamente lo step dove ci si era interrotti. "UC" è il form del Blocco 2.
 */
export type ParticipantProgress = {
  tab: ParticipantTab;
  updatedAt: number;
};

export type Submission = {
  participantId: string;
  step1?: Step1Submission;
  step2?: Step2Submission;
  step3?: Step3Submission;
  step4?: Step4Submission;
  block2?: Block2Submission;
  progress?: ParticipantProgress;
};

/** Riepilogo di una sessione attiva, mostrato al facilitatore che rientra. */
export type SessionSummary = {
  code: string;
  facilitatorName: string;
  createdAt: number;
  participantCount: number;
  lastActivityAt: number;
};

/** Ore/anno assorbite da un'attività: durata × frequenza annua × persone. */
export function oreAnnue(effort: AttivitaEffort | undefined): number | null {
  if (!effort) return null;
  const { durataMinuti, frequenzaNumero, frequenzaPeriodo, persone } = effort;
  if (!durataMinuti || !frequenzaNumero || !frequenzaPeriodo) return null;

  const perAnno: Record<FrequenzaPeriodo, number> = {
    giorno: 220, // giorni lavorativi in un anno
    settimana: 44, // settimane lavorative
    mese: 11, // mesi lavorativi
    anno: 1,
  };

  const esecuzioniAnno = frequenzaNumero * perAnno[frequenzaPeriodo];
  return (durataMinuti / 60) * esecuzioniAnno * (persone && persone > 0 ? persone : 1);
}
