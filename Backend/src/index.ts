import "reflect-metadata";
import "dotenv/config";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import { AppDataSource } from "./database.js";
import { User } from "./entities/User.js";
import authRoutes from "./controllers/auth.controller.js";
import fichaRoutes from "./controllers/ficha.controller.js";
import employeesRoutes from "./controllers/employees.controller.js";
import documentsRoutes from "./controllers/documents.controller.js";
import absencesRoutes from "./controllers/absences.controller.js";
import reportsRoutes from "./controllers/reports.controller.js";
import contactRoutes from "./controllers/contact.controller.js";
import workCenterRoutes from "./controllers/workcenters.controller.js";
import scheduleController from "./controllers/schedule.controller.js";
import pushRoutes from "./controllers/push.controller.js";
import webauthnRoutes from "./routes/webauthn.routes.js";
import { GdprController } from "./controllers/gdpr.controller.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { firebaseAuthMiddleware } from "./middleware/auth.middleware.js";
import {
  authRateLimiter,
  apiRateLimiter,
} from "./middleware/rate-limit.middleware.js";

const app: Express = express();
const PORT = process.env.PORT || 8080;

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(helmet());
app.use(hpp());
app.disable("x-powered-by");

app.use((req, _res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`,
  );
  next();
});

// 1. CORS - Configuración dinámica para producción
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "https://tempos-project-f1e77.web.app",
  "https://tempos-project-f1e77.firebaseapp.com",
  "https://discerning-emotion-production-4044.up.railway.app",
  "https://tempos-production.up.railway.app"
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(",").forEach((url) => {
    const trimmed = url.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (como apps móviles o curl)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV !== "production"
      ) {
        callback(null, true);
      } else {
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    optionsSuccessStatus: 204,
    maxAge: 86400,
  }),
);

// 2. Logging & Parsing
app.use(
  morgan("dev", {
    skip: (req) =>
      req.url === "/health" ||
      req.url === "/status" ||
      req.method === "OPTIONS",
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ─── Health & Status ───────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/status", async (_req: Request, res: Response) => {
  const dbOk = AppDataSource.isInitialized;
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? "healthy" : "unhealthy",
    database: dbOk ? "connected" : "disconnected",
    version: "0.1.0",
  });
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1", apiRateLimiter);
app.use("/api/v1/auth", authRateLimiter, authRoutes);
app.use("/api/v1/fichas", fichaRoutes);
app.use("/api/v1/employees", employeesRoutes);
app.use("/api/v1/documents", documentsRoutes);
app.use("/api/v1/absences", absencesRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/work-centers", workCenterRoutes);
app.use("/api/v1/schedules", scheduleController);
app.use("/api/v1/push", pushRoutes);
app.use("/api/v1/webauthn", webauthnRoutes);

// Health check for Railway/CloudRun
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString(), version: "1.0.1-pro" });
});

// GDPR Routes (RGPD compliance)
app.get(
  "/api/v1/gdpr/access",
  firebaseAuthMiddleware,
  GdprController.accessPersonalData,
);
app.put(
  "/api/v1/gdpr/rectify",
  firebaseAuthMiddleware,
  GdprController.rectifyData,
);
app.delete(
  "/api/v1/gdpr/delete",
  firebaseAuthMiddleware,
  GdprController.deletePersonalData,
);
app.put(
  "/api/v1/gdpr/restrict",
  firebaseAuthMiddleware,
  GdprController.restrictProcessing,
);
app.get(
  "/api/v1/gdpr/export",
  firebaseAuthMiddleware,
  GdprController.exportData,
);

// Me endpoint (protegido)
app.get(
  "/api/v1/me",
  firebaseAuthMiddleware,
  async (req: Request, res: Response) => {
    res.json({
      uid: (req as any).firebaseUser.uid,
      email: (req as any).firebaseUser.email,
      message: "Autenticado correctamente",
    });
  },
);

// ─── Error handling ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Database init & Server ────────────────────────────────────────────────────
AppDataSource.initialize()
  .then(async () => {
    console.log("✅ Base de datos conectada");

    app.listen(PORT, async () => {
      console.log(`🚀 Servidor escuchando en puerto ${PORT}`);

      // Seed dev user en desarrollo (después de arrancar para no trabar la conexión)
      if (process.env.NODE_ENV !== "production") {
        try {
          const userRepo = AppDataSource.getRepository(User);
          const devUid = "00000000-0000-0000-0000-000000000001";
          const exists = await userRepo.findOne({ where: { uid: devUid } });
          if (!exists) {
            await userRepo.save(
              userRepo.create({
                uid: devUid,
                email: "dev@tempos.es",
                displayName: "Dev User",
                companyId: "tempos-demo",
                role: "admin",
              }),
            );
            console.log("🌱 [DEV] Usuario de desarrollo creado");
          }
        } catch (err) {
          console.error("⚠️ [DEV] Error creando usuario de desarrollo:", err);
        }
      }
    });
  })
  .catch((err) => {
    console.error("❌ Error inicializando BD:", err);
    process.exit(1);
  });

export default app;
