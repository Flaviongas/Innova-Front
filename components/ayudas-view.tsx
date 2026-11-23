"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Package,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { getMacrosector } from "@/lib/data";
import {
  formatDateTime,
  helpLabel,
  stateLabel,
  stateTone,
  type Emergency,
  type EmergencyHelpType,
  type EmergencyState,
  type StockItem,
} from "@/lib/api";

export type AyudasViewProps = {
  emergencies: Emergency[];
  stockItems: StockItem[];
  loading: boolean;
  error: string | null;
  forbidden: boolean;
  role?: string;
  onReload: () => void;
  onSelect: (item: Emergency) => void;
};

const HELP_TYPES: EmergencyHelpType[] = [
  "alimentos",
  "higiene",
  "abrigo",
  "dinero",
  "materiales",
  "otro",
];

const CATEGORIES = ["alimentos", "higiene", "abrigo", "materiales", "otro"];

const STATES: EmergencyState[] = ["recibida", "en_proceso", "entregada"];

type CaseRow = {
  emergency: Emergency;
  units: number;
  summary: string;
  helps: Set<string>;
  categories: Set<string>;
};

type ItemRow = {
  item: string;
  category: string;
  unit: string;
  quantity: number;
  cases: number;
  stockQuantity: number | null;
  lowStock: boolean;
  helps: Set<string>;
  lastUpdate: string;
};

function sectorName(item: Emergency): string {
  return item.macrosector ? getMacrosector(item.macrosector).label : "Sin sector";
}

function plural(value: number, one: string, many: string): string {
  return `${value} ${value === 1 ? one : many}`;
}

