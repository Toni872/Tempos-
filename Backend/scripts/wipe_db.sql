-- Script de limpieza total para Tempos HR
-- Propósito: Dejar la base de datos vacía para pruebas reales de gerencia

-- Desactivar restricciones de claves foráneas temporalmente para limpieza rápida
SET session_replication_role = 'replica';

TRUNCATE TABLE 
    time_entry_change_logs,
    time_entries,
    fichas,
    shifts,
    schedules,
    absences,
    work_centers,
    audit_logs,
    users
RESTART IDENTITY CASCADE;

-- Reactivar restricciones
SET session_replication_role = 'origin';

-- Verificar limpieza
SELECT 'Limpieza completada con éxito' as status;
