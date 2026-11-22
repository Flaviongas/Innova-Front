// Typed HTTP client for Innova-Back.
//
// Base URL comes from the `NEXT_PUBLIC_API_URL` environment variable and
// falls back to the documented development URL. Because the variable is
// `NEXT_PUBLIC_` it is inlined at build time: create or edit `.env.local`
// (you create it yourself, it is gitignored) and restart the dev server:
//
//   NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
//
// The browser talks to the backend directly, so the backend must accept the
// frontend origin (CORS). Connection problems surface as ApiError with
// status 0 and a message safe to show in the UI.

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export const API_URL = RAW_BASE_URL.replace(/\/+$/, "");

const TOKEN_KEY = "innova_token";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.auth) {
    const token = getToken();
    if (!token) {
      throw new ApiError(401, "Sesión no iniciada. Ingresa nuevamente.");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(
      0,
      `No se pudo conectar con el servidor (${API_URL}). Revisa que el backend esté en ejecución y acepte este origen.`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: { error?: unknown } | null = null;
  try {
    payload = (await response.json()) as { error?: unknown };
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload.error === "string" && payload.error.length > 0
        ? payload.error
        : `Error ${response.status} del servidor.`;
    throw new ApiError(response.status, message);
  }

  return payload as T;
}

// ---------------------------------------------------------------------------
// Shapes (mirror the backend contract; no invented fields)
// ---------------------------------------------------------------------------

export type UserRole = "user" | "admin";

export type User = {
  id: number;
  username: string;
  display_name: string;
  role: UserRole;
  is_admin: boolean;
  active: boolean;
};

export type AuthResponse = {
  token: string;
  token_type: string;
  user: User;
};

export type EmergencyState = "recibida" | "en_proceso" | "entregada";
export type EmergencyCategory =
  | "incendio"
  | "terremoto"
  | "inundacion"
  | "temporal"
  | "otro";
export type EmergencyHelpType =
  | "alimentos"
  | "higiene"
  | "abrigo"
  | "dinero"
  | "materiales"
  | "otro";

export type DeliveredLine = {
  item: string;
  quantity: number;
};

export type Emergency = {
  id: number;
  code: string;
  category: EmergencyCategory;
  help_type: EmergencyHelpType;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  macrosector: string | null;
  delivered: DeliveredLine[];
  state: EmergencyState;
  created_by: number;
  created_at: string;
  updated_at: string;
};

export type EmergencyView = Omit<Emergency, "id" | "created_by">;

export type StockCategory = "alimentos" | "higiene" | "abrigo" | "materiales" | "otro";
export type StockReason = "compra" | "entrega" | "ajuste" | "regularizacion";

export type StockItem = {
  id: number;
  name: string;
  unit: string;
  category: StockCategory | string;
  quantity: number;
  threshold: number;
  low_stock: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type MacrosectorRef = {
  id: string;
  name: string;
  area_km2: number;
  num_uveci: number;
  pob_total: number;
};

export type CreateEmergencyInput = {
  category: EmergencyCategory;
  help_type: EmergencyHelpType;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  state?: EmergencyState;
};

export type PatchEmergencyInput = {
  title?: string;
  category?: EmergencyCategory;
  help_type?: EmergencyHelpType;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export type CreateStockItemInput = {
  name: string;
  unit: string;
  category: StockCategory;
  quantity: number;
  threshold: number;
};

export type CreateMovementInput = {
  item_id: number;
  delta: number;
  reason: StockReason;
  note?: string;
  emergency_code?: string;
};

export type DeliveryLineInput = {
  item_id: number;
  quantity: number;
};

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export const api = {
  register(input: { username: string; display_name: string; password: string }) {
    return request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: input,
    });
  },

  login(input: { username: string; password: string }) {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: input,
    });
  },

  logout() {
    return request<void>("/api/auth/logout", { method: "POST", auth: true });
  },

  me() {
    return request<User>("/api/me", { auth: true });
  },

  listEmergencies() {
    return request<{ emergencies: Emergency[] }>("/api/admin/emergencies", {
      auth: true,
    });
  },

  createEmergency(input: CreateEmergencyInput) {
    return request<Emergency>("/api/admin/emergencies", {
      method: "POST",
      auth: true,
      body: input,
    });
  },

  patchEmergency(id: number, input: PatchEmergencyInput) {
    return request<Emergency>(`/api/admin/emergencies/${id}`, {
      method: "PATCH",
      auth: true,
      body: input,
    });
  },

  patchEmergencyState(id: number, state: EmergencyState) {
    return request<Emergency>(`/api/admin/emergencies/${id}/state`, {
      method: "PATCH",
      auth: true,
      body: { state },
    });
  },

  addDelivery(id: number, lines: DeliveryLineInput[]) {
    return request<Emergency>(`/api/admin/emergencies/${id}/deliveries`, {
      method: "POST",
      auth: true,
      body: { lines },
    });
  },

  listStockItems(lowOnly = false) {
    const query = lowOnly ? "?low_only=true" : "";
    return request<{ items: StockItem[] }>(`/api/admin/stock/items${query}`, {
      auth: true,
    });
  },

  createStockItem(input: CreateStockItemInput) {
    return request<StockItem>("/api/admin/stock/items", {
      method: "POST",
      auth: true,
      body: input,
    });
  },

  createMovement(input: CreateMovementInput) {
    return request<unknown>("/api/admin/stock/movements", {
      method: "POST",
      auth: true,
      body: input,
    });
  },

  listMacrosectores() {
    return request<{ macrosectores: MacrosectorRef[] }>("/api/macrosectores");
  },

  locateMacrosector(lat: number, lng: number) {
    return request<{ macrosector: MacrosectorRef | null }>(
      `/api/macrosectores/locate?lat=${lat}&lng=${lng}`,
    );
  },

  lookupEmergency(code: string) {
    return request<EmergencyView>(
      `/api/emergencies/lookup?code=${encodeURIComponent(code)}`,
    );
  },
};

// ---------------------------------------------------------------------------
// Presentation helpers (formatting only, no invented data)
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<EmergencyCategory, string> = {
  incendio: "Incendio",
  terremoto: "Terremoto",
  inundacion: "Inundación",
  temporal: "Temporal",
  otro: "Otro",
};

const HELP_LABELS: Record<EmergencyHelpType, string> = {
  alimentos: "Alimentos",
  higiene: "Higiene",
  abrigo: "Abrigo",
  dinero: "Dinero",
  materiales: "Materiales",
  otro: "Otro",
};

const STATE_META: Record<EmergencyState, { label: string; tone: string }> = {
  recibida: { label: "Recibida", tone: "info" },
  en_proceso: { label: "En proceso", tone: "warning" },
  entregada: { label: "Entregada", tone: "success" },
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category as EmergencyCategory] ?? category;
}

export function helpLabel(helpType: string): string {
  return HELP_LABELS[helpType as EmergencyHelpType] ?? helpType;
}

export function stateLabel(state: string): string {
  return STATE_META[state as EmergencyState]?.label ?? state;
}

export function stateTone(state: string): string {
  return STATE_META[state as EmergencyState]?.tone ?? "info";
}

/** Format "2026-11-22T17:05:00" as "22-11-2026 17:05" without timezone shifts. */
export function formatDateTime(value: string): string {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/,
  );
  if (!match) return value;
  const [, year, month, day, hour, minute] = match;
  return `${day}-${month}-${year} ${hour}:${minute}`;
}
