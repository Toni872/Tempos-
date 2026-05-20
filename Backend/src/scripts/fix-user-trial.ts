import 'dotenv/config';
import { AppDataSource } from '../database.js';
import { User } from '../entities/User.js';

async function fix() {
  try {
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { email: 'contact@script-9.com' } });
    
    if (user) {
      const expires = new Date();
      expires.setDate(expires.getDate() + 14);
      
      user.isTrial = true;
      user.trialExpiresAt = expires;
      
      await repo.save(user);
      console.log('✅ Usuario actualizado con 14 días de Trial.');
    } else {
      console.log('❌ Usuario no encontrado.');
    }
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fix();
