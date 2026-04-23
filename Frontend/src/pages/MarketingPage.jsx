import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { submitContact } from '@/lib/api'
import '../styles/marketing.css'

const PAGE_CONTENT = {
  funcionalidades: {
    chip: 'Funcionalidades',
    title: 'Herramientas para registrar jornada, gestionar equipo y mantener trazabilidad',
    subtitle:
      'La referencia trabaja esta sección como tres bloques claros: intranet, app móvil y puntos de fichaje. Aquí la reestructuro igual, pero con una presentación más sobria y visual.',
    heroImage: '/auth_admin_site.png',
    sections: [
      {
        title: 'Intranet',
        text: 'Panel para responsables donde se da de alta a empleados, se configuran horarios, se revisan incidencias y se descargan informes. La idea es que dirección, RRHH o asesoría tengan una vista clara del registro de jornada sin depender de hojas externas.',
        image: '/marketing/intranet_c.jpg',
        position: 'center 38%',
        bullets: [
          'Gestión de empleados, horarios y permisos desde un único panel',
          'Control de fichajes, ausencias, pausas y horas extra',
          'Exportación de informes para gestoría o inspección'
        ]
      },
      {
        title: 'Aplicación móvil',
        text: 'Cada empleado puede fichar desde su teléfono, consultar su jornada, registrar pausas y enviar solicitudes de vacaciones o incidencias. Igual que en la referencia, la app se plantea como el punto de uso diario del trabajador.',
        image: '/marketing/mobile_b.jpg',
        position: 'center 24%',
        bullets: [
          'Entrada, salida y pausas desde móvil o navegador',
          'Consulta de jornada, estado y avisos del responsable',
          'Solicitud de vacaciones, permisos y comunicación de bajas'
        ]
      },
      {
        title: 'Puntos de fichaje',
        text: 'Además del dispositivo individual, puedes habilitar un punto fijo en oficina, nave o recepción. Esta estructura está muy presente en la referencia y es útil para equipos presenciales con acceso común.',
        image: '/marketing/kiosk_c.jpg',
        position: 'center 42%',
        bullets: [
          'Punto fijo en tablet o móvil para sedes presenciales',
          'Registro rápido para entradas y salidas recurrentes',
          'Complemento del fichaje móvil para equipos mixtos'
        ]
      }
    ],
    ctaTitle: '¿Necesitas más información sobre la aplicación?',
    ctaText:
      'Si tu equipo combina oficina, teletrabajo o movilidad, te ayudamos a definir qué método de fichaje y qué flujo de control tiene más sentido para implantarlo sin fricción.'
  },
  faqs: {
    chip: 'FAQs',
    title: 'Centro de ayuda sobre control horario y cumplimiento',
    subtitle:
      'Encuentra respuestas rápidas por tema: legal, teletrabajo, operativa diaria e implantación. Contenido claro, actualizado y orientado a decisiones reales de empresa.',
    heroImage: '/auth_register_4k_v2.jpg',
    heroImagePosition: 'center 44%',
    ctaTitle: '¿Tus preguntas no están en la lista?',
    ctaText: 'Si necesitas resolver dudas sobre implantación, operativa diaria o revisión legal, te acompañamos con una respuesta concreta y accionable.'
  },
  blog: {
    chip: 'Blog',
    title: 'Guías y análisis sobre control horario, cumplimiento y gestión de equipos',
    subtitle:
      'Un espacio editorial pensado para responsables de empresa, RRHH y asesorías que necesitan criterio práctico para decidir, implantar y mantener el control horario.',
    heroImage: '/landing_legal_desk.jpg',
    heroImagePosition: 'center 44%',
    posts: [
      {
        category: 'Control horario laboral',
        date: '19/03/2026',
        title: 'Los 8 mejores programas de control horario en 2026',
        excerpt:
          'Comparativa para empresas y pymes que buscan cumplir con el registro de jornada y reducir carga administrativa sin perder trazabilidad.',
        image: '/marketing/intranet_a.jpg',
        imagePosition: 'center 35%'
      },
      {
        category: 'Legal y cumplimiento',
        date: '14/08/2025',
        title: 'Cómo preparar la documentación ante una inspección de trabajo',
        excerpt:
          'Qué registros conviene mantener organizados, cómo exportarlos y qué errores evitar al presentar evidencias de jornada.',
        image: '/marketing/intranet_b.jpg',
        imagePosition: 'center 52%'
      },
      {
        category: 'Teletrabajo y operaciones',
        date: '09/07/2024',
        title: 'Control horario en teletrabajo: criterios para implantarlo bien',
        excerpt:
          'Buenas prácticas para equilibrar flexibilidad, seguimiento y trazabilidad cuando parte del equipo trabaja fuera de oficina.',
        image: '/marketing/kiosk_a.jpg',
        imagePosition: 'center 48%'
      },
      {
        category: 'Funcionalidades',
        date: '09/06/2024',
        title: 'Ventajas de una app para el control horario',
        excerpt:
          'Qué aporta una aplicación frente al fichaje manual y por qué simplifica la gestión de ausencias, pausas e incidencias.',
        image: '/marketing/mobile_a.jpg',
        imagePosition: 'center 30%'
      },
      {
        category: 'Legal',
        date: '15/05/2024',
        title: 'Qué implicaciones tiene el fin del fichaje biométrico',
        excerpt:
          'Contexto normativo y alternativas digitales para empresas que necesitan mantener seguridad, trazabilidad y cumplimiento.',
        image: '/marketing/kiosk_b.jpg',
        imagePosition: 'center 36%'
      },
      {
        category: 'Mundo laboral',
        date: '28/03/2024',
        title: 'Por qué el registro horario tenderá a ser completamente digital',
        excerpt:
          'Panorama regulatorio y consecuencias operativas para organizaciones que todavía gestionan jornada con papel o Excel.',
        image: '/marketing/mobile_b.jpg',
        imagePosition: 'center 40%'
      }
    ]
  },
  contacto: {
    chip: 'Contacto',
    title: 'Solicita información o una demo del sistema',
    subtitle:
      'Comparte el contexto de tu empresa y te ayudaremos a definir el flujo de implantación más adecuado, con enfoque práctico y orientado a cumplimiento.',
    heroImage: '/auth_login_admin_4k.jpg',
    heroImagePosition: 'center 34%',
    contactMedia: '/auth_register_admin_4k.jpg',
    contactMediaPosition: 'center 50%',
    contactItems: [
      { label: 'Dirección', value: 'Calle Alemania 34, Alicante · Atención online para toda España' },
      { label: 'Correo', value: 'equipo@tempos.es' },
      { label: 'Teléfono', value: '+34 900 000 000' },
      { label: 'Horario', value: 'Lunes a viernes · 09:00 a 18:00' },
      { label: 'Respuesta', value: 'Normalmente en menos de 24 horas laborables' }
    ],
    formIntro:
      'Envíanos tu contexto y te ayudaremos a valorar el mejor flujo de implantación según el tamaño del equipo, la operativa y el tipo de fichaje.'
  }
}

