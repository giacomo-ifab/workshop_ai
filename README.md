# Workshop AI Adoption — IFAB Foundation

App interattiva per condurre dal vivo il workshop di AI Adoption. Questa prima iterazione copre il **Blocco 1 — Identificazione Opportunità**: il facilitatore sblocca gli step uno alla volta, i partecipanti (identificati dal solo nome) compilano ogni sottosezione guidati da un agente AI.

Vedi il piano architetturale completo in `C:\Users\GaiaGambarelli\.claude\plans\foamy-forging-eich.md` per il contesto e le decisioni prese.

## Come funziona il Blocco 1

- **Step A — Identifica il processo**: selezione delle attività svolte (raggruppate in 4 categorie) + form del processo (Processo, Attività/strumenti, Descrizione, FTE), con agente AI di supporto.
- **Step B — Caratterizza il processo**: 4 sottosezioni (Variabilità, Dati, Documenti standard, Criteri e regole), attivate in base alle categorie selezionate in Step A, ciascuna con un agente AI che pone le domande guida.
- **Step C — Output**: sintesi descrittiva generata dall'AI + visualizzazione radar del profilo del processo + export PDF. (Nessuna raccomandazione di approccio AI qui: arriverà a fine workshop.)

Il facilitatore sblocca ogni step/sottosezione dalla propria dashboard; i partecipanti vedono lo sblocco entro pochi secondi (polling).

## Blocco 2 — Use Case Submission

Scheda su una pagina che ricalca il template `Workshop1_Template_Use_Case_Submission_1_page.docx`: il partecipante descrive il caso d'uso da candidare, il facilitatore sblocca il blocco quando il gruppo è pronto.

- Sezioni: 1.0 Problema/opportunità di business · 1.1 Soluzione proposta · 1.2 Obiettivi strategici · 1.3 Dati e contesto · 1.4 Impatto atteso · 1.5 Metriche di successo · 1.6 Valutazione etica preliminare · 1.7 Rischi, complessità e resistenze.
- Campi liberi, scelte singole e scelte multiple sono descritti in `src/config/block2Form.ts`: modificare lì testi, opzioni o suggerimenti aggiorna form, prompt dell'agente e conteggi, senza toccare componenti o API.
- **Agente di supporto**: chat in fondo alla scheda (`subsection: "block2"`), più un pulsante "Chiedi aiuto" per sezione che precompila la domanda. A differenza degli agenti del Blocco 1 non conduce un'intervista: spiega i campi, aiuta a rendere concrete le risposte e a stimare i valori, senza compilare al posto del partecipante né inventare cifre.
- La scheda si autosalva come bozza (come lo Step A) e si conferma con "Salva scheda"; la dashboard del facilitatore mostra ✅ per le schede consegnate e `n/N` per quelle ancora in bozza.

## Riprendere una sessione interrotta

Tutto lo stato vive lato server (Redis, TTL 48h): chiudere il browser, ricaricare la pagina o cambiare dispositivo non fa perdere il lavoro.

**Partecipante**
- L'identità (codice sessione + participantId + nome) resta nel `localStorage`: riaprendo l'app compare in home la card **"Riprendi"**, e su `/join` il pulsante **"Rientra nella sessione"** — senza ridigitare nulla.
- Da un altro dispositivo (o dopo aver svuotato il browser) basta rientrare su `/join` con lo **stesso codice e lo stesso nome**: il match sul nome normalizzato ricollega alla stessa submission.
- I campi dello **Step A si autosalvano** dopo ~1 secondo di inattività (e all'uscita dallo step), quindi anche la bozza non ancora confermata con "Salva" viene ripristinata.
- Viene ripristinato anche il **punto in cui ci si era interrotti** (tab A/B/C e sottosezione di Step B), salvato lato server a ogni cambio step.
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
│   ├── session/[code]/page.tsx       # vista partecipante (Step A/B/C)
│   └── api/                          # route handler (auth, sessione, agente AI, sintesi)
│       ├── session/list              # sessioni attive: rientro del facilitatore
│       └── session/[code]/resume     # rientro del partecipante con identità salvata
├── components/                       # StepA, StepB, StepC, Block2Form, AgentChat, ResumeCard
├── config/block1Flow.ts              # contenuto del Blocco 1 (attività, domande guida, prompt)
├── config/block2Form.ts              # scheda Use Case del Blocco 2 (sezioni, campi, prompt agente)
└── lib/                              # tipi, client Redis, helper sessione, auth, client API,
                                      # participantStorage (identità salvata nel browser)
```

## Estendere ai blocchi successivi

L'architettura (sessione + step unlock + agente AI per sottosezione + output) è pensata per essere riusata per i blocchi 2-4 (Prioritizzazione, Design, Qualità), aggiungendo nuove chiavi a `UnlockedSteps`, nuovi file di config analoghi a `block1Flow.ts` e nuovi componenti Step, senza toccare il modello di sessione/autenticazione.
