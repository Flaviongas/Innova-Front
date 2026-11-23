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

const AID_MIX: AidSlice[] = [
  { label: "Bienes de bodega", value: 42, color: "#4B9FD4" },
  { label: "Ayuda monetaria", value: 31, color: "#3574B5" },
  { label: "Materiales", value: 19, color: "#B45309" },
  { label: "Apoyo social", value: 8, color: "#65A30D" },
];

const SELECTED_AID_MIX: AidSlice[] = [
  { label: "Bienes de bodega", value: 46, color: "#4B9FD4" },
  { label: "Ayuda monetaria", value: 28, color: "#3574B5" },
  { label: "Materiales", value: 18, color: "#B45309" },
  { label: "Apoyo social", value: 8, color: "#65A30D" },
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

export function getMacrosector(id: string): Macrosector {
  return (
    MACROSECTORS.find((sector) => sector.id === id) ??
    MACROSECTORS.find((sector) => sector.id === "centro") ??
    MACROSECTORS[0]
  );
}

export function territoryFill(cases: number): string {
  if (cases >= 12) return "#3574B5";
  if (cases >= 9) return "#4B9FD4";
  if (cases >= 6) return "#A9D6F5";
  if (cases >= 3) return "#D9EDFA";
  return "#EFF7FD";
}
