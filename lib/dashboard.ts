import {
  api,
  categoryLabel,
  helpLabel,
  stateLabel,
  type DashboardApiResponse,
  type EmergencyCategory,
  type EmergencyHelpType,
  type EmergencyState,
} from "@/lib/api";
import { getMacrosector } from "@/lib/data";

export type DashboardNeedRow = {
  key: EmergencyHelpType;
  label: string;
  count: number;
};

export type DashboardCategoryRow = {
  key: EmergencyCategory;
  label: string;
  count: number;
};

export type DashboardDeliveryRow = {
  key: EmergencyHelpType;
  label: string;
  units: number;
  amountClp: number;
};

export type DashboardSectorRow = {
  id: string | null;
  label: string;
  count: number;
  deliveredUnits: number;
  amountClp: number;
};

export type DashboardStatusRow = {
  key: EmergencyState;
  label: string;
  count: number;
};

export type DashboardMonthRow = {
  key: string;
  label: string;
  requests: number;
};

export type DashboardCalendarCell = {
  date: string;
  label: string;
  count: number;
};

export type DashboardCalendar = {
  weeks: Array<Array<DashboardCalendarCell | null>>;
  monthLabels: Array<{ label: string; weekIndex: number }>;
  max: number;
  activeDays: number;
};

export type DashboardHeatCell = {
  hour: number;
  count: number;
};

export type DashboardHeatRow = {
  weekday: number;
  cells: DashboardHeatCell[];
};

export type DashboardStats = {
  generatedAt: string;
  months: number;
  rangeLabel: string;
  sectorLabel: string;
  totals: {
    requests: number;
    delivered: number;
    deliveredUnits: number;
    amountClp: number;
  };
  byNeed: DashboardNeedRow[];
  byCategory: DashboardCategoryRow[];
  byDeliveryNeed: DashboardDeliveryRow[];
  bySector: DashboardSectorRow[];
  status: DashboardStatusRow[];
  monthly: DashboardMonthRow[];
  /** Present once the backend serves the per-day series. */
  calendar?: DashboardCalendar;
  heatmap: {
    hours: number[];
    rows: DashboardHeatRow[];
  };
  coverage: {
    located: number;
    unlocated: number;
  };
};

export type DashboardParams = {
  months: number;
  sectorId: string | null;
};

export type DashboardExportSection =
  | "summary"
  | "monthly"
  | "need"
  | "category"
  | "territory"
  | "delivery"
  | "status"
  | "heatmap";

export const DASHBOARD_EXPORT_SECTIONS: Array<{
  key: DashboardExportSection;
  label: string;
  hint: string;
}> = [
  {
    key: "summary",
    label: "Resumen ejecutivo",
    hint: "Solicitudes, entregas, unidades y monto.",
  },
  {
    key: "monthly",
    label: "Solicitudes por mes",
    hint: "Serie mensual del periodo.",
  },
  {
    key: "need",
    label: "Tipo de necesidad",
    hint: "Solicitudes agrupadas por ayuda.",
  },
  {
    key: "category",
    label: "Tipo de evento",
    hint: "Solicitudes agrupadas por evento.",
  },
  {
    key: "territory",
    label: "Distribución territorial",
    hint: "Ranking citywide con el sector destacado.",
  },
  {
    key: "delivery",
    label: "Entregas por necesidad",
    hint: "Unidades y monto CLP entregados.",
  },
  {
    key: "status",
    label: "Estado actual",
    hint: "Recibidas, en proceso y entregadas.",
  },
  {
    key: "heatmap",
    label: "Frecuencia por día",
    hint: "Días con más solicitudes.",
  },
];

const MONTH_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** Fill for a need category, shared by the bars and delivery rows. */
const NEED_COLORS: Record<string, string> = {
  alimentos: "#4B9FD4",
  dinero: "#3574B5",
  materiales: "#B45309",
  higiene: "#65A30D",
  abrigo: "#4B99A5",
  otro: "#8B8E8D",
};

export function needColor(key: string): string {
  return NEED_COLORS[key] ?? NEED_COLORS.otro;
}

/** Backend canonical id → frontend sector id. */
function normalizeSectorId(id: string | null): string | null {
  if (!id) return null;
  if (id === "costanera-del-cautin") return "costanera";
  return id;
}

/** Frontend sector id → backend canonical id. */
function canonicalSectorId(id: string | null): string | null {
  if (!id) return null;
  if (id === "costanera") return "costanera-del-cautin";
  return id;
}

function sectorDisplayLabel(id: string | null, fallback: string): string {
  if (!id) return "Sin sector";
  try {
    return getMacrosector(id).label;
  } catch {
    return fallback;
  }
}

function monthShort(key: string): string {
  const month = Number(key.slice(5, 7));
  return MONTH_SHORT[month - 1] ?? key;
}

function dayLabel(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return `${String(day).padStart(2, "0")}-${String(month).padStart(
    2,
    "0",
  )}-${year}`;
}