function SectionNav() {
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)
  const close = () => setNavOpen(false)

  return (
    <>
      <nav className="tp-nav" aria-label="Navegación principal">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--mg)" strokeWidth="2.5" opacity="0.2"/>
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--mg)" strokeWidth="2.8"/>
            <circle cx="50" cy="12" r="2.2" fill="var(--mg)"/>
            <circle cx="88" cy="50" r="2.2" fill="var(--mg)"/>
            <circle cx="50" cy="88" r="2.2" fill="var(--mg)"/>
            <circle cx="12" cy="50" r="2.2" fill="var(--mg)"/>
            <line x1="50" y1="50" x2="50" y2="28" stroke="var(--mg)" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
            <line x1="50" y1="50" x2="68" y2="44" stroke="var(--mg)" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
            <circle cx="50" cy="50" r="3.5" fill="var(--mg)"/>
          </svg>
          <span style={{ fontFamily: 'var(--ff-head)', fontSize: 24, fontWeight: 600, letterSpacing: 1.5, color: 'var(--t0)' }}>
            Tem<span style={{ color: 'var(--mg)' }}>pos</span>
          </span>
        </div>

        {/* Desktop links */}
        <div className="tp-nav-links">
          <NavLink to="/" end className={({ isActive }) => `tp-nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
          <NavLink to="/funcionalidades" className={({ isActive }) => `tp-nav-link ${isActive ? 'active' : ''}`}>Funcionalidades</NavLink>
          <NavLink to="/faqs" className={({ isActive }) => `tp-nav-link ${isActive ? 'active' : ''}`}>FAQs</NavLink>
          <NavLink to="/blog" className={({ isActive }) => `tp-nav-link ${isActive ? 'active' : ''}`}>Blog</NavLink>
          <NavLink to="/contacto" className={({ isActive }) => `tp-nav-link ${isActive ? 'active' : ''}`}>Contacto</NavLink>
        </div>

        {/* Desktop CTAs */}
        <div className="tp-nav-actions">
          <button
            onClick={() => navigate('/login')}
            style={{ fontFamily: 'var(--ff-body)', fontSize: 13, color: 'var(--t2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseEnter={(event) => { event.target.style.color = 'var(--t0)' }}
            onMouseLeave={(event) => { event.target.style.color = 'var(--t2)' }}
          >
            Iniciar sesión
          </button>
          <button onClick={() => navigate('/register')} className="tp-btn tp-btn-primary" style={{ borderRadius: 10, padding: '8px 20px', fontSize: 13.5 }}>
            Probar gratis
          </button>
        </div>

        {/* Hamburger (mobile only) */}
        <button className="tp-nav-ham" aria-label="Abrir menú" onClick={() => setNavOpen(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </nav>

      {/* Mobile overlay */}
      <div className={`tp-mob-overlay ${navOpen ? 'tp-mob-open' : ''}`} role="dialog" aria-modal="true" aria-label="Menú de navegación">
        <button className="tp-mob-nav-close" aria-label="Cerrar menú" onClick={close}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <NavLink to="/" end className={({ isActive }) => `tp-mob-nav-link ${isActive ? 'active' : ''}`} onClick={close}>Home</NavLink>
        <NavLink to="/funcionalidades" className={({ isActive }) => `tp-mob-nav-link ${isActive ? 'active' : ''}`} onClick={close}>Funcionalidades</NavLink>
        <NavLink to="/faqs" className={({ isActive }) => `tp-mob-nav-link ${isActive ? 'active' : ''}`} onClick={close}>FAQs</NavLink>
        <NavLink to="/blog" className={({ isActive }) => `tp-mob-nav-link ${isActive ? 'active' : ''}`} onClick={close}>Blog</NavLink>
        <NavLink to="/contacto" className={({ isActive }) => `tp-mob-nav-link ${isActive ? 'active' : ''}`} onClick={close}>Contacto</NavLink>
        <div className="tp-mob-nav-actions">
          <button onClick={() => { close(); navigate('/login'); }} className="tp-btn tp-btn-ghost" style={{ borderRadius: 12, padding: 13, fontSize: 15 }}>
            Iniciar sesión
          </button>
          <button onClick={() => { close(); navigate('/register'); }} className="tp-btn tp-btn-primary" style={{ borderRadius: 12, padding: 13, fontSize: 15 }}>
            Probar gratis
          </button>
        </div>
      </div>
    </>
  )
}

function HeroSection({ content, primaryAction, secondaryAction }) {
  return (
    <section className="tp-marketing-hero">
      <div className="tp-marketing-hero-copy">
        <span className="tp-marketing-chip">{content.chip}</span>
        <h1 className="tp-marketing-title">{content.title}</h1>
        <p className="tp-marketing-subtitle">{content.subtitle}</p>

        <div className="tp-marketing-actions">
          {primaryAction}
          {secondaryAction}
        </div>

      </div>

      <div className="tp-marketing-hero-media">
        <img src={content.heroImage} alt={content.title} loading="eager" style={{ objectPosition: content.heroImagePosition || 'center' }} />
      </div>
    </section>
  )
}

function FunctionalitiesView({ content, navigate }) {
  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <h2 className="tp-marketing-section-title">Tres módulos principales</h2>
        <p className="tp-marketing-section-copy">
          Igual que en la referencia, la página se apoya en tres módulos muy reconocibles para explicar el producto sin mezclarlo todo en una sola lista de ventajas.
        </p>
      </div>

      <section className="tp-marketing-grid-3">
        {content.sections.map((section) => (
          <article key={section.title} className="tp-marketing-card">
            <div className="tp-marketing-card-media">
              <img src={section.image} alt={section.title} loading="lazy" style={{ objectPosition: section.position || 'center' }} />
            </div>
            <div className="tp-marketing-card-body">
              <h3>{section.title}</h3>
              <p>{section.text}</p>
              <div className="tp-marketing-bullets">
                {section.bullets.map((bullet) => (
                  <div key={bullet} className="tp-marketing-bullet">{bullet}</div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="tp-marketing-panel">
        <h3>{content.ctaTitle}</h3>
        <p>{content.ctaText}</p>
        <div className="tp-marketing-actions">
          <button onClick={() => navigate('/contacto')} className="tp-btn tp-btn-primary" style={{ borderRadius: 12, padding: '13px 18px', fontSize: 14 }}>
            Contáctanos
          </button>
          <button onClick={() => navigate('/trial')} className="tp-btn tp-btn-ghost" style={{ borderRadius: 12, padding: '13px 18px', fontSize: 14 }}>
            Solicitar demo
          </button>
        </div>
      </section>
    </>
  )
}

function FaqsView({ content, navigate }) {
  const allFaqs = [
    {
      category: 'Control horario laboral',
      date: '19/03/2026',
      title: 'Los 8 mejores programas de control horario en 2026',
      excerpt: 'Comparativa para empresas y pymes que buscan cumplir con el registro de jornada y reducir carga administrativa sin perder trazabilidad.',
      q: '¿Qué debo priorizar al comparar software de control horario?',
      a: 'Prioriza trazabilidad de cambios, exportación para inspección, control de ausencias y facilidad de uso para empleados y responsables.'
    },
    {
      category: 'Legal y cumplimiento',
      date: '14/08/2025',
      title: 'Cómo preparar la documentación ante una inspección de trabajo',
      excerpt: 'Qué registros conviene mantener organizados, cómo exportarlos y qué errores evitar al presentar evidencias de jornada.',
      q: '¿Qué documentación conviene tener preparada de forma recurrente?',
      a: 'Registro diario de jornada, incidencias justificadas, ausencias y reportes exportables con historial de cambios.'
    },
    {
      category: 'Teletrabajo y operaciones',
      date: '09/07/2024',
      title: 'Control horario en teletrabajo: criterios para implantarlo bien',
      excerpt: 'Buenas prácticas para equilibrar flexibilidad, seguimiento y trazabilidad cuando parte del equipo trabaja fuera de oficina.',
      q: '¿Cómo implantar control horario remoto sin fricción con el equipo?',
      a: 'Define reglas simples, comunica criterios de uso y usa una app que registre entradas, pausas e incidencias sin procesos manuales.'
    },
    {
      category: 'Funcionalidades',
      date: '09/06/2024',
      title: 'Ventajas de una app para el control horario',
      excerpt: 'Qué aporta una aplicación frente al fichaje manual y por qué simplifica la gestión de ausencias, pausas e incidencias.',
      q: '¿Qué mejora real aporta frente a papel o Excel?',
      a: 'Reduce errores, automatiza cálculo de jornada, centraliza incidencias y acelera la generación de informes para gestión y asesoría.'
    },
    {
      category: 'Legal',
      date: '15/05/2024',
      title: 'Qué implicaciones tiene el fin del fichaje biométrico',
      excerpt: 'Contexto normativo y alternativas digitales para empresas que necesitan mantener seguridad, trazabilidad y cumplimiento.',
      q: '¿Qué alternativas al fichaje biométrico se están adoptando?',
      a: 'PIN personal, app móvil con validaciones, puntos de fichaje y flujos con trazabilidad auditables para inspección.'
    },
    {
      category: 'Mundo laboral',
      date: '28/03/2024',
      title: 'Por qué el registro horario tenderá a ser completamente digital',
      excerpt: 'Panorama regulatorio y consecuencias operativas para organizaciones que todavía gestionan jornada con papel o Excel.',
      q: '¿Por qué conviene digitalizar ahora y no esperar?',
      a: 'Porque reduce carga administrativa, mejora control operativo y minimiza riesgo de sanción por registros incompletos o inconsistentes.'
    }
  ]

  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todas')
  const categories = ['Todas', ...Array.from(new Set(allFaqs.map((item) => item.category)))]

  const filteredFaqs = allFaqs.filter((item) => {
    const categoryMatch = activeCategory === 'Todas' || item.category === activeCategory
    const q = query.trim().toLowerCase()
    const textMatch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.excerpt.toLowerCase().includes(q) ||
      item.q.toLowerCase().includes(q) ||
      item.a.toLowerCase().includes(q)

    return categoryMatch && textMatch
  })

  return (
    <section className="tp-marketing-faq-layout">
      <section className="tp-marketing-faq-toolbar">
        <input
          className="tp-marketing-faq-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por tema: inspección, teletrabajo, fichaje, legal..."
          aria-label="Buscar en preguntas frecuentes"
        />
        <div className="tp-marketing-faq-chips">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`tp-marketing-faq-chip ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="tp-marketing-faq-result-note">
          {filteredFaqs.length} resultado(s) en preguntas frecuentes.
        </div>
      </section>

      <section className="tp-marketing-faq-box">
        <h3>Temas y respuestas</h3>
        <p style={{ marginBottom: 14 }}>
          Estructura optimizada para lectura rápida: contexto breve por tema y respuesta accionable en acordeón.
        </p>

        <div className="tp-marketing-faq-group">
          {filteredFaqs.map((item) => (
            <article key={item.title} className="tp-marketing-faq-topic">
              <div className="tp-marketing-faq-topic-meta">
                <span>{item.category}</span>
                <span>{item.date}</span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.excerpt}</p>
              <details className="tp-marketing-faq-item">
                <summary>{item.q}</summary>
                <div className="tp-marketing-faq-answer">{item.a}</div>
              </details>
            </article>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="tp-marketing-faq-topic">
              <h4>Sin resultados con ese criterio</h4>
              <p>Prueba con otra palabra clave o selecciona la categoría “Todas”.</p>
            </div>
          )}
        </div>
      </section>

      <section className="tp-marketing-panel">
        <h3>{content.ctaTitle}</h3>
        <p>{content.ctaText}</p>
        <div className="tp-marketing-actions">
          <button onClick={() => navigate('/contacto')} className="tp-btn tp-btn-primary" style={{ borderRadius: 12, padding: '13px 18px', fontSize: 14 }}>
            Ir a contacto
          </button>
        </div>
      </section>
    </section>
  )
}

