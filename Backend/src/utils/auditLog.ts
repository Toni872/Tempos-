import { AppDataSource } from "../database.js";
import { AuditLog } from "../entities/AuditLog.js";

interface LogActionParams {
  userId?: string;
  companyId?: string;
  action: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/**
 * Fire-and-forget audit log writer.
 * Never throws — a log failure must never break the main request.
 */
export async function logAction(params: LogActionParams): Promise<void> {
  try {
    const repo = AppDataSource.getRepository(AuditLog);
    const entry = repo.create({
      userId: params.userId,
      companyId: params.companyId,
      action: params.action,
      metadata: params.metadata,
      ip: params.ip,
      userAgent: params.userAgent,
    });
    await repo.save(entry);
  } catch {
    // Silent — do not let audit failures affect business logic
  }
}