/** "2026-11-26T14:03:00Z" → "26-11-2026 11:03" in America/Santiago. */
function formatGeneratedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("day")}-${get("month")}-${get("year")} ${get("hour")}:${get("minute")}`;
}

function buildCalendar(
  daily: Array<{ date: string; count: number }>,
  fromKey: string,
  toKey: string,
): DashboardCalendar {
  const counts = new Map<string, number>();
  for (const day of daily) {
    counts.set(day.date, day.count);
  }

  const start = new Date(`${fromKey}T12:00:00Z`);
  const end = new Date(`${toKey}T12:00:00Z`);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const last = toKey > todayKey ? todayKey : toKey;

  const weeks: DashboardCalendar["weeks"] = [];
  const monthLabels: DashboardCalendar["monthLabels"] = [];
  let week: Array<DashboardCalendarCell | null> = [];
  const firstWeekday = (start.getUTCDay() + 6) % 7;
  for (let index = 0; index < firstWeekday; index += 1) {
    week.push(null);
  }

  for (
    let cursor = new Date(start);
    `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-${String(
      cursor.getUTCDate(),
    ).padStart(2, "0")}` <= last;
    cursor = new Date(cursor.getTime() + 86400000)
  ) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;
    const day = cursor.getUTCDate();
    const key = `${year}-${String(month).padStart(2, "0")}-${String(
      day,
    ).padStart(2, "0")}`;

    if (day === 1) {
      monthLabels.push({
        label: MONTH_SHORT[month - 1],
        weekIndex: weeks.length,
      });
    }

    week.push({
      date: key,
      label: dayLabel(key),
      count: counts.get(key) ?? 0,
    });

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const values = [...counts.values()];
  const max = values.length > 0 ? Math.max(...values) : 0;

  return {
    weeks,
    monthLabels,
    max,
    activeDays: values.filter((count) => count > 0).length,
  };
}

function adaptDashboard(response: DashboardApiResponse): DashboardStats {
  const months = response.meta.months;
  const fromMonth = response.meta.period.from.slice(0, 7);
  const toMonth = response.meta.period.to.slice(0, 7);
  const fromLabel = `${monthShort(fromMonth)} ${fromMonth.slice(0, 4)}`;
  const toLabel = `${monthShort(toMonth)} ${toMonth.slice(0, 4)}`;
  const rangeLabel =
    fromMonth === toMonth ? `${toLabel}` : `${fromLabel} – ${toLabel}`;

  const sectorId = normalizeSectorId(response.meta.sector);

  return {
    generatedAt: formatGeneratedAt(response.meta.generated_at),
    months,
    rangeLabel,
    sectorLabel: sectorId
      ? sectorDisplayLabel(sectorId, response.meta.sector_label)
      : "Ciudad",
    totals: {
      requests: response.totals.requests,
      delivered: response.totals.delivered,
      deliveredUnits: response.totals.delivered_units,
      amountClp: response.totals.amount_clp,
    },
    byNeed: response.by_need.map((row) => ({
      key: row.help_type as DashboardNeedRow["key"],
      label: helpLabel(row.help_type),
      count: row.count,
    })),
    byCategory: response.by_category.map((row) => ({
      key: row.category as DashboardCategoryRow["key"],
      label: categoryLabel(row.category),
      count: row.count,
    })),
    byDeliveryNeed: response.by_delivery_need.map((row) => ({
      key: row.help_type as DashboardDeliveryRow["key"],
      label: helpLabel(row.help_type),
      units: row.delivered_units,
      amountClp: row.amount_clp,
    })),
    bySector: response.by_sector.map((row) => {
      const id = normalizeSectorId(row.macrosector);
      return {
        id,
        label: id ? sectorDisplayLabel(id, row.name) : "Sin sector",
        count: row.count,
        deliveredUnits: row.delivered_units,
        amountClp: row.amount_clp,
      };
    }),
    status: response.status.map((row) => ({
      key: row.state as DashboardStatusRow["key"],
      label: stateLabel(row.state),
      count: row.count,
    })),
    monthly: response.monthly.map((row) => ({
      key: row.month,
      label: monthShort(row.month),
      requests: row.requests,
    })),
    calendar: response.daily
      ? buildCalendar(
          response.daily,
          response.meta.period.from,
          response.meta.period.to,
        )
      : undefined,
    heatmap: {
      hours: response.heatmap.hours,
      rows: response.heatmap.rows.map((row) => ({
        weekday: row.weekday,
        cells: row.cells.map((cell) => ({
          hour: cell.hour,
          count: cell.count,
        })),
      })),
    },
    coverage: {
      located: response.coverage.located,
      unlocated: response.coverage.unlocated,
    },
  };
}

/**
 * Dashboard data load against `GET /api/admin/dashboard`. The UI contract
 * stays stable; the backend owns aggregation, windows and timezones.
 */
export async function loadDashboardStats(
  params: DashboardParams,
): Promise<DashboardStats> {
  const months = Math.max(1, Math.min(12, Math.round(params.months)));
  const response = await api.getDashboardStats(
    months,
    canonicalSectorId(params.sectorId),
  );
  return adaptDashboard(response);
}
