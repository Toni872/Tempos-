import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database.js';
import { User } from '../entities/User.js';
import { firebaseAuthMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { buildValidationError, updateAuthProfileSchema } from '../utils/validation.js';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Registra nuevo usuario desde Firebase
 */
router.post(
  '/register',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const userRepository = AppDataSource.getRepository(User);

    // Comprobar si existe
    let user = await userRepository.findOne({ where: { uid: firebaseUser.uid } });

    if (user) {
      res.status(409).json({ error: 'Usuario ya registrado' });
      return;
    }

    // Crear nuevo usuario
    user = userRepository.create({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.name || firebaseUser.email,
      emailVerified: firebaseUser.email_verified,
      metadata: {
        createdAt: new Date().toISOString(),
      },
    });

    await userRepository.save(user);

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
    });
  })
);

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get(
  '/me',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { uid: firebaseUser.uid },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      status: user.status,
      createdAt: user.createdAt,
    });
  })
);

/**
 * PUT /api/v1/auth/profile
 * Update user profile
 */
router.put(
  '/profile',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const parsedBody = updateAuthProfileSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json(buildValidationError(parsedBody.error));
      return;
    }

    const { displayName } = parsedBody.data;
    const userRepository = AppDataSource.getRepository(User);

    let user = await userRepository.findOne({
      where: { uid: firebaseUser.uid },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    user.displayName = displayName;

    await userRepository.save(user);

    res.json({
      message: 'Perfil actualizado',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
    });
  })
);

export default router;
