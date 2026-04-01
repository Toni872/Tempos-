import 'dotenv/config';
import { AppDataSource } from '../database.js';
import { User } from '../entities/User.js';
import { Ficha } from '../entities/Ficha.js';
import { Absence } from '../entities/Absence.js';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const fichaRepo = AppDataSource.getRepository(Ficha);
  const absenceRepo = AppDataSource.getRepository(Absence);

  // Usuarios de ejemplo
  const users = [
    { uid: uuidv4(), email: 'alice@example.com', displayName: 'Alice', emailVerified: true, status: 'active' },
    { uid: uuidv4(), email: 'bob@example.com', displayName: 'Bob', emailVerified: true, status: 'active' },
    { uid: uuidv4(), email: 'carol@example.com', displayName: 'Carol', emailVerified: false, status: 'active' },
  ];

  for (const u of users) {
    const exists = await userRepo.findOneBy({ email: u.email });
    if (!exists) await userRepo.save(userRepo.create(u as any));
  }

  const alice = await userRepo.findOneBy({ email: 'alice@example.com' });
  if (alice) {
    const fichas = [
      { userId: alice.uid, date: new Date('2026-03-30'), startTime: '09:00', endTime: '17:00', hoursWorked: 8.0, description: 'Trabajo', status: 'confirmed' },
      { userId: alice.uid, date: new Date('2026-03-31'), startTime: '09:15', endTime: '17:05', hoursWorked: 7.83, description: 'Trabajo', status: 'confirmed' },
    ];
    for (const f of fichas) {
      await fichaRepo.save(fichaRepo.create(f as any));
    }
  }

  const bob = await userRepo.findOneBy({ email: 'bob@example.com' });
  if (bob) {
    await absenceRepo.save(absenceRepo.create({
      userId: bob.uid,
      type: 'vacation',
      startDate: new Date('2026-04-10'),
      endDate: new Date('2026-04-14'),
      status: 'approved',
      reason: 'Vacaciones',
    } as any));
  }

  console.log('Seed completed');
  await AppDataSource.destroy();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
