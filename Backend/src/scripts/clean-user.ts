
import { AppDataSource } from '../database.js';
import { User } from '../entities/User.js';

async function clean() {
  try {
    console.log('🔄 Conectando a la base de datos para limpieza...');
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(User);
    
    // Borramos por email (ignorando mayúsculas/minúsculas)
    const result = await repo.createQueryBuilder()
      .delete()
      .from(User)
      .where("LOWER(email) = LOWER(:email)", { email: 'contact@script-9.com' })
      .execute();
      
    console.log(`✅ Base de datos limpia. Registros afectados: ${result.affected}`);
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
    process.exit(1);
  }
}

clean();
