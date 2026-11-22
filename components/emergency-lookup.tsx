"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import {
  ApiError,
  api,
  categoryLabel,
  formatDateTime,
  helpLabel,
  stateLabel,
  stateTone,
} from "@/lib/api";

type LookupState =
  | { status: "idle" }
  | { status: "busy" }
  | {
      status: "found";
      code: string;
      title: string;
      category: string;
      helpType: string;
      address: string;
      state: string;
      updatedAt: string;
    }
  | { status: "error"; message: string };

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
      setLookup({
        status: "found",
        code: record.code,
        title: record.title,
        category: categoryLabel(record.category),
        helpType: helpLabel(record.help_type),
        address: record.address,
        state: record.state,
        updatedAt: formatDateTime(record.updated_at),
      });
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

      {lookup.status === "found" && (
        <div className="lookup-result" role="status">
          <div className="lookup-result-head">
            <strong>{lookup.code}</strong>
            <span className={`status status--${stateTone(lookup.state)}`}>
              {stateLabel(lookup.state)}
            </span>
          </div>
          <p className="lookup-title">{lookup.title}</p>
          <p className="lookup-meta">
            {lookup.category}, {lookup.helpType.toLowerCase()} · {lookup.address}
          </p>
          <p className="lookup-updated">Actualizado {lookup.updatedAt}</p>
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
