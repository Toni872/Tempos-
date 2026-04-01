# Tempos — Contexto del Proyecto

## ¿Qué es Tempos?
SaaS de **control horario legal** para pymes y autónomos en España. Cumple el Real Decreto 8/2019 que obliga a registrar la jornada laboral de todos los empleados.

## Modelo de Negocio
- **Autónomos**: 9€/mes (1 usuario)
- **Empresas**: 4€/empleado/mes (ilimitados)
- **Enterprise**: Contacto personalizado (100+ empleados)
- **Trial**: 14 días gratis, sin tarjeta de crédito

## Funcionalidades Clave
1. **Fichaje**: Clock-in/clock-out desde móvil, web o tablet
2. **Panel de control**: Tiempo real, empleados activos, pausas, horas extra
3. **Informes legales**: PDF/Excel con firma digital para Inspección de Trabajo
4. **Auditoría inmutable**: Log de cambios requerido por ley
5. **Multi-tenant**: Cada empresa aislada con sus datos
6. **Geolocalización** (opcional): Verificar ubicación del fichaje

## Base de Datos (PostgreSQL)
- `companies` — empresas (id, name, cif)
- `employees` — empleados (company_id, name, email, phone)
- `timesheets` — fichajes (employee_id, clock_in, clock_out, break_duration)
- `timesheet_audit` — auditoría legal (timesheet_id, action, old_data, new_data)

## API Endpoints (FastAPI, fase 2)
- `POST /api/v1/auth/register` — registro empresa
- `POST /api/v1/auth/login` — login JWT
- `POST /api/v1/timesheets/clock` — fichaje IN/OUT toggle
- `GET /api/v1/timesheets` — lista fichajes empresa
- `GET /api/v1/reports/daily` — informe legal PDF

## Diseño Visual
- **Tema oscuro premium** (fondo #141414)
- **Color primario**: magenta #e8007d
- **Tipografías**: Cormorant Garamond + DM Sans
- **Animaciones**: Float, glow-breathe, reveal, scanline
- **iPhone 17 mockup interactivo** en landing
- **Glassmorphism** sutil en navbar y cards

## Estado Actual
- ✅ Landing page completa (`Frontend/src/pages/LandingPage.jsx`)
- ✅ Router con code splitting base (lazy routes + Suspense)
- ✅ Workflow de hardening frontend definido en `.agents/workflows/frontend-hardening.md`
- ⬜ Dashboard empleados
- ⬜ Sistema de autenticación
- ⬜ Backend API
- ⬜ Base de datos
