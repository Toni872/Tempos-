import { AppDataSource } from "../database.js";
import { Ficha } from "../entities/Ficha.js";
import { TimeEntry } from "../entities/TimeEntry.js";
import { TimeEntryChangeLog } from "../entities/TimeEntryChangeLog.js";
import { LessThan } from "typeorm";

export class RetentionService {
  /**
   * Elimina registros de fichaje más antiguos de N años (por defecto 4 años según Art. 34.9 ET).
   * @param years Number of years to keep
   * @returns result object with counts
   */
  static async purgeOldRecords(years: number = 4) {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - years);

    console.log(
      `[GDPR] Iniciando purga de registros anteriores a: ${cutoffDate.toISOString()}`,
    );

    const fichaRepo = AppDataSource.getRepository(Ficha);
    const entryRepo = AppDataSource.getRepository(TimeEntry);
    const logRepo = AppDataSource.getRepository(TimeEntryChangeLog);

    // 1. Encontrar fichas a eliminar
    const oldFichas = await fichaRepo.find({
      where: {
        date: LessThan(cutoffDate),
      },
      select: ["id"],
    });

    const fichaIds = oldFichas.map((f) => f.id);

    if (fichaIds.length === 0) {
      return { fichasDeleted: 0, entriesDeleted: 0, logsDeleted: 0 };
    }

    // 2. Encontrar TimeEntries asociados (algunos podrían no estar vinculados a fichas, por seguridad buscamos por fecha)
    const oldEntries = await entryRepo.find({
      where: {
        timestampUtc: LessThan(cutoffDate),
      },
      select: ["id"],
    });
    const entryIds = oldEntries.map((e) => e.id);

    // 3. Eliminar ChangeLogs primero (por FK)
    let logsDeleted = 0;
    if (entryIds.length > 0) {
      const logDeleteRes = await logRepo
        .createQueryBuilder()
        .delete()
        .where("timeEntryId IN (:...ids)", { ids: entryIds })
        .execute();
      logsDeleted = logDeleteRes.affected || 0;
    }

    // 4. Eliminar TimeEntries
    let entriesDeleted = 0;
    if (entryIds.length > 0) {
      const entryDeleteRes = await entryRepo.delete(entryIds);
      entriesDeleted = entryDeleteRes.affected || 0;
    }

    // 5. Eliminar Fichas
    const fichaDeleteRes = await fichaRepo.delete(fichaIds);
    const fichasDeleted = fichaDeleteRes.affected || 0;

    console.log(
      `[GDPR] Purga completada: ${fichasDeleted} fichas, ${entriesDeleted} entradas, ${logsDeleted} logs.`,
    );

    return { fichasDeleted, entriesDeleted, logsDeleted };
  }
}
