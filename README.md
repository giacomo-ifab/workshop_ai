# Workshop AI Adoption — IFAB Foundation

App interattiva per condurre dal vivo il workshop di AI Adoption. Questa prima iterazione copre il **Blocco 1 — Identificazione Opportunità**: il facilitatore sblocca gli step uno alla volta, i partecipanti (identificati dal solo nome) compilano ogni sottosezione guidati da un agente AI.

Vedi il piano architetturale completo in `C:\Users\GaiaGambarelli\.claude\plans\foamy-forging-eich.md` per il contesto e le decisioni prese.

## Come funziona il Blocco 1

- **Step A — Identifica il processo**: selezione delle attività svolte (raggruppate in 4 categorie) + form del processo (Processo, Attività/strumenti, Descrizione, FTE), con agente AI di supporto.
- **Step B — Caratterizza il processo**: 4 sottosezioni (Variabilità, Dati, Documenti standard, Criteri e regole), attivate in base alle categorie selezionate in Step A, ciascuna con un agente AI che pone le domande guida.
- **Step C — Output**: sintesi descrittiva generata dall'AI + visualizzazione radar del profilo del processo + export PDF. (Nessuna raccomandazione di approccio AI qui: arriverà a fine workshop.)

Il facilitatore sblocca ogni step/sottosezione dalla propria dashboard; i partecipanti vedono lo sblocco entro pochi secondi (polling). Se un partecipante esce e rientra con lo stesso nome nella stessa sessione, ritrova i dati già inseriti.

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
├── components/                       # StepA, StepB, StepC, AgentChat
├── config/block1Flow.ts              # contenuto del Blocco 1 (attività, domande guida, prompt)
└── lib/                               # tipi, client Redis, helper sessione, auth, client API
```

## Estendere ai blocchi successivi

L'architettura (sessione + step unlock + agente AI per sottosezione + output) è pensata per essere riusata per i blocchi 2-4 (Prioritizzazione, Design, Qualità), aggiungendo nuove chiavi a `UnlockedSteps`, nuovi file di config analoghi a `block1Flow.ts` e nuovi componenti Step, senza toccare il modello di sessione/autenticazione.
