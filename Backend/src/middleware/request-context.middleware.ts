import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../database.js';
import { User, type UserRole } from '../entities/User.js';
import { buildAuthContext, type AuthContext, type FirebaseUserLike } from './auth.middleware.js';
import { hasPermission, type Permission } from '../security/authorization.js';

export async function appUserContextMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const firebaseUser = (req as any).firebaseUser as FirebaseUserLike | undefined;
  if (!firebaseUser) {
    next();
    return;
  }

  let currentUser: User | null = null;
  if (AppDataSource.isInitialized) {
    currentUser = await AppDataSource.getRepository(User).findOne({
      where: { uid: firebaseUser.uid },
    });
  }

  (req as any).currentUser = currentUser;
  (req as any).authContext = buildAuthContext(firebaseUser, currentUser ?? undefined);
  next();
}

export function getAuthContext(req: Request): AuthContext {
  return (req as any).authContext as AuthContext;
}

export function requireRoles(req: Request, res: Response, roles: UserRole[]): boolean {
  const auth = getAuthContext(req);
  if (!roles.includes(auth.role)) {
    res.status(403).json({ error: 'Acción reservada para roles autorizados' });
    return false;
  }

  if (auth.status !== 'active') {
    res.status(403).json({ error: 'Usuario inactivo o suspendido' });
    return false;
  }

  return true;
}

export function requirePermission(req: Request, res: Response, permission: Permission): boolean {
  const auth = getAuthContext(req);
  if (!hasPermission(auth, permission)) {
    const message = auth.status !== 'active'
      ? 'Usuario inactivo o suspendido'
      : 'Acción reservada para roles autorizados';
    res.status(403).json({ error: message });
    return false;
  }

  return true;
}
