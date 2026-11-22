"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Crosshair,
  Download,
  FileText,
  Landmark,
  Layers,
  LogOut,
  MapPin,
  Maximize2,
  Minus,
  Package,
  Plus,
  Search,
  Settings,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import type L from "leaflet";
import { InteractiveTerritoryMap } from "@/components/interactive-territory-map";
import {
  MACROSECTORS,
  OPERATIONAL_ALERTS,
  RECENT_CASES,
  getMacrosector,
  type AidSlice,
  type CaseStatusTone,
  type RecentCase,
} from "@/lib/data";

const NAV_ITEMS = ["Panel", "Casos", "Ayudas", "Bodega", "Documentos", "Territorio", "Reportes"];

const QUICK_ACTIONS = [
  { label: "Registrar entrega", icon: Truck, message: "Registro de entrega en preparación." },
  { label: "Revisar bodega", icon: Package, message: "Vista de bodega en preparación." },
  { label: "Documentos", icon: FileText, message: "Bandeja documental en preparación." },
  { label: "Exportar reporte", icon: Download, message: "Exportación anonimizada en preparación." },
];

function StatusBadge({ tone, children }: { tone: CaseStatusTone; children: ReactNode }) {
  return <span className={`status status--${tone}`}>{children}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="metric">
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
    </span>
  );
}

function AidMixBars({ mix }: { mix: AidSlice[] }) {
  return (
    <div className="aid-mix">
      <span className="aid-mix-title">Distribución de ayudas</span>
      {mix.map((slice) => (
        <div className="aid-row" key={slice.label}>
          <span className="aid-label">{slice.label}</span>
          <span className="aid-track">
            <span
              className="aid-fill"
              style={{ width: `${slice.value}%`, background: slice.color }}
            />
          </span>
          <span className="aid-value">{slice.value}%</span>
        </div>
      ))}
    </div>
  );
}

type PanelProps = {
  id: string;
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  action?: ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
};

function Panel({ id, icon, title, badge, action, collapsed, onToggle, children }: PanelProps) {
  return (
    <section className="panel">
      <div className="panel-head">
        <button
          className="panel-toggle"
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-controls={`panel-${id}`}
        >
          <span className="panel-icon">{icon}</span>
          <span className="panel-title">{title}</span>
          {badge !== undefined && <span className="panel-badge">{badge}</span>}
          <span className="panel-chevron">
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </span>
        </button>
        {action && <div className="panel-action">{action}</div>}
      </div>

      {!collapsed && (
        <div className="panel-body" id={`panel-${id}`}>
          {children}
        </div>
      )}
    </section>
  );
}

function EmptyCases({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="empty-cases">
      <span className="empty-icon">
        <Search size={16} />
      </span>
      <strong>Sin resultados</strong>
      <p>
        {query
          ? `No encontramos casos para “${query}”.`
          : "No hay casos recientes para mostrar."}
      </p>
      <button className="text-link" type="button" onClick={onClear}>
        Limpiar búsqueda
      </button>
    </div>
  );
}

function AlertGlyph({ icon }: { icon: string }) {
  if (icon === "stock") return <Package size={13} />;
  if (icon === "documents") return <FileText size={13} />;
  return <ClipboardList size={13} />;
}

type CaseCoords = { lat: number; lng: number; accuracy: number };

type NewCasePayload = {
  person: string;
  sectorId: string;
  urgency: "Normal" | "Urgente";
  coords?: CaseCoords;
};

type NewCaseModalProps = {
  sectorId: string;
  onClose: () => void;
  onCreate: (payload: NewCasePayload) => void;
};

type GpsState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "ready"; lat: number; lng: number; accuracy: number }
  | { status: "error"; message: string };

function gpsErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Permiso de ubicación denegado. Actívalo en el navegador para usar el GPS.";
    case error.POSITION_UNAVAILABLE:
      return "No se pudo obtener la ubicación. Revisa que el GPS esté activado.";
    case error.TIMEOUT:
      return "Se agotó el tiempo esperando la ubicación. Intenta de nuevo.";
    default:
      return "No se pudo obtener la ubicación.";
  }
}

