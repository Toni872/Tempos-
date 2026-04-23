/* eslint-disable */
// @ts-nocheck
import { Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { TimeEntry } from '../entities/TimeEntry.js';
import { User } from '../entities/User.js';
import { AuditLog } from '../entities/AuditLog.js';
import { logger } from '../utils/logger.js';

export class GdprController {
  /**
   * RGPD Article 15: Right of Access
   * Allow users to access their personal data including GPS information
   */
  static async accessPersonalData(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user's time entries with GPS data
      const timeEntryRepository = AppDataSource.getRepository(TimeEntry);
      const userTimeEntries = await timeEntryRepository.find({
        where: { userId },
        relations: ['metadata'],
        order: { createdAt: 'DESC' }
      });

      // Get user's profile data (excluding sensitive fields)
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { uid: userId },
        select: ['uid', 'email', 'displayName', 'companyId', 'role', 'createdAt', 'hasAcceptedTerms', 'acceptedTermsAt']
      });

      // Log access request
      await this.logGdprAction(userId, 'ACCESS_REQUEST', 'User requested access to personal data');

      const personalData = {
        user: user,
        timeEntries: userTimeEntries.map(entry => ({
          id: entry.id,
          date: entry.date,
          startTime: entry.startTime,
          endTime: entry.endTime,
          latitude: entry.latitude,
          longitude: entry.longitude,
          accuracy: entry.accuracy,
          createdAt: entry.createdAt,
          metadata: entry.metadata
        })),
        exportDate: new Date().toISOString(),
        retentionPeriod: '4 years from creation date'
      };

      res.json({
        success: true,
        data: personalData,
        message: 'Personal data exported successfully'
      });

    } catch (error) {
      logger.error('GDPR access request failed', { error: error.message, userId: req.user?.uid });
      res.status(500).json({ error: 'Failed to access personal data' });
    }
  }

  /**
   * RGPD Article 16: Right to Rectification
   * Allow users to correct inaccurate GPS data
   */
  static async rectifyData(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      const { timeEntryId, corrections } = req.body;

      if (!userId || !timeEntryId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const timeEntryRepository = AppDataSource.getRepository(TimeEntry);
      const timeEntry = await timeEntryRepository.findOne({
        where: { id: timeEntryId, userId }
      });

      if (!timeEntry) {
        return res.status(404).json({ error: 'Time entry not found' });
      }

      // Store original values for audit
      const originalData = {
        latitude: timeEntry.latitude,
        longitude: timeEntry.longitude,
        accuracy: timeEntry.accuracy
      };

      // Apply corrections
      if (corrections.latitude !== undefined) timeEntry.latitude = corrections.latitude;
      if (corrections.longitude !== undefined) timeEntry.longitude = corrections.longitude;
      if (corrections.accuracy !== undefined) timeEntry.accuracy = corrections.accuracy;

      await timeEntryRepository.save(timeEntry);

      // Log rectification
      await this.logGdprAction(userId, 'RECTIFICATION', `GPS data corrected for time entry ${timeEntryId}`, {
        originalData,
        newData: corrections
      });

      res.json({
        success: true,
        message: 'Data rectified successfully',
        correctedEntry: {
          id: timeEntry.id,
          latitude: timeEntry.latitude,
          longitude: timeEntry.longitude,
          accuracy: timeEntry.accuracy
        }
      });

    } catch (error) {
      logger.error('GDPR rectification failed', { error: error.message, userId: req.user?.uid });
      res.status(500).json({ error: 'Failed to rectify data' });
    }
  }

  /**
   * RGPD Article 17: Right to Erasure ("Right to be Forgotten")
   * Allow users to delete their personal data
   */
  static async deletePersonalData(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const timeEntryRepository = AppDataSource.getRepository(TimeEntry);
      const auditLogRepository = AppDataSource.getRepository(AuditLog);

      // Start transaction for data deletion
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        // Anonymize time entries (don't delete, keep for legal compliance)
        await transactionalEntityManager.update(TimeEntry, { userId }, {
          latitude: null,
          longitude: null,
          accuracy: null,
          metadata: { ...JSON.parse(JSON.stringify(await transactionalEntityManager.findOne(TimeEntry, { where: { userId } }))?.metadata || {}), anonymized: true, anonymizedAt: new Date() }
        });

        // Log deletion request
        await this.logGdprAction(userId, 'ERASURE_REQUEST', 'User requested data deletion (anonymized)', {}, transactionalEntityManager);
      });

      res.json({
        success: true,
        message: 'Personal data has been anonymized as per GDPR Article 17',
        note: 'Data anonymization completed. Some metadata retained for legal compliance.'
      });

    } catch (error) {
      logger.error('GDPR erasure failed', { error: error.message, userId: req.user?.uid });
      res.status(500).json({ error: 'Failed to delete personal data' });
    }
  }

  /**
   * RGPD Article 18: Right to Restriction of Processing
   * Allow users to restrict GPS processing
   */
  static async restrictProcessing(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      const { restrict } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const userRepository = AppDataSource.getRepository(User);
      await userRepository.update({ uid: userId }, {
        requiresGeolocation: !restrict,
        metadata: {
          ...JSON.parse(JSON.stringify(await userRepository.findOne({ where: { uid: userId } }))?.metadata || {}),
          gpsProcessingRestricted: restrict,
          restrictedAt: new Date()
        }
      });

      // Log restriction
      await this.logGdprAction(userId, restrict ? 'PROCESSING_RESTRICTED' : 'PROCESSING_RESUMED', `GPS processing ${restrict ? 'restricted' : 'resumed'}`);

      res.json({
        success: true,
        message: `GPS processing ${restrict ? 'restricted' : 'resumed'} successfully`,
        requiresGeolocation: !restrict
      });

    } catch (error) {
      logger.error('GDPR processing restriction failed', { error: error.message, userId: req.user?.uid });
      res.status(500).json({ error: 'Failed to update processing restrictions' });
    }
  }

  /**
   * RGPD Article 20: Right to Data Portability
   * Export user data in machine-readable format
   */
  static async exportData(req: Request, res: Response) {
    try {
      const userId = req.user?.uid;
      const format = req.query.format || 'json';

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get comprehensive user data
      const timeEntryRepository = AppDataSource.getRepository(TimeEntry);
      const userRepository = AppDataSource.getRepository(User);

      const [timeEntries, user] = await Promise.all([
        timeEntryRepository.find({
          where: { userId },
          order: { createdAt: 'DESC' }
        }),
        userRepository.findOne({
          where: { uid: userId },
          select: ['uid', 'email', 'displayName', 'companyId', 'role', 'createdAt', 'hasAcceptedTerms', 'acceptedTermsAt']
        })
      ]);

      const exportData = {
        user: user,
        timeEntries: timeEntries,
        exportInfo: {
          exportedAt: new Date().toISOString(),
          format: format,
          gdprArticle: 'Article 20 - Right to Data Portability',
          retentionNotice: 'Data retained for 4 years from creation date'
        }
      };

      // Log export
      await this.logGdprAction(userId, 'DATA_EXPORT', `Data exported in ${format} format`);

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="gdpr-export-${userId}.json"`);
        res.json(exportData);
      } else {
        // CSV format
        const csvData = this.convertToCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="gdpr-export-${userId}.csv"`);
        res.send(csvData);
      }

    } catch (error) {
      logger.error('GDPR data export failed', { error: error.message, userId: req.user?.uid });
      res.status(500).json({ error: 'Failed to export data' });
    }
  }

  /**
   * Helper method to log GDPR actions
   */
  private static async logGdprAction(userId: string, action: string, details: string, metadata: any = {}, entityManager?: any) {
    const auditLogRepository = entityManager || AppDataSource.getRepository(AuditLog);

    await auditLogRepository.save({
      userId,
      action: 'GDPR_' + action,
      details,
      metadata: {
        ...metadata,
        gdprCompliance: true,
        timestamp: new Date().toISOString()
      },
      ipAddress: 'system', // Would be req.ip in real implementation
      userAgent: 'GDPR Controller'
    });
  }

  /**
   * Convert export data to CSV format
   */
  private static convertToCSV(data: any): string {
    const headers = ['Date', 'Start Time', 'End Time', 'Latitude', 'Longitude', 'Accuracy', 'Created At'];
    const rows = data.timeEntries.map((entry: any) => [
      entry.date,
      entry.startTime,
      entry.endTime,
      entry.latitude,
      entry.longitude,
      entry.accuracy,
      entry.createdAt
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field || ''}"`).join(','))
      .join('\n');

    return csvContent;
  }
}