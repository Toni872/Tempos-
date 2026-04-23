# Tempos E2E Test Suite

## Test Matrix

| # | Test | Route | Expected |
|---|------|-------|----------|
| 1 | Login page loads | `/login` | Auth form visible, Google button present |
| 2 | Dashboard loads (admin) | `/dashboard` | Full sidebar with Equipo, Sedes, Informes |
| 3 | Dashboard loads (employee) | `/dashboard` | Simplified sidebar: Inicio, Horarios, Ausencias, Documentos |
| 4 | Clock in button visible | `/dashboard` | "Iniciar Jornada" button renders |
| 5 | Horarios tab (admin) | `/dashboard` → Horarios | SchedulingGrid with "Planificador Semanal" |
| 6 | Horarios tab (employee) | `/dashboard` → Horarios | "Tu Jornada de Hoy" card |
| 7 | Equipo tab | `/dashboard` → Equipo | Employee table with "Nuevo Empleado" button |
| 8 | Informes tab | `/dashboard` → Informes | Audit log section visible |
| 9 | Kiosk page | `/kiosk` | PIN input grid renders |
| 10 | Build passes | N/A | `vite build` exits 0 |

## Results

Test 10 (Build): PASS — 0 errors, 760 modules, built in 3.88s
