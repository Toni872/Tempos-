import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";
import { Ficha } from "../entities/Ficha.js";
import { Schedule } from "../entities/Schedule.js";
import { Shift } from "../entities/Shift.js";

export class AutoClockService {
  /**
   * Ejecuta el proceso de fichaje automático para todos los usuarios activos.
   */
  static async processAllAutoClocks() {
    console.log("🕒 [AUTO-CLOCK] Iniciando proceso masivo...");
    const userRepo = AppDataSource.getRepository(User);
    const users = await userRepo.find({ where: { hasAutoClock: true } });

    for (const user of users) {
      await this.processUserAutoClock(user);
    }
    console.log("✅ [AUTO-CLOCK] Proceso finalizado.");
  }

  /**
   * Procesa el fichaje automático para un usuario específico hoy.
   */
  static async processUserAutoClock(user: User) {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1=Lunes, 7=Domingo
    
    // 1. Obtener horario asignado
    const schedule = await this.getUserScheduleForToday(user.uid, dayOfWeek);
    if (!schedule) return;

    // 2. Crear registros
    const dateStr = now.toISOString().split('T')[0];
    
    // Turno 1
    await this.ensureFicha(user, dateStr, schedule.startTime, schedule.endTime, "Turno Mañana (Auto)");
    
    // Turno 2 (si existe)
    if (schedule.startTime2 && schedule.endTime2) {
      await this.ensureFicha(user, dateStr, schedule.startTime2, schedule.endTime2, "Turno Tarde (Auto)");
    }
  }

  private static async getUserScheduleForToday(userId: string, day: number): Promise<Schedule | null> {
    const shiftRepo = AppDataSource.getRepository(Shift);
    
    // Buscamos asignación activa (suponiendo que Shift es el nexo entre User y Schedule)
    const assignment = await shiftRepo.findOne({
      where: { userId },
      relations: ["schedule"]
    });

    if (!assignment || !assignment.schedule) return null;
    
    // Verificar si hoy es día laboral en ese horario
    const days = assignment.schedule.daysOfWeek || [];
    if (!days.includes(day)) return null;

    return assignment.schedule;
  }

  private static async ensureFicha(user: User, date: string, start: string, end: string, desc: string) {
    const fichaRepo = AppDataSource.getRepository(Ficha);
    
    // Verificar si ya existe una ficha que empiece a esa misma hora para ese día
    const exists = await fichaRepo.findOne({
      where: { userId: user.uid, date: new Date(date) as any, startTime: start }
    });

    if (exists) return;

    console.log(`📝 [AUTO-CLOCK] Creando ficha para ${user.email}: ${start} - ${end}`);
    
    const ficha = fichaRepo.create({
      userId: user.uid,
      date: new Date(date),
      startTime: start,
      endTime: end,
      status: "confirmed",
      description: desc,
      clockInMethod: "qr", // Marcamos como QR para indicar que es "seguro/automático"
      clockOutMethod: "qr"
    });

    // Calcular horas
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    ficha.hoursWorked = parseFloat((( (h2*60 + m2) - (h1*60 + m1) ) / 60).toFixed(2));

    await fichaRepo.save(ficha);
  }
}
