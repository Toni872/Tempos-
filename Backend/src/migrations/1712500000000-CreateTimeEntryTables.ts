import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTimeEntryTables1712500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear enum types si no existen
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE time_entry_type_enum AS ENUM (
          'CLOCK_IN',
          'CLOCK_OUT',
          'BREAK_START',
          'BREAK_END'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE time_entry_source_enum AS ENUM (
          'WEB',
          'MOBILE',
          'KIOSK'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE change_action_enum AS ENUM (
          'CREATED',
          'MODIFIED',
          'DELETED',
          'CORRECTED'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Crear tabla time_entries
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        ficha_id uuid NOT NULL,
        user_id uuid NOT NULL,
        type time_entry_type_enum NOT NULL,
        timestamp_utc timestamp with time zone NOT NULL,
        local_date_time varchar,
        source time_entry_source_enum NOT NULL,
        ip varchar,
        user_agent varchar,
        latitude numeric(10, 6),
        longitude numeric(10, 6),
        metadata jsonb,
        created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_time_entries_ficha FOREIGN KEY (ficha_id)
          REFERENCES fichas(id) ON DELETE CASCADE,
        CONSTRAINT fk_time_entries_user FOREIGN KEY (user_id)
          REFERENCES users(uid) ON DELETE RESTRICT
      );
    `);

    // Índices para time_entries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_time_entries_ficha_type
      ON time_entries(ficha_id, type);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_time_entries_user_timestamp
      ON time_entries(user_id, timestamp_utc);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_time_entries_user_created
      ON time_entries(user_id, created_at);
    `);

    // Crear tabla time_entry_change_logs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS time_entry_change_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        time_entry_id uuid NOT NULL,
        changed_by uuid NOT NULL,
        action change_action_enum NOT NULL,
        change_set jsonb NOT NULL,
        reason varchar,
        ip varchar,
        user_agent varchar,
        metadata jsonb,
        created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_change_log_time_entry FOREIGN KEY (time_entry_id)
          REFERENCES time_entries(id) ON DELETE CASCADE,
        CONSTRAINT fk_change_log_user FOREIGN KEY (changed_by)
          REFERENCES users(uid) ON DELETE RESTRICT
      );
    `);

    // Índices para time_entry_change_logs
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_change_logs_time_entry_created
      ON time_entry_change_logs(time_entry_id, created_at);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_change_logs_user_created
      ON time_entry_change_logs(changed_by, created_at);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_change_logs_action_created
      ON time_entry_change_logs(action, created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tablas en orden inverso (por FKs)
    await queryRunner.query(
      `DROP TABLE IF EXISTS time_entry_change_logs CASCADE;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS time_entries CASCADE;`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS change_action_enum CASCADE;`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS time_entry_source_enum CASCADE;`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS time_entry_type_enum CASCADE;`,
    );
  }
}
