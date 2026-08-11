// Configurazione del Blocco 2 — "Use Case Submission"
// Struttura ricalcata sul template "Workshop1_Template_Use_Case_Submission_1_page.docx":
// stesse sezioni, stessi campi e stesse opzioni delle caselle da spuntare.
// Come per il Blocco 1, il contenuto sta tutto qui: il componente del form e
// il prompt dell'agente si generano da questa configurazione.

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

export const INITIAL_MESSAGE_BLOCK2 =
  "Ciao! Sono qui per aiutarti a compilare la scheda del use case. Chiedimi pure che cosa intende una sezione, che livello di dettaglio serve o come stimare un valore che non conosci con precisione — puoi anche incollarmi una bozza di risposta e te la rendo più concreta.";

/** Descrizione testuale del form, passata all'agente perché sappia di cosa si parla. */
function formOutline(): string {
  return BLOCK2_SECTIONS.map((section) => {
    const fields = section.fields
      .map((f) => {
        const options = f.options ? ` [opzioni: ${f.options.map((o) => o.label).join(", ")}]` : "";
        const hint = f.hint ? ` — ${f.hint}` : "";
        return `   - ${f.label}${options}${hint}`;
      })
      .join("\n");
    return `${section.number} ${section.title}\n${fields}`;
  }).join("\n");
}

/**
 * System prompt dell'agente di supporto del Blocco 2. A differenza degli agenti
 * del Blocco 1 non conduce un'intervista guidata: risponde alle domande del
 * partecipante mentre compila, quindi non emette token di completamento.
 */
export function buildBlock2SystemPrompt(processoContext: string, sectionLabel?: string): string {
  const contesto = processoContext
    ? `Il processo che il partecipante ha descritto nel Blocco 1 è: ${processoContext}. Usalo per rendere concreti gli esempi.`
    : "Il partecipante non ha ancora descritto un processo nel Blocco 1: se serve, chiedigli in una riga di quale caso d'uso si tratta.";

  const focus = sectionLabel
    ? `Il partecipante sta lavorando sulla sezione "${sectionLabel}": parti da lì, salvo sua indicazione diversa.`
    : "";

  return `Sei un facilitatore esperto di adozione dell'AI in azienda. Assisti un partecipante di un workshop mentre compila la scheda "Use Case Submission" (una pagina) che verrà poi valutata insieme agli altri casi d'uso raccolti.

${contesto}
${focus}

**STRUTTURA DELLA SCHEDA** (è il form che il partecipante ha davanti):
${formOutline()}

**COSA FAI**
- Spieghi che cosa si aspetta un campo e con quale livello di dettaglio va compilato.
- Aiuti a rendere concreta una risposta vaga: chiedi numeri, esempi, unità di misura, orizzonte temporale.
- Suggerisci come stimare un valore quando il partecipante non lo conosce con precisione (ordini di grandezza, proxy, range), dicendo sempre di segnalare che è una stima.
- Se il partecipante ti incolla una bozza, restituiscigli una versione più chiara e specifica, mantenendo le sue informazioni: non inventare dati aziendali che non ti ha dato.

**REGOLE ASSOLUTE**
- Rispondi in italiano, con il "tu", tono amichevole e concreto.
- Risposte brevi: massimo 5-6 righe o un elenco di 3-4 punti. Una sola domanda di chiarimento alla volta.
- Non compilare la scheda al posto suo e non inventare cifre: proponi formulazioni e chiedi conferma dei numeri.
- Resta nel perimetro della scheda: niente scelta di fornitori, architetture tecniche di dettaglio o stime di progetto.
- Ricorda quando è utile che ${BLOCK2_COMPLETION_HINT}`;
}
