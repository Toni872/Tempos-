import pg from 'pg';
import 'dotenv/config';

async function run() {
  const client = new pg.Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    
    // 1. Obtener UID del usuario de prueba
    const userRes = await client.query("SELECT uid FROM users WHERE email = 'user@tempos.es'");
    if (userRes.rows.length === 0) {
      console.log("❌ Usuario user@tempos.es no encontrado.");
      return;
    }
    const uid = userRes.rows[0].uid;

    // 2. Cerrar cualquier jornada que esté abierta (endTime IS NULL)
    const updateRes = await client.query(
      "UPDATE fichas SET \"endTime\" = '20:00:00', status = 'confirmed' WHERE \"userId\" = $1 AND \"endTime\" IS NULL",
      [uid]
    );
    console.log(`✅ Jornadas cerradas: ${updateRes.rowCount}`);

    // 3. Desactivar GPS obligatorio para este usuario
    await client.query(
      "UPDATE users SET \"requiresGeolocation\" = false WHERE uid = $1",
      [uid]
    );
    console.log("✅ GPS obligatorio desactivado.");

  } catch (err) {
    console.error("❌ Error en la limpieza:", err);
  } finally {
    await client.end();
  }
}

run();
