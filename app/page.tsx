import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  HandCoins,
  Landmark,
  LockKeyhole,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { LandingMap } from "@/components/landing-map";

export const metadata: Metadata = {
  title: "Ayudas y Emergencias · Municipalidad de Temuco",
  description:
    "Gestión municipal de ayudas y emergencias: recepción de casos, evaluación en terreno, entrega y seguimiento territorial.",
};

const PROCESS_STEPS = [
  {
    title: "Recepción",
    description:
      "Demanda espontánea o derivación de Bomberos, Riesgos y Desastres, SENAPRED u otra institución.",
  },
  {
    title: "Evaluación",
    description:
      "Un profesional visita el territorio y evalúa la situación de la persona o familia.",
  },
  {
    title: "Entrega",
    description:
      "Bienes de bodega, ayuda monetaria o materiales de construcción, según la evaluación.",
  },
  {
    title: "Seguimiento",
    description:
      "Acta, informe social, decreto y regularización cuando corresponde.",
  },
];

const AID_TYPES = [
  {
    title: "Bienes de bodega",
    description:
      "Alimentos, pañales, colchonetas y otros bienes disponibles. Respuesta rápida desde bodega.",
    metaLabel: "Tiempo de respuesta",
    metaValue: "Rápido",
    icon: Package,
    tone: "landing-aid-card--goods",
  },
  {
    title: "Ayuda monetaria",
    description:
      "Requiere completar el trámite administrativo y la autorización antes del pago.",
    metaLabel: "Plazo referencial",
    metaValue: "Un mes o más",
    icon: HandCoins,
    tone: "landing-aid-card--money",
  },
  {
    title: "Materiales de construcción",
    description:
      "Incluye visita, cuantificación de materiales y coordinación de transporte.",
    metaLabel: "Plazo referencial",
    metaValue: "Uno o dos meses",
    icon: Truck,
    tone: "landing-aid-card--materials",
  },
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
            <a href="#proceso">Cómo funciona</a>
            <a href="#ayudas">Tipos de ayuda</a>
            <a href="#transparencia">Transparencia</a>
          </nav>

          <div className="landing-header-actions">
            <Link className="landing-login-link" href="/login">
              Acceso municipal
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-inner">
            <div className="landing-hero-copy">
              <span className="landing-kicker">
                <span className="live-dot" />
                Municipalidad de Temuco · Ayudas y Emergencias
              </span>

              <h1>Apoyo oportuno, coordinado con el territorio.</h1>

              <p className="landing-hero-lead">
                Un sistema interno para registrar casos, evaluar necesidades y
                coordinar ayudas y emergencias con trazabilidad documental y
                mirada territorial.
              </p>

              <div className="landing-hero-actions">
                <Link className="button button--primary button--large" href="/login">
                  Acceso municipal
                  <ArrowRight size={15} />
                </Link>
                <a className="button button--ghost button--large" href="#proceso">
                  Conocer el proceso
                </a>
              </div>

              <p className="landing-hero-note">
                <ShieldCheck size={15} />
                Información confidencial. Los reportes territoriales se trabajan
                de forma agregada.
              </p>
            </div>

            <div className="landing-hero-visual">
              <div className="hero-map-card">
                <div className="hero-map-toolbar">
                  <span className="hero-map-toolbar__status" />
                  Vista territorial
                  <span className="hero-map-toolbar__tag">MS-04</span>
                </div>

                <LandingMap />

                <div className="hero-map-panel">
                  <span className="hero-map-eyebrow">Territorio priorizado</span>
                  <div className="hero-map-title">
                    <strong>Macrosector 04</strong>
                    <span>Urbano</span>
                  </div>
                  <div className="hero-map-metrics">
                    <span>
                      <strong>12</strong>
                      casos
                    </span>
                    <span>
                      <strong>1.684</strong>
                      atenciones
                    </span>
                  </div>
                  <div className="hero-map-foot">
                    <span className="hero-map-delta">
                      <ArrowUp size={11} />
                      8,4 %
                    </span>
                    <span>vs. mes anterior</span>
                    <Link href="/login" aria-label="Ver análisis territorial">
                      Ver análisis
                      <ArrowUpRight size={12} />
                    </Link>
                  </div>
                </div>

                <div className="hero-map-legend">
                  <span>Casos activos</span>
                  <span className="hero-map-legend__scale" />
                  <span>0</span>
                  <span>12+</span>
                </div>

                <span className="hero-map-source">Vista referencial · Temuco</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-stats" aria-label="Contexto territorial">
          <div className="landing-stats-inner">
            <div className="landing-stat">
              <strong>11</strong>
              <span>macrosectores</span>
              <small>10 urbanos + 1 rural</small>
            </div>
            <div className="landing-stat">
              <strong>36</strong>
              <span>unidades vecinales</span>
              <small>32 urbanas + 4 rurales</small>
            </div>
            <div className="landing-stat">
              <strong>3</strong>
              <span>tipos de ayuda</span>
              <small>Bodega, monetaria y materiales</small>
            </div>
            <div className="landing-stat">
              <strong className="landing-stat__word">1 a 1</strong>
              <span>revisión de casos</span>
              <small>Evaluación profesional, no automática</small>
            </div>
          </div>
        </section>

        <section className="landing-section landing-process" id="proceso">
          <div className="landing-section-inner">
            <div className="landing-section-head">
              <span className="landing-section-kicker">
                <ClipboardList size={14} />
                Cómo funciona
              </span>
              <h2>Del aviso a la entrega, con revisión profesional.</h2>
              <p>
                Cada caso se evalúa de forma individual. La ayuda se define según
                la necesidad manifiesta, no por una regla automática asociada al
                tipo de evento.
              </p>
            </div>

            <div className="landing-process-grid">
              {PROCESS_STEPS.map((step, index) => (
                <article className="landing-process-step" key={step.title}>
                  <span className="landing-process-number">{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>

            <div className="landing-process-callout">
              <ShieldCheck size={16} />
              <span>
                En emergencias materiales, la entrega puede anticiparse y
                regularizarse después. El sistema mantiene esa tarea visible
                hasta completar la documentación.
              </span>
            </div>
          </div>
        </section>

        <section className="landing-section landing-aids" id="ayudas">
          <div className="landing-section-inner">
            <div className="landing-section-head">
              <span className="landing-section-kicker">
                <HandCoins size={14} />
                Tipos de ayuda
              </span>
              <h2>Tres formas de ayudar, con tiempos distintos.</h2>
              <p>
                La ayuda no se asigna automáticamente por el tipo de evento. El
                equipo profesional define qué corresponde y cuándo.
              </p>
            </div>

            <div className="landing-aid-grid">
              {AID_TYPES.map((aid) => {
                const Icon = aid.icon;

                return (
                  <article
                    className={`landing-aid-card ${aid.tone}`}
                    key={aid.title}
                  >
                    <span className="landing-aid-icon">
                      <Icon size={18} />
                    </span>
                    <h3>{aid.title}</h3>
                    <p>{aid.description}</p>
                    <div className="landing-aid-meta">
                      <span>{aid.metaLabel}</span>
                      <strong>{aid.metaValue}</strong>
                    </div>
                  </article>
                );
              })}
            </div>

            <p className="landing-aid-note">
              Los plazos son referenciales y dependen de la evaluación y de los
              trámites.
            </p>
          </div>
        </section>

        <section className="landing-transparency" id="transparencia">
          <div className="landing-transparency-inner">
            <div className="landing-transparency-copy">
              <span className="landing-section-kicker landing-section-kicker--light">
                <ShieldCheck size={14} />
                Transparencia y confidencialidad
              </span>
              <h2>Decisiones informadas. Datos protegidos.</h2>
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
                <MapPin size={15} />
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

        <section className="landing-cta">
          <div className="landing-cta-inner">
            <div className="landing-cta-copy">
              <span className="landing-section-kicker">
                <Users size={14} />
                Para equipos municipales
              </span>
              <h2>¿Trabajas en el municipio?</h2>
              <p>
                Accede al panel operativo para gestionar casos, ayudas,
                documentos y reportes territoriales.
              </p>
            </div>

            <div className="landing-cta-action">
              <Link className="button button--primary button--large" href="/login">
                <LockKeyhole size={15} />
                Ingresar con cuenta institucional
              </Link>
              <span>Acceso restringido · Datos protegidos</span>
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
            <a href="#proceso">Cómo funciona</a>
            <a href="#ayudas">Tipos de ayuda</a>
            <Link href="/login">Acceso municipal</Link>
          </nav>

          <span className="landing-footer-note">
            Sistema interno · Vista referencial
          </span>
        </div>
      </footer>
    </div>
  );
}
