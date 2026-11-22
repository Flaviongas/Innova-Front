"use client";

import { useId } from "react";
import { MACROSECTORS, getMacrosector, territoryFill } from "@/lib/data";

type TerritoryMapProps = {
  selectedId: string;
  onSelect: (id: string) => void;
  compact?: boolean;
};

const MAJOR_ROADS = [
  "M -20 260 C 220 250, 420 300, 650 270 S 1000 220, 1220 250",
  "M 80 830 C 160 650, 300 540, 480 470 S 760 410, 940 230",
  "M -20 590 C 240 550, 420 600, 620 570 S 940 520, 1220 560",
  "M 560 -20 C 580 160, 640 340, 690 520 S 740 720, 760 820",
  "M 860 -20 C 890 180, 930 380, 980 560 S 1030 720, 1060 820",
];

const MINOR_ROADS = [
  "M 0 102 L 300 92",
  "M 0 182 L 262 170",
  "M 322 62 L 600 72",
  "M 622 82 L 900 72",
  "M 0 362 L 252 350",
  "M 20 472 L 242 462",
  "M 302 382 L 572 372",
  "M 602 302 L 882 292",
  "M 922 422 L 1200 412",
  "M 0 662 L 222 652",
  "M 432 562 L 702 552",
  "M 742 702 L 982 692",
  "M 602 762 L 982 752",
  "M 102 0 L 92 302",
  "M 202 0 L 212 302",
  "M 382 0 L 392 202",
  "M 542 0 L 552 252",
  "M 702 0 L 712 302",
  "M 822 0 L 832 252",
  "M 962 0 L 972 332",
  "M 1082 0 L 1092 332",
  "M 62 322 L 72 572",
  "M 182 312 L 192 572",
  "M 342 262 L 352 482",
  "M 502 252 L 512 482",
  "M 662 252 L 672 482",
  "M 782 262 L 792 512",
  "M 922 332 L 932 652",
  "M 1062 332 L 1072 662",
  "M 122 572 L 132 800",
  "M 302 562 L 312 800",
  "M 482 482 L 492 800",
  "M 642 532 L 652 800",
  "M 802 512 L 812 800",
  "M 942 652 L 952 800",
  "M 1102 662 L 1112 800",
  "M 20 42 L 300 38",
  "M 322 22 L 600 30",
  "M 0 222 L 260 216",
  "M 282 202 L 558 212",
  "M 602 222 L 880 216",
  "M 920 242 L 1200 236",
  "M 0 522 L 238 516",
  "M 282 542 L 560 532",
  "M 602 522 L 858 518",
  "M 902 542 L 1200 536",
  "M 0 742 L 220 738",
  "M 432 782 L 700 776",
  "M 742 742 L 980 736",
  "M 1022 782 L 1200 776",
  "M 42 0 L 36 300",
  "M 262 0 L 272 300",
  "M 462 0 L 472 250",
  "M 622 0 L 632 250",
  "M 762 0 L 772 250",
  "M 902 0 L 912 330",
  "M 1042 0 L 1052 330",
  "M 42 322 L 52 570",
  "M 222 312 L 232 570",
  "M 402 262 L 412 482",
  "M 562 252 L 572 482",
  "M 722 252 L 732 482",
  "M 842 262 L 852 512",
  "M 982 332 L 992 652",
  "M 1122 332 L 1132 662",
  "M 162 572 L 172 800",
  "M 342 562 L 352 800",
  "M 522 482 L 532 800",
  "M 682 532 L 692 800",
  "M 842 512 L 852 800",
  "M 982 652 L 992 800",
  "M 1142 662 L 1152 800",
  "M 300 202 L 390 302",
  "M 600 302 L 690 402",
  "M 300 402 L 390 502",
  "M 600 502 L 690 602",
  "M 300 602 L 390 702",
  "M 600 702 L 690 802",
];

const ROAD_LABELS = [
  { text: "AV. ALEMANIA", x: 704, y: 452, rotate: -8 },
  { text: "AV. CAUPOLICÁN", x: 326, y: 558, rotate: 8 },
  { text: "RUTA 5", x: 1012, y: 428, rotate: 90 },
  { text: "AV. PEDRO DE VALDIVIA", x: 620, y: 610, rotate: 5 },
  { text: "AV. BULNES", x: 138, y: 304, rotate: 88 },
];

