"use client";

import { useEffect, useState } from "react";
import { InteractiveTerritoryMap } from "@/components/interactive-territory-map";
import { getMacrosector } from "@/lib/data";
import {
  OFFICIAL_TO_ID,
  loadMacrosectores,
  type MacrosectorCollection,
} from "@/lib/macrosectores";

export function LandingHeroMap() {
  const [selectedId, setSelectedId] = useState("centro");
  const [collection, setCollection] =
    useState<MacrosectorCollection | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMacrosectores().then(
      (data) => {
        if (!cancelled) setCollection(data);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = getMacrosector(selectedId);
  const feature = collection?.features.find(
    (item) => OFFICIAL_TO_ID[item.properties.macrosect] === selectedId,
  );
  const area = feature?.properties.area_km2;
  const population = feature?.properties.pob_total;

  return (
    <div className="hero-live-map">
      <InteractiveTerritoryMap
        selectedId={selectedId}
        onSelect={setSelectedId}
        mapMode="map"
        scrollWheelZoom={false}
        showCounts={false}
        choropleth={false}
      />
      <div className="hero-live-tag" aria-live="polite">
        <strong>{selected.label}</strong>
        <span>
          {area && population
            ? `${area} km² · ${population.toLocaleString("es-CL")} hab. · Censo 2017`
            : "Macrosector oficial"}
        </span>
      </div>
    </div>
  );
}
