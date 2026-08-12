# Workshop AI Adoption — IFAB Foundation

App interattiva per condurre dal vivo il workshop di AI Adoption. Il facilitatore sblocca gli step uno alla volta, i partecipanti (identificati dal solo nome) compilano ogni step con un assistente AI a fianco.

## Come funziona il Blocco 1 — Scheda di attrito

- **Step 1 — Scheda di attrito**: 21 domande sì/no in elenco unico (i quattro blocchi restano interni). Su ogni sì si apre un nome facoltativo per l'attività e lo **slider Impatto 1-10**, senza valore preimpostato: va mosso. Tornando al no, i campi si chiudono e il dato viene scartato. Contatore risposte in alto, avviso non bloccante oltre 8 sì, messaggio dedicato se non c'è nessun sì. La **domanda 21** (eccezioni gestite con criteri non documentati) è una spia: non apre lo slider, non concorre alle candidate, alza solo il flag `criteriTaciti`.
- **Step 2 — Caratteristiche delle tre candidate**: le tre attività con impatto più alto (a parità vince quella dichiarata prima), una scheda alla volta con navigazione avanti/indietro. Un solo slider per scheda, deciso dal blocco della domanda di origine (costanza del formato · disponibilità dei dati · template e fonti · esplicitezza dei criteri). Nessun punteggio o anteprima; concludendo lo step le risposte si bloccano e le candidate vengono congelate.
- **Step 3 — Esito**: **matrice Impatto × Prontezza in SVG inline** con i quattro quadranti nominati e le candidate posizionate, poi una scheda per candidata in ordine di punteggio con direzione tecnologica, livello di supervisione e riga di motivazione. Export PDF.

Calcolo (in `src/lib/frizioneScoring.ts`, unico punto di verità, usato anche dalla dashboard):

```
prontezza = blocco "sposti" ? max(0, 10 - |valore - 5.5| × 2) : valore   // campana: l'ottimo è al centro
punteggio = impatto × prontezza                                          // prodotto, non somma: 0-100
```

I knockout hanno la precedenza sulla tecnologia standard e si valutano in ordine: formato costante (≤2 su "sposti") → automazione classica RPA; formato sempre diverso (≥9) → capacità interpretativa e human-in-the-loop; valore ≤3 sugli altri blocchi → prima data readiness. I due estremi di "sposti" ricevono lo stesso punteggio per effetto della campana ma **messaggi opposti**. La supervisione scende a human-in-the-loop su ogni caso quando `criteriTaciti` è vero, con nota esplicita.

Domande, ancoraggi, tecnologie e messaggi vivono in `src/config/block1Frizione.ts`.

Il facilitatore sblocca ogni step dalla propria dashboard; i partecipanti vedono lo sblocco entro pochi secondi (polling).

## Blocco 2 — Use Case Submission

Scheda su una pagina che ricalca il template `Workshop1_Template_Use_Case_Submission_1_page.docx`: il partecipante descrive il caso d'uso da candidare, il facilitatore sblocca il blocco quando il gruppo è pronto.

- Sezioni: 1.0 Problema/opportunità di business · 1.1 Soluzione proposta · 1.2 Obiettivi strategici · 1.3 Dati e contesto · 1.4 Impatto atteso · 1.5 Metriche di successo · 1.6 Valutazione etica preliminare · 1.7 Rischi, complessità e resistenze.
- Campi liberi, scelte singole e scelte multiple sono descritti in `src/config/block2Form.ts`: modificare lì testi, opzioni o suggerimenti aggiorna form, prompt dell'agente e conteggi, senza toccare componenti o API.
- **Agente di supporto**: chat nel pannello fisso a destra (`subsection: "block2"`), più un pulsante "Chiedi aiuto" per sezione che precompila la domanda. A differenza degli agenti del Blocco 1 non conduce un'intervista: spiega i campi, aiuta a rendere concrete le risposte e a stimare i valori, senza compilare al posto del partecipante né inventare cifre.
- La scheda si autosalva come bozza (come lo Step A) e si conferma con "Salva scheda"; la dashboard del facilitatore mostra ✅ per le schede consegnate e `n/N` per quelle ancora in bozza.

## Riprendere una sessione interrotta

Tutto lo stato vive lato server (Redis, TTL 48h): chiudere il browser, ricaricare la pagina o cambiare dispositivo non fa perdere il lavoro.

