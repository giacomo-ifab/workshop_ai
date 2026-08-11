"use client";

import { useRef, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Sparkles, FileDown } from "lucide-react";
import { CHARACTERISTICS, categoryForActivity, labelForActivity } from "@/config/block1Flow";
import {
  CATEGORY_TO_CHARACTERISTIC,
  CharacteristicKey,
  Step1Submission,
  Step2Submission,
  Step4Submission,
  oreAnnue,
} from "@/lib/types";
import { synthesizeStep4 } from "@/lib/clientApi";

/**
 * Step 4 — output del Blocco 1: sintesi generata dall'AI, classifica delle
 * attività per ore/anno, profilo delle caratteristiche indagate ed export PDF.
 */
export default function Step4Output({
  code,
  participantId,
  participantName,
  step1,
  step2,
  step4,
  onGenerated,
}: {
  code: string;
  participantId: string;
  participantName: string;
  step1?: Step1Submission;
  step2?: Step2Submission;
  step4?: Step4Submission;
  onGenerated: (data: Step4Submission) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const topAttivita = step2?.topAttivita ?? [];

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const { submission } = await synthesizeStep4(code, participantId);
      onGenerated(submission.step4 ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante la generazione");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportPdf() {
    if (!printRef.current) return;
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);
    const canvas = await html2canvas(printRef.current, { backgroundColor: "#ffffff", scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 48;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.text(`Workshop AI Adoption — ${participantName}`, 24, 28);
    pdf.addImage(imgData, "PNG", 24, 40, imgWidth, imgHeight);
    pdf.save(`workshop-ai-adoption-${participantName.replace(/\s+/g, "_")}.pdf`);
  }

  const chartData = Object.entries(step4?.profilo ?? {}).map(([key, score]) => ({
    caratteristica: CHARACTERISTICS[key as CharacteristicKey]?.label ?? key,
    valore: score,
  }));

  // Caratteristiche indagate, derivate dalle attività più onerose.
  const caratteristicheIndagate = Array.from(
    new Set(
      topAttivita
        .map((key) => categoryForActivity(key))
        .filter((c): c is NonNullable<typeof c> => Boolean(c))
        .map((c) => CATEGORY_TO_CHARACTERISTIC[c])
    )
  );

  const classifica = (step1?.attivitaSelezionate ?? [])
    .map((key) => ({ key, ore: oreAnnue(step2?.effort?.[key]) }))
    .filter((r) => r.ore !== null)
    .sort((a, b) => (b.ore ?? 0) - (a.ore ?? 0));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-lg font-semibold text-ifab-navy">Step 4 · Output</h2>
          <p className="text-sm text-ifab-text-muted">
            Sintesi descrittiva di quanto raccolto. La raccomandazione sull&apos;approccio AI arriverà a fine
            workshop.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !step1?.attivitaSelezionate?.length}
            className="flex items-center gap-2 rounded-lg bg-ifab-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-ifab-blue-dark disabled:opacity-50"
          >
            <Sparkles size={16} /> {loading ? "Generazione..." : "Genera sintesi"}
          </button>
          {step4?.sintesi && (
            <button
              type="button"
              onClick={handleExportPdf}
              className="flex items-center gap-2 rounded-lg border border-ifab-navy px-4 py-2 text-sm font-semibold text-ifab-navy transition hover:bg-ifab-navy hover:text-white"
            >
              <FileDown size={16} /> Esporta PDF
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {step4?.sintesi ? (
        <div ref={printRef} className="rounded-xl border border-ifab-border bg-white p-6">
          <h3 className="mb-1 text-base font-semibold text-ifab-navy">
            {step1?.dipartimento || "Attività candidate"}
            {step1?.areaFunzionale ? ` · ${step1.areaFunzionale}` : ""}
          </h3>
          <p className="mb-4 text-xs text-ifab-text-muted">
            Attività più onerose: {topAttivita.map(labelForActivity).join(", ") || "non ancora confermate"}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ifab-text">{step4.sintesi}</p>

          {classifica.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-2 text-sm font-semibold text-ifab-navy">Tempo assorbito (stima)</h4>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ifab-border text-ifab-text-muted">
                    <th className="py-1.5 pr-4">Attività</th>
                    <th className="py-1.5 text-right">Ore/anno</th>
                  </tr>
                </thead>
                <tbody>
                  {classifica.map(({ key, ore }) => (
                    <tr key={key} className="border-b border-ifab-border last:border-0">
                      <td className="py-1.5 pr-4 text-ifab-text">{labelForActivity(key)}</td>
                      <td className="py-1.5 text-right font-medium text-ifab-navy">
                        {Math.round(ore ?? 0).toLocaleString("it-IT")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {chartData.length > 0 && (
            <div className="mt-6 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData} outerRadius="75%">
                  <PolarGrid stroke="var(--ifab-border)" />
                  <PolarAngleAxis dataKey="caratteristica" tick={{ fontSize: 11, fill: "#292929" }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <Radar dataKey="valore" stroke="#1b98e0" fill="#1b98e0" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {caratteristicheIndagate.length > 0 && (
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {caratteristicheIndagate.map((key) => (
                <div key={key} className="rounded-lg bg-ifab-bg-soft p-3 text-xs">
                  <p className="font-semibold text-ifab-blue-dark">{CHARACTERISTICS[key].label}</p>
                  <p className="mt-1 italic text-ifab-text-muted">{CHARACTERISTICS[key].lettura}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-ifab-border bg-white p-8 text-center text-sm text-ifab-text-muted">
          Completa gli step 1, 2 e 3, poi genera la sintesi.
        </div>
      )}
    </div>
  );
}
