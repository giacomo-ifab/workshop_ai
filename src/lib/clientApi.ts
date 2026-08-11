import { Submission, StepBKey } from "./types";

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Errore ${res.status}`);
  }
  return data as T;
}

export function facilitatorLogin(name: string, password: string) {
  return jsonFetch<{ ok: true; name: string }>("/api/facilitator/login", {
    method: "POST",
    body: JSON.stringify({ name, password }),
  });
}

export function facilitatorMe() {
  return jsonFetch<{ authenticated: boolean; name: string }>("/api/facilitator/me");
}

export function facilitatorLogout() {
  return jsonFetch<{ ok: true }>("/api/facilitator/logout", { method: "POST" });
}

export function createSession() {
  return jsonFetch<{ meta: import("./types").SessionMeta }>("/api/session/create", { method: "POST" });
}

export function joinSession(code: string, name: string) {
  return jsonFetch<{
    participant: import("./types").Participant;
    isNew: boolean;
    submission: Submission;
    meta: import("./types").SessionMeta;
  }>(`/api/session/${code}/join`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function fetchState(code: string, participantId?: string) {
  const qs = participantId ? `?participantId=${encodeURIComponent(participantId)}` : "";
  return jsonFetch<{
    meta: import("./types").SessionMeta;
    participants: { name: string; joinedAt: number; lastSeenAt: number }[];
    ownSubmission: Submission | null;
  }>(`/api/session/${code}/state${qs}`);
}

export function unlockStep(code: string, step: string, value: boolean) {
  return jsonFetch<{ meta: import("./types").SessionMeta }>(`/api/session/${code}/unlock`, {
    method: "POST",
    body: JSON.stringify({ step, value }),
  });
}

export function submitStepA(code: string, participantId: string, data: import("./types").StepASubmission) {
  return jsonFetch<{ submission: Submission }>(`/api/session/${code}/submit`, {
    method: "POST",
    body: JSON.stringify({ participantId, part: "stepA", data }),
  });
}

export function submitStepB(
  code: string,
  participantId: string,
  dimension: StepBKey,
  data: { chatLog: import("./types").ChatMessage[]; completedAt?: number }
) {
  return jsonFetch<{ submission: Submission }>(`/api/session/${code}/submit`, {
    method: "POST",
    body: JSON.stringify({ participantId, part: "stepB", dimension, data }),
  });
}

export function synthesizeStepC(code: string, participantId: string) {
  return jsonFetch<{ submission: Submission }>(`/api/session/${code}/synthesize`, {
    method: "POST",
    body: JSON.stringify({ participantId }),
  });
}

export function fetchAggregate(code: string) {
  return jsonFetch<{
    rows: { participant: import("./types").Participant; submission: Submission }[];
  }>(`/api/session/${code}/aggregate`);
}
