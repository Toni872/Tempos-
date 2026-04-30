import './env-setup.js';
import { AppDataSource } from '../dist/database.js';
import { Ficha } from '../dist/entities/Ficha.js';

async function runAudit() {
  console.log('🔍 Iniciando Auditoría de Retención RGPD (4 años)...');
  
  try {
    // Aseguramos que el entorno tenga la URL de la DB
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://tempos_user:tempos_password_dev@localhost:5433/tempos_db';

    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(Ficha);
    
    const now = new Date();
    const fourYearsAgo = new Date();
    fourYearsAgo.setFullYear(now.getFullYear() - 4);
    
    const stats = await repo.createQueryBuilder('ficha')
      .select('COUNT(*)', 'total')
      .addSelect('MIN(date)', 'oldest')
      .addSelect('MAX(date)', 'newest')
      .getRawOne();
      
    console.log(`\n📊 Resumen de Base de Datos:`);
    console.log(`- Total de fichajes: ${stats.total}`);
    console.log(`- Registro más antiguo: ${stats.oldest}`);
    console.log(`- Registro más reciente: ${stats.newest}`);
    
    const oldestDate = new Date(stats.oldest);
    if (!stats.oldest || oldestDate > fourYearsAgo) {
      console.log('\n✅ CUMPLIMIENTO: Todos los registros están dentro del periodo de retención legal (4 años).');
    } else {
      console.log('\n⚠️  ATENCIÓN: Existen registros de más de 4 años que podrían ser anonimizados según el RGPD.');
    }
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en la auditoría:', err.message);
    process.exit(1);
  }
}

runAudit();
