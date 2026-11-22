export type AidSlice = {
  label: string;
  value: number;
  color: string;
};

export type Macrosector = {
  id: string;
  label: string;
  shortLabel: string;
  type: "Urbano" | "Rural";
  path: string;
  x: number;
  y: number;
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
    id: "MS-10",
    label: "Macrosector 10",
    shortLabel: "MS-10",
    type: "Urbano",
    path: "M0 0 L300 0 L312 150 L258 300 L0 312 Z",
    x: 150,
    y: 180,
    cases: 2,
    attentions: 220,
    people: 180,
    delta: 0,
    aidMix: AID_MIX,
  },
  {
    id: "MS-01",
    label: "Macrosector 01",
    shortLabel: "MS-01",
    type: "Urbano",
    path: "M300 0 L620 0 L612 120 L558 250 L312 150 Z",
    x: 460,
    y: 118,
    cases: 4,
    attentions: 620,
    people: 480,
    delta: 3.1,
    aidMix: AID_MIX,
  },
  {
    id: "MS-06",
    label: "Macrosector 06",
    shortLabel: "MS-06",
    type: "Urbano",
    path: "M620 0 L900 0 L912 140 L818 262 L612 120 Z",
    x: 758,
    y: 136,
    cases: 3,
    attentions: 410,
    people: 330,
    delta: 1.8,
    aidMix: AID_MIX,
  },
  {
    id: "RURAL",
    label: "Macrosector rural",
    shortLabel: "Rural",
    type: "Rural",
    path: "M900 0 L1200 0 L1200 330 L1002 310 L912 140 Z",
    x: 800,
    y: 86,
    cases: 2,
    attentions: 95,
    people: 80,
    delta: 1.1,
    aidMix: AID_MIX,
  },
  {
    id: "MS-05",
    label: "Macrosector 05",
    shortLabel: "MS-05",
    type: "Urbano",
    path: "M0 312 L258 300 L280 430 L238 570 L0 548 Z",
    x: 140,
    y: 420,
    cases: 5,
    attentions: 760,
    people: 590,
    delta: -1.2,
    aidMix: AID_MIX,
  },
  {
    id: "MS-02",
    label: "Macrosector 02",
    shortLabel: "MS-02",
    type: "Urbano",
    path: "M312 150 L558 250 L580 430 L400 478 L280 430 Z",
    x: 410,
    y: 320,
    cases: 6,
    attentions: 910,
    people: 700,
    delta: 2.4,
    aidMix: AID_MIX,
  },
  {
    id: "MS-04",
    label: "Macrosector 04",
    shortLabel: "MS-04",
    type: "Urbano",
    path: "M612 120 L818 262 L902 330 L858 508 L618 478 L580 430 Z",
    x: 760,
    y: 340,
    cases: 12,
    attentions: 1684,
    people: 1240,
    delta: 8.4,
    aidMix: SELECTED_AID_MIX,
  },
  {
    id: "MS-09",
    label: "Macrosector 09",
    shortLabel: "MS-09",
    type: "Urbano",
    path: "M902 330 L1200 330 L1200 660 L1000 648 L858 508 Z",
    x: 806,
    y: 512,
    cases: 4,
    attentions: 690,
    people: 550,
    delta: 2.2,
    aidMix: AID_MIX,
  },
  {
    id: "MS-08",
    label: "Macrosector 08",
    shortLabel: "MS-08",
    type: "Urbano",
    path: "M0 548 L238 570 L400 478 L420 800 L0 800 Z",
    x: 300,
    y: 610,
    cases: 8,
    attentions: 540,
    people: 430,
    delta: -0.6,
    aidMix: AID_MIX,
  },
  {
    id: "MS-03",
    label: "Macrosector 03",
    shortLabel: "MS-03",
    type: "Urbano",
    path: "M400 478 L618 478 L740 530 L720 800 L420 800 Z",
    x: 560,
    y: 650,
    cases: 6,
    attentions: 880,
    people: 690,
    delta: 5.2,
    aidMix: AID_MIX,
  },
  {
    id: "MS-07",
    label: "Macrosector 07",
    shortLabel: "MS-07",
    type: "Urbano",
    path: "M618 478 L858 508 L1000 648 L982 800 L720 800 L740 530 Z",
    x: 850,
    y: 680,
    cases: 9,
    attentions: 1320,
    people: 980,
    delta: 4.6,
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
    sectorId: "MS-04",
    time: "Hace 18 min",
    urgency: "Urgente",
  },
  {
    id: "AY-2026-000479",
    person: "Familia Muñoz",
    aidType: "Materiales de construcción",
    status: "En evaluación",
    tone: "info",
    sectorId: "MS-07",
    time: "Hace 42 min",
    urgency: "Normal",
  },
  {
    id: "AY-2026-000471",
    person: "Jorge L.",
    aidType: "Ayuda monetaria",
    status: "Documento observado",
    tone: "warning",
    sectorId: "MS-02",
    time: "Hace 1 h 12 min",
    urgency: "Urgente",
  },
  {
    id: "AY-2026-000468",
    person: "Rosa M.",
    aidType: "Bienes de bodega",
    status: "Entregada",
    tone: "success",
    sectorId: "MS-08",
    time: "Hace 2 h",
    urgency: "Normal",
  },
  {
    id: "AY-2026-000455",
    person: "Familia Sepúlveda",
    aidType: "Materiales de construcción",
    status: "Pendiente de regularización",
    tone: "warning",
    sectorId: "MS-04",
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
  return MACROSECTORS.find((sector) => sector.id === id) ?? MACROSECTORS[6];
}

export function territoryFill(cases: number): string {
  if (cases >= 12) return "#B9D9C7";
  if (cases >= 9) return "#C9E0D2";
  if (cases >= 6) return "#D8E9DE";
  if (cases >= 3) return "#E5F0E9";
  return "#EEF4F0";
}
