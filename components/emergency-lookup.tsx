"use client";

import { useState, type FormEvent } from "react";
import { Check, MapPin, Package, Search } from "lucide-react";
import { InteractiveTerritoryMap } from "@/components/interactive-territory-map";
import { StatusBadge } from "@/components/status-badge";
import { getMacrosector } from "@/lib/data";
import {
  ApiError,
  api,
  categoryLabel,
  formatDateTime,
  helpLabel,
  stateLabel,
  stateTone,
  type EmergencyView,
  type EmergencyState,
} from "@/lib/api";

type LookupState =
  | { status: "idle" }
  | { status: "busy" }
  | { status: "found"; record: EmergencyView }
  | { status: "error"; message: string };

const STATE_STEPS: EmergencyState[] = ["recibida", "en_proceso", "entregada"];

export function EmergencyLookup() {
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const code = String(data.get("code") ?? "").trim();
    if (!code) return;

    setLookup({ status: "busy" });
    try {
      const record = await api.lookupEmergency(code);
      setLookup({ status: "found", record });
    } catch (err) {
      setLookup({
        status: "error",
        message:
          err instanceof ApiError
            ? err.message
            : "No se pudo consultar el código.",
      });
    }
  }

  const record = lookup.status === "found" ? lookup.record : null;
  const sector =
    record?.macrosector ? getMacrosector(record.macrosector) : null;
  const deliveredUnits =
    record?.delivered.reduce((total, line) => total + line.quantity, 0) ?? 0;
  const currentStep = record
    ? STATE_STEPS.indexOf(record.state as EmergencyState)
    : -1;

  return (
    <div className="lookup">
      <form className="lookup-form" onSubmit={handleSubmit}>
        <Search size={15} className="search-icon" />
        <input
          name="code"
          placeholder="Ej. TMO-X7K2-Q9P4"
          aria-label="Código de seguimiento"
          autoComplete="off"
        />
        <button
          className="button button--primary"
          type="submit"
          disabled={lookup.status === "busy"}
        >
          {lookup.status === "busy" ? "Buscando…" : "Consultar"}
        </button>
      </form>

      {record && (
        <div className="lookup-result" role="status">
          <div className="lookup-result-head">
            <div>
              <span className="lookup-code">{record.code}</span>
              <p className="lookup-title">{record.title}</p>
            </div>
            <StatusBadge tone={stateTone(record.state)}>
              {stateLabel(record.state)}
            </StatusBadge>
          </div>

          <ol className="lookup-steps" aria-label="Avance del caso">
            {STATE_STEPS.map((step, index) => {
              const reached = currentStep >= index;
              return (
                <li
                  key={step}
                  className={reached ? "is-reached" : ""}
                  aria-current={currentStep === index ? "step" : undefined}
                >
                  <span className="lookup-step-marker">
                    {reached ? <Check size={12} /> : index + 1}
                  </span>
                  <span className="lookup-step-label">{stateLabel(step)}</span>
                </li>
              );
            })}
          </ol>

          <div className="lookup-result-body">
            <div className="lookup-details">
              <dl className="lookup-facts">
                <div>
                  <dt>Tipo de evento</dt>
                  <dd>{categoryLabel(record.category)}</dd>
                </div>
                <div>
                  <dt>Tipo de ayuda</dt>
                  <dd>{helpLabel(record.help_type)}</dd>
                </div>
                <div>
                  <dt>Macrosector</dt>
                  <dd>{sector ? `${sector.label} · ${sector.type}` : "Sin asignar"}</dd>
                </div>
                <div>
                  <dt>Dirección</dt>
                  <dd>{record.address}</dd>
                </div>
                <div>
                  <dt>Registrado</dt>
                  <dd>{formatDateTime(record.created_at)}</dd>
                </div>
                <div>
                  <dt>Última actualización</dt>
                  <dd>{formatDateTime(record.updated_at)}</dd>
                </div>
              </dl>

              <div className="lookup-deliveries">
                <h3>
                  <Package size={15} />
                  {deliveredUnits === 0
                    ? "Sin entregas registradas"
                    : `${deliveredUnits} ${
                        deliveredUnits === 1 ? "unidad entregada" : "unidades entregadas"
                      }`}
                </h3>
                {record.delivered.length > 0 ? (
                  <ul>
                    {record.delivered.map((line) => (
                      <li key={line.item}>
                        <span>{line.item}</span>
                        <strong>{line.quantity}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    Cuando la municipalidad registre una entrega, aparecerá
                    aquí.
                  </p>
                )}
              </div>

              <p className="lookup-privacy">
                No mostramos datos personales en esta consulta.
              </p>
            </div>

            <div className="lookup-map-wrap">
              <div className="lookup-map">
                <InteractiveTerritoryMap
                  selectedId={record.macrosector ?? "centro"}
                  onSelect={() => {}}
                  mapMode="map"
                  scrollWheelZoom={false}
                  showCounts={false}
                  choropleth={false}
                  readOnly
                  focusPoint={[record.latitude, record.longitude]}
                  focusZoom={13}
                  focusKey={record.code}
                  cases={[
                    {
                      id: 0,
                      latitude: record.latitude,
                      longitude: record.longitude,
                      code: record.code,
                      title: record.title,
                      category: record.category,
                      categoryLabel: categoryLabel(record.category),
                    },
                  ]}
                />
              </div>
              <p className="lookup-map-caption">
                <MapPin size={13} />
                {sector
                  ? `Ubicación del caso en ${sector.label}`
                  : "Ubicación del caso (macrosector sin asignar)"}
              </p>
            </div>
          </div>
        </div>
      )}

      {lookup.status === "error" && (
        <p className="lookup-error" role="alert">
          {lookup.message}
        </p>
      )}
    </div>
  );
}
