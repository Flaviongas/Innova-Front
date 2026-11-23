"use client";

import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Crosshair,
  Landmark,
  Layers,
  LogOut,
  MapPin,
  Maximize2,
  Minus,
  Package,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type L from "leaflet";
import { AyudasView } from "@/components/ayudas-view";
import { CasosView } from "@/components/casos-view";
import { InteractiveTerritoryMap } from "@/components/interactive-territory-map";
import { StatusBadge } from "@/components/status-badge";
import { MACROSECTORS, getMacrosector, type AidSlice } from "@/lib/data";
import { focusMap } from "@/lib/map-focus";
import {
  ApiError,
  api,
  categoryLabel,
  clearToken,
  formatDateTime,
  getToken,
  helpLabel,
  stateLabel,
  stateTone,
  type CreateEmergencyInput,
  type DeliveryLineInput,
  type Emergency,
  type EmergencyCategory,
  type EmergencyHelpType,
  type EmergencyState,
  type StockItem,
  type User,
} from "@/lib/api";

const NAV_ITEMS = ["Panel", "Casos", "Ayudas", "Bodega"];

const CATEGORY_OPTIONS: EmergencyCategory[] = [
  "incendio",
  "terremoto",
  "inundacion",
  "temporal",
  "otro",
];

const HELP_OPTIONS: EmergencyHelpType[] = [
  "alimentos",
  "higiene",
  "abrigo",
  "dinero",
  "materiales",
  "otro",
];

const STOCK_CATEGORIES = ["alimentos", "higiene", "abrigo", "materiales", "otro"] as const;

const STATE_OPTIONS: EmergencyState[] = ["recibida", "en_proceso", "entregada"];

const HELP_COLORS: Record<string, string> = {
  alimentos: "#4B9FD4",
  dinero: "#3574B5",
  materiales: "#B45309",
  higiene: "#65A30D",
  abrigo: "#4B99A5",
  otro: "#8B8E8D",
};

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

function AlertGlyph({ icon }: { icon: "stock" | "attention" }) {
  if (icon === "stock") return <Package size={13} />;
  return <ClipboardList size={13} />;
}

export type OperationalAlert = {
  id: string;
  title: string;
  detail: string;
  count: number;
  tone: string;
  icon: "stock" | "attention";
};

type CaseCoords = { lat: number; lng: number; accuracy: number };

