# Checklist Laboral (Go-Live Audit)

Revisión diseñada acorde al RDL 8/2019 (Registro Jornada Laboral), Guía Práctica MTIN y Criterios Operativos 115/2021 de la ITSS.

## [Puntos Críticos 🚨]: Infranqueables antes de la Venta B2B
- [ ] **1. Universalidad Diaria:** ¿El programa habilita y fuerza fichar a TODO el personal (oficina y trabajo en remoto)?
- [ ] **2. Trazabilidad Inalterable:** ¿Las correcciones de los encargados generan un log (TimeEntryChangeLog) detallando fecha de cambio, quién cambia y motivo en vez de sobre-escribir la base de datos subyacente sin rastro?
- [ ] **3. Inicios y Cierres Seguros:** ¿Los fichajes marcan hora de origen del clic (Web Kiosk / Móvil) previniendo que cualquiera inserte el número 08:00 repetidamente con un botón manual sin rastro de IP ni metadata?
- [ ] **4. Geoposición Justificada:** Si el empleado está geolocalizado, ¿Recibe el terminal / navegador la alerta de consentimiento por primera vez al solicitar el API "navigator.geolocation"?
- [ ] **5. Garantía de 4 años:** ¿Prevé el software el NO borrado prematuro de los logs y un expurgo al llegar a 4 años?
- [ ] **6. Privacidad Role-based:** ¿Los empleados no ven lo de otros, salvo los que tengan explícitamente rol de Auditor / Manager?
- [ ] **7. Generador a Exportación Invariable:** ¿Permite aislar y exportar de forma veloz a papel o digital a través de "Informes" sin posibilidad de cambiar el CSV sobre la marcha en la interfaz web?
- [ ] **8. Aislamiento Empresarial Efectivo:** Un UID o token de una Empresa A *no puede* de ningún modo hacer leak para leer `fichas` de los UID de una Empresa B. (Se verifica vía SQL Intersect/Where Clauses controlados firmemente en el backend).

## [Puntos Importantes 🟡]: Robustez como SaaS
- [ ] 9. Interfaz libre del "Paternalismo Excesivo": Permite a administradores arreglar un olvido de su empleado creando un evento "Offline/Manual" o con aprobación, porque si no pueden los administradores el software no es vendible para contingencias comunes.
- [ ] 10. Alojamiento UE. Los servidores en Cloud corren en "europe-westx" (es España, Alemania, Francia o Holanda). Firebase no manda tokens inyectados PII a USA.
- [ ] 11. ¿Enlace claro al DPA/Términos desde la pasarela de suscripción?
- [ ] 12. Logs operativos rotan adecuadamente para no saturar disco.
- [ ] 13. Funciona la alerta de fallos para notificar caídas.
