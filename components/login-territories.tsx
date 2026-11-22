"use client";

import { useEffect, useState } from "react";
import {
  loadMacrosectores,
  type MacrosectorCollection,
} from "@/lib/macrosectores";

const WIDTH = 1200;
const HEIGHT = 800;
// Fixed frame around Temuco so the texture is stable before data loads.
const FRAME = { minX: -72.83, maxX: -72.49, minY: -38.79, maxY: -38.67 };

function toPath(coordinates: number[][][]): string {
  return coordinates
    .map(
      (ring) =>
        "M" +
        ring.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") +
        "Z",
    )
    .join("");
}

export function LoginTerritories() {
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

  if (!collection) return null;

  const project = ([lng, lat]: number[]): [number, number] => [
    ((lng - FRAME.minX) / (FRAME.maxX - FRAME.minX)) * WIDTH,
    ((FRAME.maxY - lat) / (FRAME.maxY - FRAME.minY)) * HEIGHT,
  ];

  return (
    <svg
      className="login-map"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {collection.features.map((feature) => (
        <path
          key={feature.properties.macrosect}
          d={toPath(feature.geometry.coordinates.map((ring) => ring.map(project)))}
          className="login-map__territory"
        />
      ))}
    </svg>
  );
}
