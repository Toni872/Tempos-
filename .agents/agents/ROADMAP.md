# Tempos — Roadmap de Lanzamiento y Escalabilidad
**Stack:** React 18 + Vite + Capacitor (Android) + Google Cloud  
**Objetivo:** Lanzar MVP a producción en 6-8 semanas, escalar a 10K usuarios en 6 meses.  
**Última actualización:** 23 de marzo de 2026

---

## 📋 Fases y Timeline

### **FASE 0: Pre-MVP (Semana -2 a 0) — Setup inicial**
**Duración:** 1-2 semanas  
**Coste:** €100-150 (gestión)  
**Estado:** ✅ Completado 70% (falta backend)

| Tarea | Dueño | Status | Fin |
|---|---|---|---|
| Proyecto creado (React + Vite) | Dev | ✅ | ✓ |
| Responsive mobile (grid CSS, hamburger nav) | Design+Dev | ✅ | ✓ |
| PWA (manifest, service worker, install banner) | Dev | ✅ | ✓ |
| Capacitor + Android setup | DevOps | ✅ | ✓ |
| Firebase Hosting config | DevOps | ✅ | ✓ |
| Cloud Build CI/CD pipeline | DevOps | ✅ | ✓ |
| **Falta: Backend API (Node.js + Cloud Run)** | Dev | 🔲 | Sem 1 |
| Diseño UX final (páginas principales) | Design | 🔲 | Sem 0 |

**Deliverables esperados:**
- ✅ RPM (`npm run deploy` funciona localmente)
- ✅ Asset bundle <3MB para APK de Capacitor
- 🔲 Primer endpoint API testeable (auth o home)

---

### **FASE 1: MVP Mínimo Viable (Semana 1-4) — Lanzamiento piloto**
**Duración:** 3-4 semanas  
**Coste mensual:** €15-80 (GCP free tier + SaaS básico)  
**Usuarios objetivo:** 0-50 (amigos, familia, early adopters)  
**Criterio de salida:** APK en Google Play, > 80% Lighthouse score

#### 1.1 Backend Core (Semana 1-2)
| Tarea | Subtareas | Estimación |
|---|---|---|
| **API REST en Cloud Run** | Node.js + Express starter | 3h |
| | POST /auth/login (Firebase Auth) | 4h |
| | POST /auth/register + validación | 4h |
| | Cloud SQL PostgreSQL connection pool | 2h |
| | Logs + error handling básico | 2h |
| **Deploy test** | Dockerfile + cloudbuild.yaml trigger | 3h |
| **Total Semana 1-2** | | **~18h (2-3 dev-days)** |

**Tecnologías:**
```
Backend: Node.js 20 + Express + TypeORM + Firebase SDK
DB: Cloud SQL PostgreSQL (db-g1-small, ~€15/mes)
Auth: Firebase Authentication (gratis <50K MAU)
Runtime: Cloud Run (2M req/mes gratis, luego ~€0.40/1M req)
SDK: google-cloud/secret-manager para env vars sensibles
```

#### 1.2 Autenticación (Semana 2)
| Tarea | Estimación |
|---|---|
| Fichas de usuario + JWT (backend) | 4h |
| Integración Firebase Auth frontend | 3h |
| Logout + refresh token | 2h |
| **Subtotal** | **9h** |

#### 1.3 Pantalla principal (Semana 2-3)
| Tarea | Estimación |
|---|---|
| Dashboard home (componente React) | 5h |
| Conectar a endpoint API GET /me | 2h |
| Testing responsivo Android | 2h |
| **Subtotal** | **9h** |

#### 1.4 Google Play + APK (Semana 3-4)
| Tarea | Estimación |
|---|---|
| Generar cert de firma (keytool) | 0.5h |
| Build APK release (Capacitor) | 1h |
| Creación bundle Google Play (30-min review) | 0.5h |
| Guía de instalación + soporte | 1h |
| **Subtotal** | **3h** |

**Hitos FASE 1:**
- ✅ API desplegada en Cloud Run (URL pública)
- ✅ APK disponible en Google Play (versión 0.1.0)
- ✅ Primeros 10 usuarios registrados
- ✅ Documentación API (Swagger/OpenAPI)

