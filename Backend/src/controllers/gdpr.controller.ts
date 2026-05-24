import { Request, Response } from "express";
import { AppDataSource } from "../database.js";
import { TimeEntry } from "../entities/TimeEntry.js";
import { User } from "../entities/User.js";
import { AuditLog } from "../entities/AuditLog.js";
import { logger } from "../utils/logger.js";
import { getAuthContext } from "../middleware/request-context.middleware.js";

export class GdprController {
  /**
   * RGPD Article 15: Right of Access
   * Allow users to access their personal data including GPS information
   */
  static async accessPersonalData(req: Request, res: Response) {
    try {
      const auth = getAuthContext(req);
      const userId = auth.uid;

      // Get user's time entries with GPS data
      const timeEntryRepository = AppDataSource.getRepository(TimeEntry);
      const userTimeEntries = await timeEntryRepository.find({
        where: { userId },
        order: { createdAt: "DESC" },
      });

      // Get user's profile data (excluding sensitive fields)
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { uid: userId },
        select: [
          "uid",
          "email",
          "displayName",
          "companyId",
          "role",
          "createdAt",
          "hasAcceptedTerms",
          "acceptedTermsAt",
        ],
      });

      // Log access request
      await this.logGdprAction(
        userId,
        "ACCESS_REQUEST",
        "User requested access to personal data",
      );

      const personalData = {
        user: user,
        timeEntries: userTimeEntries.map((entry) => ({
          id: entry.id,
          timestampUtc: entry.timestampUtc,
          type: entry.type,
          latitude: entry.latitude,
          longitude: entry.longitude,
          source: entry.source,
          createdAt: entry.createdAt,
          metadata: entry.metadata,
        })),
        exportDate: new Date().toISOString(),
        retentionPeriod: "4 years from creation date",
      };

