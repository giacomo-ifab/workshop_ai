// Tipi condivisi per il modello dati del workshop (Blocco 1 — Identificazione Opportunità)

export type CategoryKey = "ripetitive" | "analisiDati" | "documentazione" | "decisioni";

export type StepBKey = "variabilita" | "dati" | "docStandard" | "criteri";

export const STEP_B_KEYS: StepBKey[] = ["variabilita", "dati", "docStandard", "criteri"];

// Mappa 1:1 tra categoria selezionata in Step A e sottosezione di Step B da attivare
export const CATEGORY_TO_STEP_B: Record<CategoryKey, StepBKey> = {
  ripetitive: "variabilita",
  analisiDati: "dati",
  documentazione: "docStandard",
  decisioni: "criteri",
};

export type UnlockedSteps = {
  A: boolean;
  variabilita: boolean;
  dati: boolean;
  docStandard: boolean;
  criteri: boolean;
  C: boolean;
};

export const DEFAULT_UNLOCKED_STEPS: UnlockedSteps = {
  A: false,
  variabilita: false,
  dati: false,
  docStandard: false,
  criteri: false,
  C: false,
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

export type StepASubmission = {
  dipartimento?: string;
  areaFunzionale?: string;
  attivitaSelezionate?: string[]; // chiavi delle attività scelte (es. "ricopiature")
  processo?: string;
  attivitaStrumenti?: string;
  descrizione?: string;
  fteDurata?: string;
  fteFrequenza?: string;
  ftePersone?: string;
  chatLog?: ChatMessage[];
  updatedAt?: number; // ultimo salvataggio automatico della bozza
  completedAt?: number;
};

export type StepBAnswer = {
  chatLog: ChatMessage[];
  sintesi?: string; // riepilogo delle risposte generato dall'agente
  lettura?: string; // euristica del documento associata alla dimensione
  completedAt?: number;
};

export type StepBSubmission = Partial<Record<StepBKey, StepBAnswer>>;

export type ProfiloScores = Partial<Record<StepBKey, number>>; // punteggi 1-5 solo descrittivi, non prescrittivi

export type StepCSubmission = {
  sintesi?: string;
  profilo?: ProfiloScores;
  generatedAt?: number;
};

/**
 * Punto in cui il partecipante stava lavorando: salvato lato server insieme
 * alla submission così che il rientro (anche da un altro dispositivo) riapra
 * esattamente lo step/sottosezione dove ci si era interrotti.
 */
export type ParticipantProgress = {
  tab: "A" | "B" | "C";
  stepBDimension?: StepBKey;
  updatedAt: number;
};

export type Submission = {
  participantId: string;
  stepA?: StepASubmission;
  stepB?: StepBSubmission;
  stepC?: StepCSubmission;
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
