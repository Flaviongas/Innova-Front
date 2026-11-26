"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Download,
  FileText,
  RefreshCw,
  ShieldAlert,
  X,
} from "lucide-react";
import { SectorPicker } from "@/components/sector-picker";
import { categoryFill } from "@/lib/data";
import {
  DASHBOARD_EXPORT_SECTIONS,
  loadDashboardStats,
  needColor,
  type DashboardExportSection,
  type DashboardStats,
} from "@/lib/dashboard";

const numberFormat = new Intl.NumberFormat("es-CL");
const clpFormat = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

function SectionHead({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <div className="ind-section-head">
      <h2>{title}</h2>
      {note && <span>{note}</span>}
    </div>
  );
}

function LeadSummary({ stats }: { stats: DashboardStats }) {
  const { totals } = stats;
  return (
    <div className="ind-lead">
      <div className="ind-lead-main">
        <strong className="ind-lead-value">
          {numberFormat.format(totals.requests)}
        </strong>
        <span className="ind-lead-label">solicitudes creadas</span>
        <span className="ind-lead-context">en el periodo</span>
      </div>
      <dl className="ind-ledger">
        <div>
          <dt>Entregadas</dt>
          <dd>
            {numberFormat.format(totals.delivered)}{" "}
            <em>({pct(totals.delivered, totals.requests)}%)</em>
          </dd>
        </div>
        <div>
          <dt>Unidades</dt>
          <dd>{numberFormat.format(totals.deliveredUnits)}</dd>
        </div>
        <div>
          <dt>Monto</dt>
          <dd className="is-money">{clpFormat.format(totals.amountClp)}</dd>
        </div>
      </dl>
    </div>
  );
}

function MonthlyBars({ stats }: { stats: DashboardStats }) {
  const max = Math.max(...stats.monthly.map((row) => row.requests), 1);
  return (
    <div
      className="ind-monthly"
      role="img"
      aria-label={`Solicitudes por mes: ${stats.monthly
        .map((row) => `${row.label} ${row.requests}`)
        .join(", ")}`}
    >
      {stats.monthly.map((row) => (
        <div
          className="ind-month"
          key={row.key}
          title={`${row.label}: ${row.requests} solicitudes`}
        >
          <span className="ind-month-value">
            {row.requests > 0 ? row.requests : ""}
          </span>
          <span className="ind-month-track">
            <span
              className="ind-month-fill"
              style={{ height: `${(row.requests / max) * 100}%` }}
            />
          </span>
          <span className="ind-month-label">{row.label}</span>
        </div>
      ))}
    </div>
  );
}

function NeedBars({ stats }: { stats: DashboardStats }) {
  const total = stats.totals.requests;
  const max = Math.max(...stats.byNeed.map((row) => row.count), 1);
  return (
    <div className="ind-ranks">
      {stats.byNeed.map((row) => (
        <div className="ind-rank" key={row.key}>
          <span className="ind-rank-label">{row.label}</span>
          <span className="ind-rank-track">
            {row.count > 0 && (
              <span
                className="ind-rank-fill"
                style={{
                  width: `${(row.count / max) * 100}%`,
                  background: needColor(row.key),
                }}
              />
            )}
          </span>
          <span className="ind-rank-value">
            {numberFormat.format(row.count)}
            <em>{pct(row.count, total)}%</em>
          </span>
        </div>
      ))}
    </div>
  );
}

