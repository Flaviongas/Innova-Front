import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type {
  DashboardExportSection,
  DashboardStats,
} from "@/lib/dashboard";

const BLUE = "3574B5";
const INK = "102133";
const MUTED = "5A6B7D";
const BORDER = "D5E1ED";
const HEADER_FILL = "F5F8FB";

const numberFormat = new Intl.NumberFormat("es-CL");
const clpFormat = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

function percent(part: number, total: number): string {
  return total === 0 ? "0%" : `${Math.round((part / total) * 100)}%`;
}

function text(
  value: string,
  options: { bold?: boolean; color?: string; size?: number; italics?: boolean } = {},
): TextRun {
  return new TextRun({
    text: value,
    bold: options.bold,
    color: options.color ?? INK,
    size: options.size ?? 19,
    italics: options.italics,
    font: "Aptos",
  });
}

function paragraph(
  value: string,
  options: {
    bold?: boolean;
    color?: string;
    size?: number;
    before?: number;
    after?: number;
    italics?: boolean;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
  } = {},
): Paragraph {
  return new Paragraph({
    alignment: options.alignment,
    spacing: { before: options.before ?? 0, after: options.after ?? 100 },
    children: [
      text(value, {
        bold: options.bold,
        color: options.color,
        size: options.size,
        italics: options.italics,
      }),
    ],
  });
}

function heading(value: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 4 },
    },
    children: [text(value, { bold: true, color: INK, size: 26 })],
  });
}

function rule(): Paragraph {
  return new Paragraph({
    spacing: { before: 80, after: 140 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 },
    },
    children: [],
  });
}

function summaryNarrative(stats: DashboardStats): string {
  const received =
    stats.status.find((row) => row.key === "recibida")?.count ?? 0;
  const inProgress =
    stats.status.find((row) => row.key === "en_proceso")?.count ?? 0;
  const deliveredShare = percent(
    stats.totals.delivered,
    stats.totals.requests,
  );
  return `Durante ${stats.rangeLabel}, se registraron ${numberFormat.format(
    stats.totals.requests,
  )} solicitudes en ${stats.sectorLabel}. ${numberFormat.format(
    stats.totals.delivered,
  )} están entregadas (${deliveredShare}), ${numberFormat.format(
    inProgress,
  )} en proceso y ${numberFormat.format(
    received,
  )} recibidas. Se entregaron ${numberFormat.format(
    stats.totals.deliveredUnits,
  )} unidades por un monto de ${clpFormat.format(stats.totals.amountClp)}.`;
}

function cell(
  value: string,
  options: {
    header?: boolean;
    width?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
  } = {},
): TableCell {
  return new TableCell({
    width: options.width
      ? { size: options.width, type: WidthType.PERCENTAGE }
      : undefined,
    shading: options.header
      ? { type: ShadingType.CLEAR, fill: HEADER_FILL }
      : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [
      new Paragraph({
        alignment: options.align ?? AlignmentType.LEFT,
        spacing: { after: 20 },
        children: [
          text(value, {
            bold: options.header,
            color: INK,
            size: 18,
          }),
        ],
      }),
    ],
  });
}

function table(
  headers: string[],
  rows: string[][],
  widths: number[],
  numericColumns: number[] = [],
): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((header, index) =>
      cell(header, {
        header: true,
        width: widths[index],
        align: numericColumns.includes(index)
          ? AlignmentType.RIGHT
          : AlignmentType.LEFT,
      }),
    ),
  });

  const bodyRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map((value, index) =>
          cell(value, {
            width: widths[index],
            align: numericColumns.includes(index)
              ? AlignmentType.RIGHT
              : AlignmentType.LEFT,
          }),
        ),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
    },
    rows: [headerRow, ...bodyRows],
  });
}

