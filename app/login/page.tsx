import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Landmark,
} from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { LoginTerritories } from "@/components/login-territories";

export const metadata: Metadata = {
  title: "Ingresar · Ayudas y Emergencias",
  description:
    "Acceso institucional al panel de ayudas y emergencias de la Municipalidad de Temuco.",
};

export default function LoginPage() {
  return (
    <div className="login-page">
      <aside className="login-visual">
        <LoginTerritories />

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
            <div className="login-file-head">
              <span>Expediente de acceso</span>
              <span className="login-stamp">Uso interno</span>
            </div>
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
            <h2>Ingresar</h2>
            <p>Usa tu cuenta institucional para acceder al panel operativo.</p>

            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
}
