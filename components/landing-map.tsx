import { MACROSECTORS, getMacrosector, territoryFill } from "@/lib/data";

const SELECTED_ID = "MS-04";
const MARKER_IDS = ["MS-04", "MS-02", "MS-07", "MS-08", "MS-05"];

const ROADS = [
  "M -20 260 C 220 250, 420 300, 650 270 S 1000 220, 1220 250",
  "M 80 830 C 160 650, 300 540, 480 470 S 760 410, 940 230",
  "M -20 590 C 240 550, 420 600, 620 570 S 940 520, 1220 560",
  "M 560 -20 C 580 160, 640 340, 690 520 S 740 720, 760 820",
  "M 860 -20 C 890 180, 930 380, 980 560 S 1030 720, 1060 820",
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
];

export function LandingMap() {
  const selected = getMacrosector(SELECTED_ID);

  return (
    <svg
      className="landing-map"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-labelledby="landing-map-title"
    >
      <title id="landing-map-title">
        Mapa referencial de macrosectores de Temuco con el Macrosector 04
        seleccionado
      </title>

      <defs>
        <radialGradient id="landing-map-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#125742" stopOpacity="0.2" />
          <stop offset="70%" stopColor="#125742" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#125742" stopOpacity="0" />
        </radialGradient>

        <pattern
          id="landing-map-rural"
          width="30"
          height="30"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(32)"
        >
          <rect width="30" height="30" fill="#EEF3EA" />
          <path d="M0 0 V30" stroke="#DCE7D6" strokeWidth="1" />
          <path d="M15 0 V30" stroke="#E4EDDD" strokeWidth="1" />
        </pattern>

        <filter
          id="landing-map-shadow"
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
            floodOpacity="0.28"
          />
        </filter>
      </defs>

      <rect width="1200" height="800" fill="#E9EEEA" />

      <g>
        {MACROSECTORS.map((sector) => {
          const isSelected = sector.id === SELECTED_ID;
          const fill =
            sector.type === "Rural"
              ? "url(#landing-map-rural)"
              : isSelected
                ? "#B9D9C7"
                : territoryFill(sector.cases);

          return (
            <path
              key={sector.id}
              d={sector.path}
              fill={fill}
              className={`landing-map__territory${
                isSelected ? " landing-map__territory--selected" : ""
              }`}
            />
          );
        })}
      </g>

      <g aria-hidden="true">
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

      <g aria-hidden="true">
        <path
          className="landing-map__river"
          d="M -20 710 C 160 680, 280 750, 460 720 S 720 640, 940 690 S 1130 760, 1220 740"
        />
        <path
          className="landing-map__river-inner"
          d="M -20 710 C 160 680, 280 750, 460 720 S 720 640, 940 690 S 1130 760, 1220 740"
        />
      </g>

      <circle
        cx={selected.x}
        cy={selected.y}
        r="170"
        fill="url(#landing-map-glow)"
      />

      <g aria-hidden="true">
        {ROADS.map((d) => (
          <path key={d} d={d} className="landing-map__road" />
        ))}
        <path
          className="landing-map__highway"
          d="M 980 -20 C 1000 200, 1040 420, 1080 640 S 1100 760, 1110 820"
        />
      </g>

      <g className="landing-map__labels" aria-hidden="true">
        <text x="526" y="208" textAnchor="middle">
          CERRO ÑIELOL
        </text>
        <text x="470" y="396" textAnchor="middle">
          TEMUCO CENTRO
        </text>
        <text x="808" y="580" textAnchor="middle">
          PUEBLO NUEVO
        </text>
        <text x="560" y="744" textAnchor="middle" className="landing-map__label--water">
          RÍO CAUTÍN
        </text>
        <text x="704" y="452" textAnchor="middle" className="landing-map__label--road">
          AV. ALEMANIA
        </text>
      </g>

      <g aria-hidden="true">
        {MARKER_IDS.map((id) => {
          const sector = getMacrosector(id);
          const isSelected = id === SELECTED_ID;

          return (
            <g
              key={id}
              transform={`translate(${sector.x} ${sector.y})`}
              className={`landing-map__marker${
                isSelected ? " landing-map__marker--selected" : ""
              }`}
            >
              {isSelected && <circle className="landing-map__marker-ring" r="28" />}
              <circle
                className="landing-map__marker-circle"
                r={isSelected ? 21 : 18}
                filter={isSelected ? "url(#landing-map-shadow)" : undefined}
              />
              <text
                className="landing-map__marker-text"
                textAnchor="middle"
                dy="0.35em"
              >
                {sector.cases}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
