import { NextResponse } from "next/server";
import { getParticipants, saveBlock2, saveProgress, saveStepA, saveStepBAnswer, saveStepC } from "@/lib/session";
import { StepBKey } from "@/lib/types";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await req.json();
  const { participantId, part, dimension, data } = body;

  if (!participantId || !part || !data) {
    return NextResponse.json({ error: "Richiesta incompleta" }, { status: 400 });
  }

  const participants = await getParticipants(code);
  if (!participants.some((p) => p.participantId === participantId)) {
    return NextResponse.json({ error: "Partecipante non registrato in questa sessione" }, { status: 403 });
  }

  let submission;
  if (part === "stepA") {
    submission = await saveStepA(code, participantId, data);
  } else if (part === "stepB") {
    if (!dimension) {
      return NextResponse.json({ error: "Dimensione mancante per stepB" }, { status: 400 });
    }
    submission = await saveStepBAnswer(code, participantId, dimension as StepBKey, data);
  } else if (part === "stepC") {
    submission = await saveStepC(code, participantId, data);
  } else if (part === "block2") {
    submission = await saveBlock2(code, participantId, data);
  } else if (part === "progress") {
    submission = await saveProgress(code, participantId, data);
  } else {
    return NextResponse.json({ error: "part non valido" }, { status: 400 });
  }

  return NextResponse.json({ submission });
}
