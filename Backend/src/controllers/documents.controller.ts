import { Router, Request, Response } from "express";
import { firebaseAuthMiddleware } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { AppDataSource } from "../database.js";
import { Document } from "../entities/Document.js";
import { User } from "../entities/User.js";
import { logAction } from "../utils/auditLog.js";
import busboy from "busboy";
import {
  appUserContextMiddleware,
  getAuthContext,
} from "../middleware/request-context.middleware.js";
import { documentStorageService } from "../services/document-storage.service.js";

const router = Router();

/**
 * Helper to find a document ensuring it belongs to the same company
 * and the user has permission to see it.
 */
async function findScopedDocument(
  id: string,
  auth: { uid: string; companyId: string; role?: string },
): Promise<Document | null> {
  const query = AppDataSource.getRepository(Document)
    .createQueryBuilder("document")
    .innerJoin(User, "user", "user.uid = document.userId")
    .where("document.id = :id", { id })
    .andWhere("user.companyId = :companyId", { companyId: auth.companyId });

  // If not admin, can only see their own docs
  if (auth.role !== "admin") {
    query.andWhere("document.userId = :userId", { userId: auth.uid });
  }

  return query.getOne();
}

/**
 * GET /api/v1/documents
 * List documents. Admins can filter by ?userId=XYZ.
 */
router.get(
  "/",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { userId } = req.query;

    const repo = AppDataSource.getRepository(Document);
    const query = repo
      .createQueryBuilder("document")
      .innerJoin(User, "user", "user.uid = document.userId")
      .where("user.companyId = :companyId", { companyId: auth.companyId });

    if (auth.role === "admin") {
      if (userId) query.andWhere("document.userId = :userId", { userId });
    } else {
      query.andWhere("document.userId = :userId", { userId: auth.uid });
    }

    const docs = await query.orderBy("document.createdAt", "DESC").getMany();
    res.json({ data: docs });
  }),
);

/**
 * POST /api/v1/documents
 * Upload a document (multipart/form-data)
 */
router.post(
  "/",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const contentType = req.headers["content-type"] || "";
    const repo = AppDataSource.getRepository(Document);

    if (contentType.includes("multipart/form-data")) {
      const bb = busboy({ headers: req.headers });
      const fields: Record<string, string> = {};
      const fileChunks: Buffer[] = [];
      let originalFilename = "";
      let detectedMimeType = "application/octet-stream";

      await new Promise<void>((resolve, reject) => {
        bb.on("file", (_name, stream, info) => {
          originalFilename = info.filename || "documento.bin";
          detectedMimeType = info.mimeType || "application/octet-stream";
          stream.on("data", (chunk: Buffer) =>
            fileChunks.push(Buffer.from(chunk)),
          );
          stream.on("error", reject);
        });
        bb.on("field", (key, value) => {
          fields[key] = value;
        });
        bb.on("error", reject);
        bb.on("close", resolve);
        req.pipe(bb);
      });

      const targetUserId =
        auth.role === "admin" && fields["userId"] ? fields["userId"] : auth.uid;

      const content = Buffer.concat(fileChunks);
      const uploadResult = await documentStorageService.save({
        filename: originalFilename,
        mimeType: fields["mimeType"] || detectedMimeType,
        content,
        userId: targetUserId,
      });

      const doc = repo.create({
        userId: targetUserId,
        title: fields["title"] || originalFilename,
        type: (fields["type"] as any) || "other",
        status: fields["requireSignature"] === "true" ? "pending" : "delivered",
        filename: uploadResult.filename,
        fileUrl: uploadResult.fileUrl,
        mimeType: fields["mimeType"] || detectedMimeType,
      });

      await repo.save(doc);
      await logAction({
        userId: auth.uid,
        companyId: auth.companyId,
        action: "document_upload",
        metadata: { documentId: doc.id, targetUserId },
      });
      res.status(201).json({ data: doc });
    } else {
      // JSON metadata for manually registered docs
      const { userId, title, type, fileUrl, mimeType, requireSignature } =
        req.body;
      const targetUserId = auth.role === "admin" && userId ? userId : auth.uid;

      const doc = repo.create({
        userId: targetUserId,
        title: title || "Documento",
        type: type || "other",
        status: requireSignature ? "pending" : "delivered",
        fileUrl,
        mimeType,
      });
      await repo.save(doc);
      res.status(201).json({ data: doc });
    }
  }),
);

/**
 * GET /api/v1/documents/:id/download
 */
router.get(
  "/:id/download",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { id } = req.params;
    const doc = await findScopedDocument(id, auth);

    if (!doc) {
      res.status(404).json({ error: "Documento no encontrado" });
      return;
    }

    try {
      const readStream = await documentStorageService.openReadStream(
        doc.fileUrl || "",
      );
      if (readStream) {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${doc.filename || "documento"}"`,
        );
        res.setHeader(
          "Content-Type",
          doc.mimeType || "application/octet-stream",
        );
        readStream.pipe(res);
      } else {
        throw new Error("No stream available");
      }
    } catch {
      res.status(500).json({ error: "Error al descargar el archivo" });
    }
  }),
);

/**
 * POST /api/v1/documents/:id/sign
 * Digital signature with evidence tracking
 */
router.post(
  "/:id/sign",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { id } = req.params;
    const { signatureData, location } = req.body;

    if (!signatureData) {
      res.status(400).json({ error: "La firma es obligatoria" });
      return;
    }

    const doc = await findScopedDocument(id, auth);
    if (!doc) {
      res.status(404).json({ error: "Documento no encontrado" });
      return;
    }

    if (doc.userId !== auth.uid) {
      res
        .status(403)
        .json({ error: "Solo el destinatario puede firmar este documento" });
      return;
    }

    doc.status = "signed";
    doc.signatureData = signatureData;
    doc.signedAt = new Date();
    doc.signatureMetadata = {
      ip: req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      location: location || undefined,
    };

    await AppDataSource.getRepository(Document).save(doc);
    await logAction({
      userId: auth.uid,
      companyId: auth.companyId,
      action: "document_signed_legal",
      metadata: { documentId: doc.id, title: doc.title },
    });

    res.json({ message: "Documento firmado con éxito", data: doc });
  }),
);

export default router;