type NewCaseModalProps = {
  onClose: () => void;
  onCreate: (payload: CreateEmergencyInput) => Promise<void>;
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

function NewCaseModal({ onClose, onCreate }: NewCaseModalProps) {
  const [gps, setGps] = useState<GpsState>({ status: "idle" });
  const [locationMode, setLocationMode] = useState<"gps" | "manual">("gps");
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [located, setLocated] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function requestGps() {
    if (!("geolocation" in navigator)) {
      setGps({
        status: "error",
        message: "Este navegador no soporta geolocalización.",
      });
      return;
    }

    setGps({ status: "locating" });
    setLocated(undefined);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGps({
          status: "ready",
          lat,
          lng,
          accuracy: position.coords.accuracy,
        });
        try {
          const result = await api.locateMacrosector(lat, lng);
          setLocated(result.macrosector ? result.macrosector.id : null);
        } catch {
          setLocated(undefined);
        }
      },
      (error) => setGps({ status: "error", message: gpsErrorMessage(error) }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  function clearGps() {
    setGps({ status: "idle" });
    setLocated(undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    const address = String(data.get("address") ?? "").trim();
    const category = String(data.get("category") ?? "otro") as EmergencyCategory;
    const helpType = String(data.get("help_type") ?? "otro") as EmergencyHelpType;
    const state = String(data.get("state") ?? "recibida") as Emergency["state"];

    if (title.length < 3) {
      setSubmitError("El título debe tener al menos 3 caracteres.");
      return;
    }
    if (address.length < 3) {
      setSubmitError("La dirección debe tener al menos 3 caracteres.");
      return;
    }

    let latitude: number;
    let longitude: number;

    if (locationMode === "gps") {
      if (gps.status !== "ready") {
        setSubmitError(
          "Captura la ubicación GPS o cambia a coordenadas manuales.",
        );
        return;
      }
      latitude = gps.lat;
      longitude = gps.lng;
    } else {
      latitude = Number(manualLat);
      longitude = Number(manualLng);
      if (
        manualLat.trim() === "" ||
        manualLng.trim() === "" ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        setSubmitError(
          "Ingresa una latitud entre -90 y 90 y una longitud entre -180 y 180.",
        );
        return;
      }
    }

    setBusy(true);
    setSubmitError(null);
    try {
      await onCreate({
        category,
        help_type: helpType,
        title,
        address,
        latitude,
        longitude,
        state,
      });
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "No se pudo crear el caso.",
      );
    } finally {
      setBusy(false);
    }
  }

  const locatedLabel =
    located === undefined
      ? null
      : located === null
        ? "Fuera de macrosectores (se registrará sin sector)"
        : `Macrosector: ${getMacrosector(located).label} (automático)`;

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
            <p>Un registro cubre un evento y un tipo de ayuda, sin datos personales.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <form className="case-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field field--full">
              <span>Título del evento</span>
              <input
                name="title"
                placeholder="Ej. Incendio calle Prat"
                required
                autoComplete="off"
                autoFocus
              />
            </label>

            <label className="field">
              <span>Tipo de evento</span>
              <select name="category" defaultValue="incendio">
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {categoryLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Tipo de ayuda</span>
              <select name="help_type" defaultValue="alimentos">
                {HELP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {helpLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field--full">
              <span>Dirección</span>
              <input
                name="address"
                placeholder="Ej. Prat 123, Temuco"
                required
                autoComplete="off"
              />
            </label>

            <div className="field field--full">
              <span>Ubicación</span>
              <div className="location-mode" role="group" aria-label="Método de ubicación">
                <button
                  type="button"
                  className={locationMode === "gps" ? "is-active" : ""}
                  aria-pressed={locationMode === "gps"}
                  onClick={() => {
                    setLocationMode("gps");
                    setSubmitError(null);
                  }}
                >
                  GPS
                </button>
                <button
                  type="button"
                  className={locationMode === "manual" ? "is-active" : ""}
                  aria-pressed={locationMode === "manual"}
                  onClick={() => {
                    setLocationMode("manual");
                    setSubmitError(null);
                  }}
                >
                  Coordenadas manuales
                </button>
              </div>

              {locationMode === "gps" ? (
                <>
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
                        onClick={clearGps}
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
                  {locatedLabel && (
                    <span className="gps-located">{locatedLabel}</span>
                  )}
                </>
              ) : (
                <>
                  <div className="coords-grid">
                    <label className="field">
                      <span>Latitud</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min={-90}
                        max={90}
                        placeholder="-38.7359"
                        value={manualLat}
                        onChange={(event) => {
                          setManualLat(event.target.value);
                          setSubmitError(null);
                        }}
                      />
                    </label>
                    <label className="field">
                      <span>Longitud</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min={-180}
                        max={180}
                        placeholder="-72.5904"
                        value={manualLng}
                        onChange={(event) => {
                          setManualLng(event.target.value);
                          setSubmitError(null);
                        }}
                      />
                    </label>
                  </div>
                  <span className="gps-hint">
                    El servidor asignará el macrosector según estas coordenadas.
                  </span>
                </>
              )}
            </div>

            <label className="field field--full">
              <span>Estado inicial</span>
              <select name="state" defaultValue="recibida">
                <option value="recibida">Recibida</option>
                <option value="en_proceso">En proceso</option>
                <option value="entregada">
                  Entregada (ayuda urgente previa al registro)
                </option>
              </select>
            </label>
          </div>

          {submitError && (
            <p className="form-error" role="alert">
              {submitError}
            </p>
          )}

          <div className="form-note">
            <AlertTriangle size={14} />
            <span>
              Se genera un código de seguimiento (por ejemplo TMO-X7K2-Q9P4) para consulta pública.
            </span>
          </div>

          <div className="modal-actions">
            <button className="button button--ghost" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="button button--primary" type="submit" disabled={busy}>
              <Plus size={14} />
              {busy ? "Creando…" : "Crear caso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type EmergencyDrawerProps = {
  emergency: Emergency;
  stockItems: StockItem[];
  onClose: () => void;
  onUpdated: (emergency: Emergency) => void;
  onStockChanged: () => void;
  notify: (message: string) => void;
};

function EmergencyDrawer({
  emergency,
  stockItems,
  onClose,
  onUpdated,
  onStockChanged,
  notify,
}: EmergencyDrawerProps) {
  const [stateBusy, setStateBusy] = useState(false);
  const [deliveryItem, setDeliveryItem] = useState("");
  const [deliveryQty, setDeliveryQty] = useState("1");
  const [deliveryBusy, setDeliveryBusy] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const sectorLabel = emergency.macrosector
    ? getMacrosector(emergency.macrosector).label
    : "Sin sector";

  async function changeState(state: EmergencyState) {
    if (state === emergency.state || stateBusy) return;
    setStateBusy(true);
    try {
      const updated = await api.patchEmergencyState(emergency.id, state);
      onUpdated(updated);
      notify(`Caso ${updated.code} ahora está ${stateLabel(updated.state).toLowerCase()}.`);
    } catch (err) {
      notify(
        err instanceof ApiError ? err.message : "No se pudo cambiar el estado.",
      );
    } finally {
      setStateBusy(false);
    }
  }

  async function submitDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deliveryBusy) return;

    const itemId = Number(deliveryItem);
    const quantity = Number(deliveryQty);
    if (!itemId || !Number.isInteger(quantity) || quantity <= 0) {
      setDeliveryError("Elige un artículo y una cantidad entera mayor que cero.");
      return;
    }

    setDeliveryBusy(true);
    setDeliveryError(null);
    try {
      const updated = await api.addDelivery(emergency.id, [
        { item_id: itemId, quantity },
      ]);
      onUpdated(updated);
      onStockChanged();
      setDeliveryItem("");
      setDeliveryQty("1");
      notify(`Entrega registrada en ${updated.code}. Stock descontado.`);
    } catch (err) {
      setDeliveryError(
        err instanceof ApiError ? err.message : "No se pudo registrar la entrega.",
      );
    } finally {
      setDeliveryBusy(false);
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editBusy) return;

    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    if (title.length < 3) {
      setEditError("El título debe tener al menos 3 caracteres.");
      return;
    }

    const latitudeRaw = String(data.get("latitude") ?? "").trim();
    const longitudeRaw = String(data.get("longitude") ?? "").trim();
    const latitude = latitudeRaw === "" ? emergency.latitude : Number(latitudeRaw);
    const longitude = longitudeRaw === "" ? emergency.longitude : Number(longitudeRaw);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      setEditError(
        "Latitud debe estar entre -90 y 90, longitud entre -180 y 180.",
      );
      return;
    }

    setEditBusy(true);
    setEditError(null);
    try {
      const updated = await api.patchEmergency(emergency.id, {
        title,
        category: String(data.get("category") ?? emergency.category) as EmergencyCategory,
        help_type: String(data.get("help_type") ?? emergency.help_type) as Emergency["help_type"],
        address: String(data.get("address") ?? emergency.address).trim() || emergency.address,
        latitude,
        longitude,
      });
      onUpdated(updated);
      setEditing(false);
      notify(`Caso ${updated.code} actualizado.`);
    } catch (err) {
      setEditError(
        err instanceof ApiError ? err.message : "No se pudo guardar.",
      );
    } finally {
      setEditBusy(false);
    }
  }

  const activeItems = stockItems.filter((item) => item.active);

  return (
    <div
      className="modal-scrim drawer-scrim"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">{emergency.code}</span>
            <h2 id="drawer-title">{emergency.title}</h2>
            <p>
              {categoryLabel(emergency.category)}, {helpLabel(emergency.help_type).toLowerCase()} · {sectorLabel}
            </p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar detalle">
            <X size={16} />
          </button>
        </div>

        <div className="drawer-status">
          <StatusBadge tone={stateTone(emergency.state)}>
            {stateLabel(emergency.state)}
          </StatusBadge>
          <div className="state-switch" role="group" aria-label="Cambiar estado">
            {STATE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={option === emergency.state ? "is-active" : ""}
                disabled={stateBusy || option === emergency.state}
                onClick={() => changeState(option)}
              >
                {stateLabel(option)}
              </button>
            ))}
          </div>
        </div>

        <dl className="drawer-facts">
          <div>
            <dt>Dirección</dt>
            <dd>{emergency.address}</dd>
          </div>
          <div>
            <dt>Coordenadas</dt>
            <dd>
              {emergency.latitude.toFixed(5)}, {emergency.longitude.toFixed(5)}
            </dd>
          </div>
          <div>
            <dt>Actualizado</dt>
            <dd>{formatDateTime(emergency.updated_at)}</dd>
          </div>
        </dl>

        <div className="drawer-section">
          <div className="drawer-section-head">
            <h3>Entregas registradas</h3>
            <span>{emergency.delivered.length}</span>
          </div>
          {emergency.delivered.length === 0 ? (
            <p className="drawer-empty">Sin entregas registradas todavía.</p>
          ) : (
            <ul className="delivered-list">
              {emergency.delivered.map((line, index) => (
                <li key={`${line.item}-${index}`}>
                  <span>{line.item}</span>
                  <strong>× {line.quantity}</strong>
                </li>
              ))}
            </ul>
          )}

          <form className="drawer-form" onSubmit={submitDelivery}>
            <label className="field">
              <span>Artículo</span>
              <select
                value={deliveryItem}
                onChange={(event) => setDeliveryItem(event.target.value)}
                required
              >
                <option value="">Seleccionar…</option>
                {activeItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (stock: {item.quantity})
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Cantidad</span>
              <input
                type="number"
                min={1}
                step={1}
                value={deliveryQty}
                onChange={(event) => setDeliveryQty(event.target.value)}
                required
              />
            </label>
            <button
              className="button button--secondary"
              type="submit"
              disabled={deliveryBusy}
            >
              {deliveryBusy ? "Registrando…" : "Registrar entrega"}
            </button>
          </form>
          {deliveryError && (
            <p className="form-error" role="alert">
              {deliveryError}
            </p>
          )}
          <p className="drawer-hint">
            Descuenta stock atómicamente; si falta stock no se mueve nada.
          </p>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-head">
            <h3>Ficha del evento</h3>
            <button
              className="panel-action"
              type="button"
              onClick={() => {
                setEditing((value) => !value);
                setEditError(null);
              }}
            >
              {editing ? "Cancelar" : "Editar"}
            </button>
          </div>
          {editing ? (
            <form className="drawer-form" onSubmit={submitEdit}>
              <label className="field field--full">
                <span>Título</span>
                <input name="title" defaultValue={emergency.title} required />
              </label>
              <label className="field">
                <span>Tipo de evento</span>
                <select name="category" defaultValue={emergency.category}>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {categoryLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Tipo de ayuda</span>
                <select name="help_type" defaultValue={emergency.help_type}>
                  {HELP_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {helpLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field field--full">
                <span>Dirección</span>
                <input name="address" defaultValue={emergency.address} required />
              </label>
              <div className="field field--full">
                <span>Coordenadas</span>
                <div className="coords-grid">
                  <label className="field">
                    <span>Latitud</span>
                    <input
                      name="latitude"
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min={-90}
                      max={90}
                      defaultValue={emergency.latitude}
                    />
                  </label>
                  <label className="field">
                    <span>Longitud</span>
                    <input
                      name="longitude"
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min={-180}
                      max={180}
                      defaultValue={emergency.longitude}
                    />
                  </label>
                </div>
                <span className="gps-hint">
                  Si cambian, el servidor reasigna el macrosector.
                </span>
              </div>
              {editError && (
                <p className="form-error" role="alert">
                  {editError}
                </p>
              )}
              <button
                className="button button--primary"
                type="submit"
                disabled={editBusy}
              >
                {editBusy ? "Guardando…" : "Guardar cambios"}
              </button>
            </form>
          ) : (
            <p className="drawer-empty">Código {emergency.code} · creado {formatDateTime(emergency.created_at)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

type StockModalProps = {
  items: StockItem[];
  busy: boolean;
  onClose: () => void;
  onCreateItem: (input: {
    name: string;
    unit: string;
    category: (typeof STOCK_CATEGORIES)[number];
    quantity: number;
    threshold: number;
  }) => Promise<void>;
  onPurchase: (itemId: number, quantity: number) => Promise<void>;
};

function StockModal({ items, busy, onClose, onCreateItem, onPurchase }: StockModalProps) {
  const [itemError, setItemError] = useState<string | null>(null);
  const [purchaseItem, setPurchaseItem] = useState("");
  const [purchaseQty, setPurchaseQty] = useState("10");
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  async function submitItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const unit = String(data.get("unit") ?? "").trim() || "unidad";
    const quantity = Number(data.get("quantity") ?? 0);
    const threshold = Number(data.get("threshold") ?? 0);

    if (name.length < 2) {
      setItemError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(threshold) || threshold < 0) {
      setItemError("Cantidad y umbral deben ser números no negativos.");
      return;
    }

    setItemError(null);
    try {
      await onCreateItem({
        name,
        unit,
        category: String(data.get("category") ?? "otro") as (typeof STOCK_CATEGORIES)[number],
        quantity,
        threshold,
      });
      event.currentTarget.reset();
    } catch (err) {
      setItemError(err instanceof ApiError ? err.message : "No se pudo crear el artículo.");
    }
  }

  async function submitPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const itemId = Number(purchaseItem);
    const quantity = Number(purchaseQty);
    if (!itemId || !Number.isInteger(quantity) || quantity <= 0) {
      setPurchaseError("Elige un artículo y una cantidad entera mayor que cero.");
      return;
    }
    setPurchaseBusy(true);
    setPurchaseError(null);
    try {
      await onPurchase(itemId, quantity);
      setPurchaseQty("10");
    } catch (err) {
      setPurchaseError(err instanceof ApiError ? err.message : "No se pudo registrar la compra.");
    } finally {
      setPurchaseBusy(false);
    }
  }

  const activeItems = items.filter((item) => item.active);

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
        aria-labelledby="stock-title"
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">Bodega</span>
            <h2 id="stock-title">Existencias</h2>
            <p>{items.length} artículos · {items.filter((item) => item.low_stock).length} bajo mínimo</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar bodega">
            <X size={16} />
          </button>
        </div>

        {busy && items.length === 0 ? (
          <p className="drawer-empty">Cargando existencias…</p>
        ) : items.length === 0 ? (
          <p className="drawer-empty">Sin artículos registrados.</p>
        ) : (
          <ul className="stock-list">
            {items.map((item) => (
              <li key={item.id} className={item.low_stock ? "is-low" : ""}>
                <span className="stock-name">
                  <strong>{item.name}</strong>
                  <span>
                    {item.unit} · umbral {item.threshold}
                    {!item.active && " · retirado"}
                  </span>
                </span>
                <strong className="stock-qty">{item.quantity}</strong>
              </li>
            ))}
          </ul>
        )}

        <div className="drawer-section">
          <div className="drawer-section-head">
            <h3>Registrar compra</h3>
          </div>
          <form className="drawer-form" onSubmit={submitPurchase}>
            <label className="field">
              <span>Artículo</span>
              <select
                value={purchaseItem}
                onChange={(event) => setPurchaseItem(event.target.value)}
                required
              >
                <option value="">Seleccionar…</option>
                {activeItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Cantidad</span>
              <input
                type="number"
                min={1}
                step={1}
                value={purchaseQty}
                onChange={(event) => setPurchaseQty(event.target.value)}
                required
              />
            </label>
            <button
              className="button button--secondary"
              type="submit"
              disabled={purchaseBusy}
            >
              {purchaseBusy ? "Registrando…" : "Sumar stock"}
            </button>
          </form>
          {purchaseError && (
            <p className="form-error" role="alert">
              {purchaseError}
            </p>
          )}
        </div>

        <div className="drawer-section">
          <div className="drawer-section-head">
            <h3>Nuevo artículo</h3>
          </div>
          <form className="case-form" onSubmit={submitItem}>
            <div className="form-grid">
              <label className="field field--full">
                <span>Nombre</span>
                <input name="name" placeholder="Ej. Colchoneta 1 plaza" autoComplete="off" />
              </label>
              <label className="field">
                <span>Unidad</span>
                <input name="unit" placeholder="unidad" defaultValue="unidad" autoComplete="off" />
              </label>
              <label className="field">
                <span>Categoría</span>
                <select name="category" defaultValue="abrigo">
                  {STOCK_CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                      {helpLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Stock inicial</span>
                <input name="quantity" type="number" min={0} step={1} defaultValue={0} />
              </label>
              <label className="field">
                <span>Umbral mínimo</span>
                <input name="threshold" type="number" min={0} step={1} defaultValue={10} />
              </label>
            </div>
            {itemError && (
              <p className="form-error" role="alert">
                {itemError}
              </p>
            )}
            <div className="modal-actions">
              <button className="button button--primary" type="submit">
                Crear artículo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [view, setView] = useState<"panel" | "casos" | "ayudas">("panel");
  const [selectedId, setSelectedId] = useState("centro");
  const [user, setUser] = useState<User | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [casesError, setCasesError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
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
  const [detailCode, setDetailCode] = useState<string | null>(null);
  const [stockOpen, setStockOpen] = useState(false);
  const [stockBusy, setStockBusy] = useState(false);

  const selected = getMacrosector(selectedId);

  function showToast(message: string) {
    setToast(message);
  }

  const loadEmergencies = useCallback(async () => {
    setLoadingCases(true);
    setCasesError(null);
    try {
      const result = await api.listEmergencies();
      setEmergencies(result.emergencies);
      setForbidden(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
        setEmergencies([]);
      } else {
        setCasesError(
          err instanceof ApiError ? err.message : "No se pudieron cargar los casos.",
        );
      }
    } finally {
      setLoadingCases(false);
    }
  }, []);

  const loadStock = useCallback(async () => {
    try {
      const result = await api.listStockItems();
      setStockItems(result.items);
    } catch {
      // Stock failures surface inside the stock modal, not globally.
    }
  }, []);

  // Allow deep links into the operational queues, e.g. /panel?vista=casos.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("vista");
    if (requested === "casos" || requested === "ayudas") setView(requested);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      if (!getToken()) {
        router.replace("/login");
        return;
      }
      try {
        const account = await api.me();
        if (cancelled) return;
        setUser(account);
        setSessionChecked(true);
        void loadEmergencies();
        void loadStock();
      } catch {
        if (cancelled) return;
        clearToken();
        router.replace("/login");
      }
    }
    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [router, loadEmergencies, loadStock]);

  function refreshEmergency(updated: Emergency) {
    setEmergencies((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  async function handleLogout() {
    setUserMenuOpen(false);
    try {
      await api.logout();
    } catch {
      // Even if revocation fails, the local session ends here.
    }
    clearToken();
    router.replace("/login");
  }

  const filteredCases = useMemo(() => {
    const query = submittedSearch.trim().toLowerCase();
    if (!query) return emergencies;

    return emergencies.filter((item) => {
      const sectorLabel = item.macrosector
        ? getMacrosector(item.macrosector).label
        : "Sin sector";
      return [
        item.code,
        item.title,
        item.address,
        categoryLabel(item.category),
        helpLabel(item.help_type),
        sectorLabel,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [emergencies, submittedSearch]);

  const visibleCases = showAllCases ? filteredCases : filteredCases.slice(0, 3);

  const sectorEmergencies = useMemo(
    () => emergencies.filter((item) => item.macrosector === selectedId),
    [emergencies, selectedId],
  );

  const sectorDelivered = useMemo(
    () =>
      sectorEmergencies.reduce(
        (total, item) =>
          total + item.delivered.reduce((sum, line) => sum + line.quantity, 0),
        0,
      ),
    [sectorEmergencies],
  );

  const sectorHelpMix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of sectorEmergencies) {
      counts.set(item.help_type, (counts.get(item.help_type) ?? 0) + 1);
    }
    const total = sectorEmergencies.length || 1;
    return [...counts.entries()].map(([helpType, count]) => ({
      label: helpLabel(helpType),
      value: Math.round((count / total) * 100),
      color: HELP_COLORS[helpType] ?? "#8B8E8D",
    }));
  }, [sectorEmergencies]);

  const caseCounts = useMemo(() => {
    // Every sector starts at zero so the map never falls back to synthetic
    // reference counts for territories without cases.
    const counts: Record<string, number> = {};
    for (const sector of MACROSECTORS) {
      counts[sector.id] = 0;
    }
    for (const item of emergencies) {
      if (!item.macrosector) continue;
      counts[item.macrosector] = (counts[item.macrosector] ?? 0) + 1;
    }
    return counts;
  }, [emergencies]);

  const unlocatedCount = useMemo(
    () => emergencies.filter((item) => !item.macrosector).length,
    [emergencies],
  );

  const alerts = useMemo<OperationalAlert[]>(() => {
    const list: OperationalAlert[] = [];
    const lowItems = stockItems.filter((item) => item.low_stock && item.active);
    if (lowItems.length > 0) {
      list.push({
        id: "stock",
        title: "Stock bajo mínimo",
        detail: lowItems
          .slice(0, 2)
          .map((item) => item.name)
          .join(", "),
        count: lowItems.length,
        tone: "danger",
        icon: "stock",
      });
    }
    const pending = emergencies.filter((item) => item.state === "recibida");
    if (pending.length > 0) {
      list.push({
        id: "pending",
        title: "Casos recibidos por atender",
        detail: "Revisar y mover a En proceso",
        count: pending.length,
        tone: "info",
        icon: "attention",
      });
    }
    return list;
  }, [emergencies, stockItems]);

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
      if (detailCode) {
        setDetailCode(null);
        return;
      }
      if (stockOpen) {
        setStockOpen(false);
        return;
      }
      setNotificationOpen(false);
      setUserMenuOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [newCaseOpen, detailCode, stockOpen]);

  useEffect(() => {
    if (!newCaseOpen && !detailCode && !stockOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [newCaseOpen, detailCode, stockOpen]);

  function openNewCase() {
    setNotificationOpen(false);
    setUserMenuOpen(false);
    setNewCaseOpen(true);
  }

  function applyView(next: "panel" | "casos" | "ayudas") {
    setView(next);
    const url = new URL(window.location.href);
    if (next === "panel") {
      url.searchParams.delete("vista");
    } else {
      url.searchParams.set("vista", next);
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function handleNav(label: string) {
    closePopovers();
    if (label === "Panel") {
      applyView("panel");
      return;
    }
    if (label === "Casos") {
      applyView("casos");
      if (casesError) void loadEmergencies();
      return;
    }
    if (label === "Ayudas") {
      applyView("ayudas");
      if (casesError) void loadEmergencies();
      return;
    }
    if (label === "Bodega") {
      setStockBusy(true);
      setStockOpen(true);
      void loadStock().finally(() => setStockBusy(false));
      return;
    }
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

  function handleCaseSelect(item: Emergency) {
    if (item.macrosector) {
      setSelectedId(item.macrosector);
    }
    // The map only exists in the panel view; the queue opens the same drawer.
    if (view === "panel" && mapRef.current) {
      focusMap(mapRef.current, [item.latitude, item.longitude], 15);
    }
    setDetailCode(item.code);
  }

  async function handleCreateCase(payload: CreateEmergencyInput) {
    const record = await api.createEmergency(payload);
    setEmergencies((current) => [record, ...current]);
    if (record.macrosector) {
      setSelectedId(record.macrosector);
    }
    setNewCaseOpen(false);
    setSubmittedSearch("");
    setSearch("");
    if (mapRef.current) {
      focusMap(mapRef.current, [record.latitude, record.longitude], 16);
    }
    showToast(`Caso ${record.code} creado.`);
    void loadStock();
  }

  async function handleCreateStockItem(input: {
    name: string;
    unit: string;
    category: (typeof STOCK_CATEGORIES)[number];
    quantity: number;
    threshold: number;
  }) {
    await api.createStockItem(input);
    await loadStock();
    showToast(`Artículo ${input.name} creado.`);
  }

  async function handlePurchase(itemId: number, quantity: number) {
    await api.createMovement({
      item_id: itemId,
      delta: quantity,
      reason: "compra",
    });
    await loadStock();
    showToast("Compra registrada en bodega.");
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
    if (mapRef.current) {
      focusMap(mapRef.current, [-38.7359, -72.5904], 13);
    }
    showToast("Vista centrada en Temuco.");
  }

  function handleNotificationSelect(alert: OperationalAlert) {
    setNotificationOpen(false);
    if (alert.id === "stock") {
      setStockBusy(true);
      setStockOpen(true);
      void loadStock().finally(() => setStockBusy(false));
      return;
    }
    showToast(`${alert.title.toLowerCase()}: ${alert.detail.toLowerCase()}.`);
  }

  function closePopovers() {
    setNotificationOpen(false);
    setUserMenuOpen(false);
  }

  const detailEmergency = detailCode
    ? (emergencies.find((item) => item.code === detailCode) ?? null)
    : null;

  if (!sessionChecked) {
    return (
      <div className="page-frame">
        <div className="gate-loading" role="status" aria-live="polite">
          <span className="brand-mark">
            <Landmark size={18} />
          </span>
          <span>Verificando sesión…</span>
        </div>
      </div>
    );
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
            {NAV_ITEMS.map((item) => {
              const active =
                (view === "casos" && item === "Casos") ||
                (view === "ayudas" && item === "Ayudas") ||
                (view === "panel" && item === "Panel");
              return (
                <button
                  key={item}
                  type="button"
                  className={`nav-link${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => handleNav(item)}
                >
                  {item}
                </button>
              );
            })}
          </nav>

          <div className="topbar-actions">
            <span className="status-pill">
              <span className="live-dot" />
              {emergencies.length} casos registrados
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
                {!notificationsRead && alerts.length > 0 && (
                  <span className="notification-dot" />
                )}
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
                      <span>
                        {notificationsRead || alerts.length === 0
                          ? "Sin pendientes"
                          : `${alerts.reduce((sum, alert) => sum + alert.count, 0)} pendientes`}
                      </span>
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
                    {alerts.length === 0 && (
                      <p className="drawer-empty">Sin alertas operativas.</p>
                    )}
                    {alerts.map((alert) => (
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
                <span className="avatar">
                  {(user?.display_name ?? "?").slice(0, 2).toUpperCase()}
                </span>
                <span className="user-name">{user?.display_name ?? "…"}</span>
                <ChevronDown size={13} />
              </button>

              {userMenuOpen && (
                <div className="popover user-popover" id="user-menu" role="menu">
                  <div className="user-summary">
                    <span className="avatar avatar--large">
                      {(user?.display_name ?? "?").slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <strong>{user?.display_name ?? "…"}</strong>
                      <span>
                        {user ? `${user.username} · ${user.role === "admin" ? "Administración" : "Usuario"}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="menu-list">
                    <button
                      type="button"
                      role="menuitem"
                      className="menu-item--danger"
                      onClick={() => void handleLogout()}
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
          className={`workspace${
            view !== "panel" ? " workspace--queue" : ""
          }${
            view === "panel" && mapMode === "satellite"
              ? " workspace--satellite"
              : ""
          }${view === "panel" && inspectorOpen ? " workspace--sheet-open" : ""}`}
        >
          {view === "casos" ? (
            <CasosView
              emergencies={emergencies}
              loading={loadingCases}
              error={casesError}
              forbidden={forbidden}
              role={user?.role}
              onReload={() => void loadEmergencies()}
              onNewCase={openNewCase}
              onSelect={handleCaseSelect}
            />
          ) : view === "ayudas" ? (
            <AyudasView
              emergencies={emergencies}
              stockItems={stockItems}
              loading={loadingCases}
              error={casesError}
              forbidden={forbidden}
              role={user?.role}
              onReload={() => void loadEmergencies()}
              onSelect={handleCaseSelect}
            />
          ) : (
            <>
          <div className="map-stage">
            <div className="map-canvas map-canvas--interactive">
              <InteractiveTerritoryMap
                selectedId={selectedId}
                onSelect={setSelectedId}
                mapMode={mapMode}
                onMapReady={handleMapReady}
                counts={caseCounts}
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

            <div className="map-legend" aria-label="Leyenda de casos registrados">
              <div className="legend-head">
                <span>Casos registrados</span>
                <span>Total</span>
              </div>
              <div className="legend-scale" />
              <div className="legend-ticks">
                <span>0</span>
                <span>3</span>
                <span>6</span>
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
                  placeholder="Buscar código, título, dirección o sector"
                  aria-label="Buscar casos por código, título, dirección o sector"
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
                      {sectorEmergencies.length} eventos
                      {unlocatedCount > 0 &&
                        ` · ${unlocatedCount} sin sector en total`}
                    </p>
                  </div>

                  <div className="metric-grid">
                    <Metric
                      label="Eventos"
                      value={String(sectorEmergencies.length)}
                    />
                    <Metric
                      label="En proceso"
                      value={String(
                        sectorEmergencies.filter(
                          (item) => item.state === "en_proceso",
                        ).length,
                      )}
                    />
                    <Metric
                      label="Unidades entregadas"
                      value={sectorDelivered.toLocaleString("es-CL")}
                    />
                  </div>

                  {sectorHelpMix.length > 0 && (
                    <AidMixBars mix={sectorHelpMix} />
                  )}
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

                  {loadingCases ? (
                    <div className="empty-cases">
                      <span className="empty-icon">
                        <Search size={16} />
                      </span>
                      <strong>Cargando casos…</strong>
                      <p>Conectando con el servidor municipal.</p>
                    </div>
                  ) : casesError ? (
                    <div className="empty-cases">
                      <span className="empty-icon">
                        <AlertTriangle size={16} />
                      </span>
                      <strong>No se pudieron cargar los casos</strong>
                      <p>{casesError}</p>
                      <button
                        className="text-link"
                        type="button"
                        onClick={() => void loadEmergencies()}
                      >
                        Reintentar
                      </button>
                    </div>
                  ) : forbidden ? (
                    <div className="empty-cases">
                      <span className="empty-icon">
                        <UserRound size={16} />
                      </span>
                      <strong>Sin acceso a emergencias</strong>
                      <p>
                        Tu cuenta ({user?.role ?? "usuario"}) no tiene permisos
                        de administración. Pide a una administración que cambie
                        tu rol.
                      </p>
                    </div>
                  ) : filteredCases.length === 0 ? (
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
                              <span className="case-folio">{item.code}</span>
                              <span className="case-time">
                                {formatDateTime(item.updated_at)}
                              </span>
                            </span>
                            <span className="case-person">{item.title}</span>
                            <span className="case-meta">
                              {categoryLabel(item.category)},{" "}
                              {helpLabel(item.help_type).toLowerCase()}
                              {item.macrosector
                                ? `, ${getMacrosector(item.macrosector).shortLabel}`
                                : ", sin sector"}
                            </span>
                          </span>
                          <StatusBadge tone={stateTone(item.state)}>
                            {stateLabel(item.state)}
                          </StatusBadge>
                        </button>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>
            </aside>
            </>
          )}
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
            onClose={() => setNewCaseOpen(false)}
            onCreate={handleCreateCase}
          />
        )}

        {detailEmergency && (
          <EmergencyDrawer
            emergency={detailEmergency}
            stockItems={stockItems}
            onClose={() => setDetailCode(null)}
            onUpdated={refreshEmergency}
            onStockChanged={() => void loadStock()}
            notify={showToast}
          />
        )}

        {stockOpen && (
          <StockModal
            items={stockItems}
            busy={stockBusy}
            onClose={() => setStockOpen(false)}
            onCreateItem={handleCreateStockItem}
            onPurchase={handlePurchase}
          />
        )}
      </div>
    </div>
  );
}
