import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { LandingHeroMap } from "@/components/landing-hero-map";

export const metadata: Metadata = {
  title: "Ayudas y Emergencias · Municipalidad de Temuco",
  description:
    "Gestión municipal de ayudas y emergencias: recepción de casos, evaluación en terreno, entrega y seguimiento territorial.",
};

const AID_TYPES = [
  {
    title: "Bienes de bodega",
    description:
      "Alimentos, pañales, colchonetas y otros bienes disponibles. Respuesta rápida desde bodega.",
    metaLabel: "Plazo referencial",
    metaValue: "Rápido",
  },
  {
    title: "Ayuda monetaria",
    description:
      "Requiere completar el trámite administrativo y la autorización antes del pago.",
    metaLabel: "Plazo referencial",
    metaValue: "Un mes o más",
  },
  {
    title: "Materiales de construcción",
    description:
      "Incluye visita, cuantificación de materiales y coordinación de transporte.",
    metaLabel: "Plazo referencial",
    metaValue: "Uno o dos meses",
  },
];

const TERRITORY_LEDGER = [
  { value: "10", label: "macrosectores oficiales, más sector rural" },
  { value: "36", label: "unidades vecinales, 32 urbanas y 4 rurales" },
  { value: "3", label: "tipos de ayuda: bodega, monetaria y materiales" },
  { value: "1 a 1", label: "revisión de casos, evaluación profesional" },
];

export default function LandingPage() {
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
            <a href="#ayudas">Tipos de ayuda</a>
            <a href="#transparencia">Transparencia</a>
          </nav>

          <div className="landing-header-actions">
            <Link className="landing-login-link" href="/login">
              Acceso municipal
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-map-frame">
            <LandingHeroMap />
            <div className="landing-hero-inner">
              <div className="landing-hero-sheet">
                <h1>Apoyo oportuno, coordinado con el territorio.</h1>

                <p className="landing-hero-lead">
                  Un sistema interno para registrar casos, evaluar necesidades
                  y coordinar ayudas y emergencias con trazabilidad
                  documental y mirada territorial.
                </p>

                <div className="landing-hero-actions">
                  <Link
                    className="button button--primary button--large"
                    href="/login"
                  >
                    Acceso municipal
                    <ArrowRight size={15} />
                  </Link>
                  <a
                    className="button button--ghost button--large"
                    href="#ayudas"
                  >
                    Conocer el proceso
                  </a>
                </div>

                <p className="landing-hero-note">
                  <ShieldCheck size={15} />
                  Información confidencial. Los reportes territoriales se
                  trabajan de forma agregada.
                </p>
              </div>
            </div>
          </div>

          <div className="landing-ledger">
            <div className="landing-ledger-inner">
              {TERRITORY_LEDGER.map((item) => (
                <span className="landing-ledger-item" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-aids" id="ayudas">
          <div className="landing-section-inner">
            <div className="landing-section-head">
              <h2>Tres formas de ayudar, con tiempos distintos.</h2>
              <p>
                La ayuda no se asigna automáticamente por el tipo de evento. El
                equipo profesional define qué corresponde y cuándo.
              </p>
            </div>

            <ol className="landing-timeline">
              {AID_TYPES.map((aid) => (
                <li className="landing-timeline-step" key={aid.title}>
                  <div className="landing-timeline-time">
                    <strong>{aid.metaValue}</strong>
                    <span>{aid.metaLabel}</span>
                  </div>
                  <h3>{aid.title}</h3>
                  <p>{aid.description}</p>
                </li>
              ))}
            </ol>

            <p className="landing-aid-note">
              Los plazos son referenciales y dependen de la evaluación y de los
              trámites.
            </p>
          </div>
        </section>

        <section className="landing-transparency" id="transparencia">
          <div className="landing-transparency-inner">
            <div className="landing-transparency-copy">
              <h2>El territorio se comparte. Las personas se protegen.</h2>
              <p>
                La información territorial se trabaja de forma agregada. Los
                antecedentes individuales y de las familias son confidenciales.
              </p>

              <ul className="landing-transparency-list">
                <li>
                  <CheckCircle2 size={16} />
                  Reportes por macrosector, no por familia.
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  Sin nombres ni RUT en reportes territoriales.
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  Acceso al panel restringido a personal municipal.
                </li>
              </ul>
            </div>

            <div className="landing-transparency-card">
              <div className="landing-transparency-card__head">
                <span>Criterios de trabajo</span>
              </div>

              <div className="landing-transparency-row">
                <span>Personas</span>
                <strong>1.240</strong>
              </div>
              <div className="landing-transparency-row">
                <span>Atenciones</span>
                <strong>1.684</strong>
              </div>
              <div className="landing-transparency-row">
                <span>Cobertura territorial</span>
                <strong>Validada</strong>
              </div>
              <div className="landing-transparency-row">
                <span>Datos personales</span>
                <strong>Protegidos</strong>
              </div>

              <p>
                Una persona puede recibir más de una atención. Los reportes
                distinguen ambas medidas.
              </p>
            </div>
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
            <a href="#ayudas">Tipos de ayuda</a>
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