**Checklist de salida FASE 1:**
```
[ ] npm run deploy ejecuta sin errores
[ ] Cloud Build dispara en cada push a main
[ ] API responde <500ms desde Madrid
[ ] APK <20MB, instala sin errores en Android 10+
[ ] 3+ usuarios piloto + feedback recibido
[ ] Sentry está capturando errores (Sentry free)
[ ] Logs visibles en Cloud Logging
```

---

### **FASE 2: MVP Completo (Semana 5-8) — Público limitado**
**Duración:** 3-4 semanas  
**Coste mensual:** €50-150 (infraestructura + SaaS)  
**Usuarios objetivo:** 50-500 (beta abierta)  
**Criterio de salida:** Core features trabajando, <50ms p95 latencia

#### 2.1 Fichas (Semana 5)
| Tarea | Estimación |
|---|---|
| Modelo Ficha (PostgreSQL migration) | 2h |
| POST /fichas (crear) | 3h |
| GET /fichas (listar, paginado) | 3h |
| Frontend: panel de fichaje + botones | 6h |
| Testing (unitario + integración) | 4h |
| **Subtotal** | **18h** |

#### 2.2 Reportes básicos (Semana 6)
| Tarea | Estimación |
|---|---|
| GET /reportes/horas (resumen día/semana) | 4h |
| Gráficos con Recharts (frontend) | 5h |
| Exportar CSV | 2h |
| **Subtotal** | **11h** |

#### 2.3 Notificaciones + Push (Semana 6-7)
| Tarea | Estimación |
|---|---|
| Firebase Cloud Messaging setup | 3h |
| Backend: envío de notificaciones | 4h |
| Frontend: pedidores + serviceworker | 3h |
| Testing en dispositivos reales | 2h |
| **Subtotal** | **12h** |

#### 2.4 Performance + observabilidad (Semana 7)
| Tarea | Estimación |
|---|---|
| Lighthouse audit → 90+ score | 4h |
| Redis (Memorystore) para caché | 3h |
| Cloud Profiler activado | 1h |
| SLA / uptime tracking | 2h |
| **Subtotal** | **10h** |

#### 2.5 Marketing + onboarding (Semana 8)
| Tarea | Estimación |
|---|---|
| Landing page + CTA | 4h |
| Onboarding tutorial in-app | 4h |
| Email de bienvenida (Resend) | 2h |
| Google Analytics + events | 2h |
| **Subtotal** | **12h** |

**Infraestructura FASE 2:**
```
Cloud SQL: db-n1-standard-1 (~€30/mes, HA: +€30)
Cloud Run: CPU/mem auto-scale (minutos: 100, máx: 1000)
Redis: Memorystore basic tier (~€8/mes)
Cloud Logging: los primeros 50GB/mes incluidos
Monitoreo: Cloud Monitoring + Cloud Monitoring Dashboard
Seguridad: Cloud Armor WAF (básico ~€5/mes)
```

**Hitos FASE 2:**
- ✅ Fichas funcionales (crear, listar, editar)
- ✅ Report de horas por día/semana
- ✅ >100 usuarios activos
- ✅ Latencia p95 <100ms desde Madrid
- ✅ Uptime 99%+ (monitoreo activo)

---

### **FASE 3: Escala (Semana 9-16) — Crecimiento sostenible**
**Duración:** 2 meses  
**Coste mensual:** €150-400 (infraestructura optimizada)  
**Usuarios objetivo:** 500-2K  
**Criterio de salida:** SLP/SMTP integrado, plan premium, referral loop

#### 3.1 Integración pagos (Semana 9-10)
| Tarea | Estimación |
|---|---|
| Stripe webhook + SDK | 4h |
| Plans (Free / Pro) | 3h |
| Upgrade flow frontend | 5h |
| Facturación automática | 3h |
| **Subtotal** | **15h** |

**Precios propuestos:**
- Free: 0€/mes, 20 fichas/mes
- Pro: 4,99€/mes (o €49/año), ilimitado
- Enterprise: custom (contactar)

