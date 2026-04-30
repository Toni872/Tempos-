/**
 * Entorno de Test Seguro:
 * Este archivo debe importarse PRIMERO en los tests para asegurar que
 * el entorno esté configurado antes de cargar los módulos del sistema.
 */
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test_db";
process.env.NODE_ENV = "test";