function NewCaseModal({ sectorId, onClose, onCreate }: NewCaseModalProps) {
  const [gps, setGps] = useState<GpsState>({ status: "idle" });

  function requestGps() {
    if (!("geolocation" in navigator)) {
      setGps({
        status: "error",
        message: "Este navegador no soporta geolocalización.",
      });
      return;
    }

    setGps({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          status: "ready",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => setGps({ status: "error", message: gpsErrorMessage(error) }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const person = String(data.get("person") ?? "").trim();
    const sector = String(data.get("sector") ?? sectorId);
    const urgency = String(data.get("urgency") ?? "Normal") === "Urgente" ? "Urgente" : "Normal";

    if (!person) return;

    onCreate({
      person,
      sectorId: sector,
      urgency,
      coords:
        gps.status === "ready"
          ? { lat: gps.lat, lng: gps.lng, accuracy: gps.accuracy }
          : undefined,
    });
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
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-case-title"
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">Ingreso de caso</span>
            <h2 id="new-case-title">Nuevo caso</h2>
            <p>Registra el antecedente inicial. La evaluación y la ayuda se definen después.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <form className="case-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>RUT</span>
              <input
                name="rut"
                placeholder="12.345.678-9"
                inputMode="text"
                autoComplete="off"
                autoFocus
              />
            </label>

            <label className="field">
              <span>Nombre o familia</span>
              <input
                name="person"
                placeholder="Ej. Familia Muñoz"
                required
                autoComplete="off"
              />
            </label>

            <label className="field">
              <span>Origen</span>
              <select name="origin" defaultValue="Demanda espontánea">
                <option value="Demanda espontánea">Demanda espontánea</option>
                <option value="Bomberos">Bomberos</option>
                <option value="Dirección de Riesgos y Desastres">
                  Dirección de Riesgos y Desastres
                </option>
                <option value="SENAPRED">SENAPRED</option>
                <option value="Otra institución">Otra institución</option>
              </select>
            </label>

            <label className="field">
              <span>Canal</span>
              <select name="channel" defaultValue="Presencial">
                <option value="Presencial">Presencial</option>
                <option value="Teléfono">Teléfono</option>
                <option value="Correo electrónico">Correo electrónico</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Otro">Otro</option>
              </select>
            </label>

            <label className="field">
              <span>Territorio</span>
              <select name="sector" defaultValue={sectorId}>
                {MACROSECTORS.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Urgencia</span>
              <select name="urgency" defaultValue="Normal">
                <option value="Normal">Normal</option>
                <option value="Urgente">Urgente</option>
              </select>
            </label>

            <label className="field field--full">
              <span>Dirección de referencia</span>
              <input
                name="address"
                placeholder="Ej. Calle, número, sector o hito cercano"
                autoComplete="off"
              />
            </label>

            <div className="field field--full">
              <span>Ubicación GPS</span>
              {gps.status === "ready" ? (
                <div className="gps-ready">
                  <MapPin size={14} />
                  <span>
                    {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}{" "}
                    <em>±{Math.round(gps.accuracy)} m</em>
                  </span>
                  <button
                    className="gps-clear"
                    type="button"
                    onClick={() => setGps({ status: "idle" })}
                    aria-label="Quitar ubicación GPS"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  className="gps-button"
                  type="button"
                  onClick={requestGps}
                  disabled={gps.status === "locating"}
                >
                  <Crosshair size={14} />
                  {gps.status === "locating"
                    ? "Obteniendo ubicación…"
                    : gps.status === "error"
                      ? "Reintentar ubicación GPS"
                      : "Usar mi ubicación actual"}
                </button>
              )}
              {gps.status === "error" && (
                <span className="gps-error" role="alert">
                  {gps.message}
                </span>
              )}
              {gps.status === "idle" && (
                <span className="gps-hint">
                  Requiere permiso del navegador. Funciona en HTTPS o localhost.
                </span>
              )}
            </div>

            <label className="field field--full">
              <span>Notas de ingreso</span>
              <textarea
                name="notes"
                rows={3}
                placeholder="Motivo, medio de contacto, antecedentes iniciales…"
              />
            </label>
          </div>

          <div className="form-note">
            <AlertTriangle size={14} />
            <span>
              El caso se crea como borrador. La evaluación profesional define la ayuda.
            </span>
          </div>

          <div className="modal-actions">
            <button className="button button--ghost" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="button button--primary" type="submit">
              <Plus size={14} />
              Crear caso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [selectedId, setSelectedId] = useState("centro");
  const [cases, setCases] = useState<RecentCase[]>(RECENT_CASES);
  const [mapMode, setMapMode] = useState<"map" | "satellite">("map");
  const mapRef = useRef<L.Map | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [showAllCases, setShowAllCases] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [newCaseOpen, setNewCaseOpen] = useState(false);

  const selected = getMacrosector(selectedId);
  const totalCases = useMemo(
    () =>
      MACROSECTORS.reduce((total, sector) => total + sector.cases, 0) +
      Math.max(0, cases.length - RECENT_CASES.length),
    [cases.length],
  );

  const filteredCases = useMemo(() => {
    const query = submittedSearch.trim().toLowerCase();
    if (!query) return cases;

    return cases.filter((item) => {
      const sector = getMacrosector(item.sectorId);
      return [
        item.id,
        item.person,
        item.aidType,
        item.status,
        item.sectorId,
        sector.label,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [cases, submittedSearch]);

  const visibleCases = showAllCases ? filteredCases : filteredCases.slice(0, 3);
  const deltaClass =
    selected.delta < 0 ? "delta--down" : selected.delta === 0 ? "delta--flat" : "";

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (newCaseOpen) {
        setNewCaseOpen(false);
        return;
      }
      setNotificationOpen(false);
      setUserMenuOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [newCaseOpen]);

  useEffect(() => {
    if (!newCaseOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [newCaseOpen]);

  function showToast(message: string) {
    setToast(message);
  }

  function openNewCase() {
    setNotificationOpen(false);
    setUserMenuOpen(false);
    setNewCaseOpen(true);
  }

  function handleNav(label: string) {
    closePopovers();
    if (label === "Panel") return;
    showToast(`${label}: módulo en preparación.`);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    setSubmittedSearch(query);
    setShowAllCases(false);

    if (!query) {
      showToast("Mostrando todos los casos recientes.");
      return;
    }

    const sector = MACROSECTORS.find(
      (item) =>
        item.id.toLowerCase() === query.toLowerCase() ||
        item.shortLabel.toLowerCase() === query.toLowerCase() ||
        item.label.toLowerCase() === query.toLowerCase(),
    );

    if (sector) {
      setSelectedId(sector.id);
      showToast(`${sector.label} seleccionado.`);
    }
  }

  function clearSearch() {
    setSearch("");
    setSubmittedSearch("");
    setShowAllCases(false);
  }

  function handleCaseSelect(item: RecentCase) {
    setSelectedId(item.sectorId);
    showToast(`${item.id} · ${item.status}`);
  }

  function handleCreateCase(payload: {
    person: string;
    sectorId: string;
    urgency: "Normal" | "Urgente";
    coords?: { lat: number; lng: number; accuracy: number };
  }) {
    const folio = `AY-2026-${String(483 + cases.length).padStart(6, "0")}`;
    const nextCase: RecentCase = {
      id: folio,
      person: payload.person,
      aidType: "Por evaluar",
      status: "En evaluación",
      tone: "info",
      sectorId: payload.sectorId,
      time: "Ahora",
      urgency: payload.urgency,
    };

    setCases((current) => [nextCase, ...current]);
    setSelectedId(payload.sectorId);
    setNewCaseOpen(false);
    setSubmittedSearch("");
    setSearch("");

    if (payload.coords) {
      mapRef.current?.flyTo([payload.coords.lat, payload.coords.lng], 16, {
        duration: 0.8,
      });
      showToast(`Caso ${folio} creado con ubicación GPS.`);
    } else {
      showToast(`Caso ${folio} creado como borrador.`);
    }
  }

  function togglePanel(id: string) {
    setCollapsed((current) => ({ ...current, [id]: !current[id] }));
  }

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  function zoomIn() {
    mapRef.current?.zoomIn();
  }

  function zoomOut() {
    mapRef.current?.zoomOut();
  }

  async function handleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.querySelector(".app-shell")?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      showToast("El navegador no permitió entrar en pantalla completa.");
    }
  }

  function handleLocate() {
    setSelectedId("centro");
    mapRef.current?.flyTo([-38.7359, -72.5904], 13, { duration: 0.8 });
    showToast("Vista centrada en Temuco.");
  }

  function handleNotificationSelect(alert: (typeof OPERATIONAL_ALERTS)[number]) {
    setNotificationOpen(false);
    showToast(`Abriendo: ${alert.title.toLowerCase()}.`);
  }

  function closePopovers() {
    setNotificationOpen(false);
    setUserMenuOpen(false);
  }

  return (
    <div className="page-frame">
      <div className="app-shell">
        <header className="topbar">
          <a className="brand" href="/" aria-label="Ir al panel de Ayudas y Emergencias">
            <span className="brand-mark">
              <Landmark size={18} />
            </span>
            <span className="brand-copy">
              <strong>Municipalidad de Temuco</strong>
              <span>Ayudas y Emergencias</span>
            </span>
          </a>

          <nav className="main-nav" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                type="button"
                className={`nav-link${item === "Panel" ? " is-active" : ""}`}
                aria-current={item === "Panel" ? "page" : undefined}
                onClick={() => handleNav(item)}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="topbar-actions">
            <span className="status-pill">
              <span className="live-dot" />
              {totalCases} casos activos
            </span>

            <button className="topbar-primary" type="button" onClick={openNewCase}>
              <Plus size={14} />
              <span>Nuevo caso</span>
            </button>

            <div className="popover-anchor">
              <button
                className="icon-button"
                type="button"
                aria-label="Notificaciones"
                aria-expanded={notificationOpen}
                aria-controls="notifications-popover"
                onClick={() => {
                  setNotificationOpen((open) => !open);
                  setUserMenuOpen(false);
                }}
              >
                <Bell size={16} />
                {!notificationsRead && <span className="notification-dot" />}
              </button>

              {notificationOpen && (
                <div
                  className="popover notification-popover"
                  id="notifications-popover"
                  role="dialog"
                  aria-label="Notificaciones"
                >
                  <div className="popover-head">
                    <div>
                      <strong>Notificaciones</strong>
                      <span>{notificationsRead ? "Sin pendientes" : "3 pendientes"}</span>
                    </div>
                    <button
                      className="icon-button icon-button--small"
                      type="button"
                      onClick={() => setNotificationOpen(false)}
                      aria-label="Cerrar notificaciones"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <div className="popover-list">
                    {OPERATIONAL_ALERTS.map((alert) => (
                      <button
                        key={alert.id}
                        className="notification-row"
                        type="button"
                        onClick={() => handleNotificationSelect(alert)}
                      >
                        <span className={`alert-icon alert-icon--${alert.tone}`}>
                          <AlertGlyph icon={alert.icon} />
                        </span>
                        <span className="notification-copy">
                          <strong>{alert.title}</strong>
                          <span>{alert.detail}</span>
                        </span>
                        <span className="alert-count">{alert.count}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    className="popover-footer"
                    type="button"
                    disabled={notificationsRead}
                    onClick={() => {
                      setNotificationsRead(true);
                      setNotificationOpen(false);
                      showToast("Notificaciones marcadas como leídas.");
                    }}
                  >
                    {notificationsRead ? "Notificaciones leídas" : "Marcar como leídas"}
                  </button>
                </div>
              )}
            </div>

            <div className="popover-anchor">
              <button
                className="user-button"
                type="button"
                aria-label="Menú de cuenta"
                aria-expanded={userMenuOpen}
                aria-controls="user-menu"
                onClick={() => {
                  setUserMenuOpen((open) => !open);
                  setNotificationOpen(false);
                }}
              >
                <span className="avatar">MC</span>
                <span className="user-name">María Contreras</span>
                <ChevronDown size={13} />
              </button>

              {userMenuOpen && (
                <div className="popover user-popover" id="user-menu" role="menu">
                  <div className="user-summary">
                    <span className="avatar avatar--large">MC</span>
                    <div>
                      <strong>María Contreras</strong>
                      <span>Profesional social, Centro</span>
                    </div>
                  </div>

                  <div className="menu-list">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        showToast("Perfil en preparación.");
                      }}
                    >
                      <UserRound size={14} />
                      Mi perfil
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        showToast("Preferencias en preparación.");
                      }}
                    >
                      <Settings size={14} />
                      Preferencias
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="menu-item--danger"
                      onClick={() => {
                        setUserMenuOpen(false);
                        window.location.assign("/login");
                      }}
                    >
                      <LogOut size={14} />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main
          className={`workspace${mapMode === "satellite" ? " workspace--satellite" : ""}${
            inspectorOpen ? " workspace--sheet-open" : ""
          }`}
        >
          <div className="map-stage">
            <div className="map-canvas map-canvas--interactive">
              <InteractiveTerritoryMap
                selectedId={selectedId}
                onSelect={setSelectedId}
                mapMode={mapMode}
                onMapReady={handleMapReady}
              />
            </div>

            <div className="map-toolbar" role="group" aria-label="Tipo de mapa">
              <button
                type="button"
                className={mapMode === "map" ? "is-active" : ""}
                onClick={() => setMapMode("map")}
                aria-pressed={mapMode === "map"}
              >
                Mapa
              </button>
              <button
                type="button"
                className={mapMode === "satellite" ? "is-active" : ""}
                onClick={() => setMapMode("satellite")}
                aria-pressed={mapMode === "satellite"}
              >
                Satélite
              </button>
            </div>

            <div className="map-controls" role="group" aria-label="Controles del mapa">
              <button
                type="button"
                onClick={() =>
                  showToast("Capas: macrosectores, casos y cobertura de direcciones.")
                }
                aria-label="Capas del mapa"
                title="Capas"
              >
                <Layers size={16} />
              </button>
              <button
                type="button"
                onClick={zoomIn}
                aria-label="Acercar"
                title="Acercar"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={zoomOut}
                aria-label="Alejar"
                title="Alejar"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                onClick={handleFullscreen}
                aria-label="Pantalla completa"
                title="Pantalla completa"
              >
                <Maximize2 size={16} />
              </button>
              <button
                type="button"
                onClick={handleLocate}
                aria-label="Centrar en Temuco"
                title="Centrar en Temuco"
              >
                <Crosshair size={16} />
              </button>
            </div>

            <div className="map-legend" aria-label="Leyenda de casos activos">
              <div className="legend-head">
                <span>Casos activos</span>
                <span>Este mes</span>
              </div>
              <div className="legend-scale" />
              <div className="legend-ticks">
                <span>0</span>
                <span>4</span>
                <span>8</span>
                <span>12+</span>
              </div>
              <span className="legend-note">
                {mapMode === "satellite"
                  ? "Esri World Imagery, límites: Municipalidad de Temuco"
                  : "© OpenStreetMap, © CARTO, límites: Municipalidad de Temuco"}
              </span>
            </div>

            {!inspectorOpen && (
              <button
                className="inspector-open"
                type="button"
                onClick={() => setInspectorOpen(true)}
              >
                <ChevronLeft size={14} />
                Mostrar panel
              </button>
            )}
          </div>

          <aside
            className={`inspector${inspectorOpen ? "" : " inspector--closed"}`}
              aria-hidden={!inspectorOpen}
              inert={!inspectorOpen}
            >
              <button
                className="inspector-collapse"
                type="button"
                onClick={() => setInspectorOpen(false)}
                aria-label="Ocultar panel"
                title="Ocultar panel"
              >
                <ChevronRight size={15} />
              </button>

              <div className="mobile-sheet-head">
                <span className="sheet-handle" />
                <button
                  className="sheet-close"
                  type="button"
                  onClick={() => setInspectorOpen(false)}
                  aria-label="Cerrar panel"
                >
                  <X size={15} />
                </button>
              </div>

              <form className="search-bar" onSubmit={handleSearch}>
                <Search size={15} className="search-icon" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar RUT, folio, persona o sector"
                  aria-label="Buscar casos por RUT, folio, persona o sector"
                />
                {search && (
                  <button
                    className="search-clear"
                    type="button"
                    onClick={clearSearch}
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={13} />
                  </button>
                )}
                <button className="search-submit" type="submit">
                  Buscar
                </button>
              </form>

              <div className="inspector-scroll">
                <Panel
                  id="territory"
                  icon={<MapPin size={15} />}
                  title="Territorio"
                  badge={selected.shortLabel}
                  collapsed={Boolean(collapsed.territory)}
                  onToggle={() => togglePanel("territory")}
                >
                  <div className="territory-summary" aria-live="polite">
                    <span className="eyebrow">Territorio seleccionado</span>
                    <div className="territory-title-row">
                      <h2>{selected.label}</h2>
                      <span className="territory-type">{selected.type}</span>
                    </div>
                    <p>
                      {selected.cases} casos activos,{" "}
                      {selected.attentions.toLocaleString("es-CL")} atenciones
                    </p>
                  </div>

                  <div className="metric-grid">
                    <Metric
                      label="Atenciones"
                      value={selected.attentions.toLocaleString("es-CL")}
                    />
                    <Metric label="Personas" value={selected.people.toLocaleString("es-CL")} />
                    <Metric label="Casos" value={String(selected.cases)} />
                  </div>

                  <div className={`delta ${deltaClass}`}>
                    {selected.delta < 0 ? (
                      <ArrowDown size={12} />
                    ) : selected.delta === 0 ? (
                      <Minus size={12} />
                    ) : (
                      <ArrowUp size={12} />
                    )}
                    <strong>
                      {Math.abs(selected.delta).toLocaleString("es-CL", {
                        maximumFractionDigits: 1,
                      })}{" "}
                      %
                    </strong>
                    <span>vs. mes anterior</span>
                  </div>

                  <AidMixBars mix={selected.aidMix} />

                  <button
                    className="text-link"
                    type="button"
                    onClick={() => showToast("Análisis territorial en preparación.")}
                  >
                    Ver análisis territorial
                  </button>
                </Panel>

                <Panel
                  id="cases"
                  icon={<ClipboardList size={15} />}
                  title="Casos recientes"
                  badge={filteredCases.length}
                  action={
                    filteredCases.length > 4 ? (
                      <button
                        className="panel-action"
                        type="button"
                        onClick={() => setShowAllCases((current) => !current)}
                      >
                        {showAllCases ? "Ver menos" : "Ver todos"}
                      </button>
                    ) : undefined
                  }
                  collapsed={Boolean(collapsed.cases)}
                  onToggle={() => togglePanel("cases")}
                >
                  {submittedSearch && (
                    <div className="filter-chip">
                      <Search size={11} />
                      <span>“{submittedSearch}”</span>
                      <button type="button" onClick={clearSearch} aria-label="Quitar búsqueda">
                        <X size={11} />
                      </button>
                    </div>
                  )}

                  {filteredCases.length === 0 ? (
                    <EmptyCases query={submittedSearch} onClear={clearSearch} />
                  ) : (
                    <div className="case-list">
                      {visibleCases.map((item) => (
                        <button
                          className="case-row"
                          type="button"
                          key={item.id}
                          onClick={() => handleCaseSelect(item)}
                        >
                          <span className="case-copy">
                            <span className="case-topline">
                              <span className="case-folio">{item.id}</span>
                              {item.urgency === "Urgente" && (
                                <span className="urgent-dot" title="Urgente" />
                              )}
                              <span className="case-time">{item.time}</span>
                            </span>
                            <span className="case-person">{item.person}</span>
                            <span className="case-meta">
                              {item.aidType}, {getMacrosector(item.sectorId).shortLabel}
                            </span>
                          </span>
                          <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                        </button>
                      ))}
                    </div>
                  )}
                </Panel>

                <Panel
                  id="alerts"
                  icon={<AlertTriangle size={15} />}
                  title="Alertas operativas"
                  badge={OPERATIONAL_ALERTS.length}
                  collapsed={Boolean(collapsed.alerts)}
                  onToggle={() => togglePanel("alerts")}
                >
                  <div className="alert-list">
                    {OPERATIONAL_ALERTS.map((alert) => (
                      <button
                        className="alert-row"
                        type="button"
                        key={alert.id}
                        onClick={() => showToast(`Abriendo: ${alert.title.toLowerCase()}.`)}
                      >
                        <span className={`alert-icon alert-icon--${alert.tone}`}>
                          <AlertGlyph icon={alert.icon} />
                        </span>
                        <span className="alert-copy">
                          <span className="alert-title">{alert.title}</span>
                          <span className="alert-detail">{alert.detail}</span>
                        </span>
                        <span className="alert-count">{alert.count}</span>
                      </button>
                    ))}
                  </div>
                </Panel>

                <Panel
                  id="quick"
                  icon={<Plus size={15} />}
                  title="Accesos rápidos"
                  collapsed={Boolean(collapsed.quick)}
                  onToggle={() => togglePanel("quick")}
                >
                  <button className="quick-primary" type="button" onClick={openNewCase}>
                    <Plus size={15} />
                    Nuevo caso
                  </button>

                  <div className="quick-grid">
                    {QUICK_ACTIONS.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          className="quick-action"
                          type="button"
                          key={action.label}
                          onClick={() => showToast(action.message)}
                        >
                          <Icon size={14} />
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                </Panel>
              </div>
            </aside>
        </main>

        {(notificationOpen || userMenuOpen) && (
          <button
            className="popover-scrim"
            type="button"
            aria-label="Cerrar menú"
            tabIndex={-1}
            onClick={closePopovers}
          />
        )}

        {toast && (
          <div className="toast" role="status" aria-live="polite">
            <CheckCircle2 size={15} />
            <span>{toast}</span>
          </div>
        )}

        {newCaseOpen && (
          <NewCaseModal
            sectorId={selectedId}
            onClose={() => setNewCaseOpen(false)}
            onCreate={handleCreateCase}
          />
        )}
      </div>
    </div>
  );
}