function BlogView({ content }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todas')

  const categories = ['Todas', ...Array.from(new Set(content.posts.map((post) => post.category)))]
  const normalizedQuery = query.trim().toLowerCase()

  const filteredPosts = content.posts.filter((post) => {
    const categoryMatch = activeCategory === 'Todas' || post.category === activeCategory
    const queryMatch =
      !normalizedQuery ||
      post.title.toLowerCase().includes(normalizedQuery) ||
      post.excerpt.toLowerCase().includes(normalizedQuery) ||
      post.category.toLowerCase().includes(normalizedQuery)

    return categoryMatch && queryMatch
  })

  const featuredPost = filteredPosts[0]
  const secondaryPosts = filteredPosts.slice(1)
  const recommendedPosts = content.posts.slice(0, 3)

  const popularTopics = [
    'inspección de trabajo',
    'teletrabajo',
    'fichaje biométrico',
    'registro digital',
    'ausencias e incidencias'
  ]

  return (
    <section>
      <section className="tp-marketing-blog-toolbar">
        <input
          className="tp-marketing-blog-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar artículos: inspección, teletrabajo, registro digital..."
          aria-label="Buscar en blog"
        />

        <div className="tp-marketing-blog-chips">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`tp-marketing-blog-chip ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="tp-marketing-blog-note">
          {filteredPosts.length} artículo(s) disponible(s).
        </div>
      </section>

      <section className="tp-marketing-blog-popular" aria-label="Temas populares">
        <div className="tp-marketing-blog-popular-title">Temas populares</div>
        <div className="tp-marketing-blog-popular-list">
          {popularTopics.map((topic) => (
            <button
              key={topic}
              type="button"
              className="tp-marketing-blog-popular-item"
              onClick={() => setQuery(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
      </section>

      {featuredPost && (
        <article className="tp-marketing-blog-featured">
          <div className="tp-marketing-blog-featured-media">
            <img src={featuredPost.image} alt={featuredPost.title} loading="lazy" style={{ objectPosition: featuredPost.imagePosition || 'center' }} />
          </div>
          <div className="tp-marketing-blog-featured-body">
            <div className="tp-marketing-post-meta">
              <span>{featuredPost.category}</span>
              <span style={{ color: 'var(--t2)' }}>{featuredPost.date}</span>
            </div>
            <h3>{featuredPost.title}</h3>
            <p>{featuredPost.excerpt}</p>
            <a href="#" onClick={(event) => event.preventDefault()} className="tp-marketing-post-link">Continuar leyendo</a>
          </div>
        </article>
      )}

      <section className="tp-marketing-blog-grid">
        {secondaryPosts.map((post) => (
          <article key={post.title} className="tp-marketing-post">
            <img src={post.image} alt={post.title} loading="lazy" style={{ objectPosition: post.imagePosition || 'center' }} />
            <div className="tp-marketing-post-body">
              <div className="tp-marketing-post-meta">
                <span>{post.category}</span>
                <span style={{ color: 'var(--t2)' }}>{post.date}</span>
              </div>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <a href="#" onClick={(event) => event.preventDefault()} className="tp-marketing-post-link">Continuar leyendo</a>
            </div>
          </article>
        ))}
      </section>

      {!featuredPost && (
        <section className="tp-marketing-panel" style={{ marginTop: 0 }}>
          <h3>Sin artículos con ese criterio</h3>
          <p>Prueba con otra búsqueda o selecciona la categoría “Todas”.</p>
        </section>
      )}

      <section className="tp-marketing-blog-reco" aria-label="Lecturas recomendadas">
        <h3>Lecturas recomendadas</h3>
        <div className="tp-marketing-blog-reco-grid">
          {recommendedPosts.map((post) => (
            <article key={`reco-${post.title}`} className="tp-marketing-blog-reco-item">
              <h4>{post.title}</h4>
              <p>{post.category} · {post.date}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

function ContactView({ content }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | ok | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (status === 'error') { setStatus('idle'); setErrorMsg(''); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setErrorMsg('');
    try {
      await submitContact({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
      });
      setStatus('ok');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo enviar el formulario.');
    }
  };

  return (
    <section className="tp-marketing-contact-layout" style={{ alignItems: 'stretch', gap: 32 }}>
      <article className="tp-marketing-contact-box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 420 }}>
        <div className="tp-marketing-contact-media" style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 18 }}>
          <img
            src={content.contactMedia || '/landing_team_collab.jpg'}
            alt="Equipo de Tempos"
            loading="lazy"
            style={{ objectPosition: content.contactMediaPosition || 'center', width: '100%', height: '100%' }}
          />
        </div>
        <div className="tp-marketing-contact-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: 24, marginBottom: 10, textAlign: 'center' }}>Habla con un especialista en control horario</h3>
          <p style={{ color: 'var(--t1)', fontSize: 15, marginBottom: 18, textAlign: 'center', maxWidth: 340 }}>
            Solicita información o una demo y te orientaremos sobre el flujo más adecuado para tu empresa, con un enfoque claro, práctico y alineado con la normativa.
          </p>
          <div className="tp-marketing-contact-list" style={{ width: '100%', maxWidth: 340, display: 'grid', gap: 10 }}>
            {content.contactItems.map((item) => (
              <div key={item.label} className="tp-marketing-contact-item" style={{ borderRadius: 14, padding: '13px 14px', background: 'rgba(255,255,255,0.015)' }}>
                <span style={{ color: 'var(--t2)', fontSize: 12 }}>{item.label}</span>
                <span style={{ color: 'var(--t0)', fontSize: 14, fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </article>

      <article className="tp-marketing-form-box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 420 }}>
        <div className="tp-marketing-form-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ fontFamily: 'var(--ff-head)', fontSize: 24, marginBottom: 10, textAlign: 'center' }}>Escríbenos</h3>
          <p style={{ color: 'var(--t1)', fontSize: 15, marginBottom: 18, textAlign: 'center', maxWidth: 340 }}>{content.formIntro}</p>

          {status === 'ok' ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--mg)', marginBottom: 8 }}>¡Mensaje enviado!</p>
              <p style={{ color: 'var(--t1)', fontSize: 14 }}>Te responderemos en breve.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="tp-marketing-form" style={{ width: '100%', maxWidth: 340, display: 'grid', gap: 12 }}>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Nombre y apellidos" required />
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Correo profesional" required />
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Teléfono de contacto" />
              <textarea name="message" value={form.message} onChange={handleChange} placeholder="Cuéntanos tu caso (equipo, operativa y objetivos)" required />
              {errorMsg && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{errorMsg}</p>}
              <div className="tp-marketing-form-note" style={{ color: 'var(--t2)', fontSize: 12, lineHeight: 1.6 }}>
                Al enviar el formulario aceptas la política de privacidad y el tratamiento de tus datos para responder a tu solicitud.
              </div>
              <button type="submit" className="tp-btn tp-btn-primary" disabled={status === 'sending'} style={{ borderRadius: 12, padding: '14px 18px', fontSize: 14.5, opacity: status === 'sending' ? 0.7 : 1 }}>
                {status === 'sending' ? 'Enviando…' : 'Enviar formulario'}
              </button>
            </form>
          )}
        </div>
      </article>
    </section>
  );
}

export default function MarketingPage({ kind }) {
  const navigate = useNavigate()
  const content = PAGE_CONTENT[kind] || PAGE_CONTENT.funcionalidades

  useEffect(() => {
    window.scrollTo(0, 0)

    const titles = {
      funcionalidades: 'Tempos | Funcionalidades del software de control horario',
      faqs: 'Tempos | FAQs sobre control horario y registro de jornada',
      blog: 'Tempos | Blog sobre control horario, legalidad y gestión laboral',
      contacto: 'Tempos | Contacto y demo para empresas y autónomos'
    }

    document.title = titles[kind] || titles.funcionalidades
  }, [kind])

  return (
    <div className="tp-root tp-marketing-page">

      <SectionNav />

      <main className="tp-marketing-main">
        <HeroSection
          content={content}
          primaryAction={
            <button onClick={() => navigate('/trial')} className="tp-btn tp-btn-primary" style={{ borderRadius: 12, padding: '14px 18px', fontSize: 14.5 }}>
              Probar gratis
            </button>
          }
          secondaryAction={
            <button onClick={() => navigate('/contacto')} className="tp-btn tp-btn-ghost" style={{ borderRadius: 12, padding: '14px 18px', fontSize: 14.5 }}>
              Solicitar información
            </button>
          }
        />

        {kind === 'funcionalidades' && <FunctionalitiesView content={content} navigate={navigate} />}
        {kind === 'faqs' && <FaqsView content={content} navigate={navigate} />}
        {kind === 'blog' && <BlogView content={content} />}
        {kind === 'contacto' && <ContactView content={content} />}
      </main>

      <footer className="tp-marketing-footer">
        <span>© 2026 Tempos</span>
        <span>Control horario para empresas, autónomos y pymes</span>
      </footer>
    </div>
  )
}
