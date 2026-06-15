import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class EmailVerification1700000000000 implements MigrationInterface {
  name = 'EmailVerification1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'email_verifications',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'uid',
            type: 'varchar',
            length: '128',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'token',
            type: 'varchar',
            length: '64',
            isUnique: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamptz',
          },
          {
            name: 'used',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'email_verifications',
      new TableIndex({
        name: 'IDX_email_verifications_token_used',
        columnNames: ['token', 'used'],
      }),
    );

    await queryRunner.createIndex(
      'email_verifications',
      new TableIndex({
        name: 'IDX_email_verifications_uid_email',
        columnNames: ['uid', 'email'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('email_verifications');
  }
}