# AGENTS.md — Tempos Project

## Descripción
**Tempos** es un SaaS de control horario legal para pymes y autónomos en España (RD 8/2019). Stack: **FastAPI + React + PostgreSQL + Redis**.

## Stack Tecnológico

### Frontend (en desarrollo primero)
- **Framework**: React 18 + Vite 5
- **Estilos**: TailwindCSS 3.x + CSS-in-JS en componentes premium
- **Router**: React Router DOM 6
- **Estado**: Zustand (cuando se necesite)
- **HTTP**: Axios o fetch nativo

### Backend (próxima fase)
- **Framework**: FastAPI (Python)
- **ORM**: SQLAlchemy 2.0 + Pydantic v2
- **DB**: PostgreSQL 16 + Redis 7
- **Auth**: JWT (python-jose, HS256)
- **Tareas**: Celery + Redis

## Estructura del Proyecto

```
Tempos/
├── AGENTS.md                    ← Este archivo
├── Stack.md                     ← Referencia del stack completo
├── .agents/
│   ├── context.md               ← Contexto detallado del proyecto
│   └── workflows/
│       ├── dev.md               ← Iniciar servidor desarrollo
│       └── build.md             ← Build de producción
│
├── Frontend/                    ← React + Vite
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── public/
│   └── src/
│       ├── main.jsx             ← Entry point React
│       ├── App.jsx              ← Router principal
│       ├── index.css            ← Tailwind + globals
│       ├── pages/               ← Páginas (una por ruta)
│       │   └── LandingPage.jsx  ← Landing premium
│       ├── components/          ← Componentes reutilizables
│       │   └── ui/              ← Botones, inputs, modales
│       ├── hooks/               ← Custom hooks
│       ├── services/            ← API calls (axios/fetch)
│       ├── stores/              ← Estado global (Zustand)
│       ├── utils/               ← Helpers y constantes
│       └── assets/              ← Imágenes, iconos, fonts
│
└── Backend/                     ← FastAPI (fase 2)
    ├── app/
    │   ├── main.py
    │   ├── core/
    │   ├── api/v1/endpoints/
    │   ├── crud/
    │   ├── models/
    │   ├── schemas/
    │   └── db/
    ├── requirements.txt
    └── .env
```

## Reglas de Código

### Generales
1. **TypeScript no se usa** — ES6+ puro con JSX. Si se necesita tipado, migrar a TS más adelante.
2. **Componentes funcionales** siempre — nunca class components.
3. **Hooks personalizados** en `hooks/` para lógica reutilizable.
4. **Named exports** para componentes, `default export` solo para páginas.
5. **Imports absolutos** preferidos con alias `@/` (configurar en vite.config.js).

### Estilo
1. **CSS del LandingPage**: preservar SIEMPRE el CSS-in-JS existente intacto (variables CSS, animaciones, iPhone mockup).
2. **TailwindCSS**: usar para layouts y componentes nuevos del dashboard/app.
3. **Colores de marca**: `--mg: #e8007d` (magenta primario), `--bg0: #141414` (fondo oscuro).
4. **Tipografías**: Cormorant Garamond (headings) + DM Sans (body).
5. **Dark mode primero**: Todo diseño es dark-first.

### Convenciones de Naming
- Archivos de componentes: `PascalCase.jsx` (e.g., `HeroSection.jsx`)
- Archivos de hooks: `camelCase.js` (e.g., `useReveal.js`)
- Archivos de utils: `camelCase.js` (e.g., `formatDate.js`)
- Archivos de servicios: `camelCase.js` (e.g., `authService.js`)
- CSS modules (si se usan): `Component.module.css`

### Calidad
1. **No dejar `console.log`** en producción — usar solo en desarrollo.
2. **Error boundaries** en componentes críticos.
3. **Lazy loading** para rutas del dashboard con `React.lazy()`.
4. **Responsive**: Mobile-first en dashboard, la landing ya es responsive.

## Restricciones
- **NO simplificar** el código de la landing page — está listo para producción.
- **NO añadir dependencias** sin justificación clara.
- **NO cambiar variables CSS** (`--mg`, `--bg0`, etc.) — son el sistema de diseño.
- **Datos en España**: Todo hosting y procesamiento debe contemplar servidores EU/ES.
