import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";
import { Ficha } from "../entities/Ficha.js";
import { WorkCenter } from "../entities/WorkCenter.js";
import { Shift } from "../entities/Shift.js";

export interface Anomaly {
  type: "missed_clock_in" | "out_of_bounds" | "late_arrival";
  userId: string;
  userName: string;
  severity: "low" | "medium" | "high";
  details: string;
  timestamp: string;
}

/**
 * AnomalyService
 * Detección en tiempo real de irregularidades operativas:
 *  - Fichajes ausentes (missed_clock_in)
 *  - Fichajes fuera del radio autorizado (out_of_bounds)
 *
 * Los repositorios se instancian una sola vez y las queries se minimizan
 * para evitar N+1 en compañías con muchos empleados.
 */
export class AnomalyService {
  static async getDailyAnomalies(companyId: string): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

    // Instanciar repos una sola vez fuera del loop
    const userRepo = AppDataSource.getRepository(User);
    const shiftRepo = AppDataSource.getRepository(Shift);
    const fichaRepo = AppDataSource.getRepository(Ficha);
    const workCenterRepo = AppDataSource.getRepository(WorkCenter);

    const users = await userRepo.find({
      where: { companyId, status: "active" },
    });

    if (users.length === 0) return anomalies;

    // Pre-cargar datos en batch para evitar N+1
    const userUids = users.map((u) => u.uid);

    const [allShifts, todayFichas, workCenters] = await Promise.all([
      shiftRepo.find({
        where: userUids.map((uid) => ({ userId: uid })),
        relations: ["schedule"],
      }),
      fichaRepo
        .createQueryBuilder("f")
        .where("f.userId IN (:...uids)", { uids: userUids })
        .andWhere("f.date = :today", { today: todayStr })
        .getMany(),
      workCenterRepo.find({
        where: { companyId, status: "active" },
      }),
    ]);

    // Indexar para O(1) lookups
    const shiftByUser = new Map<string, (typeof allShifts)[0]>();
    for (const s of allShifts) shiftByUser.set(s.userId, s);

    const fichasByUser = new Map<string, (typeof todayFichas)>();
    for (const f of todayFichas) {
      const arr = fichasByUser.get(f.userId) ?? [];
      arr.push(f);
      fichasByUser.set(f.userId, arr);
    }

    for (const user of users) {
      // --- 1. Detección de fichaje ausente ---
      const shift = shiftByUser.get(user.uid);
      const schedule = shift?.schedule;

      if (schedule?.daysOfWeek?.includes(dayOfWeek)) {
        const [startH, startM] = schedule.startTime.split(":").map(Number);
        if (isNaN(startH) || isNaN(startM)) continue;

        const gracePeriod = schedule.gracePeriodMinutes ?? 15;
        const scheduledStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          startH,
          startM,
        );
        const deadline = scheduledStart.getTime() + gracePeriod * 60_000;

        const userFichas = fichasByUser.get(user.uid) ?? [];

        if (userFichas.length === 0 && now.getTime() > deadline) {
          anomalies.push({
            type: "missed_clock_in",
            userId: user.uid,
            userName: user.displayName || user.email,
            severity: "high",
            details: `No ha fichado la entrada programada a las ${schedule.startTime}`,
            timestamp: now.toISOString(),
          });
        }
      }

      // --- 2. Detección fuera de rango (GPS) ---
      const userFichas = fichasByUser.get(user.uid) ?? [];
      for (const f of userFichas) {
        if (f.status !== "confirmed") continue;

        const fichaLoc = this.parseFichaLocation(f);
        if (!fichaLoc) continue;

        // Buscar el centro de trabajo más cercano
        for (const wc of workCenters) {
          if (!wc.latitude || !wc.longitude) continue;

          const dist = this.calculateDistance(
            fichaLoc.lat,
            fichaLoc.lng,
            Number(wc.latitude),
            Number(wc.longitude),
          );

          if (dist > (wc.radiusMeters || 500)) {
            anomalies.push({
              type: "out_of_bounds",
              userId: user.uid,
              userName: user.displayName || user.email,
              severity: "medium",
              details: `Fichaje a ${Math.round(dist)}m del centro "${wc.name || "principal"}"`,
              timestamp: f.startTime || now.toISOString(),
            });
            break; // Solo reportar una vez por ficha
          }
        }
      }
    }

    return anomalies;
  }

  /**
   * Extrae lat/lng del campo metadata.location de una Ficha.
   * Soporta formato string "lat,lng" y objeto {lat, lng}.
   */
  private static parseFichaLocation(
    ficha: Ficha,
  ): { lat: number; lng: number } | null {
    const raw = ficha.metadata?.location;
    if (!raw) return null;

    if (typeof raw === "string") {
      const [lat, lng] = raw.split(",").map(Number);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    // Guardia defensiva: metadata.location puede ser objeto en datos legacy
    const obj = raw as unknown as Record<string, unknown>;
    if (typeof obj === "object" && "lat" in obj && "lng" in obj) {
      return { lat: Number(obj.lat), lng: Number(obj.lng) };
    }

    return null;
  }

  /** Haversine: distancia en metros entre dos coordenadas. */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6_371_000; // Radio de la Tierra en metros
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
