import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddUserCompanyIdAndRole1712600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("users");

    if (table && !table.findColumnByName("companyId")) {
      await queryRunner.addColumn(
        "users",
        new TableColumn({
          name: "companyId",
          type: "varchar",
          isNullable: false,
          default: "'tempos-demo'",
        }),
      );
    }

    if (table && !table.findColumnByName("role")) {
      await queryRunner.addColumn(
        "users",
        new TableColumn({
          name: "role",
          type: "varchar",
          isNullable: false,
          default: "'employee'",
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("users");

    if (table?.findColumnByName("role")) {
      await queryRunner.dropColumn("users", "role");
    }

    if (table?.findColumnByName("companyId")) {
      await queryRunner.dropColumn("users", "companyId");
    }
  }
}
