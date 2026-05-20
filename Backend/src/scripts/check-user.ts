
import "reflect-metadata";
import "dotenv/config";
import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";

async function checkUser() {
  try {
    await AppDataSource.initialize();
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email: "contact@script-9.com" } });
    
    if (user) {
      console.log("USER DATA:", {
        email: user.email,
        isTrial: user.isTrial,
        trialExpiresAt: user.trialExpiresAt,
        role: user.role
      });
    } else {
      console.log("User not found");
    }
  } catch (err) {
    console.error("Error in checkUser:", err);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

checkUser();
