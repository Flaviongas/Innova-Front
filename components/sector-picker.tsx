"use client";

import { MapPin } from "lucide-react";
import { MACROSECTORS } from "@/lib/data";

export function SectorPicker({
  value,
  onChange,
  className,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  className?: string;
}) {
  return (
    <label
      className={`sector-picker${className ? ` ${className}` : ""}`}
      title="Macrosector seleccionado"
    >
      <MapPin size={14} />
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        aria-label="Macrosector seleccionado"
      >
        <option value="">Ciudad</option>
        {MACROSECTORS.map((sector) => (
          <option key={sector.id} value={sector.id}>
            {sector.label}
          </option>
        ))}
      </select>
    </label>
  );
}
