# Listado de Subencargados Autorizados (Subprocessors)

Con el fin de ofrecer nuestro soporte B2B y mantener la alta disponibilidad y cifrado del sistema, Tempos hace uso de infraestructura de terceros actuando como sub-encargados en el sentido del RGPD. Estos han sido cuidadosamente seleccionados y cumplen idénticas garantías de soberanía del dato o han provisto las *SCCs (Cláusulas Contractuales Tipo)* exigidas por la Unión Europea.

### Infraestructura Core:
- **Proveedores en la Nube:** Proveedor Cloud de GCP (Google Ireland / EU) - Para Computación Principal (Cloud Run / Functions).
- **Procesadores de Bases de Datos Relacionales:** (Ej. Neon / Supabase o Cloud SQL). Para almacenamiento transaccional del Audit-Log.
- **Autenticación (Identity Provider):** Google Firebase Auth para custodiar e intercambiar contraseñas por JsonWebTokens.

Si un proveedor de infraestructura o servicio de correo electrónico fuese modificado o añadido a nuestra pila técnica, se considerará que los clientes otorgan una autorización tácita general si pasados 15 días tras ser notificados en el panel no se oponen al uso de este nuevo Subencargado.

---

# Ejercicio de Derechos (Flujo ARCO)
Dada la naturaleza del Estatuto de los Trabajadores en España, los datos de los empleados, su identidad y las horas que fichan *no pueden ser destruidos a capricho* como quien borra su cuenta de una Red Social, por la implicación penal tributaria o sancionatoria hacia la Empresa. El flujo de los derechos será:

1. **El interesado** solicita Rectificación, Cancelación u Oposición.
2. **Su Petición recae sobre la Empresa Empleadora**, NO sobre Tempos.
3. El Administrador de la Empresa Empleadora revisa si procede (Ej. Cancelación es legalmente imposible en los primeros 4 años del fichaje).
4. Si procede una modificación lícita y pactada para alterar una equivocación en hora trabajada, el Administrador usa las herramientas del Audit-Trail en Tempos (Corrección de Ficha) registrando obligatoriamente un **'Comentario' o 'Motivo'** el cual deja traza inalterable de quién ordenó este cambio.
