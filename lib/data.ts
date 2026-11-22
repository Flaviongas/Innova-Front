export type AidSlice = {
  label: string;
  value: number;
  color: string;
};

export type Macrosector = {
  id: string;
  /** Exact `macrosect` value in public/data/macrosectores.geojson. Absent when there is no official geometry yet (rural). */
  officialName?: string;
  label: string;
  shortLabel: string;
  type: "Urbano" | "Rural";
  cases: number;
  attentions: number;
  people: number;
  delta: number;
  aidMix: AidSlice[];
};

export type CaseStatusTone = "warning" | "info" | "success" | "danger";

export type RecentCase = {
  id: string;
  person: string;
  aidType: string;
  status: string;
  tone: CaseStatusTone;
  sectorId: string;
  time: string;
  urgency?: "Normal" | "Urgente";
};

export type OperationalAlert = {
  id: string;
  title: string;
  detail: string;
  count: number;
  tone: "warning" | "danger" | "info";
  icon: "regularization" | "stock" | "documents";
};

const AID_MIX: AidSlice[] = [
  { label: "Bienes de bodega", value: 42, color: "#4B9279" },
  { label: "Ayuda monetaria", value: 31, color: "#2876B8" },
  { label: "Materiales", value: 19, color: "#9A6A3A" },
  { label: "Apoyo social", value: 8, color: "#7652A6" },
];

const SELECTED_AID_MIX: AidSlice[] = [
  { label: "Bienes de bodega", value: 46, color: "#4B9279" },
  { label: "Ayuda monetaria", value: 28, color: "#2876B8" },
  { label: "Materiales", value: 18, color: "#9A6A3A" },
  { label: "Apoyo social", value: 8, color: "#7652A6" },
];

export const MACROSECTORS: Macrosector[] = [
  {
    id: "labranza",
    officialName: "LABRANZA",
    label: "Labranza",
    shortLabel: "Labranza",
    type: "Urbano",
    cases: 9,
    attentions: 1320,
    people: 980,
    delta: 4.6,
    aidMix: AID_MIX,
  },
  {
    id: "botrolhue",
    officialName: "BOTROLHUE",
    label: "Botrolhue",
    shortLabel: "Botrolhue",
    type: "Urbano",
    cases: 6,
    attentions: 880,
    people: 690,
    delta: 5.2,
    aidMix: AID_MIX,
  },
  {
    id: "poniente",
    officialName: "PONIENTE",
    label: "Poniente",
    shortLabel: "Poniente",
    type: "Urbano",
    cases: 5,
    attentions: 760,
    people: 590,
    delta: -1.2,
    aidMix: AID_MIX,
  },
  {
    id: "amanecer",
    officialName: "AMANECER",
    label: "Amanecer",
    shortLabel: "Amanecer",
    type: "Urbano",
    cases: 8,
    attentions: 540,
    people: 430,
    delta: -0.6,
    aidMix: AID_MIX,
  },
  {
    id: "centro",
    officialName: "CENTRO",
    label: "Centro",
    shortLabel: "Centro",
    type: "Urbano",
    cases: 12,
    attentions: 1684,
    people: 1240,
    delta: 8.4,
    aidMix: SELECTED_AID_MIX,
  },
  {
    id: "costanera",
    officialName: "COSTANERA DEL CAUTIN",
    label: "Costanera del Cautín",
    shortLabel: "Costanera",
    type: "Urbano",
    cases: 4,
    attentions: 690,
    people: 550,
    delta: 2.2,
    aidMix: AID_MIX,
  },
  {
    id: "pueblo-nuevo",
    officialName: "PUEBLO NUEVO",
    label: "Pueblo Nuevo",
    shortLabel: "P. Nuevo",
    type: "Urbano",
    cases: 3,
    attentions: 410,
    people: 330,
    delta: 1.8,
    aidMix: AID_MIX,
  },
  {
    id: "pedro-de-valdivia",
    officialName: "PEDRO DE VALDIVIA",
    label: "Pedro de Valdivia",
    shortLabel: "P. Valdivia",
    type: "Urbano",
    cases: 2,
    attentions: 220,
    people: 180,
    delta: 0,
    aidMix: AID_MIX,
  },
  {
    id: "nielol",
    officialName: "ÑIELOL",
    label: "Ñielol",
    shortLabel: "Ñielol",
    type: "Urbano",
    cases: 4,
    attentions: 620,
    people: 480,
    delta: 3.1,
    aidMix: AID_MIX,
  },
  {
    id: "el-carmen",
    officialName: "EL CARMEN",
    label: "El Carmen",
    shortLabel: "El Carmen",
    type: "Urbano",
    cases: 6,
    attentions: 910,
    people: 700,
    delta: 2.4,
    aidMix: AID_MIX,
  },
  {
    id: "rural",
    label: "Macrosector rural",
    shortLabel: "Rural",
    type: "Rural",
    cases: 2,
    attentions: 95,
    people: 80,
    delta: 1.1,
    aidMix: AID_MIX,
  },
];

export const RECENT_CASES: RecentCase[] = [
  {
    id: "AY-2026-000482",
    person: "Camila R.",
    aidType: "Bienes de bodega",
    status: "Pendiente de regularización",
    tone: "warning",
    sectorId: "centro",
    time: "Hace 18 min",
    urgency: "Urgente",
  },
  {
    id: "AY-2026-000479",
    person: "Familia Muñoz",
    aidType: "Materiales de construcción",
    status: "En evaluación",
    tone: "info",
    sectorId: "labranza",
    time: "Hace 42 min",
    urgency: "Normal",
  },
  {
    id: "AY-2026-000471",
    person: "Jorge L.",
    aidType: "Ayuda monetaria",
    status: "Documento observado",
    tone: "warning",
    sectorId: "el-carmen",
    time: "Hace 1 h 12 min",
    urgency: "Urgente",
  },
  {
    id: "AY-2026-000468",
    person: "Rosa M.",
    aidType: "Bienes de bodega",
    status: "Entregada",
    tone: "success",
    sectorId: "amanecer",
    time: "Hace 2 h",
    urgency: "Normal",
  },
  {
    id: "AY-2026-000455",
    person: "Familia Sepúlveda",
    aidType: "Materiales de construcción",
    status: "Pendiente de regularización",
    tone: "warning",
    sectorId: "centro",
    time: "Ayer",
    urgency: "Normal",
  },
];

export const OPERATIONAL_ALERTS: OperationalAlert[] = [
  {
    id: "regularization",
    title: "Entregas pendientes de regularización",
    detail: "Revisar actas y decretos",
    count: 7,
    tone: "warning",
    icon: "regularization",
  },
  {
    id: "stock",
    title: "Artículos bajo mínimo en bodega",
    detail: "Solicitar reposición",
    count: 4,
    tone: "danger",
    icon: "stock",
  },
  {
    id: "documents",
    title: "Documentos observados",
    detail: "Revisar firmas y visaciones",
    count: 2,
    tone: "info",
    icon: "documents",
  },
];

export function getMacrosector(id: string): Macrosector {
  return (
    MACROSECTORS.find((sector) => sector.id === id) ??
    MACROSECTORS.find((sector) => sector.id === "centro") ??
    MACROSECTORS[0]
  );
}

export function territoryFill(cases: number): string {
  if (cases >= 12) return "#B9D9C7";
  if (cases >= 9) return "#C9E0D2";
  if (cases >= 6) return "#D8E9DE";
  if (cases >= 3) return "#E5F0E9";
  return "#EEF4F0";
}
