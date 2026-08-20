import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY non configurata in .env.local");
  }
  client = new OpenAI({ apiKey });
  return client;
}

/** Assistenti di supporto degli Step 1 e 2: spiegano, non scrivono documenti. */
export const CHAT_MODEL = "gpt-4o-mini";

/**
 * Intervista dello Step 4: deve capire quando una risposta e' ambigua, insistere
 * sul punto giusto e scrivere i campi della scheda in modo professionale. Il
 * modello piccolo qui generalizza troppo, quindi si usa quello pieno.
 */
export const INTERVIEW_MODEL = "gpt-4o";
