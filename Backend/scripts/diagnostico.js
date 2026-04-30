import './env-setup.js'; // Carga DATABASE_URL primero
import { AppDataSource } from '../dist/database.js';
import { User } from '../dist/entities/User.js';

async function diagnosticar() {
    console.log('🔍 Iniciando diagnóstico de sistema Tempos...');
    
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        
        const userRepo = AppDataSource.getRepository(User);
        const users = await userRepo.find();
        
        console.log(`\n📊 Estado de la base de datos:`);
        console.log(`- Usuarios registrados: ${users.length}`);
        
        if (users.length === 0) {
            console.log('⚠️  ALERTA: No hay usuarios en la base de datos. Por favor, regístrate de nuevo en la aplicación.');
            return;
        }

        // Si hay usuarios, nos aseguramos de que al menos uno sea ADMIN para que el sistema funcione
        const admins = users.filter(u => u.role === 'admin');
        if (admins.length === 0 && users.length > 0) {
            console.log('🔧 CORRECCIÓN: No se detectan administradores. Promocionando al primer usuario a ADMIN...');
            const firstUser = users[0];
            firstUser.role = 'admin';
            firstUser.status = 'active';
            await userRepo.save(firstUser);
            console.log(`✅ ÉXITO: Usuario ${firstUser.email} ahora es Administrador.`);
        } else {
            console.log(`✅ OK: Se detectan ${admins.length} administradores.`);
        }

        users.forEach(u => {
            console.log(`  > User: ${u.email} | Role: ${u.role} | Status: ${u.status} | Company: ${u.companyId}`);
        });

    } catch (error) {
        console.error('❌ ERROR FATAL en el diagnóstico:', error.message);
    } finally {
        await AppDataSource.destroy();
    }
}

diagnosticar();