**Partecipante**
- L'identità (codice sessione + participantId + nome) resta nel `localStorage`: riaprendo l'app compare in home la card **"Riprendi"**, e su `/join` il pulsante **"Rientra nella sessione"** — senza ridigitare nulla.
- Da un altro dispositivo (o dopo aver svuotato il browser) basta rientrare su `/join` con lo **stesso codice e lo stesso nome**: il match sul nome normalizzato ricollega alla stessa submission.
- Tutti gli step **si autosalvano** dopo ~1 secondo di inattività (e all'uscita dallo step), quindi anche la bozza non ancora confermata viene ripristinata.
- Viene ripristinato anche il **punto in cui ci si era interrotti** (step 1-3 o scheda Use Case), salvato lato server a ogni cambio step.
- Se la sessione è scaduta o il partecipante non risulta più registrato, si viene riportati a `/join` con un avviso, invece di restare su una pagina in caricamento.

**Facilitatore**
- Il cookie di autenticazione dura 12h: rientrando su `/facilitator/login` con il cookie valido si salta la password.
- Dopo l'accesso viene mostrato l'**elenco delle sessioni ancora attive** (codice, orario, numero di partecipanti) per riprendere quella in corso; la sessione usata l'ultima volta su quel browser è marcata "ultima usata". Una nuova sessione si crea solo esplicitamente (o automaticamente se non ce n'è nessuna attiva).
- Se il codice aperto non è più valido, la dashboard propone il ritorno al selettore delle sessioni.
- Ogni sessione si può **eliminare** (icona cestino nel selettore, pulsante "Elimina" nella dashboard, con conferma in due passaggi): rimuove meta, partecipanti e submission. I partecipanti eventualmente collegati vengono riportati a `/join` al polling successivo.

## Setup locale

### Prerequisiti
- Node.js 18+
- Una chiave OpenAI API (per gli agenti)
- Un database Upstash Redis gratuito (https://console.upstash.com) — usato come store di stato condiviso per la durata dell'evento

### Installazione

```bash
npm install
cp .env.local.example .env.local
# compila OPENAI_API_KEY, FACILITATOR_PASSWORD, KV_REST_API_URL, KV_REST_API_TOKEN
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

- **Facilitatore**: vai su `/facilitator/login`, inserisci nome + `FACILITATOR_PASSWORD`. Al primo accesso viene creata una sessione con un codice a 6 caratteri da condividere con i partecipanti.
- **Partecipanti**: vanno su `/join` (o sul link copiato dal facilitatore) e inseriscono codice sessione + il proprio nome.

## Deploy su Vercel

Vedi [DEPLOYMENT.md](./DEPLOYMENT.md) per la guida passo-passo (import del repo, collegamento di un database Redis dal tab Storage di Vercel senza bisogno di un account Upstash separato, verifica end-to-end).

## Struttura del progetto

```
src/
├── app/
│   ├── page.tsx                      # landing (scelta partecipante/facilitatore)
│   ├── join/page.tsx                 # ingresso partecipante
│   ├── facilitator/login/page.tsx    # login facilitatore
│   ├── facilitator/[code]/page.tsx   # dashboard facilitatore
│   ├── session/[code]/page.tsx       # vista partecipante (step 1-3 + Use Case)
│   └── api/                          # route handler (auth, sessione, agente AI)
│       ├── session/list              # sessioni attive: rientro del facilitatore
│       └── session/[code]/resume     # rientro del partecipante con identità salvata
├── components/                       # Step1Frizione, Step2Caratteristiche, Step3Esito,
│                                     # MatriceImpattoProntezza (SVG), Block2Form, AgentChat,
│                                     # AssistantPanel (pannello fisso a destra), ResumeCard
├── config/block1Frizione.ts          # Blocco 1: 21 domande, ancoraggi, tecnologie, messaggi, prompt
├── config/block2Form.ts              # scheda Use Case del Blocco 2 (sezioni, campi, prompt agente)
└── lib/                              # tipi, frizioneScoring (calcolo esito), client Redis,
                                      # helper sessione, auth, client API, participantStorage
```

## Estendere ai blocchi successivi

L'architettura (sessione + step unlock + assistente AI per step + output) è pensata per essere riusata per i blocchi successivi (Prioritizzazione, Design, Qualità), aggiungendo nuove chiavi a `UnlockedSteps`, nuovi file di config analoghi a `block1Flow.ts`/`block2Form.ts` e nuovi componenti Step, senza toccare il modello di sessione/autenticazione.

Nota: la whitelist degli step in `/api/session/[code]/unlock` deriva da `DEFAULT_UNLOCKED_STEPS`, quindi una nuova chiave è sbloccabile senza altre modifiche. Le sessioni già in corso al momento di un cambio di struttura ripartono con tutti gli step bloccati (le chiavi non riconosciute risultano `false`): basta risbloccarli dalla dashboard.
