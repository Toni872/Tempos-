import './env-setup.js';
import { AppDataSource } from '../dist/database.js';

async function resetYReparar() {
    console.log('🚀 Iniciando REINICIO TOTAL de Tempos...');
    
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        // Borrado en cascada de TODAS las tablas
        console.log('🧹 Vaciando tablas...');
        const tables = [
            'time_entry_change_logs', 'time_entries', 'fichas', 'shifts', 
            'schedules', 'absences', 'work_centers', 'audit_logs', 'users'
        ];
        
        for (const table of tables) {
            try {
                await queryRunner.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
                console.log(`  ✅ Tabla "${table}" vaciada.`);
            } catch {
                console.log(`  ⚠️  No se pudo vaciar "${table}" (quizás no existe aún).`);
            }
        }

        console.log('\n✨ Sistema reiniciado. La base de datos está totalmente vacía.');
        console.log('👉 Próximo paso: Ve a la web y REGÍSTRATE con tu email real.');

        await queryRunner.release();

    } catch (error) {
        console.error('❌ ERROR durante el reset:', error.message);
    } finally {
        await AppDataSource.destroy();
    }
}

resetYReparar();