function summaryTable(stats: DashboardStats): Table {
  return table(
    ["Indicador", "Valor"],
    [
      ["Solicitudes creadas", numberFormat.format(stats.totals.requests)],
      [
        "Solicitudes entregadas",
        `${numberFormat.format(stats.totals.delivered)} (${percent(
          stats.totals.delivered,
          stats.totals.requests,
        )})`,
      ],
      [
        "Unidades entregadas",
        numberFormat.format(stats.totals.deliveredUnits),
      ],
      ["Monto entregado (CLP)", clpFormat.format(stats.totals.amountClp)],
      [
        "Cobertura territorial",
        `${numberFormat.format(stats.coverage.located)} de ${numberFormat.format(
          stats.totals.requests,
        )} con macrosector`,
      ],
    ],
    [58, 42],
    [1],
  );
}

function monthlyTable(stats: DashboardStats): Table {
  return table(
    ["Mes", "Solicitudes"],
    stats.monthly.map((row) => [row.label, numberFormat.format(row.requests)]),
    [70, 30],
    [1],
  );
}

function needTable(stats: DashboardStats): Table {
  return table(
    ["Tipo de necesidad", "Solicitudes", "%"],
    stats.byNeed.map((row) => [
      row.label,
      numberFormat.format(row.count),
      percent(row.count, stats.totals.requests),
    ]),
    [56, 24, 20],
    [1, 2],
  );
}

function territoryTable(stats: DashboardStats): Table {
  return table(
    ["Macrosector", "Solicitudes", "Unidades", "Monto"],
    stats.bySector.map((row) => [
      row.label,
      numberFormat.format(row.count),
      numberFormat.format(row.deliveredUnits),
      clpFormat.format(row.amountClp),
    ]),
    [36, 18, 20, 26],
    [1, 2, 3],
  );
}

function deliveryTable(stats: DashboardStats): Table {
  return table(
    ["Tipo de necesidad", "Unidades", "Monto"],
    stats.byDeliveryNeed.map((row) => [
      row.label,
      numberFormat.format(row.units),
      clpFormat.format(row.amountClp),
    ]),
    [48, 22, 30],
    [1, 2],
  );
}

function categoryTable(stats: DashboardStats): Table {
  return table(
    ["Tipo de evento", "Solicitudes", "%"],
    stats.byCategory.map((row) => [
      row.label,
      numberFormat.format(row.count),
      percent(row.count, stats.totals.requests),
    ]),
    [56, 24, 20],
    [1, 2],
  );
}

function statusTable(stats: DashboardStats): Table {
  return table(
    ["Estado", "Solicitudes", "%"],
    stats.status.map((row) => [
      row.label,
      numberFormat.format(row.count),
      percent(row.count, stats.totals.requests),
    ]),
    [56, 24, 20],
    [1, 2],
  );
}

