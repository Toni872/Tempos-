import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { prefetchRoute } from '@/lib/routePrefetch';
import '../styles/landing.css';

// ─── HOOKS ────────────────────────────────────────────────────────────────────

function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useCounter(target, duration = 2200, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, active]);
  return val;
}

// ─── ICONS ───────────────────────────────────────────────────────────────────

const Icon = {
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Mobile: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  ),
  Chart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
      <path d="M22 12A10 10 0 0 0 12 2v10z"/>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Legal: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Wifi: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
      <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  ),
  Zap: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Edit: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Bell: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Report: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
};

// ─── HERO SLIDER COMPONENT ───────────────────────────────────────────────────

function HeroImageSlider() {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const onPointerDown = (event) => {
    event.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: rotation.x,
      baseY: rotation.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!isDragging || !dragRef.current || dragRef.current.id !== event.pointerId) return;
    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    const nextY = clamp(dragRef.current.baseY + deltaX * 0.22, -44, 44);
    const nextX = clamp(dragRef.current.baseX - deltaY * 0.2, -30, 30);
    setRotation({ x: nextX, y: nextY });
  };

  const onPointerUp = () => {
    setIsDragging(false);
    dragRef.current = null;
  };

  const onDoubleClick = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div className="tp-phone3d-stage" aria-label="Modelo 3D de smartphone premium con interacción">
      <div
        className="tp-phone3d-wrap"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <div className="tp-phone3d-shadow" />

        <div className={`tp-phone3d-idle ${isDragging ? 'tp-pause' : ''}`}>
          <div
            className={`tp-phone3d-device ${isDragging ? 'tp-dragging' : ''}`}
            style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
          >
          <div className="tp-phone3d-face tp-phone3d-back">
            <div className="tp-phone3d-camera-bump">
              <div className="tp-phone3d-lens l1" />
              <div className="tp-phone3d-lens l2" />
              <div className="tp-phone3d-lens l3" />
              <div className="tp-phone3d-flash" />
            </div>
            <div className="tp-phone3d-logo">iPhone</div>
          </div>

          <div className="tp-phone3d-face tp-phone3d-front">
            <div className="tp-phone3d-screen-wrap" aria-hidden="true">
              <div className="tp-phone3d-island" />
              <div className="tp-phone3d-screen" />
              <div className="tp-phone3d-glass" />
            </div>
          </div>

          <div className="tp-phone3d-button tp-phone3d-btn-action" />
          <div className="tp-phone3d-button tp-phone3d-btn-vol-up" />
          <div className="tp-phone3d-button tp-phone3d-btn-vol-down" />
          <div className="tp-phone3d-button tp-phone3d-btn-power" />
          <div className="tp-phone3d-button tp-phone3d-btn-camera" />

          <div className="tp-phone3d-port" />
          <div className="tp-phone3d-grille left" />
          <div className="tp-phone3d-grille right" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [ctaVariant, setCtaVariant] = useState('A');

  const navItems = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'producto', label: 'Producto' },
    { id: 'proceso', label: 'Proceso' },
    { id: 'precios', label: 'Precios' },
    { id: 'faqs', label: 'FAQs' },
  ];

  const withViewTransition = (action) => {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      document.startViewTransition(action);
      return;
    }
    action();
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      withViewTransition(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    setNavOpen(false);
  };

  const navigateWithTransition = (path) => {
    withViewTransition(() => navigate(path));
  };

  const goToTrial = () => {
    navigateWithTransition('/trial');
  };

  const bindPrefetch = (path) => ({
    onMouseEnter: () => prefetchRoute(path),
    onFocus: () => prefetchRoute(path),
    onTouchStart: () => prefetchRoute(path),
  });

  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [navOpen]);

  useEffect(() => {
    try {
      const key = 'tp.cta.variant';
      const existing = sessionStorage.getItem(key);
      const variant = existing === 'A' || existing === 'B'
        ? existing
        : (Math.random() > 0.5 ? 'A' : 'B');
      sessionStorage.setItem(key, variant);
      setCtaVariant(variant);
    }
    catch {
      setCtaVariant('A');
    }
  }, []);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);

    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length) {
          setActiveSection(visible[0].target.id);
        }
      },
      { root: null, rootMargin: '-36% 0px -48% 0px', threshold: [0.2, 0.4, 0.65] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const next = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, next)));
      setIsScrolled(window.scrollY > 18);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const ctaCopy = ctaVariant === 'B'
    ? {
      navTrial: 'Solicitar demo',
      heroPrimary: 'Ver demo en vivo',
      heroSecondary: 'Comparar planes',
      midPrimary: 'Reservar demo',
      pricingPrimary: 'Solicitar asesoría',
      finalPrimary: 'Crear cuenta gratis',
    }
    : {
      navTrial: 'Prueba gratis',
      heroPrimary: 'Solicitar prueba 14 días',
      heroSecondary: 'Ver planes',
      midPrimary: 'Solicitar prueba',
      pricingPrimary: 'Empezar ahora',
      finalPrimary: 'Empezar ahora',
    };

  // Reveal refs
  const [heroRef, heroVis]         = useReveal(0.05);
  const [benefitsRef, benefitsVis] = useReveal(0.1);
  const [showcaseRef, showcaseVis] = useReveal(0.08);
  const [stepsRef, stepsVis]       = useReveal(0.1);
  const [pricingRef, pricingVis]   = useReveal(0.08);

  const benefits = [
    { Icon: Icon.Shield, title: 'Cumplimiento legal real', desc: 'Registro de jornada conforme al marco legal en España. Historial trazable y documentación lista para una inspección.' },
    { Icon: Icon.Clock,  title: 'Control de horas y extras',  desc: 'Cálculo automático de horas ordinarias, extra y descansos para evitar errores manuales y discusiones internas.' },
    { Icon: Icon.Mobile, title: 'Fichaje flexible', desc: 'Tus empleados fichan por móvil, web, QR o punto de oficina según su puesto y forma de trabajo.' },
    { Icon: Icon.Chart,  title: 'Informes accionables',   desc: 'Exporta datos en PDF y Excel para RRHH, gestoría y dirección con visibilidad clara de jornada y ausencias.' },
  ];

  const modules = [
    {
      title: 'Intranet de empresa',
      desc: 'Alta de empleados, configuración de horarios, validación de registros y control de incidencias desde un panel único.',
      cta: 'Ideal para responsables de RRHH y gerencia.',
    },
    {
      title: 'App para empleados',
      desc: 'Fichaje inmediato, consulta de jornada, solicitud de vacaciones y comunicación de ausencias desde el móvil.',
      cta: 'Menos fricción para el equipo, más datos fiables para la empresa.',
    },
    {
      title: 'Punto de fichaje en oficina',
      desc: 'Activa un punto fijo en tablet o móvil para equipos presenciales. Registro rápido, visual y sin complejidad técnica.',
      cta: 'Perfecto para centros con entrada común o turnos rotativos.',
    },
  ];

  const targetProfiles = [
    {
      title: 'Autónomos',
      desc: 'Registra tu jornada sin papeleo y mantén toda la documentación preparada para cualquier requerimiento legal.',
    },
    {
      title: 'Pymes',
      desc: 'Coordina equipos con distintos turnos, vacaciones y ausencias desde una única plataforma fácil de mantener.',
    },
    {
      title: 'Equipos en movilidad',
      desc: 'Valida fichajes fuera de oficina con geolocalización y reglas por ubicación para mantener trazabilidad.',
    },
  ];

  const showcase = [
    {
      img: '/landing_workstation.jpg',
      label: 'Panel de gestión',
      title: 'Control de jornada desde el panel de empresa',
      desc: 'El responsable de RRHH o gerencia tiene visión completa de fichajes, ausencias e incidencias desde un único panel web, sin necesidad de exportar datos manualmente.',
      alt: 'Responsable de equipo gestionando jornadas con Tempos en su ordenador',
    },
    {
      img: '/landing_analytics.jpg',
      label: 'Informes y analítica',
      title: 'Datos de jornada listos para gestoría e inspección',
      desc: 'Genera informes detallados de horas, extras y ausencias exportables en PDF y Excel. Documentación preparada en segundos para auditorías o requerimientos de Inspección de Trabajo.',
      alt: 'Vista de informes y analítica de control horario en Tempos',
    },
    {
      img: '/landing_team_collab.jpg',
      label: 'Coordinación de equipo',
      title: 'Organiza turnos, vacaciones y permisos sin fricciones',
      desc: 'Los empleados solicitan vacaciones o permisos desde la app y el responsable aprueba o gestiona la incidencia al instante. Menos correos, menos errores, más control.',
      alt: 'Equipo colaborando con gestión de turnos y vacaciones en Tempos',
    },
    {
      img: '/landing_legal_desk.jpg',
      label: 'Cumplimiento legal',
      title: 'Documenta la jornada con trazabilidad real',
      desc: 'Cada fichaje queda registrado con sello de tiempo y contexto verificable. Historial auditable para cumplir la obligación legal de registro horario en España.',
      alt: 'Documentación de cumplimiento legal de control horario para inspección',
    },
  ];

  const faqs = [
    {
      q: '¿Tempos cumple la normativa de registro horario en España?',
      a: 'Sí. Tempos está diseñado para registrar jornada diaria, conservar histórico y facilitar documentación verificable para auditorías e inspecciones.',
    },
    {
      q: '¿Cómo fichan los empleados?',
      a: 'Pueden fichar desde app móvil, navegador, código QR o punto fijo en oficina. La empresa decide qué método habilitar por perfil o sede.',
    },
    {
      q: '¿Se pueden gestionar vacaciones, permisos y bajas?',
      a: 'Sí. El equipo puede enviar solicitudes y RRHH validarlas desde la intranet, manteniendo trazabilidad y calendario actualizado.',
    },
    {
      q: '¿Qué pasa si un empleado olvida fichar?',
      a: 'El sistema permite gestionar incidencias y correcciones con control de cambios, evitando pérdidas de información y mejorando la calidad del dato.',
    },
    {
      q: '¿Puedo descargar informes para gestoría o inspección?',
      a: 'Sí. Puedes exportar informes en PDF y Excel con el detalle de jornada, ausencias y horas para compartir con gestoría o auditoría.',
    },
    {
      q: '¿Tiene permanencia o costes de alta?',
      a: 'No. Puedes empezar con prueba y cancelar cuando quieras, sin compromisos de permanencia ni costes de implantación complejos.',
    },
  ];

  const proofItems = [
    { value: '14 días', label: 'de prueba para validar la operativa antes de implantarla' },
    { value: '0€', label: 'de cuota de alta para empezar sin costes iniciales' },
    { value: '1 panel', label: 'para controlar jornada, ausencias e incidencias del equipo' },
  ];

  const useCases = [
    {
      name: 'Empresas con personal administrativo y operativo',
      quote: 'Centraliza fichajes, ausencias e incidencias en un único entorno y reduce la revisión manual de registros.',
    },
    {
      name: 'Pymes con turnos o varios centros',
      quote: 'Combina fichaje en oficina, móvil o punto fijo según cada equipo, con control unificado desde la intranet.',
    },
    {
      name: 'Asesorías y responsables de RRHH',
      quote: 'Accede a información ordenada y exportable para revisar jornada, horas extra y documentación ante inspecciones.',
    },
  ];

  const compareRows = [
    ['Registro en papel o Excel', 'Procesos manuales, errores frecuentes y poca trazabilidad'],
    ['Tempos', 'Registro digital centralizado, histórico ordenado y control inmediato del equipo'],
  ];

  const steps = [
    { n: '01', title: 'Crea tu cuenta', desc: 'Registro en 30 segundos. Sin tarjeta de crédito. Configura tu empresa o perfil de autónomo de forma inmediata.' },
    { n: '02', title: 'Invita a tu equipo', desc: 'Añade empleados por correo electrónico. Cada usuario accede con sus propias credenciales de forma segura.' },
    { n: '03', title: 'Control desde el primer minuto', desc: 'Visualiza fichajes, horas y alertas en tiempo real. Exporta cuando lo necesites, sin complicaciones.' },
  ];

  return (
    <div className="tp-root">

      <header className={`tp-nav ${isScrolled ? 'tp-compact' : ''}`} role="banner" aria-label="Navegación principal">
        <div className="tp-brand-wrap">
          <button
            onClick={() => scrollToSection('inicio')}
            className="tp-brand"
            aria-label="Ir al inicio"
          >
            <span className="tp-brand-mark" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--mg2)" strokeWidth="2.5" opacity="0.2"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--mg)" strokeWidth="2.8"/>
                <circle cx="50" cy="12" r="2.2" fill="var(--mg)"/>
                <circle cx="88" cy="50" r="2.2" fill="var(--mg)"/>
                <circle cx="50" cy="88" r="2.2" fill="var(--mg)"/>
                <circle cx="12" cy="50" r="2.2" fill="var(--mg)"/>
                <line x1="50" y1="50" x2="50" y2="28" stroke="var(--mg)" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
                <line x1="50" y1="50" x2="68" y2="44" stroke="var(--mg2)" strokeWidth="2" strokeLinecap="round" opacity="0.78"/>
                <circle cx="50" cy="50" r="3.5" fill="var(--mg)"/>
              </svg>
            </span>
            <span className="tp-brand-copy">
              <span className="tp-brand-name">Tem<span>pos</span></span>
              <span className="tp-brand-tag">Control horario legal</span>
            </span>
          </button>

          <span className="tp-brand-proof">Cumplimiento laboral verificado</span>
        </div>

        <nav className="tp-nav-links" aria-label="Secciones">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`tp-nav-link ${activeSection === item.id ? 'tp-active' : ''}`}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="tp-nav-actions">
          <Link to="/login" className="tp-btn tp-btn-ghost" {...bindPrefetch('/login')}>Entrar</Link>
          <Link to="/trial" className="tp-btn tp-btn-primary" {...bindPrefetch('/trial')}>{ctaCopy.navTrial}</Link>
        </div>

        <button className="tp-nav-ham" onClick={() => setNavOpen(true)} aria-label="Abrir menú móvil">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="tp-scroll-meter" aria-hidden="true">
          <span style={{ width: `${scrollProgress}%` }} />
        </div>
      </header>

      <div className={`tp-mob-overlay ${navOpen ? 'tp-mob-open' : ''}`} aria-hidden={!navOpen}>
        <button className="tp-mob-nav-close" onClick={() => setNavOpen(false)} aria-label="Cerrar menú móvil">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        </button>

        {navItems.map((item) => (
          <button
            key={item.id}
            className={`tp-mob-nav-link ${activeSection === item.id ? 'tp-active' : ''}`}
            onClick={() => scrollToSection(item.id)}
          >
            {item.label}
          </button>
        ))}

        <div className="tp-mob-nav-actions">
          <Link to="/login" className="tp-btn tp-btn-ghost" onClick={() => setNavOpen(false)} {...bindPrefetch('/login')}>Entrar</Link>
          <Link to="/trial" className="tp-btn tp-btn-primary" onClick={() => setNavOpen(false)} {...bindPrefetch('/trial')}>{ctaCopy.navTrial}</Link>
        </div>
      </div>

      <main id="contenido-principal">

      {/* ── Hero ── */}
      <section ref={heroRef} id="inicio" aria-label="Software de control horario legal para empresas y autónomos en España" style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center',
        paddingTop: 84, position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient orbs */}
        <div className="tp-orb" style={{ width: 700, height: 700, top: '-15%', left: '-18%', background: 'radial-gradient(circle, rgba(37,99,235,0.11) 0%, transparent 70%)' }}/>
        <div className="tp-orb" style={{ width: 500, height: 500, bottom: '-10%', right: '-12%', background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)' }}/>

        <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(32px,4vw,60px) clamp(18px,4vw,48px)', width: '100%', position: 'relative', zIndex: 1 }}>
          <div className="tp-hero-wrap">

            {/* Left copy */}
            <div className={`tp-reveal-l ${heroVis ? 'tp-visible' : ''}`} style={{ flex: 1, maxWidth: 560 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, borderRadius: 100, border: '1px solid var(--border-mg)', background: 'rgba(37,99,235,0.06)', padding: '5px 16px', marginBottom: 36 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--mg)', boxShadow: '0 0 10px var(--mg)' }}/>
                <span style={{ fontSize: 11.5, color: 'var(--mg)', letterSpacing: 0.4, fontWeight: 600 }}>Normativa 2026 · Datos alojados en España</span>
              </div>

              <h1 style={{ fontFamily: 'var(--ff-head)', fontSize: 'clamp(34px,5.5vw,68px)', fontWeight: 600, lineHeight: 1.05, letterSpacing: 0.5, marginBottom: 26, color: 'var(--t0)' }}>
                Controla las horas <i style={{ fontWeight: 400, color: 'rgba(255,255,255,0.7)' }}>de tu equipo.</i>
                <br />
                <span className="tp-shimmer">Cumple la ley. Sin papeleo.</span>
              </h1>

              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 17, color: 'var(--t1)', lineHeight: 1.65, maxWidth: 480, fontWeight: 300 }}>
                  Software de control horario para empresas, autónomos y pymes: fichaje por móvil o QR, gestión de vacaciones y bajas, e informes listos para Inspección de Trabajo.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 44 }}>
                <button onClick={() => navigateWithTransition('/trial')} className="tp-btn tp-btn-primary" style={{ borderRadius: 13, padding: '15px 30px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 9 }}>
                  {ctaCopy.heroPrimary} <Icon.ArrowRight />
                </button>
                <button onClick={() => scrollToSection('precios')} className="tp-btn tp-btn-ghost" style={{ borderRadius: 13, padding: '15px 28px', fontSize: 15 }}>
                  {ctaCopy.heroSecondary}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                {['Sin tarjeta de crédito', 'Cancelación inmediata', 'Soporte en español'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--t2)' }}>
                    <span style={{ color: 'var(--mg)' }}><Icon.Check /></span>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Slider */}
            <div className={`tp-reveal-r tp-hero-right ${heroVis ? 'tp-visible' : ''}`} style={{ flexShrink: 0 }}>
              <HeroImageSlider />
            </div>

          </div>
        </div>
      </section>

      {/* (Stats strip removed for MVP) */}

      {/* ── Feature Grid ── */}
      <section className="tp-section-surface" aria-label="Características principales de Tempos" style={{ padding: '40px 48px 100px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <h2 className="tp-visually-hidden">Características principales de Tempos</h2>
          <div className="tp-grid-5">
            {[
              { ic: Icon.Zap, t: 'Automatización', d: 'Configura horarios y avisos para reducir olvidos y tareas repetitivas.' },
              { ic: Icon.MapPin, t: 'Geolocalización', d: 'Valida fichajes remotos o en movilidad con contexto de ubicación.' },
              { ic: Icon.Edit, t: 'Gestión de incidencias', d: 'Corrige olvidos y revisa cambios con trazabilidad.' },
              { ic: Icon.Bell, t: 'Comunicación', d: 'Gestiona ausencias, solicitudes y avisos desde un único canal.' },
              { ic: Icon.Report, t: 'Informes', d: 'Exporta información clara para dirección, gestoría o inspección.' },
            ].map(f => (
              <div key={f.t} className="tp-card" style={{ padding: 24, borderRadius: 20, textAlign: 'center' }}>
                <div style={{ color: 'var(--mg)', marginBottom: 16, display: 'flex', justifyContent: 'center' }}><f.ic /></div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t0)', marginBottom: 8 }}>{f.t}</h3>
                <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5 }}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="tp-section-surface" id="producto" ref={benefitsRef} aria-label="Beneficios del software de control horario Tempos" style={{ padding: 'clamp(60px,8vw,110px) clamp(18px,4vw,48px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div className={`tp-reveal ${benefitsVis ? 'tp-visible' : ''}`} style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="tp-label">Control y cumplimiento</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 48, fontWeight: 600, letterSpacing: 0.5, color: 'var(--t0)', marginBottom: 14 }}>
              Un sistema de registro horario<br/>útil para la gestión diaria.
            </h2>
            <p style={{ fontSize: 15.5, color: 'var(--t1)', maxWidth: 500, margin: '0 auto', lineHeight: 1.65, fontWeight: 300 }}>
              Tempos cubre el registro de jornada laboral exigido por ley y ayuda a ordenar la operativa diaria de equipos, turnos y ausencias.
            </p>
          </div>

          <div className="tp-grid-4">
            {benefits.map(({ Icon: Ic, title, desc }, i) => (
              <div
                key={title}
                className={`tp-card tp-reveal ${benefitsVis ? 'tp-visible' : ''} tp-d${i}`}
                style={{ borderRadius: 20, padding: '32px 28px' }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: 13, marginBottom: 22,
                  background: 'rgba(37,99,235,0.09)',
                  border: '1px solid rgba(37,99,235,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--mg)',
                  transition: 'background 0.3s ease',
                }}>
                  <Ic />
                </div>
                <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: 15.5, fontWeight: 700, color: 'var(--t0)', marginBottom: 10, letterSpacing: -0.3, lineHeight: 1.3 }}>{title}</h3>
                <p style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.65, fontWeight: 300 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Showcase ── */}
      <section className="tp-section-surface" ref={showcaseRef} aria-label="Imágenes del software de control horario Tempos en uso" style={{ padding: '0 clamp(18px,4vw,48px) clamp(56px,7vw,96px)', position: 'relative', zIndex: 1, borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <span className="tp-label">Software en acción</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 44, fontWeight: 600, color: 'var(--t0)', marginBottom: 14, lineHeight: 1.12 }}>
              Diseñado para el trabajo real
            </h2>
            <p style={{ fontSize: 15.5, color: 'var(--t1)', maxWidth: 520, margin: '0 auto', lineHeight: 1.65, fontWeight: 300 }}>
              Desde el fichaje diario hasta los informes de fin de mes: Tempos cubre cada punto del ciclo de gestión horaria.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(52px,7vw,88px)' }}>
            {showcase.map((item, i) => (
              <div
                key={item.title}
                className={`tp-reveal ${showcaseVis ? 'tp-visible' : ''} tp-d${i}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 'clamp(28px,5vw,64px)',
                  alignItems: 'center',
                }}
              >
                {/* Image side */}
                <div
                  style={{
                    order: i % 2 === 0 ? 0 : 1,
                    borderRadius: 20, overflow: 'hidden',
                    border: '1px solid var(--border)',
                    position: 'relative', flexShrink: 0,
                  }}
                >
                  <img
                    src={item.img}
                    alt={item.alt}
                    style={{ width: '100%', height: 'clamp(220px,28vw,360px)', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.32) 0%, transparent 55%)' }} aria-hidden="true" />
                </div>
                {/* Text side */}
                <div style={{ order: i % 2 === 0 ? 1 : 0 }}>
                  <span className="tp-label" style={{ marginBottom: 16, display: 'inline-block' }}>{item.label}</span>
                  <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: 'clamp(22px,3vw,30px)', fontWeight: 600, color: 'var(--t0)', marginBottom: 16, lineHeight: 1.22, letterSpacing: -0.4 }}>{item.title}</h3>
                  <p style={{ fontSize: 15, color: 'var(--t1)', lineHeight: 1.72, fontWeight: 300 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core modules ── */}
      <section className="tp-section-surface" aria-label="Funcionalidades clave del software de control horario" style={{ padding: '0 clamp(18px,4vw,48px) clamp(56px,7vw,100px)', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 34 }}>
            <span className="tp-label">Funcionalidades clave</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 42, fontWeight: 600, color: 'var(--t0)', marginBottom: 14, lineHeight: 1.15 }}>
              Todo lo necesario para controlar la jornada
            </h2>
            <p style={{ fontSize: 15.5, color: 'var(--t1)', lineHeight: 1.7, maxWidth: 760, margin: '0 auto', fontWeight: 300 }}>
              Tempos combina software de control horario, gestión de equipo y cumplimiento legal en tres módulos conectados para que no dependas de hojas de cálculo ni procesos manuales.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {modules.map((item) => (
              <div key={item.title} className="tp-card" style={{ borderRadius: 22, padding: '30px 28px' }}>
                <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: 19, color: 'var(--t0)', marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.65, marginBottom: 16 }}>{item.desc}</p>
                <p style={{ fontSize: 12.5, color: 'var(--mg)', lineHeight: 1.5, fontWeight: 600 }}>{item.cta}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22, border: '1px solid var(--border)', borderRadius: 20, padding: '18px 20px', background: 'rgba(255,255,255,0.015)' }}>
            <p style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.7 }}>
              Además, puedes activar reglas de geolocalización, validación por IP y modo offline para adaptarte a entornos presenciales, remotos o mixtos.
            </p>
          </div>
        </div>
      </section>

      {/* ── Target profiles ── */}
      <section className="tp-section-surface" aria-label="Para quién es Tempos" style={{ padding: '0 48px 96px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 34 }}>
            <span className="tp-label">Tipos de empresa</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 40, fontWeight: 600, color: 'var(--t0)', marginBottom: 12 }}>
              Adaptado a distintas formas de trabajo
            </h2>
            <p style={{ fontSize: 15, color: 'var(--t1)', lineHeight: 1.7, maxWidth: 760, margin: '0 auto', fontWeight: 300 }}>
              Desde autónomos hasta pymes con varios turnos o centros: Tempos se adapta a la operativa real y reduce el tiempo dedicado al control de jornada.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {targetProfiles.map((item) => (
              <div key={item.title} className="tp-card" style={{ borderRadius: 20, padding: '26px 24px' }}>
                <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: 18, fontWeight: 600, color: 'var(--t0)', marginBottom: 9 }}>{item.title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.65 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="tp-section-surface" id="proceso" ref={stepsRef} aria-label="Cómo usar Tempos — 3 pasos para empezar" style={{
        padding: 'clamp(56px,7vw,100px) clamp(18px,4vw,48px)',
        background: 'rgba(255,255,255,0.012)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div className={`tp-reveal ${stepsVis ? 'tp-visible' : ''}`} style={{ textAlign: 'center', marginBottom: 72 }}>
            <span className="tp-label">Despliegue instantáneo</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 48, fontWeight: 600, letterSpacing: 0.5, color: 'var(--t0)' }}>
              100% operativo hoy mismo
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map(({ n, title, desc }, i) => (
              <div
                key={n}
                className={`tp-reveal ${stepsVis ? 'tp-visible' : ''} tp-d${i}`}
                style={{
                  display: 'flex', gap: 36, alignItems: 'flex-start',
                  padding: '36px 0',
                  borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: 'rgba(37,99,235,0.1)',
                    border: '1px solid rgba(37,99,235,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--ff-mono)', fontSize: 16, fontWeight: 700, color: 'var(--mg)',
                    letterSpacing: -0.5,
                  }}>
                    {n}
                  </div>
                </div>
                <div style={{ paddingTop: 12 }}>
                  <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 700, color: 'var(--t0)', marginBottom: 10, letterSpacing: -0.5 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.7, maxWidth: 540, fontWeight: 300 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="tp-section-surface" aria-label="Razones operativas y casos de uso de Tempos" style={{ padding: 'clamp(52px,6vw,88px) clamp(18px,4vw,48px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span className="tp-label">Casos de uso</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 42, fontWeight: 600, color: 'var(--t0)', marginBottom: 14 }}>
              Cuándo tiene sentido implantar Tempos
            </h2>
            <p style={{ fontSize: 15.5, color: 'var(--t1)', lineHeight: 1.7, maxWidth: 760, margin: '0 auto', fontWeight: 300 }}>
              El valor no está solo en fichar. Está en reducir tiempo administrativo, ordenar incidencias y disponer de información fiable cuando la empresa la necesita.
            </p>
          </div>

          <div className="tp-grid-3" style={{ marginBottom: 18 }}>
            {proofItems.map((item) => (
              <div key={item.value} className="tp-card" style={{ borderRadius: 20, padding: '26px 22px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--ff-head)', fontSize: 32, fontWeight: 600, color: 'var(--mg)', marginBottom: 8 }}>{item.value}</div>
                <p style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.65 }}>{item.label}</p>
              </div>
            ))}
          </div>

          <div className="tp-grid-3">
            {useCases.map((item) => (
              <div key={item.name} className="tp-card" style={{ borderRadius: 20, padding: '24px 22px' }}>
                <p style={{ fontSize: 14, color: 'var(--t0)', lineHeight: 1.75, marginBottom: 14 }}>
                  {item.quote}
                </p>
                <div style={{ fontSize: 12.5, color: 'var(--mg)', fontWeight: 600 }}>{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="tp-section-surface" id="faqs" aria-label="Preguntas frecuentes sobre el software de control horario" style={{ padding: '0 clamp(18px,4vw,48px) clamp(56px,7vw,100px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 34 }}>
            <span className="tp-label">FAQs</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 40, fontWeight: 600, color: 'var(--t0)', marginBottom: 12 }}>
              Respuestas claras antes de empezar
            </h2>
            <p style={{ fontSize: 15, color: 'var(--t1)', lineHeight: 1.7, maxWidth: 740, margin: '0 auto', fontWeight: 300 }}>
              Todo lo que suele preguntar una empresa antes de implantar un software de control horario y registro de jornada laboral.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((item) => (
              <div key={item.q} className="tp-card" style={{ borderRadius: 16, padding: '18px 20px' }}>
                <h3 style={{ fontSize: 15.5, color: 'var(--t0)', marginBottom: 8 }}>{item.q}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.65 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="tp-section-surface" aria-label="Comparativa entre control manual y control horario digital" style={{ padding: '0 48px 88px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <span className="tp-label">Comparativa</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 40, fontWeight: 600, color: 'var(--t0)', marginBottom: 12 }}>
              Seguir con papel cuesta más de lo que parece
            </h2>
            <p style={{ fontSize: 15, color: 'var(--t1)', lineHeight: 1.7, maxWidth: 720, margin: '0 auto', fontWeight: 300 }}>
              Si el control horario depende de procesos manuales, la empresa pierde tiempo, consistencia y capacidad de respuesta ante incidencias o requerimientos de documentación.
            </p>
          </div>

          <div className="tp-card" style={{ borderRadius: 22, overflow: 'hidden' }}>
            {compareRows.map((row, index) => (
              <div key={row[0]} className="tp-compare-row" style={{ borderBottom: index < compareRows.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ padding: '18px 20px', background: index === 1 ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.02)', fontSize: 14, fontWeight: 700, color: index === 1 ? 'var(--mg)' : 'var(--t0)' }}>
                  {row[0]}
                </div>
                <div style={{ padding: '18px 20px', fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.65 }}>
                  {row[1]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mid CTA ── */}
      <section className="tp-section-surface" aria-label="Llamada a la acción antes de precios" style={{ padding: '0 clamp(18px,4vw,48px) clamp(52px,6vw,88px)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 980, margin: '0 auto', border: '1px solid rgba(37,99,235,0.24)', background: 'linear-gradient(180deg, rgba(37,99,235,0.09), rgba(255,255,255,0.015))', borderRadius: 24, padding: '30px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 28, fontWeight: 600, color: 'var(--t0)', marginBottom: 8 }}>
              Empieza a digitalizar el control horario sin complicarte
            </h2>
            <p style={{ fontSize: 14.5, color: 'var(--t1)', lineHeight: 1.7, maxWidth: 620 }}>
              Prueba Tempos con tu operativa real y evalúa en pocos días cómo mejora el control del equipo, la gestión de incidencias y la preparación de documentación.
            </p>
          </div>
          <button onClick={() => navigateWithTransition('/trial')} className="tp-btn tp-btn-primary" style={{ borderRadius: 13, padding: '15px 24px', fontSize: 14.5, flexShrink: 0 }}>
            {ctaCopy.midPrimary}
          </button>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="tp-section-surface" id="precios" ref={pricingRef} aria-label="Precios de Tempos — Planes para autónomos y empresas" style={{
        padding: 'clamp(60px,8vw,120px) clamp(18px,4vw,48px) clamp(70px,9vw,140px)', borderTop: '1px solid var(--border)', overflow: 'hidden',
        background: 'rgba(255,255,255,0.012)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div className={`tp-reveal ${pricingVis ? 'tp-visible' : ''}`} style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="tp-label">Precios</span>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 48, fontWeight: 600, letterSpacing: 0.5, color: 'var(--t0)', marginBottom: 12 }}>
              Transparente, sin sorpresas
            </h2>
            <p style={{ fontSize: 15, color: 'var(--t1)', fontWeight: 300 }}>14 días de prueba gratuita. Sin tarjeta de crédito. Sin permanencia.</p>
          </div>

          <div className="tp-grid-2">

            {/* Autónomos */}
            <div className={`tp-card tp-reveal ${pricingVis ? 'tp-visible' : ''}`} style={{ borderRadius: 24, padding: 44 }}>
              <div style={{ fontSize: 10.5, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--t2)', marginBottom: 22, fontWeight: 600 }}>Autónomos</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--ff-head)', fontSize: 52, fontWeight: 600, letterSpacing: 0, color: 'var(--t0)', lineHeight: 1 }}>9€</span>
                <span style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 8, fontWeight: 300 }}>/mes</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--t1)', marginBottom: 32, lineHeight: 1.6, fontWeight: 300 }}>Para trabajadores por cuenta propia que necesitan registrar su jornada con precisión.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 36 }}>
                {['1 usuario', 'Registro de jornada ilimitado', 'Exportación PDF y Excel', 'Acceso web y móvil', 'Soporte por correo'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--t1)' }}>
                    <span style={{ color: 'var(--mg)', flexShrink: 0 }}><Icon.Check /></span> {f}
                  </div>
                ))}
              </div>
              <button onClick={goToTrial} className="tp-btn" style={{
                width: '100%', padding: '14px', borderRadius: 13,
                background: 'rgba(37,99,235,0.1)',
                border: '1px solid rgba(37,99,235,0.25)',
                color: 'var(--mg)', fontSize: 14.5, cursor: 'pointer',
              }}>
                {ctaCopy.pricingPrimary}
              </button>
            </div>

            {/* Empresas */}
            <div className={`tp-price-featured tp-reveal tp-d1 ${pricingVis ? 'tp-visible' : ''}`} style={{ borderRadius: 24, padding: 44, background: 'var(--bg2)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -1, right: 32 }}>
                <div style={{ background: 'var(--mg)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '5px 14px', borderRadius: '0 0 10px 10px', letterSpacing: 1, textTransform: 'uppercase' }}>
                  Más popular
                </div>
              </div>
              {/* Ambient */}
              <div style={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.09) 0%, transparent 70%)', pointerEvents: 'none' }}/>
              <div style={{ fontSize: 10.5, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(37,99,235,0.65)', marginBottom: 22, fontWeight: 600, position: 'relative' }}>Empresas</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 8, position: 'relative' }}>
                <span style={{ fontFamily: 'var(--ff-head)', fontSize: 52, fontWeight: 600, letterSpacing: 0, color: 'var(--t0)', lineHeight: 1 }}>4€</span>
                <span style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 8, fontWeight: 300 }}>/empleado/mes</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--t1)', marginBottom: 32, lineHeight: 1.6, fontWeight: 300, position: 'relative' }}>Para equipos de cualquier tamaño. Gestión completa sin límite de empleados ni sedes.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 36, position: 'relative' }}>
                {['Empleados ilimitados', 'Panel de administración completo', 'Gestión de turnos y ausencias', 'Informes para Inspección de Trabajo', 'Soporte prioritario', 'API e integraciones con nóminas'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--t1)' }}>
                    <span style={{ color: 'var(--mg)', flexShrink: 0 }}><Icon.Check /></span> {f}
                  </div>
                ))}
              </div>
              <button onClick={goToTrial} className="tp-btn tp-btn-primary" style={{ width: '100%', padding: '14px', borderRadius: 13, fontSize: 14.5, position: 'relative', cursor: 'pointer' }}>
                {ctaCopy.pricingPrimary}
              </button>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12.5, color: 'var(--t3)' }}>
            ¿Más de 100 empleados?{' '}
            <Link to="/contacto" style={{ color: 'var(--mg)', textDecoration: 'none', fontWeight: 600 }}>Contáctanos para un plan personalizado</Link>
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="tp-section-surface" aria-label="Empieza a usar Tempos hoy" style={{ padding: 'clamp(60px,8vw,120px) clamp(18px,4vw,48px)', textAlign: 'center', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 400, background: 'radial-gradient(ellipse, rgba(37,99,235,0.1) 0%, transparent 65%)', pointerEvents: 'none' }}/>
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
          <span className="tp-label">Transformación inmediata</span>
          <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 56, fontWeight: 600, letterSpacing: 0.5, color: 'var(--t0)', marginBottom: 18, lineHeight: 1.08 }}>
            Es hora de liderar<br/>con mejores datos.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--t1)', marginBottom: 44, lineHeight: 1.7, fontWeight: 300 }}>
            Únete a cientos de empresas líderes que ya protegen sus márgenes y blindan su cumplimiento legal con Tempos.
          </p>
            <button onClick={() => navigateWithTransition('/register')} className="tp-btn tp-btn-primary" style={{
              borderRadius: 14, padding: '18px 40px', fontSize: 16.5, display: 'inline-flex', alignItems: 'center', gap: 10,
            }}>
              {ctaCopy.finalPrimary} <Icon.ArrowRight />
            </button>
        </div>
      </section>

      </main>

      {/* ── Footer ── */}
      <footer role="contentinfo" style={{
        borderTop: '1px solid var(--border)',
        padding: '36px 48px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 20, position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.008)',
      }}>
        <span style={{ fontFamily: 'var(--ff-head)', fontSize: 24, fontWeight: 600, letterSpacing: 1.5, color: 'var(--t0)' }}>
          Tem<span style={{ color: 'var(--mg)' }}>pos</span>
        </span>
        <div style={{ display: 'flex', gap: 30 }}>
          <Link to="/faqs" style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--t0)'} onMouseLeave={e => e.target.style.color = 'var(--t3)'}>Legal</Link>
          <Link to="/faqs" style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--t0)'} onMouseLeave={e => e.target.style.color = 'var(--t3)'}>Privacidad</Link>
          <Link to="/faqs" style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--t0)'} onMouseLeave={e => e.target.style.color = 'var(--t3)'}>Cookies</Link>
          <Link to="/contacto" style={{ fontSize: 12.5, color: 'var(--t3)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--t0)'} onMouseLeave={e => e.target.style.color = 'var(--t3)'}>Contacto</Link>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--t3)' }}>© 2026 Tempos. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