#### 3.2 Equipos / multiusuario (Semana 10-11)
| Tarea | Estimación |
|---|---|
| Modelo Team en PostgreSQL | 3h |
| Invitar miembros (email) | 4h |
| Roles (admin, user, viewer) | 3h |
| Compartir fichas por equipo | 5h |
| **Subtotal** | **15h** |

#### 3.3 Integraciones 3eras partes (Semana 12)
| Tarea | Estimación |
|---|---|
| Zapier / Make.com (webhook standard) | 2h |
| Slack notification | 3h |
| Google Calendar (read fichas) | 4h |
| Documentación API pública | 3h |
| **Subtotal** | **12h** |

#### 3.4 Mobile improvements (Semana 13)
| Tarea | Estimación |
|---|---|
| Offline support (local cache + sync) | 6h |
| Geolocalización opcional | 3h |
| Biometría (fingerprint/Face ID) | 4h |
| App badges / contador | 2h |
| **Subtotal** | **15h** |

#### 3.5 Compliance + Security (Semana 14)
| Tarea | Estimación |
|---|---|
| RGPD: data export + deletion | 4h |
| Pentest inicial (HackerOne brief) | 2h |
| SOC2 Type II audit (prep) | 3h |
| Privacy Policy + ToS modernización | 2h |
| SSL certificate renewal (auto con Cert Manager) | 0.5h |
| **Subtotal** | **11.5h** |

**Infraestructura FASE 3:**
```
Cloud SQL: db-n1-standard-2 HA + backups auto (€60-80/mes)
Cloud Run: CPUs dedicadas si P95 > 200ms
Cloud Memorystore: standard tier (€25/mes)
Cloud CDN: habilitado para static assets (€0.12/GB)
Cloud Amour WAF: plan estándar
Load Balancer: global
Multi-region: replicación DB read en europe-southwest1 (Madrid)
```

**Hitos FASE 3:**
- ✅ MRR > €1K (10-15 suscripciones Pro)
- ✅ >500 usuarios registrados
- ✅ 99.5% uptime
- ✅ Latencia p99 <200ms
- ✅ Churn < 5% MoM

---

### **FASE 4: Madurez (Semana 17+) — Optimización continua**
**Duración:** Open-ended  
**Coste mensual:** €400-1K (según escala)  
**Usuarios objetivo:** 2K-10K+  

#### 4.1 Analytics avanzados
- Cohort analysis (Posthog / Amplitude)
- Predicción de churn (ML basic)
- NPS tracking automático

#### 4.2 Automatización inteligente
- Sugerencias de horas (ML)
- Detección de anomalías en fichas
- Reportes automáticos por email

#### 4.3 Expansión geográfica (opcional)
- Localización: IT, FR, DE (si demanda)
- Cumplimiento fiscal por país
- Soporte multimoneda

#### 4.4 Enterprise
- SSO (Okta / Azure AD)
- Auditoría completa
- SLA contractual 99.9%

---

## 💰 Proyección de costes por fase

### Google Cloud (OPEX mensual)

| Servicio | MVP | Fase 1 | Fase 2 | Fase 3 |
|---|---|---|---|---|
| **Firebase Hosting** | €0 | €0 | €5 | €10 |
| **Cloud Run** | €0 | €20 | €45 | €80 |
| **Cloud SQL** | €15 | €15 | €50 | €70 |
| **Cloud Storage** | €0 | €2 | €5 | €10 |
| **Cloud Logging** | €0 | €0 | €10 | €20 |
| **Cloud Monitoring** | €0 | €0 | €8 | €15 |
| **Memorystore** | — | — | €10 | €25 |
| **Cloud CDN** | — | — | €0 | €5 |
| **Cloud Armor** | — | — | €5 | €15 |
| **Otras APIs** | €0 | €3 | €5 | €10 |
| **Subtotal GCP** | **€15** | **€40** | **€143** | **€260** |

### SaaS complementarios (OPEX mensual)