const PLACE_LABELS = [
  { text: "CERRO ÑIELOL", x: 526, y: 208 },
  { text: "TEMUCO CENTRO", x: 470, y: 396 },
  { text: "PUEBLO NUEVO", x: 808, y: 580 },
  { text: "LABRANZA", x: 330, y: 720 },
  { text: "RURAL", x: 1040, y: 250 },
];

export function TerritoryMap({ selectedId, onSelect, compact = false }: TerritoryMapProps) {
  const selected = getMacrosector(selectedId);
  const tooltipY = selected.y < 150 ? selected.y + 34 : selected.y - 66;
  const viewWidth = compact ? 520 : 1200;
  const viewHeight = compact ? 600 : 800;
  const viewX = compact
    ? Math.min(Math.max(selected.x - viewWidth / 2, 0), 1200 - viewWidth)
    : 0;
  const viewY = compact
    ? Math.min(Math.max(selected.y - viewHeight / 2, 0), 800 - viewHeight)
    : 0;
  const mapId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const titleId = `${mapId}-title`;
  const descriptionId = `${mapId}-description`;
  const selectedGlowId = `${mapId}-selected-glow`;
  const ruralFieldsId = `${mapId}-rural-fields`;
  const urbanBlocksId = `${mapId}-urban-blocks`;
  const markerShadowId = `${mapId}-marker-shadow`;

  return (
    <svg
      className="territory-map"
      viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="xMidYMid slice"
      role="group"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <title id={titleId}>Mapa referencial de macrosectores de Temuco</title>
      <desc id={descriptionId}>
        Mapa esquemático con once macrosectores, casos activos por territorio y
        acceso al detalle de cada macrosector.
      </desc>

      <defs>
        <radialGradient id={selectedGlowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#125742" stopOpacity="0.18" />
          <stop offset="55%" stopColor="#125742" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#125742" stopOpacity="0" />
        </radialGradient>

        <pattern
          id={ruralFieldsId}
          width="30"
          height="30"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(32)"
        >
          <rect width="30" height="30" fill="#EEF3EA" />
          <path d="M0 0 V30" stroke="#DCE7D6" strokeWidth="1" />
          <path d="M15 0 V30" stroke="#E4EDDD" strokeWidth="1" />
        </pattern>

        <pattern
          id={urbanBlocksId}
          width="44"
          height="44"
          patternUnits="userSpaceOnUse"
        >
          <rect x="5" y="6" width="14" height="10" rx="1.5" fill="#DFE8E1" />
          <rect x="25" y="6" width="12" height="10" rx="1.5" fill="#E4EBE5" />
          <rect x="5" y="24" width="12" height="10" rx="1.5" fill="#E2EAE3" />
          <rect x="23" y="24" width="15" height="10" rx="1.5" fill="#DDE7DF" />
        </pattern>

        <filter
          id={markerShadowId}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="4"
            floodColor="#0F4937"
            floodOpacity="0.32"
          />
        </filter>
      </defs>

      <rect width="1200" height="800" fill="#E9EEEA" />

      <g className="map-territories">
        {MACROSECTORS.map((sector) => {
          const isSelected = sector.id === selectedId;
          const fill =
            sector.type === "Rural"
              ? `url(#${ruralFieldsId})`
              : isSelected
                ? "#B9D9C7"
                : territoryFill(sector.cases);

          return (
            <path
              key={sector.id}
              d={sector.path}
              fill={fill}
              className={`territory${isSelected ? " territory--selected" : ""}`}
            />
          );
        })}
      </g>

      <path
        d="M 292 118 L 920 138 L 984 612 L 408 766 L 214 566 Z"
        fill={`url(#${urbanBlocksId})`}
        opacity="0.34"
        pointerEvents="none"
      />

      <g className="map-parks" pointerEvents="none">
        <path
          d="M 468 148 C 518 118, 592 138, 614 190 C 626 242, 564 274, 512 254 C 460 236, 438 184, 468 148 Z"
          fill="#D4E3D2"
          stroke="#C5D9C4"
          strokeWidth="1"
        />
        <path
          d="M 660 550 C 692 536, 728 552, 736 582 C 742 610, 708 628, 682 618 C 654 608, 640 566, 660 550 Z"
          fill="#D9E7D7"
        />
        <path
          d="M 170 612 C 198 598, 226 612, 232 640 C 236 666, 206 682, 184 670 C 160 658, 150 626, 170 612 Z"
          fill="#D9E7D7"
        />
      </g>

      <g className="map-river" pointerEvents="none">
        <path
          className="river"
          d="M -20 710 C 160 680, 280 750, 460 720 S 720 640, 940 690 S 1130 760, 1220 740"
        />
        <path
          className="river-inner"
          d="M -20 710 C 160 680, 280 750, 460 720 S 720 640, 940 690 S 1130 760, 1220 740"
        />
        <text
          x="560"
          y="744"
          textAnchor="middle"
          className="map-label map-label--water"
        >
          RÍO CAUTÍN
        </text>
      </g>

      <circle
        cx={selected.x}
        cy={selected.y}
        r="152"
        fill={`url(#${selectedGlowId})`}
        pointerEvents="none"
      />

      <g className="road-network" pointerEvents="none">
        <g className="road-edges">
          {MAJOR_ROADS.map((d) => (
            <path key={`edge-${d}`} d={d} className="road-edge" />
          ))}
          <path
            d="M 980 -20 C 1000 200, 1040 420, 1080 640 S 1100 760, 1110 820"
            className="highway-edge"
          />
        </g>

        <g className="road-surfaces">
          {MAJOR_ROADS.map((d) => (
            <path key={`surface-${d}`} d={d} className="road-major" />
          ))}
          {MINOR_ROADS.map((d) => (
            <path key={d} d={d} className="road-minor" />
          ))}
          <path
            d="M 980 -20 C 1000 200, 1040 420, 1080 640 S 1100 760, 1110 820"
            className="highway"
          />
          <path
            d="M 980 -20 C 1000 200, 1040 420, 1080 640 S 1100 760, 1110 820"
            className="highway-center"
          />
        </g>
      </g>

      <g className="map-labels" pointerEvents="none" aria-hidden="true">
        {PLACE_LABELS.map((label) => (
          <text
            key={label.text}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            className="map-label"
          >
            {label.text}
          </text>
        ))}

        {ROAD_LABELS.map((label) => (
          <text
            key={label.text}
            transform={`translate(${label.x} ${label.y}) rotate(${label.rotate})`}
            textAnchor="middle"
            className="map-label map-label--road"
          >
            {label.text}
          </text>
        ))}
      </g>

      <g className="map-markers">
        {MACROSECTORS.map((sector) => {
          const isSelected = sector.id === selectedId;
          const radius = isSelected ? 21 : 18;

          return (
            <g
              key={sector.id}
              className={`map-marker${isSelected ? " map-marker--selected" : ""}`}
              transform={`translate(${sector.x} ${sector.y})`}
              role="button"
              tabIndex={0}
              aria-label={`${sector.label}: ${sector.cases} casos activos. Ver detalle.`}
              aria-pressed={isSelected}
              onClick={() => onSelect(sector.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(sector.id);
                }
              }}
            >
              <title>{`${sector.label} · ${sector.cases} casos activos`}</title>

              {isSelected && (
                <>
                  <circle className="marker-halo" r="34" />
                  <circle className="marker-ring" r="27" />
                </>
              )}

              <circle
                className="marker-circle"
                r={radius}
                filter={isSelected ? `url(#${markerShadowId})` : undefined}
              />
              <text className="marker-text" textAnchor="middle" dy="0.35em">
                {sector.cases}
              </text>
            </g>
          );
        })}
      </g>

      <g
        className="map-tooltip"
        transform={`translate(${selected.x - 82} ${tooltipY})`}
        pointerEvents="none"
        aria-hidden="true"
      >
        <rect className="map-tooltip__background" width="164" height="42" rx="9" />
        {selected.y < 150 ? (
          <path
            className="map-tooltip__background"
            d="M 74 0 L 82 -8 L 90 0 Z"
          />
        ) : (
          <path
            className="map-tooltip__background"
            d="M 74 42 L 82 50 L 90 42 Z"
          />
        )}
        <text x="82" y="17" textAnchor="middle" className="map-tooltip__title">
          {selected.label}
        </text>
        <text x="82" y="32" textAnchor="middle" className="map-tooltip__meta">
          {selected.cases} casos activos
        </text>
      </g>
    </svg>
  );
}
