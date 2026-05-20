
import "reflect-metadata";
import "dotenv/config";
import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";

async function fixUser() {
  try {
    console.log("Connecting to database...");
    await AppDataSource.initialize();
    console.log("Database connected.");
    
    const userRepo = AppDataSource.getRepository(User);
    const email = "contact@script-9.com";
    const user = await userRepo.findOne({ where: { email } });
    
    if (user) {
      console.log("User found:", user.email);
      console.log("Current state:", { isTrial: user.isTrial, trialExpiresAt: user.trialExpiresAt });
      
      user.isTrial = true;
      user.trialExpiresAt = new Date("2026-05-30T23:59:59Z");
      user.role = "admin";
      
      await userRepo.save(user);
      console.log("User updated successfully.");
      
      const updatedUser = await userRepo.findOne({ where: { email } });
      console.log("Verified state:", { isTrial: updatedUser?.isTrial, trialExpiresAt: updatedUser?.trialExpiresAt });
    } else {
      console.log("User NOT found:", email);
      // List some users to see what's there
      const someUsers = await userRepo.find({ take: 5 });
      console.log("Existing users:", someUsers.map(u => u.email));
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await AppDataSource.destroy();
  }
}

fixUser();
