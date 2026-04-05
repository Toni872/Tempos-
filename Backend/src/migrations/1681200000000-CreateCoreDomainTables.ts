import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateCoreDomainTables1681200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasFichas = await queryRunner.hasTable('fichas');
    if (!hasFichas) {
      await queryRunner.createTable(
        new Table({
          name: 'fichas',
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
            { name: 'userId', type: 'uuid', isNullable: false },
            { name: 'date', type: 'date', isNullable: false },
            { name: 'startTime', type: 'time', isNullable: false },
            { name: 'endTime', type: 'time', isNullable: true },
            { name: 'hoursWorked', type: 'decimal', precision: 5, scale: 2, isNullable: true },
            { name: 'description', type: 'varchar', isNullable: true },
            { name: 'projectCode', type: 'varchar', isNullable: true },
            { name: 'metadata', type: 'json', isNullable: true },
            { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'status', type: 'varchar', default: "'confirmed'" },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'fichas',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedTableName: 'users',
          referencedColumnNames: ['uid'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'fichas',
        new TableIndex({ name: 'IDX_fichas_userId_date', columnNames: ['userId', 'date'] }),
      );
      await queryRunner.createIndex(
        'fichas',
        new TableIndex({ name: 'IDX_fichas_userId_status', columnNames: ['userId', 'status'] }),
      );
    }

    const hasAbsences = await queryRunner.hasTable('absences');
    if (!hasAbsences) {
      await queryRunner.createTable(
        new Table({
          name: 'absences',
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
            { name: 'userId', type: 'uuid', isNullable: false },
            { name: 'type', type: 'varchar', isNullable: false },
            { name: 'startDate', type: 'date', isNullable: false },
            { name: 'endDate', type: 'date', isNullable: false },
            { name: 'status', type: 'varchar', default: "'pending'" },
            { name: 'reason', type: 'text', isNullable: true },
            { name: 'adminComment', type: 'text', isNullable: true },
            { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'absences',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedTableName: 'users',
          referencedColumnNames: ['uid'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'absences',
        new TableIndex({ name: 'IDX_absences_userId_startDate', columnNames: ['userId', 'startDate'] }),
      );
    }

    const hasDocuments = await queryRunner.hasTable('documents');
    if (!hasDocuments) {
      await queryRunner.createTable(
        new Table({
          name: 'documents',
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
            { name: 'userId', type: 'uuid', isNullable: false },
            { name: 'title', type: 'varchar', isNullable: false },
            { name: 'type', type: 'varchar', isNullable: true },
            { name: 'status', type: 'varchar', default: "'delivered'" },
            { name: 'filename', type: 'varchar', isNullable: true },
            { name: 'fileUrl', type: 'varchar', isNullable: true },
            { name: 'mimeType', type: 'varchar', isNullable: true },
            { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'documents',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedTableName: 'users',
          referencedColumnNames: ['uid'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'documents',
        new TableIndex({ name: 'IDX_documents_userId_createdAt', columnNames: ['userId', 'createdAt'] }),
      );
    }

    const hasAuditLogs = await queryRunner.hasTable('audit_logs');
    if (!hasAuditLogs) {
      await queryRunner.createTable(
        new Table({
          name: 'audit_logs',
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
            { name: 'userId', type: 'uuid', isNullable: true },
            { name: 'companyId', type: 'varchar', isNullable: true },
            { name: 'action', type: 'varchar', isNullable: false },
            { name: 'metadata', type: 'json', isNullable: true },
            { name: 'ip', type: 'varchar', isNullable: true },
            { name: 'userAgent', type: 'varchar', isNullable: true },
            { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'audit_logs',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedTableName: 'users',
          referencedColumnNames: ['uid'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'audit_logs',
        new TableIndex({ name: 'IDX_audit_logs_companyId_createdAt', columnNames: ['companyId', 'createdAt'] }),
      );
      await queryRunner.createIndex(
        'audit_logs',
        new TableIndex({ name: 'IDX_audit_logs_userId_createdAt', columnNames: ['userId', 'createdAt'] }),
      );
      await queryRunner.createIndex(
        'audit_logs',
        new TableIndex({ name: 'IDX_audit_logs_action', columnNames: ['action'] }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('audit_logs')) {
      await queryRunner.dropTable('audit_logs');
    }
    if (await queryRunner.hasTable('documents')) {
      await queryRunner.dropTable('documents');
    }
    if (await queryRunner.hasTable('absences')) {
      await queryRunner.dropTable('absences');
    }
    if (await queryRunner.hasTable('fichas')) {
      await queryRunner.dropTable('fichas');
    }
  }
}
