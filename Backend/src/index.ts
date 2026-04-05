import 'reflect-metadata';
import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { AppDataSource } from './database.js';
import { User } from './entities/User.js';
import authRoutes from './controllers/auth.controller.js';
import fichaRoutes from './controllers/ficha.controller.js';
import employeesRoutes from './controllers/employees.controller.js';
import documentsRoutes from './controllers/documents.controller.js';
import absencesRoutes from './controllers/absences.controller.js';
import reportsRoutes from './controllers/reports.controller.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { firebaseAuthMiddleware } from './middleware/auth.middleware.js';
import { authRateLimiter } from './middleware/rate-limit.middleware.js';

const app: Express = express();
const PORT = process.env.PORT || 8080;

// ─── Middleware ────────────────────────────────────────────────────────────────
// CORS configuration: allow a list of origins via FRONTEND_URL or ALLOWED_HOSTS
const rawOrigins = process.env.FRONTEND_URL || process.env.ALLOWED_HOSTS || (process.env.NODE_ENV === 'production' ? 'https://tempos.es' : '*');
const allowedOrigins = Array.isArray(rawOrigins)
  ? rawOrigins
  : String(rawOrigins)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

const corsOptions = {
  origin(origin: string | undefined, callback: any) {
    // Allow non-browser requests like curl (no origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ─── Health & Status ───────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/status', async (_req: Request, res: Response) => {
  const dbOk = AppDataSource.isInitialized;
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'healthy' : 'unhealthy',
    database: dbOk ? 'connected' : 'disconnected',
    version: '0.1.0',
  });
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRateLimiter, authRoutes);
app.use('/api/v1/fichas', fichaRoutes);
app.use('/api/v1/employees', employeesRoutes);
app.use('/api/v1/documents', documentsRoutes);
app.use('/api/v1/absences', absencesRoutes);
app.use('/api/v1/reports', reportsRoutes);

// Me endpoint (protegido)
app.get('/api/v1/me', firebaseAuthMiddleware, async (req: Request, res: Response) => {
  res.json({
    uid: (req as any).firebaseUser.uid,
    email: (req as any).firebaseUser.email,
    message: 'Autenticado correctamente',
  });
});

// ─── Error handling ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Database init & Server ────────────────────────────────────────────────────
AppDataSource.initialize()
  .then(async () => {
    console.log('✅ Base de datos conectada');

    // Seed dev user en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      const userRepo = AppDataSource.getRepository(User);
      const devUid = '00000000-0000-0000-0000-000000000001';
      const exists = await userRepo.findOne({ where: { uid: devUid } });
      if (!exists) {
        await userRepo.save(
          userRepo.create({ uid: devUid, email: 'dev@tempos.es', displayName: 'Dev User' })
        );
        console.log('🌱 [DEV] Usuario de desarrollo creado');
      }
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error inicializando BD:', err);
    process.exit(1);
  });

export default app;
