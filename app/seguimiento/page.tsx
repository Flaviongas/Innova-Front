import type { Metadata } from "next";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { EmergencyLookup } from "@/components/emergency-lookup";

export const metadata: Metadata = {
  title: "Seguimiento · Ayudas y Emergencias",
  description:
    "Consulta el estado de una ayuda municipal con tu código de seguimiento, sin crear una cuenta.",
};

export default function SeguimientoPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link className="landing-brand" href="/" aria-label="Inicio">
            <span className="brand-mark">
              <Landmark size={18} />
            </span>
            <span className="brand-copy">
              <strong>Municipalidad de Temuco</strong>
              <span>Ayudas y Emergencias</span>
            </span>
          </Link>

          <nav className="landing-nav" aria-label="Secciones">
            <a href="/#ayudas">Tipos de ayuda</a>
            <a href="/#transparencia">Transparencia</a>
            <Link href="/seguimiento" aria-current="page">
              Seguimiento
            </Link>
          </nav>

          <div className="landing-header-actions">
            <Link className="landing-login-link" href="/login">
              Acceso municipal
            </Link>
          </div>
        </div>
      </header>

      <main className="seguimiento-main">
        <section className="landing-section landing-lookup-section">
          <div className="landing-section-inner">
            <div className="landing-section-head">
              <h2>Consulta el estado con tu código.</h2>
              <p>
                Cada ayuda genera un código de seguimiento. Ingrésalo para ver
                el estado del evento, sin crear una cuenta.
              </p>
            </div>

            <EmergencyLookup />
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <Link className="landing-footer-brand" href="/">
            <span className="brand-mark">
              <Landmark size={16} />
            </span>
            <span>
              <strong>Municipalidad de Temuco</strong>
              <small>Ayudas y Emergencias</small>
            </span>
          </Link>

          <nav className="landing-footer-links" aria-label="Enlaces del pie">
            <a href="/#ayudas">Tipos de ayuda</a>
            <Link href="/seguimiento">Seguimiento</Link>
            <Link href="/login">Acceso municipal</Link>
          </nav>

          <span className="landing-footer-note">
            Sistema interno, vista referencial
          </span>
        </div>
      </footer>
    </div>
  );
}