function frequencyTable(stats: DashboardStats): Table | Paragraph {
  if (stats.calendar) {
    const days = stats.calendar.weeks.flat().filter(
      (cell): cell is NonNullable<typeof cell> => cell !== null,
    );
    const busiest = [...days]
      .filter((day) => day.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    if (busiest.length > 0) {
      return table(
        ["Fecha", "Solicitudes"],
        busiest.map((day) => [day.label, numberFormat.format(day.count)]),
        [60, 40],
        [1],
      );
    }
  }

  // Fallback while the backend has no per-day series: busiest weekday/hour
  // slots from the heatmap it already serves.
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const slots = stats.heatmap.rows
    .flatMap((row) =>
      row.cells.map((cell) => ({
        day: dayNames[row.weekday] ?? `Día ${row.weekday + 1}`,
        hour: cell.hour,
        count: cell.count,
      })),
    )
    .filter((slot) => slot.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  if (slots.length === 0) {
    return paragraph("Sin datos de frecuencia en el periodo.", {
      color: MUTED,
      italics: true,
    });
  }

  return table(
    ["Día", "Hora", "Solicitudes"],
    slots.map((slot) => [
      slot.day,
      `${String(slot.hour).padStart(2, "0")}:00`,
      numberFormat.format(slot.count),
    ]),
    [40, 30, 30],
    [2],
  );
}

export async function buildDashboardDocx(
  stats: DashboardStats,
  sections: DashboardExportSection[],
): Promise<Blob> {
  const children: Array<Paragraph | Table> = [
    paragraph("Indicadores", { bold: true, color: BLUE, size: 38, after: 60 }),
    paragraph("Municipalidad de Temuco", {
      bold: true,
      color: MUTED,
      size: 19,
      after: 20,
    }),
    paragraph("Ayudas y Emergencias", {
      color: MUTED,
      size: 18,
      after: 220,
    }),
    paragraph(
      `Periodo: ${stats.rangeLabel} (${stats.months} ${
        stats.months === 1 ? "mes" : "meses"
      })`,
      { bold: true, after: 40 },
    ),
    paragraph(`Territorio: ${stats.sectorLabel}`, { after: 40 }),
    paragraph(`Generado: ${stats.generatedAt}`, { color: MUTED, after: 40 }),
  ];



  const selected = new Set(sections);

  children.push(rule());

  if (selected.has("summary")) {
    children.push(
      heading("Resumen ejecutivo"),
      paragraph(summaryNarrative(stats), {
        size: 19,
        after: 140,
      }),
      summaryTable(stats),
    );
  }

  if (selected.has("monthly")) {
    children.push(heading("Solicitudes por mes"), monthlyTable(stats));
  }

  if (selected.has("need")) {
    children.push(heading("Solicitudes por tipo de necesidad"), needTable(stats));
  }

  if (selected.has("territory")) {
    children.push(
      heading("Distribución territorial"),
      paragraph(
        "El ranking muestra toda la ciudad; el resto de los indicadores está filtrado por el territorio del reporte.",
        { color: MUTED, size: 17, after: 100 },
      ),
      territoryTable(stats),
    );
  }

  if (selected.has("delivery")) {
    children.push(
      heading("Entregas por tipo de necesidad"),
      deliveryTable(stats),
    );
  }

  if (selected.has("status")) {
    children.push(heading("Estado actual de las solicitudes"), statusTable(stats));
  }

  if (selected.has("category")) {
    children.push(heading("Solicitudes por tipo de evento"), categoryTable(stats));
  }

  if (selected.has("heatmap")) {
    children.push(
      heading("Frecuencia por día"),
      paragraph(
        stats.calendar
          ? "Se muestran los 15 días con más solicitudes del periodo."
          : "Se muestran las 15 franjas de día y hora con más solicitudes del periodo.",
        {
          color: MUTED,
          size: 17,
          after: 100,
        },
      ),
      frequencyTable(stats),
    );
  }

  if (stats.coverage.unlocated > 0) {
    children.push(
      paragraph(
        `Cobertura: ${numberFormat.format(stats.coverage.unlocated)} ${
          stats.coverage.unlocated === 1 ? "solicitud" : "solicitudes"
        } sin macrosector. La distribución territorial las muestra por separado.`,
        { color: MUTED, size: 17, before: 200, after: 40 },
      ),
    );
  }

  children.push(
    paragraph(
      "Fuente: sistema de Ayudas y Emergencias de la Municipalidad de Temuco.",
      { color: MUTED, size: 16, before: 220, after: 40 },
    ),
    paragraph("Documento generado automáticamente desde el panel Indicadores.", {
      color: MUTED,
      size: 16,
      after: 40,
    }),
  );

  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80 },
        children: [
          text("Ayudas y Emergencias, página ", {
            color: MUTED,
            size: 16,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            color: MUTED,
            size: 16,
            font: "Aptos",
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    creator: "Ayudas y Emergencias",
    title: `Indicadores — ${stats.sectorLabel}`,
    description: "Reporte de indicadores de solicitudes y entregas.",
    styles: {
      default: {
        document: {
          run: { font: "Aptos", size: 19, color: INK },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        footers: { default: footer },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

export function dashboardDocxFilename(stats: DashboardStats): string {
  const slug = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  return `indicadores-${slug(stats.sectorLabel)}-${slug(stats.rangeLabel)}.docx`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
