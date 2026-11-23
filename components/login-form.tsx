"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { ApiError, api, setToken } from "@/lib/api";

type Mode = "login" | "register";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const data = new FormData(event.currentTarget);
    const username = String(data.get("username") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const displayName = String(data.get("display_name") ?? "").trim();

    if (username.length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (mode === "register" && displayName.length < 2) {
      setError("El nombre a mostrar debe tener al menos 2 caracteres.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response =
        mode === "login"
          ? await api.login({ username, password })
          : await api.register({ username, display_name: displayName, password });
      setToken(response.token);
      router.push("/panel");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado. Intenta de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="login-mode" role="tablist" aria-label="Modo de acceso">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={mode === "login" ? "is-active" : ""}
          onClick={() => switchMode("login")}
        >
          Ingresar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "register"}
          className={mode === "register" ? "is-active" : ""}
          onClick={() => switchMode("register")}
        >
          Crear cuenta
        </button>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="login-field">
          <span>Nombre de usuario</span>
          <input
            type="text"
            name="username"
            placeholder="jperez"
            autoComplete="username"
            autoFocus
          />
        </label>

        {mode === "register" && (
          <label className="login-field">
            <span>Nombre a mostrar</span>
            <input
              type="text"
              name="display_name"
              placeholder="Juan Pérez"
              autoComplete="name"
            />
          </label>
        )}

        <label className="login-field">
          <span>Contraseña</span>
          <span className="login-password">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder={
                mode === "register"
                  ? "Mínimo 8 caracteres"
                  : "Ingresa tu contraseña"
              }
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
            />
            <button
              className="login-password-toggle"
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </span>
        </label>

        {error && (
          <p className="login-message login-message--error" role="alert">
            {error}
          </p>
        )}

        <button className="login-submit" type="submit" disabled={busy}>
          {busy
            ? "Conectando…"
            : mode === "login"
              ? "Ingresar al panel"
              : "Crear cuenta e ingresar"}
          {!busy && <ArrowRight size={15} />}
        </button>
      </form>
    </>
  );
}