      res.json({
        success: true,
        data: personalData,
        message: "Personal data exported successfully",
      });
    } catch (error: any) {
      logger.error("GDPR access request failed", {
        error: error.message,
        userId: getAuthContext(req).uid,
      });
      res.status(500).json({ error: "Failed to access personal data" });
    }
  }

  /**
   * RGPD Article 16: Right to Rectification
   * Allow users to correct inaccurate GPS data
   */
  static async rectifyData(req: Request, res: Response) {
    try {
      const auth = getAuthContext(req);
      const userId = auth.uid;
      const { timeEntryId, corrections } = req.body;

      if (!userId || !timeEntryId) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      const timeEntryRepository = AppDataSource.getRepository(TimeEntry);
      const timeEntry = await timeEntryRepository.findOne({
        where: { id: timeEntryId, userId },
      });

      if (!timeEntry) {
        res.status(404).json({ error: "Time entry not found" });
        return;
      }

      // Verify the time entry belongs to the same company
      const userRepository = AppDataSource.getRepository(User);
      const entryUser = await userRepository.findOne({
        where: { uid: userId },
        select: ["companyId"],
      });
      if (!entryUser || entryUser.companyId !== auth.companyId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      // Store original values for audit
      const originalData = {
        latitude: timeEntry.latitude,
        longitude: timeEntry.longitude,
      };

      // Apply corrections
      if (corrections.latitude !== undefined)
        timeEntry.latitude = corrections.latitude;
      if (corrections.longitude !== undefined)
        timeEntry.longitude = corrections.longitude;

      await timeEntryRepository.save(timeEntry);

      // Log rectification
      await this.logGdprAction(
        userId,
        "RECTIFICATION",
        `GPS data corrected for time entry ${timeEntryId}`,
        {
          originalData,
          newData: corrections,
        },
      );

      res.json({
        success: true,
        message: "Data rectified successfully",
        correctedEntry: {
          id: timeEntry.id,
          latitude: timeEntry.latitude,
          longitude: timeEntry.longitude,
        },
      });
    } catch (error: any) {
      logger.error("GDPR rectification failed", {
        error: error.message,
        userId: getAuthContext(req).uid,
      });
      res.status(500).json({ error: "Failed to rectify data" });
    }
  }

  /**
   * RGPD Article 17: Right to Erasure ("Right to be Forgotten")
   * Allow users to delete their personal data
   */
  static async deletePersonalData(req: Request, res: Response) {
    try {
      const auth = getAuthContext(req);
      const userId = auth.uid;

      // Start transaction for data deletion
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        // Anonymize time entries (don't delete, keep for legal compliance)
        const existing = await transactionalEntityManager.findOne(TimeEntry, {
          where: { userId },
        });
        const existingMetadata = existing?.metadata ?? {};

        await transactionalEntityManager.update(
          TimeEntry,
          { userId },
          {
            latitude: null as any,
            longitude: null as any,
            metadata: {
              ...existingMetadata,
              anonymized: true,
              anonymizedAt: new Date(),
            },
          },
        );

        // Log deletion request
        await this.logGdprAction(
          userId,
          "ERASURE_REQUEST",
          "User requested data deletion (anonymized)",
          {},
          transactionalEntityManager,
        );
      });

      res.json({
        success: true,
        message: "Personal data has been anonymized as per GDPR Article 17",
        note: "Data anonymization completed. Some metadata retained for legal compliance.",
      });
    } catch (error: any) {
      logger.error("GDPR erasure failed", {
        error: error.message,
        userId: getAuthContext(req).uid,
      });
      res.status(500).json({ error: "Failed to delete personal data" });
    }
  }

  /**
   * RGPD Article 18: Right to Restriction of Processing
   * Allow users to restrict GPS processing
   */
  static async restrictProcessing(req: Request, res: Response) {
    try {
      const auth = getAuthContext(req);
      const userId = auth.uid;
      const { restrict } = req.body;

      const userRepository = AppDataSource.getRepository(User);
      const existingUser = await userRepository.findOne({
        where: { uid: userId },
      });
      const existingMetadata = existingUser?.metadata ?? {};

      await userRepository.update(
        { uid: userId },
        {
          requiresGeolocation: !restrict,
          metadata: {
            ...existingMetadata,
            gpsProcessingRestricted: restrict,
            restrictedAt: new Date(),
          } as any,
        },
      );

      // Log restriction
      await this.logGdprAction(
        userId,
        restrict ? "PROCESSING_RESTRICTED" : "PROCESSING_RESUMED",
        `GPS processing ${restrict ? "restricted" : "resumed"}`,
      );

      res.json({
        success: true,
        message: `GPS processing ${restrict ? "restricted" : "resumed"} successfully`,
        requiresGeolocation: !restrict,
      });
    } catch (error: any) {
      logger.error("GDPR processing restriction failed", {
        error: error.message,
        userId: getAuthContext(req).uid,
      });
      res
        .status(500)
        .json({ error: "Failed to update processing restrictions" });
    }
  }

  /**
   * RGPD Article 20: Right to Data Portability
   * Export user data in machine-readable format
   */
  static async exportData(req: Request, res: Response) {
    try {
      const auth = getAuthContext(req);
      const userId = auth.uid;
      const format = req.query.format || "json";

      // Get comprehensive user data
      const timeEntryRepository = AppDataSource.getRepository(TimeEntry);
      const userRepository = AppDataSource.getRepository(User);

      const [timeEntries, user] = await Promise.all([
        timeEntryRepository.find({
          where: { userId },
          order: { createdAt: "DESC" },
        }),
        userRepository.findOne({
          where: { uid: userId },
          select: [
            "uid",
            "email",
            "displayName",
            "companyId",
            "role",
            "createdAt",
            "hasAcceptedTerms",
            "acceptedTermsAt",
          ],
        }),
      ]);

      const exportData = {
        user: user,
        timeEntries: timeEntries,
        exportInfo: {
          exportedAt: new Date().toISOString(),
          format: format,
          gdprArticle: "Article 20 - Right to Data Portability",
          retentionNotice: "Data retained for 4 years from creation date",
        },
      };

      // Log export
      await this.logGdprAction(
        userId,
        "DATA_EXPORT",
        `Data exported in ${format} format`,
      );

      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="gdpr-export-${userId}.json"`,
        );
        res.json(exportData);
      } else {
        // CSV format
        const csvData = this.convertToCSV(exportData);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="gdpr-export-${userId}.csv"`,
        );
        res.send(csvData);
      }
    } catch (error: any) {
      logger.error("GDPR data export failed", {
        error: error.message,
        userId: getAuthContext(req).uid,
      });
      res.status(500).json({ error: "Failed to export data" });
    }
  }

  /**
   * Helper method to log GDPR actions
   */
  private static async logGdprAction(
    userId: string,
    action: string,
    details: string,
    metadata: any = {},
    entityManager?: any,
  ) {
    const auditLogRepository =
      entityManager || AppDataSource.getRepository(AuditLog);

    await auditLogRepository.save({
      userId,
      action: "GDPR_" + action,
      details,
      metadata: {
        ...metadata,
        gdprCompliance: true,
        timestamp: new Date().toISOString(),
      },
      ipAddress: "system", // Would be req.ip in real implementation
      userAgent: "GDPR Controller",
    });
  }

  /**
   * Sanitize a CSV field to prevent formula injection
   */
  private static sanitizeCSVField(val: any): string {
    const str = String(val);
    if (
      str.startsWith("=") ||
      str.startsWith("+") ||
      str.startsWith("-") ||
      str.startsWith("@")
    ) {
      return `'${str}`;
    }
    return str;
  }

  /**
   * Convert export data to CSV format
   */
  private static convertToCSV(data: any): string {
    const headers = [
      "Timestamp",
      "Type",
      "Latitude",
      "Longitude",
      "Source",
      "Created At",
    ];
    const rows = data.timeEntries.map((entry: any) => [
      entry.timestampUtc,
      entry.type,
      entry.latitude,
      entry.longitude,
      entry.source,
      entry.createdAt,
    ]);

    const csvContent = [headers, ...rows]
      .map((row: any[]) =>
        row
          .map((field: any) =>
            `"${this.sanitizeCSVField(field).replace(/"/g, '""')}"`,
          )
          .join(","),
      )
      .join("\n");

    return csvContent;
  }
}
