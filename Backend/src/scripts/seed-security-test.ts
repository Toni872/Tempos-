import "dotenv/config";
import { AppDataSource } from "../database.js";
import { WorkCenter } from "../entities/WorkCenter.js";
import { User } from "../entities/User.js";

const ADMIN_UID = "00000000-0000-0000-0000-000000000001";
const EMPLOYEE_UID = "00000000-0000-0000-0000-000000000002";

async function seed() {
  await AppDataSource.initialize();
  console.log("Base de datos conectada");

  const workCenterRepo = AppDataSource.getRepository(WorkCenter);
  const userRepo = AppDataSource.getRepository(User);

  // 1. Crear Sede de Prueba (Sol, Madrid)
  let center = await workCenterRepo.findOneBy({
    name: "Oficina Central (Sol)",
  });
  if (!center) {
    center = workCenterRepo.create({
      name: "Oficina Central (Sol)",
      address: "Puerta del Sol, Madrid",
      latitude: 40.4168,
      longitude: -3.7038,
      radiusMeters: 100000,
      qrToken: "QR-TEST-123",
      companyId: "tempos-demo",
      status: "active",
    });
    await workCenterRepo.save(center);
    console.log("Sede creada: Oficina Central (Sol) con QR: QR-TEST-123");
  } else {
    center.radiusMeters = 100000;
    await workCenterRepo.save(center);
    console.log("Sede Oficina Central (Sol) actualizada con radio de 100km.");
  }

  // 2. Configurar usuario admin
  let admin = await userRepo.findOneBy({ uid: ADMIN_UID });
  if (!admin) {
    console.log("Creando admin local...");
    admin = userRepo.create({
      uid: ADMIN_UID,
      email: "dev-admin@tempos.es",
      displayName: "Dev Admin",
      role: "admin",
      companyId: "tempos-demo",
      status: "active",
    });
  }
  admin.requiresGeolocation = true;
  admin.requiresQR = true;
  await userRepo.save(admin);
  console.log("Admin configurado.");

  // 3. Configurar usuario empleado
  let emp = await userRepo.findOneBy({ uid: EMPLOYEE_UID });
  if (!emp) {
    console.log("Creando empleado local...");
    emp = userRepo.create({
      uid: EMPLOYEE_UID,
      email: "dev-employee@tempos.es",
      displayName: "Dev Employee",
      role: "employee",
      companyId: "tempos-demo",
      status: "active",
    });
  }
  emp.requiresGeolocation = true;
  emp.requiresQR = true;
  await userRepo.save(emp);
  console.log("Empleado configurado.");

  await AppDataSource.destroy();
}

seed().catch(console.error);