export function AyudasView({
  emergencies,
  stockItems,
  loading,
  error,
  forbidden,
  role,
  onReload,
  onSelect,
}: AyudasViewProps) {
  const [query, setQuery] = useState("");
  const [helpType, setHelpType] = useState<EmergencyHelpType | "">("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState<EmergencyState | "">("");
  const [group, setGroup] = useState<"casos" | "articulos">("casos");

  const stockByName = useMemo(() => {
    const map = new Map<string, StockItem>();
    for (const item of stockItems) map.set(item.name, item);
    return map;
  }, [stockItems]);

  const caseRows = useMemo<CaseRow[]>(
    () =>
      emergencies
        .filter((item) => item.delivered.length > 0)
        .map((emergency) => {
          const units = emergency.delivered.reduce(
            (total, line) => total + line.quantity,
            0,
          );
          const helps = new Set<string>([emergency.help_type]);
          const categories = new Set<string>();
          for (const line of emergency.delivered) {
            const stock = stockByName.get(line.item);
            if (stock) categories.add(stock.category);
          }
          return {
            emergency,
            units,
            summary: emergency.delivered
              .map((line) => `${line.item} ×${line.quantity}`)
              .join(", "),
            helps,
            categories,
          };
        })
        .sort((a, b) =>
          b.emergency.updated_at.localeCompare(a.emergency.updated_at),
        ),
    [emergencies, stockByName],
  );

  const itemRows = useMemo<ItemRow[]>(() => {
    const map = new Map<string, ItemRow>();
    for (const emergency of emergencies) {
      for (const line of emergency.delivered) {
        const stock = stockByName.get(line.item);
        const row =
          map.get(line.item) ??
          ({
            item: line.item,
            category: stock?.category ?? "",
            unit: stock?.unit ?? "",
            quantity: 0,
            cases: 0,
            stockQuantity: stock?.quantity ?? null,
            lowStock: stock?.low_stock ?? false,
            helps: new Set<string>(),
            lastUpdate: emergency.updated_at,
          } satisfies ItemRow);
        row.quantity += line.quantity;
        row.cases += 1;
        row.helps.add(emergency.help_type);
        if (emergency.updated_at > row.lastUpdate) {
          row.lastUpdate = emergency.updated_at;
        }
        map.set(line.item, row);
      }
    }
    return [...map.values()].sort((a, b) => b.quantity - a.quantity);
  }, [emergencies, stockByName]);

  const counts = useMemo(
    () => ({
      units: itemRows.reduce((total, row) => total + row.quantity, 0),
      cases: caseRows.length,
      items: itemRows.length,
      delivered: emergencies.filter((item) => item.state === "entregada").length,
    }),
    [caseRows, itemRows, emergencies],
  );

  const filteredCases = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return caseRows.filter(({ emergency, helps, categories, summary }) => {
      if (helpType && emergency.help_type !== helpType) return false;
      if (category && !categories.has(category)) return false;
      if (state && emergency.state !== state) return false;
      if (!needle) return true;
      return [
        emergency.code,
        emergency.title,
        emergency.address,
        sectorName(emergency),
        helpLabel(emergency.help_type),
        summary,
        ...[...helps].map(helpLabel),
        ...[...categories].map(helpLabel),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [caseRows, query, helpType, category, state]);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return itemRows.filter((row) => {
      if (category && row.category !== category) return false;
      if (helpType && !row.helps.has(helpType)) return false;
      if (!needle) return true;
      return [
        row.item,
        helpLabel(row.category),
        ...[...row.helps].map(helpLabel),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [itemRows, query, category, helpType]);

  const filtersActive = Boolean(query || helpType || category || state);

  function clearFilters() {
    setQuery("");
    setHelpType("");
    setCategory("");
    setState("");
  }

  function switchGroup(next: "casos" | "articulos") {
    setGroup(next);
    setState("");
  }

  return (
    <div className="queue-view">
      <header className="queue-head">
        <div className="queue-head-copy">
          <span className="eyebrow">Gestión operativa</span>
          <h1>Ayudas</h1>
          <p>
            Entregas registradas sobre los casos: qué se entregó, a qué
            territorio y cuánto queda disponible en bodega.
          </p>
        </div>
        <div className="queue-head-actions">
          <button
            className="queue-button queue-button--ghost"
            type="button"
            onClick={onReload}
            disabled={loading}
          >
            <RefreshCw size={14} />
            {loading ? "Cargando…" : "Recargar"}
          </button>
        </div>
      </header>

      <div className="queue-summary" role="list">
        <div className="queue-stat" role="listitem">
          <span className="queue-stat-label">Unidades entregadas</span>
          <strong className="queue-stat-value">
            {counts.units.toLocaleString("es-CL")}
          </strong>
        </div>
        <div className="queue-stat queue-stat--info" role="listitem">
          <span className="queue-stat-label">Casos con entregas</span>
          <strong className="queue-stat-value">{counts.cases}</strong>
        </div>
        <div className="queue-stat" role="listitem">
          <span className="queue-stat-label">Artículos distintos</span>
          <strong className="queue-stat-value">{counts.items}</strong>
        </div>
        <div className="queue-stat queue-stat--success" role="listitem">
          <span className="queue-stat-label">Casos entregados</span>
          <strong className="queue-stat-value">{counts.delivered}</strong>
        </div>
      </div>

      <div className="queue-toolbar">
        <div className="queue-tabs" role="tablist" aria-label="Agrupar ayudas">
          <button
            type="button"
            role="tab"
            aria-selected={group === "casos"}
            className={group === "casos" ? "is-active" : ""}
            onClick={() => switchGroup("casos")}
          >
            Por caso
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={group === "articulos"}
            className={group === "articulos" ? "is-active" : ""}
            onClick={() => switchGroup("articulos")}
          >
            Por artículo
          </button>
        </div>

        <div className="queue-search">
          <Search size={15} className="search-icon" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar artículo, código, título o sector"
            aria-label="Buscar ayudas entregadas"
          />
          {query && (
            <button
              className="search-clear"
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="queue-filters">
          <label className="queue-filter">
            <span>Ayuda</span>
            <select
              value={helpType}
              onChange={(event) =>
                setHelpType(event.target.value as EmergencyHelpType | "")
              }
            >
              <option value="">Todas</option>
              {HELP_TYPES.map((option) => (
                <option key={option} value={option}>
                  {helpLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="queue-filter">
            <span>Categoría</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Todas</option>
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {helpLabel(option)}
                </option>
              ))}
            </select>
          </label>

          {group === "casos" && (
            <label className="queue-filter">
              <span>Estado</span>
              <select
                value={state}
                onChange={(event) =>
                  setState(event.target.value as EmergencyState | "")
                }
              >
                <option value="">Todos</option>
                {STATES.map((option) => (
                  <option key={option} value={option}>
                    {stateLabel(option)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {filtersActive && (
            <button
              className="queue-clear"
              type="button"
              onClick={clearFilters}
            >
              <X size={12} />
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="queue-results">
        <div className="queue-results-head">
          <span>
            {loading
              ? "Cargando ayudas…"
              : group === "casos"
                ? `${filteredCases.length} de ${counts.cases} casos con entregas`
                : `${filteredItems.length} de ${counts.items} artículos entregados`}
          </span>
          {filtersActive && !loading && (
            <span className="queue-results-hint">Filtros activos</span>
          )}
        </div>

        {loading ? (
          <div className="queue-state" role="status" aria-live="polite">
            <span className="queue-state-icon">
              <RefreshCw size={18} />
            </span>
            <strong>Cargando ayudas</strong>
            <p>Consultando las entregas registradas.</p>
          </div>
        ) : error ? (
          <div className="queue-state" role="alert">
            <span className="queue-state-icon queue-state-icon--danger">
              <AlertTriangle size={18} />
            </span>
            <strong>No se pudieron cargar las ayudas</strong>
            <p>{error}</p>
            <button
              className="queue-button queue-button--ghost"
              type="button"
              onClick={onReload}
            >
              <RefreshCw size={14} />
              Reintentar
            </button>
          </div>
        ) : forbidden ? (
          <div className="queue-state">
            <span className="queue-state-icon">
              <UserRound size={18} />
            </span>
            <strong>Sin acceso a emergencias</strong>
            <p>
              Tu cuenta ({role ?? "usuario"}) no tiene permisos de
              administración. Pide a una administración que cambie tu rol.
            </p>
          </div>
        ) : counts.items === 0 ? (
          <div className="queue-state">
            <span className="queue-state-icon">
              <Package size={18} />
            </span>
            <strong>Aún no hay entregas registradas</strong>
            <p>
              Registra entregas desde la ficha de un caso para que aparezcan
              aquí, descontando stock automáticamente.
            </p>
          </div>
        ) : group === "casos" ? (
          filteredCases.length === 0 ? (
            <div className="queue-state">
              <span className="queue-state-icon">
                <Search size={18} />
              </span>
              <strong>Sin coincidencias</strong>
              <p>Ajusta la búsqueda o limpia los filtros para ver más casos.</p>
              {filtersActive && (
                <button
                  className="queue-button queue-button--ghost"
                  type="button"
                  onClick={clearFilters}
                >
                  <X size={14} />
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="queue-table queue-table--entregas">
              <div className="queue-table-head" aria-hidden="true">
                <span>Caso</span>
                <span>Ayuda</span>
                <span>Territorio</span>
                <span>Entregas</span>
                <span className="queue-head-num">Unidades</span>
                <span>Estado</span>
              </div>
              <div className="queue-rows">
                {filteredCases.map(({ emergency, units, summary }) => (
                  <button
                    key={emergency.id}
                    className="queue-row"
                    type="button"
                    onClick={() => onSelect(emergency)}
                  >
                    <span className="queue-cell queue-cell--main">
                      <span className="queue-code">{emergency.code}</span>
                      <strong className="queue-title">{emergency.title}</strong>
                      <span className="queue-address">{emergency.address}</span>
                      <span className="queue-mobile-meta">
                        {helpLabel(emergency.help_type)} ·{" "}
                        {sectorName(emergency)} ·{" "}
                        {plural(units, "unidad", "unidades")} ·{" "}
                        {formatDateTime(emergency.updated_at)}
                      </span>
                    </span>
                    <span className="queue-cell queue-cell--help">
                      {helpLabel(emergency.help_type)}
                    </span>
                    <span className="queue-cell queue-cell--sector">
                      {sectorName(emergency)}
                    </span>
                    <span
                      className="queue-cell queue-cell--detail"
                      title={summary}
                    >
                      {summary}
                    </span>
                    <span className="queue-cell queue-cell--num queue-cell--units">
                      {units}
                    </span>
                    <span className="queue-cell queue-cell--state">
                      <StatusBadge tone={stateTone(emergency.state)}>
                        {stateLabel(emergency.state)}
                      </StatusBadge>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        ) : filteredItems.length === 0 ? (
          <div className="queue-state">
            <span className="queue-state-icon">
              <Search size={18} />
            </span>
            <strong>Sin coincidencias</strong>
            <p>Ajusta la búsqueda o limpia los filtros para ver más artículos.</p>
            {filtersActive && (
              <button
                className="queue-button queue-button--ghost"
                type="button"
                onClick={clearFilters}
              >
                <X size={14} />
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="queue-table queue-table--articulos">
            <div className="queue-table-head" aria-hidden="true">
              <span>Artículo</span>
              <span>Categoría</span>
              <span className="queue-head-num">Casos</span>
              <span className="queue-head-num">Unidades</span>
              <span>Stock actual</span>
            </div>
            <div className="queue-rows">
              {filteredItems.map((row) => (
                <div className="queue-row queue-row--static" key={row.item}>
                  <span className="queue-cell queue-cell--main">
                    <strong className="queue-title">{row.item}</strong>
                    <span className="queue-address">
                      {row.unit || "unidad"}
                    </span>
                    <span className="queue-mobile-meta">
                      {helpLabel(row.category)} ·{" "}
                      {plural(row.cases, "caso", "casos")} ·{" "}
                      {plural(row.quantity, "unidad", "unidades")} · stock{" "}
                      {row.stockQuantity ?? "—"}
                    </span>
                  </span>
                  <span className="queue-cell queue-cell--category">
                    {helpLabel(row.category)}
                  </span>
                  <span className="queue-cell queue-cell--num queue-cell--cases">
                    {row.cases}
                  </span>
                  <span className="queue-cell queue-cell--num">
                    {row.quantity}
                  </span>
                  <span className="queue-cell queue-cell--stock">
                    {row.stockQuantity === null ? (
                      <span className="queue-stock-empty">Sin registro</span>
                    ) : (
                      <span
                        className={
                          row.lowStock
                            ? "queue-stock queue-stock--low"
                            : "queue-stock"
                        }
                      >
                        {row.stockQuantity} {row.unit}
                        {row.lowStock && " · bajo mínimo"}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
