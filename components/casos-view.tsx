"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { getMacrosector } from "@/lib/data";
import {
  categoryLabel,
  formatDateTime,
  helpLabel,
  stateLabel,
  stateTone,
  type Emergency,
  type EmergencyCategory,
  type EmergencyHelpType,
  type EmergencyState,
} from "@/lib/api";

export type CasosViewProps = {
  emergencies: Emergency[];
  loading: boolean;
  error: string | null;
  forbidden: boolean;
  role?: string;
  scopeLabel?: string;
  onReload: () => void;
  onNewCase: () => void;
  onSelect: (item: Emergency) => void;
};

const CATEGORIES: EmergencyCategory[] = [
  "incendio",
  "terremoto",
  "inundacion",
  "temporal",
  "otro",
];

const HELP_TYPES: EmergencyHelpType[] = [
  "alimentos",
  "higiene",
  "abrigo",
  "dinero",
  "materiales",
  "otro",
];

const STATES: EmergencyState[] = ["recibida", "en_proceso", "entregada"];

function sectorName(item: Emergency): string {
  return item.macrosector ? getMacrosector(item.macrosector).label : "Sin sector";
}

export function CasosView({
  emergencies,
  loading,
  error,
  forbidden,
  role,
  scopeLabel = "Ciudad",
  onReload,
  onNewCase,
  onSelect,
}: CasosViewProps) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<EmergencyState | "">("");
  const [category, setCategory] = useState<EmergencyCategory | "">("");
  const [helpType, setHelpType] = useState<EmergencyHelpType | "">("");

  const ordered = useMemo(
    () =>
      [...emergencies].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      ),
    [emergencies],
  );

  const counts = useMemo(
    () => ({
      total: ordered.length,
      recibida: ordered.filter((item) => item.state === "recibida").length,
      en_proceso: ordered.filter((item) => item.state === "en_proceso").length,
      entregada: ordered.filter((item) => item.state === "entregada").length,
    }),
    [ordered],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ordered.filter((item) => {
      if (state && item.state !== state) return false;
      if (category && item.category !== category) return false;
      if (helpType && item.help_type !== helpType) return false;
      if (!needle) return true;
      return [
        item.code,
        item.title,
        item.address,
        sectorName(item),
        categoryLabel(item.category),
        helpLabel(item.help_type),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [ordered, query, state, category, helpType]);

  const filtersActive = Boolean(query || state || category || helpType);

  function clearFilters() {
    setQuery("");
    setState("");
    setCategory("");
    setHelpType("");
  }

  return (
    <div className="queue-view">
      <header className="queue-head">
        <div className="queue-head-copy">
          <span className="eyebrow">Gestión operativa</span>
          <h1>Casos</h1>
          <p>
            {scopeLabel === "Ciudad"
              ? "Cola completa de emergencias y ayudas registradas."
              : `Emergencias y ayudas registradas en ${scopeLabel}.`}{" "}
            Selecciona un caso para revisar su ficha, entregas y estado.
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
          <button
            className="queue-button queue-button--primary"
            type="button"
            onClick={onNewCase}
          >
            <Plus size={14} />
            Nuevo caso
          </button>
        </div>
      </header>

      <div className="queue-summary" role="list">
        <div className="queue-stat" role="listitem">
          <span className="queue-stat-label">Total</span>
          <strong className="queue-stat-value">{counts.total}</strong>
        </div>
        <div className="queue-stat queue-stat--info" role="listitem">
          <span className="queue-stat-label">Recibidas</span>
          <strong className="queue-stat-value">{counts.recibida}</strong>
        </div>
        <div className="queue-stat queue-stat--warning" role="listitem">
          <span className="queue-stat-label">En proceso</span>
          <strong className="queue-stat-value">{counts.en_proceso}</strong>
        </div>
        <div className="queue-stat queue-stat--success" role="listitem">
          <span className="queue-stat-label">Entregadas</span>
          <strong className="queue-stat-value">{counts.entregada}</strong>
        </div>
      </div>

      <div className="queue-toolbar">
        <div className="queue-search">
          <Search size={15} className="search-icon" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar código, título, dirección o sector"
            aria-label="Buscar casos"
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

          <label className="queue-filter">
            <span>Categoría</span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as EmergencyCategory | "")
              }
            >
              <option value="">Todas</option>
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {categoryLabel(option)}
                </option>
              ))}
            </select>
          </label>

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
              ? "Cargando casos…"
              : `${filtered.length} de ${counts.total} casos`}
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
            <strong>Cargando casos</strong>
            <p>Consultando las emergencias registradas.</p>
          </div>
        ) : error ? (
          <div className="queue-state" role="alert">
            <span className="queue-state-icon queue-state-icon--danger">
              <AlertTriangle size={18} />
            </span>
            <strong>No se pudieron cargar los casos</strong>
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
        ) : filtered.length === 0 ? (
          <div className="queue-state">
            <span className="queue-state-icon">
              <ClipboardList size={18} />
            </span>
            <strong>
              {counts.total === 0 ? "Aún no hay casos" : "Sin coincidencias"}
            </strong>
            <p>
              {counts.total === 0
                ? "Registra el primer caso con el botón Nuevo caso."
                : "Ajusta la búsqueda o limpia los filtros para ver más casos."}
            </p>
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
          <div className="queue-table">
            <div className="queue-table-head" aria-hidden="true">
              <span>Caso</span>
              <span>Territorio</span>
              <span>Categoría</span>
              <span>Ayuda</span>
              <span>Actualizado</span>
              <span>Estado</span>
            </div>
            <div className="queue-rows">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  className="queue-row"
                  type="button"
                  onClick={() => onSelect(item)}
                >
                  <span className="queue-cell queue-cell--main">
                    <span className="queue-code">{item.code}</span>
                    <strong className="queue-title">{item.title}</strong>
                    <span className="queue-address">{item.address}</span>
                    <span className="queue-mobile-meta">
                      {sectorName(item)} · {categoryLabel(item.category)} ·{" "}
                      {helpLabel(item.help_type)} ·{" "}
                      {formatDateTime(item.updated_at)}
                    </span>
                  </span>
                  <span className="queue-cell queue-cell--sector">
                    {sectorName(item)}
                  </span>
                  <span className="queue-cell queue-cell--category">
                    {categoryLabel(item.category)}
                  </span>
                  <span className="queue-cell queue-cell--help">
                    {helpLabel(item.help_type)}
                  </span>
                  <span className="queue-cell queue-cell--time">
                    {formatDateTime(item.updated_at)}
                  </span>
                  <span className="queue-cell queue-cell--state">
                    <StatusBadge tone={stateTone(item.state)}>
                      {stateLabel(item.state)}
                    </StatusBadge>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
