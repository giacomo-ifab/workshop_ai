// Esportazione PDF della scheda Use Case, condivisa fra partecipante (piede
// della scheda) e facilitatore (dashboard). Il PDF si compone con le primitive
// testuali di jsPDF invece di fotografare il DOM: la scheda è lunga, va su più
// pagine e il testo deve restare selezionabile e cercabile. Per lo stesso
// motivo non serve che la pagina sia visibile: il facilitatore la scarica
// partendo dai soli valori salvati.
//
// Il posizionamento è tutto a mano, quindi le regole da rispettare sono due:
// `y` è sempre la prossima baseline utile (mai il bordo superiore di un blocco)
// e ogni blocco chiede spazio con `ensure()` prima di disegnare, altrimenti
// finisce a cavallo del piede di pagina.

import {
  BLOCK2_SECTIONS,
  Block2Field,
  block2ValueLabel,
  isBlock2ValueFilled,
} from "@/config/block2Form";
import { Block2FieldValue } from "./types";

const MARGIN = { top: 48, right: 48, bottom: 58, left: 48 };

/** Palette dell'app (globals.css): il PDF deve sembrare la stessa cosa. */
const NAVY: [number, number, number] = [33, 52, 77];
const TEXT: [number, number, number] = [41, 41, 41];
const MUTED: [number, number, number] = [119, 119, 119];
const RULE: [number, number, number] = [225, 225, 225];
const BAND: [number, number, number] = [242, 244, 247];

/** Colonna delle etichette per i campi che stanno su una riga (le scelte). */
const LABEL_COLUMN = 178;

/** Interlinea: i corpi piccoli hanno bisogno di più aria in proporzione. */
const LEADING = 1.38;

type FontStyle = "normal" | "bold" | "italic";

export type UseCasePdfInput = {
  participantName: string;
  code: string;
  values: Record<string, Block2FieldValue>;
  /** Momento dell'esportazione, in millisecondi. */
  now: number;
};

/**
 * I font standard di jsPDF sono in WinAnsi: la lineetta lunga esce come uno
 * spazio vuoto e gli apici tipografici come caratteri sbagliati. Meglio
 * convertirli che vedere buchi nel documento.
 */
function clean(text: string): string {
  return text
    .replace(/[—–]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/ /g, " ")
    .replace(/•/g, "-");
}

function fileName(participantName: string): string {
  const slug = participantName.trim().replace(/\s+/g, "_").replace(/[^\w-]/g, "") || "partecipante";
  return `use-case-${slug}.pdf`;
}

