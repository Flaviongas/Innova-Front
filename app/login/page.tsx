import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Landmark,
  LockKeyhole,
} from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { MACROSECTORS } from "@/lib/data";

export const metadata: Metadata = {
  title: "Ingresar · Ayudas y Emergencias",
  description:
    "Acceso institucional al panel de ayudas y emergencias de la Municipalidad de Temuco.",
};

export default function LoginPage() {
  return (
    <div className="login-page">
      <aside className="login-visual">
        <svg
          className="login-map"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {MACROSECTORS.map((sector) => (
            <path
              key={sector.id}
              d={sector.path}
              className={
                sector.id === "MS-04"
                  ? "login-map__territory login-map__territory--active"
                  : "login-map__territory"
              }
            />
          ))}
          <path
            className="login-map__river"
            d="M -20 710 C 160 680, 280 750, 460 720 S 720 640, 940 690 S 1130 760, 1220 740"
          />
          <circle cx="760" cy="340" r="20" className="login-map__marker" />
          <circle cx="410" cy="320" r="14" className="login-map__marker" />
          <circle cx="850" cy="680" r="14" className="login-map__marker" />
        </svg>

        <div className="login-visual-content">
          <Link className="login-brand" href="/" aria-label="Volver al inicio">
            <span className="brand-mark">
              <Landmark size={18} />
            </span>
            <span className="brand-copy">
              <strong>Municipalidad de Temuco</strong>
              <span>Ayudas y Emergencias</span>
            </span>
          </Link>

          <div className="login-visual-main">
            <span className="login-kicker">
              <span className="live-dot" />
              Acceso institucional
            </span>
            <h1>Panel de Ayudas y Emergencias.</h1>
            <p>
              Gestiona casos, entregas y reportes territoriales con trazabilidad
              y confidencialidad.
            </p>

            <ul className="login-features">
              <li>
                <CheckCircle2 size={16} />
                Casos y evaluaciones
              </li>
              <li>
                <CheckCircle2 size={16} />
                Bodega y entregas
              </li>
              <li>
                <CheckCircle2 size={16} />
                Documentos y reportes
              </li>
            </ul>
          </div>

          <div className="login-visual-foot">
            <span>Municipalidad de Temuco</span>
            <span>Uso interno · Datos protegidos</span>
          </div>
        </div>
      </aside>

      <main className="login-panel">
        <div className="login-panel-top">
          <Link className="login-back" href="/">
            <ArrowLeft size={14} />
            Volver al inicio
          </Link>
        </div>

        <div className="login-card-wrap">
          <div className="login-card">
            <span className="login-pill">
              <LockKeyhole size={12} />
              Acceso institucional
            </span>
            <h2>Ingresar</h2>
            <p>Usa tu cuenta institucional para acceder al panel operativo.</p>

            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
}
