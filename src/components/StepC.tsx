"use client";

import { useRef, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Sparkles, FileDown } from "lucide-react";
import { STEP_B_CONFIG } from "@/config/block1Flow";
import { StepASubmission, StepBSubmission, StepCSubmission } from "@/lib/types";
import { synthesizeStepC } from "@/lib/clientApi";

export default function StepC({
  code,
  participantId,
  participantName,
  stepA,
  stepB,
  stepC,
  onGenerated,
}: {
  code: string;
  participantId: string;
  participantName: string;
  stepA?: StepASubmission;
  stepB?: StepBSubmission;
  stepC?: StepCSubmission;
  onGenerated: (data: StepCSubmission) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const { submission } = await synthesizeStepC(code, participantId);
      onGenerated(submission.stepC ?? {});
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

  const chartData = Object.entries(stepC?.profilo ?? {}).map(([dim, score]) => ({
    dimensione: STEP_B_CONFIG[dim as keyof typeof STEP_B_CONFIG].label,
    valore: score,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-lg font-semibold text-ifab-navy">C · Output</h2>
          <p className="text-sm text-ifab-text-muted">
            Sintesi descrittiva di quanto raccolto. La raccomandazione sull&apos;approccio AI arriverà a fine workshop.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !stepA}
            className="flex items-center gap-2 rounded-lg bg-ifab-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-ifab-blue-dark disabled:opacity-50"
          >
            <Sparkles size={16} /> {loading ? "Generazione..." : "Genera sintesi"}
          </button>
          {stepC?.sintesi && (
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

      {stepC?.sintesi ? (
        <div ref={printRef} className="rounded-xl border border-ifab-border bg-white p-6">
          <h3 className="mb-2 text-base font-semibold text-ifab-navy">{stepA?.processo || "Processo candidato"}</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ifab-text">{stepC.sintesi}</p>

          {chartData.length > 0 && (
            <div className="mt-6 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData} outerRadius="75%">
                  <PolarGrid stroke="var(--ifab-border)" />
                  <PolarAngleAxis dataKey="dimensione" tick={{ fontSize: 11, fill: "#292929" }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <Radar dataKey="valore" stroke="#1b98e0" fill="#1b98e0" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {Object.entries(stepB ?? {}).map(([dim, answer]) =>
              answer?.sintesi ? (
                <div key={dim} className="rounded-lg bg-ifab-bg-soft p-3 text-xs">
                  <p className="font-semibold text-ifab-blue-dark">
                    {STEP_B_CONFIG[dim as keyof typeof STEP_B_CONFIG].label}
                  </p>
                  <p className="mt-1 text-ifab-text">{answer.sintesi}</p>
                  {answer.lettura && <p className="mt-1 italic text-ifab-text-muted">{answer.lettura}</p>}
                </div>
              ) : null
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-ifab-border bg-white p-8 text-center text-sm text-ifab-text-muted">
          Compila Step A e le sottosezioni di Step B, poi genera la sintesi.
        </div>
      )}
    </div>
  );
}