function formatDate(now: number): string {
  return new Date(now).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Un campo sta su una riga se è una scelta o un testo breve senza capoversi. */
function isInlineField(field: Block2Field, value: Block2FieldValue | undefined): boolean {
  if (field.type === "textarea") return false;
  if (!isBlock2ValueFilled(value)) return true;
  const text = block2ValueLabel(field, value);
  return !text.includes("\n") && text.length <= 110;
}

export async function downloadUseCasePdf({
  participantName,
  code,
  values,
  now,
}: UseCasePdfInput): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const right = pageWidth - MARGIN.right;
  const contentWidth = right - MARGIN.left;
  let y = MARGIN.top;

  /** Font, corpo e colore per il prossimo disegno di testo. */
  function applyFont(size: number, style: FontStyle, color: [number, number, number]) {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);
    pdf.setTextColor(color[0], color[1], color[2]);
  }

  /** Righe in cui il testo si spezza alla larghezza data, con i capoversi. */
  function wrap(text: string, size: number, style: FontStyle, width: number): string[] {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);
    return clean(text)
      .split(/\r?\n/)
      .flatMap((paragraph) =>
        paragraph.trim() ? (pdf.splitTextToSize(paragraph, width) as string[]) : [""]
      );
  }

  function ensure(needed: number) {
    if (y + needed <= pageHeight - MARGIN.bottom) return;
    pdf.addPage();
    y = MARGIN.top;
  }

  /**
   * Blocco di testo a partire dalla baseline corrente. Le righe che iniziano
   * con "- " diventano punti elenco con rientro sporgente, perché i campi
   * lunghi che scrive l'agente sono elenchi e altrimenti la seconda riga di un
   * punto si allinea al pallino e non al testo.
   */
  function paragraph(
    text: string,
    opts: { size: number; style?: FontStyle; color?: [number, number, number]; x?: number; width?: number }
  ) {
    const { size } = opts;
    const style = opts.style ?? "normal";
    const color = opts.color ?? TEXT;
    const x = opts.x ?? MARGIN.left;
    const width = opts.width ?? right - x;
    const lineHeight = size * LEADING;
    const bulletIndent = size * 1.1;

    for (const raw of clean(text).split(/\r?\n/)) {
      const riga = raw.trim();
      if (!riga) {
        y += lineHeight * 0.5;
        continue;
      }

      const bullet = /^[-*]\s+/.test(riga);
      const testo = bullet ? riga.replace(/^[-*]\s+/, "") : riga;
      const indent = bullet ? bulletIndent : 0;
      const righe = wrap(testo, size, style, width - indent);

      righe.forEach((linea, i) => {
        ensure(lineHeight);
        applyFont(size, style, color);
        if (bullet && i === 0) pdf.text("-", x, y);
        pdf.text(linea, x + indent, y);
        y += lineHeight;
      });
    }
  }

  /** Fascia di sezione: sfondo pieno e titolo dentro, niente righe sul testo. */
  function sectionHeader(number: string, title: string) {
    const size = 11;
    const padding = 7;
    const height = size * LEADING + padding * 2;
    // La fascia non deve restare in fondo alla pagina senza il primo campo.
    ensure(height + 34);
    // Lo sfondo parte sopra la baseline: a inizio pagina va abbassato, o esce
    // dal margine superiore.
    y = Math.max(y, MARGIN.top + padding + size * 0.85);
    pdf.setFillColor(BAND[0], BAND[1], BAND[2]);
    pdf.rect(MARGIN.left, y - size * 0.85 - padding, contentWidth, height, "F");
    applyFont(size, "bold", NAVY);
    pdf.text(clean(`${number}  ${title}`), MARGIN.left + 10, y);
    y += size * LEADING + padding + 10;
  }

  /** Campo su una riga: etichetta a sinistra, valore nella sua colonna. */
  function inlineField(field: Block2Field, value: Block2FieldValue | undefined) {
    const size = 9.5;
    const lineHeight = size * LEADING;
    const compilato = isBlock2ValueFilled(value);
    const valore = compilato ? block2ValueLabel(field, value) : "Non compilato";
    const valueX = MARGIN.left + LABEL_COLUMN;
    const labelLines = wrap(field.label, size, "bold", LABEL_COLUMN - 12);
    const valueLines = wrap(valore, size, compilato ? "normal" : "italic", right - valueX);
    const righe = Math.max(labelLines.length, valueLines.length);

    ensure(righe * lineHeight);
    const start = y;
    labelLines.forEach((linea, i) => {
      applyFont(size, "bold", NAVY);
      pdf.text(linea, MARGIN.left, start + i * lineHeight);
    });
    valueLines.forEach((linea, i) => {
      applyFont(size, compilato ? "normal" : "italic", compilato ? TEXT : MUTED);
      pdf.text(linea, valueX, start + i * lineHeight);
    });
    y = start + righe * lineHeight + 5;
  }

  /** Campo descrittivo: etichetta sopra, testo sotto a tutta larghezza. */
  function blockField(field: Block2Field, value: Block2FieldValue | undefined) {
    const compilato = isBlock2ValueFilled(value);
    // Etichetta e prime due righe del valore restano insieme: un'etichetta
    // orfana in fondo alla pagina è il difetto più visibile in un PDF lungo.
    ensure(9 * LEADING + 2 * 10 * LEADING);
    applyFont(9, "bold", NAVY);
    pdf.text(clean(field.label), MARGIN.left, y);
    y += 9 * LEADING + 3;

    if (compilato) {
      paragraph(block2ValueLabel(field, value), { size: 10 });
    } else {
      paragraph("Non compilato", { size: 10, style: "italic", color: MUTED });
    }
    y += 9;
  }

  // --- Intestazione ---------------------------------------------------------
  applyFont(8, "normal", MUTED);
  pdf.text("WORKSHOP AI ADOPTION  ·  IFAB FOUNDATION", MARGIN.left, y);
  y += 8 * LEADING + 8;

  applyFont(20, "bold", NAVY);
  pdf.text("Use Case Submission", MARGIN.left, y);
  y += 20 * LEADING - 2;

  applyFont(9, "normal", MUTED);
  pdf.text(
    clean(`${participantName}  ·  sessione ${code}  ·  ${formatDate(now)}`),
    MARGIN.left,
    y
  );
  y += 9 * LEADING + 10;

  pdf.setDrawColor(RULE[0], RULE[1], RULE[2]);
  pdf.setLineWidth(0.7);
  pdf.line(MARGIN.left, y, right, y);
  y += 22;

  // --- Sezioni della scheda ------------------------------------------------
  for (const section of BLOCK2_SECTIONS) {
    sectionHeader(section.number, section.title);
    for (const field of section.fields) {
      const value = values[field.id];
      if (isInlineField(field, value)) inlineField(field, value);
      else blockField(field, value);
    }
    y += 8;
  }

  // --- Piede su ogni pagina (il totale si sa solo alla fine) ---------------
  const pagine = pdf.getNumberOfPages();
  for (let i = 1; i <= pagine; i++) {
    pdf.setPage(i);
    const footerY = pageHeight - 30;
    pdf.setDrawColor(RULE[0], RULE[1], RULE[2]);
    pdf.setLineWidth(0.5);
    pdf.line(MARGIN.left, footerY - 12, right, footerY - 12);
    applyFont(7.5, "normal", MUTED);
    pdf.text(clean(`Use Case Submission  ·  ${participantName}  ·  sessione ${code}`), MARGIN.left, footerY);
    pdf.text(`${i} / ${pagine}`, right, footerY, { align: "right" });
  }

  pdf.save(fileName(participantName));
}
