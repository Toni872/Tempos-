import 'dotenv/config';
import { DataSource } from 'typeorm';

const ds = new DataSource({
  type: 'postgres',
  host: '127.0.0.1',
  port: 5432,
  username: 'tempos_user',
  password: 'tempos_password_dev',
  database: 'tempos_db',
  synchronize: false,
});

async function run() {
  await ds.initialize();
  const qb = ds.createQueryRunner();
  await qb.query(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id SERIAL PRIMARY KEY,
      uid VARCHAR(128) NOT NULL,
      email VARCHAR(255) NOT NULL,
      token VARCHAR(64) NOT NULL UNIQUE,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      used BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✅ Tabla email_verifications creada o ya existe');
  await ds.destroy();
  process.exit(0);
}

run().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });