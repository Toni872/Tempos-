import dotenv from 'dotenv';
dotenv.config();

// Fallback para desarrollo local si no hay .env
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://tempos_user:tempos_password_dev@localhost:5433/tempos_db';
}
