import { NextResponse } from "next/server";
import { getFacilitatorFromCookies } from "@/lib/auth";
import { setUnlockedStep } from "@/lib/session";
import { UnlockedSteps } from "@/lib/types";

const VALID_STEPS: (keyof UnlockedSteps)[] = ["A", "variabilita", "dati", "docStandard", "criteri", "C"];

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const facilitator = await getFacilitatorFromCookies();
  if (!facilitator) {
    return NextResponse.json({ error: "Non autenticato come facilitatore" }, { status: 401 });
  }

  const { code } = await params;
  const { step, value } = await req.json();

  if (!VALID_STEPS.includes(step)) {
    return NextResponse.json({ error: "Step non valido" }, { status: 400 });
  }

  const meta = await setUnlockedStep(code, step, value !== false);
  if (!meta) {
    return NextResponse.json({ error: "Sessione non trovata" }, { status: 404 });
  }

  return NextResponse.json({ meta });
}
