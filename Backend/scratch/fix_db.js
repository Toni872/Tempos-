import { AppDataSource } from "../src/database.js";
import "dotenv/config";
async function fix() {
    await AppDataSource.initialize();
    console.log("Fixing database...");
    try {
        // Intentar copiar datos de la columna vieja a la nueva si existen
        await AppDataSource.query('UPDATE fichas SET user_id = "userId" WHERE user_id IS NULL AND "userId" IS NOT NULL');
        await AppDataSource.query('ALTER TABLE fichas DROP COLUMN IF EXISTS "userId"');
        await AppDataSource.query('UPDATE users SET display_name = "displayName" WHERE display_name IS NULL AND "displayName" IS NOT NULL');
        await AppDataSource.query('UPDATE users SET photo_url = "photoURL" WHERE photo_url IS NULL AND "photoURL" IS NOT NULL');
        await AppDataSource.query('UPDATE users SET email_verified = "emailVerified" WHERE email_verified IS NULL AND "emailVerified" IS NOT NULL');
        await AppDataSource.query('UPDATE users SET company_id = "companyId" WHERE company_id IS NULL AND "companyId" IS NOT NULL');
        await AppDataSource.query('ALTER TABLE users DROP COLUMN IF EXISTS "displayName"');
        await AppDataSource.query('ALTER TABLE users DROP COLUMN IF EXISTS "photoURL"');
        await AppDataSource.query('ALTER TABLE users DROP COLUMN IF EXISTS "emailVerified"');
        await AppDataSource.query('ALTER TABLE users DROP COLUMN IF EXISTS "companyId"');
        console.log("Database fixed!");
    }
    catch (err) {
        console.error("Error fixing database:", err);
    }
    finally {
        await AppDataSource.destroy();
    }
}
fix();
//# sourceMappingURL=fix_db.js.map