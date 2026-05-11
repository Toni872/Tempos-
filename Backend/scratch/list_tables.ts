/// <reference types="node" />
import { DataSource } from 'typeorm';
import 'dotenv/config';

async function list() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await ds.initialize();
  const tables = await ds.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log("TABLES:", tables.map((t: any) => t.table_name));
  
  if (tables.length > 0) {
    const columns = await ds.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    console.log("COLUMNS IN users:", columns.map((c: any) => c.column_name));
  }
  
  await ds.destroy();
}

list();
