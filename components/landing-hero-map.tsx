"use client";

import { useState } from "react";
import { InteractiveTerritoryMap } from "@/components/interactive-territory-map";
import { getMacrosector } from "@/lib/data";

export function LandingHeroMap() {
  const [selectedId, setSelectedId] = useState("MS-04");
  const selected = getMacrosector(selectedId);

  return (
    <div className="hero-live-map">
      <InteractiveTerritoryMap
        selectedId={selectedId}
        onSelect={setSelectedId}
        mapMode="map"
        scrollWheelZoom={false}
      />
      <div className="hero-live-tag" aria-live="polite">
        <strong>{selected.label}</strong>
        <span>
          {selected.cases} casos activos,{" "}
          {selected.attentions.toLocaleString("es-CL")} atenciones
        </span>
      </div>
    </div>
  );
}