function TerritoryBars({
  stats,
  sectorId,
  onSectorChange,
}: {
  stats: DashboardStats;
  sectorId: string | null;
  onSectorChange: (id: string | null) => void;
}) {
  const max = Math.max(...stats.bySector.map((row) => row.count), 1);
  return (
    <div className="ind-ranks">
      {stats.bySector.map((row) => {
        const selected = row.id !== null && row.id === sectorId;
        const content = (
          <>
            <span className="ind-rank-label">{row.label}</span>
            <span className="ind-rank-track">
              {row.count > 0 && (
                <span
                  className={`ind-rank-fill${
                    selected ? " is-selected" : ""
                  }${row.id === null ? " is-unlocated" : ""}`}
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              )}
            </span>
            <span className="ind-rank-value">
              {numberFormat.format(row.count)}
              <em>{numberFormat.format(row.deliveredUnits)} u.</em>
            </span>
          </>
        );

        if (row.id === null) {
          return (
            <div className="ind-rank ind-rank--static" key="sin-sector">
              {content}
            </div>
          );
        }

        return (
          <button
            type="button"
            className={`ind-rank ind-rank--button${
              selected ? " is-selected" : ""
            }`}
            key={row.id}
            onClick={() => onSectorChange(row.id)}
            aria-pressed={selected}
            title={`Ver ${row.label} en el panel`}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

function DeliveryBars({ stats }: { stats: DashboardStats }) {
  const max = Math.max(
    ...stats.byDeliveryNeed.map((row) => row.units),
    1,
  );
  return (
    <div className="ind-ranks">
      {stats.byDeliveryNeed.map((row) => (
        <div className="ind-rank" key={row.key}>
          <span className="ind-rank-label">{row.label}</span>
          <span className="ind-rank-track">
            {row.units > 0 && (
              <span
                className="ind-rank-fill"
                style={{
                  width: `${(row.units / max) * 100}%`,
                  background: needColor(row.key),
                }}
              />
            )}
          </span>
          <span className="ind-rank-value">
            {numberFormat.format(row.units)}
            <em>{clpFormat.format(row.amountClp)}</em>
          </span>
        </div>
      ))}
    </div>
  );
}

function DeliveryEventBars({ stats }: { stats: DashboardStats }) {
  const total = stats.totals.requests;
  const max = Math.max(...stats.byCategory.map((row) => row.count), 1);
  return (
    <div className="ind-ranks">
      {stats.byCategory.map((row) => (
        <div className="ind-rank" key={row.key}>
          <span className="ind-rank-label">{row.label}</span>
          <span className="ind-rank-track">
            {row.count > 0 && (
              <span
                className="ind-rank-fill"
                style={{
                  width: `${(row.count / max) * 100}%`,
                  background: categoryFill(row.key),
                }}
              />
            )}
          </span>
          <span className="ind-rank-value">
            {numberFormat.format(row.count)}
            <em>{pct(row.count, total)}%</em>
          </span>
        </div>
      ))}
    </div>
  );
}

function StatusBar({ stats }: { stats: DashboardStats }) {
  const total = stats.totals.requests;
  const tone: Record<string, string> = {
    recibida: "is-received",
    en_proceso: "is-progress",
    entregada: "is-delivered",
  };
  return (
    <div>
      <div
        className="ind-status-track"
        role="img"
        aria-label={stats.status
          .map((row) => `${row.label}: ${row.count}`)
          .join(", ")}
      >
        {stats.status.map((row) => (
          <span
            key={row.key}
            className={`ind-status-seg ${tone[row.key] ?? ""}`}
            style={{ width: `${pct(row.count, total)}%` }}
          />
        ))}
      </div>
      <div className="ind-status-legend">
        {stats.status.map((row) => (
          <span className="ind-status-item" key={row.key}>
            <i className={`ind-status-dot ${tone[row.key] ?? ""}`} />
            <span>{row.label}</span>
            <strong>{numberFormat.format(row.count)}</strong>
            <em>{pct(row.count, total)}%</em>
          </span>
        ))}
      </div>
    </div>
  );
}

const CALENDAR_DAY_LABELS = ["Lun", "", "Mié", "", "Vie", "", ""];
const CALENDAR_DAY_WIDTH = 35;
const CALENDAR_WEEK_STEP = 16;

function CalendarHeatmap({ stats }: { stats: DashboardStats }) {
  const { weeks, monthLabels, max, activeDays } = stats.calendar ?? {
    weeks: [],
    monthLabels: [],
    max: 0,
    activeDays: 0,
  };
  return (
    <div className="ind-cal-scroll">
      <div
        className="ind-cal"
        style={{
          minWidth: `${CALENDAR_DAY_WIDTH + weeks.length * CALENDAR_WEEK_STEP}px`,
        }}
      >
        <div className="ind-cal-months" aria-hidden="true">
          {monthLabels.map((month) => (
            <span
              key={`${month.label}-${month.weekIndex}`}
              style={{ left: `${month.weekIndex * CALENDAR_WEEK_STEP}px` }}
            >
              {month.label}
            </span>
          ))}
        </div>
        <div className="ind-cal-body">
          <div className="ind-cal-days" aria-hidden="true">
            {CALENDAR_DAY_LABELS.map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </div>
          <div
            className="ind-cal-grid"
            role="img"
            aria-label={`Frecuencia diaria: ${activeDays} días con solicitudes`}
          >
            {weeks.map((week, weekIndex) => (
              <div className="ind-cal-week" key={weekIndex}>
                {week.map((cell, dayIndex) => {
                  if (!cell) {
                    return (
                      <span
                        className="ind-cal-cell is-empty"
                        key={`empty-${weekIndex}-${dayIndex}`}
                      />
                    );
                  }
                  const bucket =
                    max === 0 || cell.count === 0
                      ? 0
                      : Math.min(4, Math.ceil((cell.count / max) * 4));
                  return (
                    <span
                      className={`ind-cal-cell ind-cal-${bucket}`}
                      key={cell.date}
                      title={`${cell.label}: ${cell.count} ${
                        cell.count === 1 ? "solicitud" : "solicitudes"
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="ind-cal-legend">
          <span>Menos</span>
          {[0, 1, 2, 3, 4].map((bucket) => (
            <i className={`ind-cal-cell ind-cal-${bucket}`} key={bucket} />
          ))}
          <span>Más</span>
          <em>{numberFormat.format(activeDays)} días con solicitudes</em>
        </div>
      </div>
    </div>
  );
}

function CoverageNote({ stats }: { stats: DashboardStats }) {
  return (
    <div className="ind-coverage">
      <span>
        {numberFormat.format(stats.coverage.located)} de{" "}
        {numberFormat.format(stats.totals.requests)} solicitudes con macrosector
        asignado
        {stats.coverage.unlocated > 0
          ? ` · ${numberFormat.format(stats.coverage.unlocated)} sin sector`
          : ""}
      </span>
      {stats.coverage.unlocated > 0 && (
        <span className="ind-coverage-warning">
          <ShieldAlert size={14} />
          La distribución territorial los muestra por separado.
        </span>
      )}
    </div>
  );
}

function DashboardSheet({
  stats,
  sectorId,
  onSectorChange,
}: {
  stats: DashboardStats;
  sectorId: string | null;
  onSectorChange: (id: string | null) => void;
}) {
  if (stats.totals.requests === 0) {
    return (
      <div className="ind-empty">
        <strong>No hay solicitudes en este periodo.</strong>
        <p>Prueba con más meses o selecciona Ciudad.</p>
      </div>
    );
  }

  return (
    <div className="indicadores-sheet">
      <LeadSummary stats={stats} />

      <section className="ind-section">
        <SectionHead
          title="Solicitudes por mes"
          note="Creadas en el periodo"
        />
        <MonthlyBars stats={stats} />
      </section>

      <div className="indicadores-grid">
        <div className="ind-col">
          <section className="ind-section">
            <SectionHead
              title="Solicitudes por tipo de necesidad"
              note="Total del periodo"
            />
            <NeedBars stats={stats} />
          </section>

          <section className="ind-section">
            <SectionHead
              title="Entregas por tipo de necesidad"
              note="Unidades y monto"
            />
            {stats.byDeliveryNeed.length === 0 ? (
              <p className="ind-chart-note">
                Sin entregas registradas en el periodo.
              </p>
            ) : (
              <DeliveryBars stats={stats} />
            )}
          </section>
        </div>

        <div className="ind-col">
          <section className="ind-section">
            <SectionHead
              title="Distribución territorial"
              note={
                sectorId
                  ? "Ciudad, sector destacado"
                  : "Ciudad: solicitudes y unidades"
              }
            />
            <TerritoryBars
              stats={stats}
              sectorId={sectorId}
              onSectorChange={onSectorChange}
            />
            {sectorId && (
              <p className="ind-chart-note">
                El ranking muestra toda la ciudad; el resto de los indicadores
                está filtrado por {stats.sectorLabel}.
              </p>
            )}
          </section>

          <section className="ind-section">
            <SectionHead
              title="Solicitudes por tipo de evento"
              note="Total del periodo"
            />
            <DeliveryEventBars stats={stats} />
          </section>

          <section className="ind-section">
            <SectionHead
              title="Estado actual"
              note="Sobre las solicitudes del periodo"
            />
            <StatusBar stats={stats} />
          </section>
        </div>

        <section className="ind-section ind-section--wide">
          <SectionHead
            title="Frecuencia por día"
            note="Días con solicitudes"
          />
          {stats.calendar ? (
            <CalendarHeatmap stats={stats} />
          ) : (
            <p className="ind-chart-note">
              La serie diaria aún no está disponible en el reporte. Se
              mostrará aquí cuando el backend la publique.
            </p>
          )}
        </section>
      </div>

      <CoverageNote stats={stats} />
    </div>
  );
}

function ExportDialog({
  stats,
  sectorId,
  onClose,
}: {
  stats: DashboardStats;
  sectorId: string | null;
  onClose: () => void;
}) {
  const [scope, setScope] = useState<"current" | "last-month">("current");
  const [selected, setSelected] = useState<DashboardExportSection[]>(
    DASHBOARD_EXPORT_SECTIONS.map((section) => section.key),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const allSelected = selected.length === DASHBOARD_EXPORT_SECTIONS.length;

  function toggleSection(key: DashboardExportSection) {
    setSelected((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  }

  async function handleExport() {
    if (busy || selected.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const reportStats =
        scope === "last-month"
          ? await loadDashboardStats({ months: 1, sectorId })
          : stats;
      const { buildDashboardDocx, dashboardDocxFilename, downloadBlob } =
        await import("@/lib/dashboard-docx");
      const blob = await buildDashboardDocx(reportStats, selected);
      downloadBlob(blob, dashboardDocxFilename(reportStats));
      onClose();
    } catch {
      setError("No se pudo generar el documento. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-scrim"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal modal--export"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
      >
        <div className="modal-head">
          <div>
            <h2 id="export-title">Preparar reporte</h2>
            <p>
              Documento Word con el alcance y las secciones que elijas.
            </p>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Cerrar exportación"
          >
            <X size={16} />
          </button>
        </div>

        <div className="export-body">
          <div className="export-file">
            <span className="export-file-icon">
              <FileText size={18} />
            </span>
            <span className="export-file-copy">
              <strong>Reporte de indicadores</strong>
              <small>
                Word (.docx), {selected.length} de{" "}
                {DASHBOARD_EXPORT_SECTIONS.length} secciones
              </small>
            </span>
          </div>

          <span className="export-label">Alcance</span>
          <div
            className="export-scope-tabs"
            role="group"
            aria-label="Alcance del reporte"
          >
            <button
              type="button"
              className={scope === "current" ? "is-active" : ""}
              aria-pressed={scope === "current"}
              onClick={() => setScope("current")}
            >
              Periodo actual
            </button>
            <button
              type="button"
              className={scope === "last-month" ? "is-active" : ""}
              aria-pressed={scope === "last-month"}
              onClick={() => setScope("last-month")}
            >
              Último mes
            </button>
          </div>
          <p className="export-scope-note">
            {scope === "current"
              ? `${stats.rangeLabel} (${stats.sectorLabel})`
              : `El mes más reciente del periodo (${stats.sectorLabel})`}
          </p>

          <div className="export-sections-head">
            <span className="export-label">Secciones</span>
            <button
              className="export-link"
              type="button"
              onClick={() =>
                setSelected(
                  allSelected
                    ? []
                    : DASHBOARD_EXPORT_SECTIONS.map((section) => section.key),
                )
              }
            >
              {allSelected ? "Quitar todo" : "Seleccionar todo"}
            </button>
          </div>

          <div className="export-outline">
            {DASHBOARD_EXPORT_SECTIONS.map((section) => (
              <label className="export-line" key={section.key}>
                <input
                  type="checkbox"
                  checked={selected.includes(section.key)}
                  onChange={() => toggleSection(section.key)}
                />
                <span className="export-line-copy">
                  <strong>{section.label}</strong>
                  <small>{section.hint}</small>
                </span>
              </label>
            ))}
          </div>

          {selected.length === 0 && (
            <p className="form-error" role="alert">
              Selecciona al menos una sección.
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button className="button button--ghost" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="button button--primary"
            type="button"
            onClick={() => void handleExport()}
            disabled={busy || selected.length === 0}
          >
            <Download size={14} />
            {busy ? "Generando…" : "Descargar .docx"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function IndicadoresView({
  sectorId,
  onSectorChange,
}: {
  sectorId: string | null;
  onSectorChange: (id: string | null) => void;
}) {
  const [months, setMonths] = useState(12);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadDashboardStats({ months, sectorId })
      .then((result) => {
        if (cancelled) return;
        setStats(result);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("No se pudieron cargar los indicadores.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [months, sectorId, reloadKey]);

  return (
    <div className="indicadores-view">
      <header className="indicadores-head">
        <div className="indicadores-title">
          <h1>Indicadores</h1>
          <p className="indicadores-context">
            <span>{stats?.sectorLabel ?? "Ciudad"}</span>
            {stats && <span>{stats.rangeLabel}</span>}
          </p>
        </div>

        <div className="indicadores-controls">
          <label className="ind-period" title="Meses incluidos">
            <CalendarDays size={14} />
            <select
              value={months}
              onChange={(event) => setMonths(Number(event.target.value))}
              aria-label="Meses incluidos"
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map(
                (value) => (
                  <option key={value} value={value}>
                    Últimos {value} {value === 1 ? "mes" : "meses"}
                  </option>
                ),
              )}
            </select>
          </label>

          <SectorPicker
            value={sectorId}
            onChange={onSectorChange}
            className="sector-picker--dashboard"
          />

          <button
            className="indicadores-export"
            type="button"
            onClick={() => setExportOpen(true)}
            disabled={!stats || loading}
            aria-label="Exportar reporte DOCX"
            title="Exportar reporte DOCX"
          >
            <Download size={15} />
            <span>Exportar</span>
          </button>

          <button
            className="indicadores-refresh"
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            disabled={loading}
            aria-label="Recargar indicadores"
            title="Recargar"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </header>

      {loading && !stats ? (
        <div className="ind-loading" role="status" aria-live="polite">
          <span className="ind-loading-bar" />
          <span className="ind-loading-bar" />
          <span className="ind-loading-bar" />
          <p>Cargando indicadores…</p>
        </div>
      ) : error ? (
        <div className="ind-error" role="alert">
          <AlertTriangle size={18} />
          <strong>{error}</strong>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
          >
            Reintentar
          </button>
        </div>
      ) : stats ? (
        <DashboardSheet
          stats={stats}
          sectorId={sectorId}
          onSectorChange={onSectorChange}
        />
      ) : null}

      <p className="indicadores-footnote">
        {stats ? `Actualizado ${stats.generatedAt} (hora de Chile). ` : ""}
        Fuente: sistema de Ayudas y Emergencias.
      </p>

      {exportOpen && stats && (
        <ExportDialog
          stats={stats}
          sectorId={sectorId}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}