| Servicio | MVP | Fase 1-2 | Fase 3 |
|---|---|---|---|
| Email (Resend) | €0 | €15 | €20 |
| Sentry | €0 | €25 | €50 |
| GitHub | €0 | €0 | €8 |
| Figma | €0 | €0 | €12 |
| Stripe (1.5%+€0.25) | €0 | €5 | €50 |
| Posthog / Analytics | €0 | €0 | €30 |
| **Subtotal SaaS** | **€0** | **€45** | **€170** |

### **Total OPEX by Fase**
- **MVP:** €15-25/mes
- **Fase 1:** €85-125/mes
- **Fase 2:** €200-280/mes
- **Fase 3:** €430-650/mes

---

## 🎯 Riesgos y mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Retrasos en backend (dev skills) | Media | Alto | Freelancer externo dedicado Sem 1 |
| API lenta con >100 usuarios | Media | Medio | Benchmarking Sem 1, Redis desde Sem 2 |
| Churn alto (falta de features) | Alta | Alto | Onboarding fuerte, feedback loop Sem 6+ |
| Coste GCP sorpresa (logs) | Baja | Medio | Cloud Logging alerts desde día 1 |
| Rechazo de APK (Play Store) | Baja | Medio | Revisar reqs 3 días antes de submit |
| Seguridad: breach de datos | Muy baja | Crítico | Input validation + encryption + SIEM estrictos |

---

## 📊 Success metrics por fase

### MVP (Sem 4)
- [ ] ≥3 usuarios registrados
- [ ] 0 crashes en Sentry (o <1/día)
- [ ] APK <15MB
- [ ] Deploy automático funciona 100%

### Fase 1 (Sem 8)
- [ ] ≥50 usuarios registrados
- [ ] 80%+ Lighthouse score
- [ ] DAU/MAU ≥40%
- [ ] <1% error rate

### Fase 2 (Sem 14)
- [ ] ≥500 usuarios
- [ ] ≥10 usuarios pagos (MRR €50+)
- [ ] Churn <8% MoM
- [ ] Latencia p95 <150ms

### Fase 3 (Sem 20)
- [ ] ≥2K usuarios
- [ ] ≥100 usuarios pagos (MRR €500+)
- [ ] Churn 3-5% MoM (sostenible)
- [ ] 99.5% uptime

---

## 🚀 Próximas acciones inmediatas (SEMANA 1)

1. **Backend setup**
   - [ ] Crear repo backend (`tempos-api`)
   - [ ] Node.js + Express starter
   - [ ] Docker + Dockerfile
   - [ ] Primer deploy a Cloud Run

2. **Firebase**
   - [ ] Crear proyecto Firebase (`tempos-app`)
   - [ ] Habilitar Auth + Firestore o RTDB
   - [ ] Copiar config a `.env.local`

3. **Google Cloud**
   - [ ] Crear CloudSQL PostgreSQL instance
   - [ ] Crear Secret Manager secrets
   - [ ] Setup billing alerts (€20, €50, €100)

4. **Testing**
   - [ ] Probar deploy frontend con Firebase
   - [ ] Probar API localhost con curl
   - [ ] Conectar frontend → API

5. **Documentación**
   - [ ] Este ROADMAP en GitHub wiki
   - [ ] API docs (Swagger)
   - [ ] Deployment playbook

---

## 📅 Timeline resumen

```
Sem 0-1  │ ████ │ Setup + Backend MVP
Sem 2-3  │ ████ │ Auth + Dashboard
Sem 4    │ ██   │ Google Play launch
Sem 5-6  │ ████ │ Fichas + Reports
Sem 7-8  │ ████ │ Push notificaciones
Sem 9-10 │ ████ │ Pagos (Stripe)
Sem 11-14│ ████ │ Equipos + Integraciones
Sem 15+  │ ──── │ Mantenimiento + Growth
```

---

## 📝 Notas finales

- **Cualquier desviación >1semana en el timeline exigirá replanificación**
- **Prioridad siempre: usuario primero, feature segundo**
- **Reuniones de cierre de fase: breve retro + ajuste de plan**
- **KPIs principales: DAU, MRR, churn, latencia p95**
- **Punto de no retorno: Sem 4 (post-launch, no se puede deshacer)**

---

**Próxima revisión:** Sem 4 (post-MVP)  
**Dueño del roadmap:** Fundador + Tech lead
