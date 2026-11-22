"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/panel");
  }

  return (
    <>
      <form className="login-form" onSubmit={handleSubmit}>
        <label className="login-field">
          <span>Correo institucional</span>
          <input
            type="email"
            name="email"
            placeholder="nombre@temuco.cl"
            autoComplete="username"
          />
        </label>

        <label className="login-field">
          <span>Contraseña</span>
          <span className="login-password">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
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

        <div className="login-row">
          <label className="login-check">
            <input type="checkbox" name="remember" />
            Recordarme
          </label>

          <button
            className="login-link"
            type="button"
            onClick={() =>
              setMessage(
                "Contacta a la unidad de soporte municipal para restablecer tu acceso.",
              )
            }
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {message && (
          <p className="login-message" role="status">
            {message}
          </p>
        )}

        <button className="login-submit" type="submit">
          Ingresar al panel
          <ArrowRight size={15} />
        </button>
      </form>

      <div className="login-divider">
        <span>o</span>
      </div>

      <Link className="login-demo" href="/panel">
        Entrar en modo demostración
      </Link>

      <div className="login-note">
        <ShieldCheck size={15} />
        <span>
          Acceso restringido a personal municipal. Los datos de casos son
          confidenciales.
        </span>
      </div>
    </>
  );
}
