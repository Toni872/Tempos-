# Tasks: S4 Go-Live + Auditoría Final

## Phase 1: Testing End-to-End GPS

- [x] 1.1 Configurar Playwright para testing móvil en `Frontend/tests/e2e-test-plan.md` - Instalar dependencias y configurar entorno móvil simulado
- [x] 1.2 Crear mocks GPS en `Backend/scratch/full-flow-test.js` - Implementar datos simulados de coordenadas GPS con precisión variable
- [x] 1.3 Implementar tests E2E para flujo de fichaje GPS en `Frontend/tests/` - Crear suite de tests que valide captura, validación y almacenamiento de GPS
- [x] 1.4 Validar consentimiento geolocalización en `Frontend/src/components/` - Implementar diálogo de consentimiento y verificación RGPD
- [x] 1.5 Probar exportación de datos legales en `Backend/src/controllers/` - Crear endpoint de exportación que incluya datos GPS auditados

## Phase 2: Auditoría Legal Final

- [x] 2.1 Crear script de validación compliance automatizada en `Backend/scripts/` - Desarrollar script que ejecute checklist RGPD automáticamente
- [ ] 2.2 Revisar documentación RGPD en `Backend/docs/compliance/` - Actualizar y validar todos documentos legales (DPA, PRIVACY_POLICY, TERMS_OF_SERVICE)
- [ ] 2.3 Verificar trazabilidad de cambios en `Backend/src/services/` - Implementar audit logs para cambios críticos con integridad criptográfica
- [ ] 2.4 Ejecutar checklist auditoría legal usando `Backend/validate-go-live.cjs` - Validar 100% compliance y generar reporte final

## Phase 3: Configuración Producción

- [ ] 3.1 Configurar variables de entorno para Railway en `Backend/` - Separar variables prod/staging/dev con encriptación
- [ ] 3.2 Gestionar secrets en producción usando Railway secrets manager - Migrar todas credenciales a variables encriptadas
- [ ] 3.3 Configurar logging Winston/PM2 en `Backend/src/` - Implementar logs estructurados con niveles y retención configurable
- [ ] 3.4 Implementar monitoreo y alertas en producción - Configurar dashboard básico y alertas para errores críticos

## Phase 4: Deployment Seguro

- [ ] 4.1 Configurar pipeline CI/CD GitHub Actions en `.github/workflows/` - Crear workflow para deploy gradual con rollback automático
- [ ] 4.2 Implementar health checks post-deployment en `Backend/src/` - Crear endpoints de health check para validación automática
- [ ] 4.3 Desarrollar plan de rollback automático en scripts de deploy - Backup DB pre-deploy y restauración en <30 minutos
- [ ] 4.4 Ejecutar validación post-deployment usando `Backend/validate-go-live.cjs` - Tests E2E post-deploy y reporte de estabilidad