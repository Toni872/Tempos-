import { Request, Response } from "express";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";
import { Credential } from "../entities/Credential.js";

const rpName = "Tempos HR";
const rpID = process.env.RP_ID || "localhost";
const origin = process.env.WEBAUTHN_ORIGIN || `http://${rpID}:5173`;

export const getRegistrationOptions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).firebaseUser?.uid;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { uid: userId },
      relations: ["credentials"],
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(user.uid)),
      userName: user.email,
      attestationType: "none",
      excludeCredentials: user.credentials?.map((cred: Credential) => ({
        id: cred.credentialID,
        type: "public-key",
        transports: cred.transports as any,
      })),
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "preferred",
      },
    });

    user.currentChallenge = options.challenge;
    await userRepository.save(user);

    res.json(options);
  } catch (error: any) {
    console.error("getRegistrationOptions Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const verifyRegistration = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).firebaseUser?.uid;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { body } = req;
    const userRepository = AppDataSource.getRepository(User);
    const credentialRepository = AppDataSource.getRepository(Credential);

    const user = await userRepository.findOneBy({ uid: userId });

    if (!user || !user.currentChallenge) {
      res
        .status(400)
        .json({ error: "No active registration challenge found for user." });
      return;
    }

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;

      const newCred = credentialRepository.create({
        credentialID: Buffer.from(credential.id).toString("base64url"),
        credentialPublicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports || [],
        userId: user.uid,
      });

      await credentialRepository.save(newCred);

      user.currentChallenge = undefined;
      await userRepository.save(user);

      res.json({ verified: true });
    } else {
      res.status(400).json({ error: "Verification failed" });
    }
  } catch (error: any) {
    console.error("verifyRegistration Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getAuthenticationOptions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.query;

    // Si no pasan email (ej: passkey discoverable)
    let userCredentials: Credential[] = [];
    let expectedChallengeUser: User | null = null;
    const userRepository = AppDataSource.getRepository(User);

    if (email) {
      expectedChallengeUser = await userRepository.findOne({
        where: { email: email as string },
        relations: ["credentials"],
      });

      if (expectedChallengeUser) {
        userCredentials = expectedChallengeUser.credentials || [];
      }
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: userCredentials.map((cred: Credential) => ({
        id: cred.credentialID,
        transports: cred.transports as any,
      })),
      userVerification: "preferred",
    });

    if (expectedChallengeUser) {
      expectedChallengeUser.currentChallenge = options.challenge;
      await userRepository.save(expectedChallengeUser);
    } else {
      // Deberiamos guardar un challenge global asociado al session ID si fuera login general sin email.
      // Simplificado: se puede crear un challenge en cookie o session temporal.
      // O en una variable temporal. En este caso requeriremos que pasen email para el fichaje.
    }

    res.json(options);
  } catch (error: any) {
    console.error("getAuthenticationOptions Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const verifyAuthentication = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, body } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email required for challenge check." });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const credentialRepository = AppDataSource.getRepository(Credential);

    const user = await userRepository.findOne({
      where: { email },
      relations: ["credentials"],
    });

    if (!user || !user.currentChallenge) {
      res
        .status(400)
        .json({ error: "No active authentication challenge found" });
      return;
    }

    const dbCred = user.credentials?.find(
      (c: Credential) => c.credentialID === body.id,
    );
    if (!dbCred) {
      res.status(400).json({ error: "Credential not found for this user" });
      return;
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: dbCred.credentialID,
        publicKey: new Uint8Array(dbCred.credentialPublicKey),
        counter: dbCred.counter,
        transports: dbCred.transports as any,
      },
    });

    if (verification.verified) {
      // Actualizar el contador para evitar replay attacks
      dbCred.counter = verification.authenticationInfo.newCounter;
      await credentialRepository.save(dbCred);

      user.currentChallenge = undefined;
      await userRepository.save(user);

      // Aquí podrías generar un JWT o realizar el fichaje.
      // Por ahora confirmamos que es verificado y devolvemos su uid
      res.json({ verified: true, uid: user.uid, role: user.role });
    } else {
      res.status(400).json({ error: "Verification failed" });
    }
  } catch (error: any) {
    console.error("verifyAuthentication Error:", error);
    res.status(500).json({ error: error.message });
  }
};
