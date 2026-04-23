import { DataSource } from 'typeorm';
import { User } from './entities/User.js';
import { Ficha } from './entities/Ficha.js';
import { Absence } from './entities/Absence.js';
import { Document } from './entities/Document.js';
import { AuditLog } from './entities/AuditLog.js';
import { TimeEntry } from './entities/TimeEntry.js';
import { TimeEntryChangeLog } from './entities/TimeEntryChangeLog.js';
import { WorkCenter } from './entities/WorkCenter.js';
import { Schedule } from './entities/Schedule.js';
import { Shift } from './entities/Shift.js';
import { Message } from './entities/Message.js';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('\nERROR: DATABASE_URL no definido. Copia Backend/.env.example a .env y rellena DATABASE_URL.\n');
  throw new Error('DATABASE_URL no definido');
}

// Validación temprana para evitar errores crípticos de pg (SASL: client password must be a string)
try {
  const parsed = new URL(dbUrl);
  // parsed.password devuelve cadena vacía si no hay password
  if (typeof parsed.password !== 'string' || parsed.password.length === 0) {
    console.warn('\nADVERTENCIA: la URL de la BD no contiene contraseña. Asegúrate de que DATABASE_URL tenga el formato:\n  postgresql://user:password@host:port/dbname\n');
  }
} catch (err) {
  console.error('\nERROR: DATABASE_URL malformado: ' + String(err) + '\nRevisa el formato en Backend/.env.example.\n');
  throw err;
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: dbUrl,
  synchronize: process.env.NODE_ENV === 'development', // Solo en dev
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Ficha, Absence, Document, AuditLog, TimeEntry, TimeEntryChangeLog, WorkCenter, Schedule, Shift, Message],
  migrations: process.env.NODE_ENV === 'production' ? ['dist/migrations/**/*.js'] : [],
  subscribers: [],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
