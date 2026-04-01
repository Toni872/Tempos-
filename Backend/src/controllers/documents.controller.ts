import { Router, Request, Response } from 'express';
import { firebaseAuthMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppDataSource } from '../database.js';
import { Document } from '../entities/Document.js';
import { logAction } from '../utils/auditLog.js';
import busboy from 'busboy';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = Router();

// Local upload directory (dev only — replace with GCS in prod)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * GET /api/v1/documents
 * List documents for the authenticated user
 */
router.get(
  '/',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const repo = AppDataSource.getRepository(Document);
    const docs = await repo.find({
      where: { userId: firebaseUser.uid },
      order: { createdAt: 'DESC' },
    });
    res.json({ data: docs });
  })
);

/**
 * POST /api/v1/documents
 * Upload a document (multipart/form-data or JSON metadata)
 */
router.post(
  '/',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const contentType = req.headers['content-type'] || '';

    const repo = AppDataSource.getRepository(Document);

    if (contentType.includes('multipart/form-data')) {
      // File upload via busboy
      const bb = busboy({ headers: req.headers });
      const fields: Record<string, string> = {};
      let savedFilename = '';
      let savedPath = '';

      await new Promise<void>((resolve, reject) => {
        bb.on('file', (_name, stream, info) => {
          const safeFilename = `${Date.now()}_${info.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          savedFilename = safeFilename;
          savedPath = path.join(UPLOADS_DIR, safeFilename);
          const writeStream = fs.createWriteStream(savedPath);
          stream.pipe(writeStream);
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        bb.on('field', (key, value) => {
          fields[key] = value;
        });

        bb.on('error', reject);
        bb.on('close', resolve);
        req.pipe(bb);
      });

      const doc = repo.create({
        userId: firebaseUser.uid,
        title: fields['title'] || savedFilename,
        type: (fields['type'] as any) || 'other',
        status: 'delivered',
        filename: savedFilename,
        fileUrl: savedPath,
        mimeType: fields['mimeType'] || 'application/octet-stream',
      });

      await repo.save(doc);
      await logAction({ userId: firebaseUser.uid, action: 'document_upload', metadata: { documentId: doc.id, title: doc.title } });
      res.status(201).json({ message: 'Documento subido', document: doc });
    } else {
      // JSON metadata only (e.g. admin creates doc record without binary)
      const { title, type, filename, fileUrl, mimeType } = req.body;
      const doc = repo.create({
        userId: firebaseUser.uid,
        title: title || 'Documento sin título',
        type: type || 'other',
        status: 'delivered',
        filename,
        fileUrl,
        mimeType,
      });
      await repo.save(doc);
      await logAction({ userId: firebaseUser.uid, action: 'document_create', metadata: { documentId: doc.id } });
      res.status(201).json({ message: 'Documento registrado', document: doc });
    }
  })
);

/**
 * GET /api/v1/documents/:id/download
 * Download a document file
 */
router.get(
  '/:id/download',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Document);

    const doc = await repo.findOne({ where: { id, userId: firebaseUser.uid } });
    if (!doc) {
      res.status(404).json({ error: 'Documento no encontrado' });
      return;
    }

    if (doc.fileUrl && fs.existsSync(doc.fileUrl)) {
      res.setHeader('Content-Disposition', `attachment; filename="${doc.filename || 'documento'}"`);
      res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
      fs.createReadStream(doc.fileUrl).pipe(res);
    } else {
      // Fallback: send placeholder content
      const content = `Documento: ${doc.title}\nFecha: ${doc.createdAt}\nEstado: ${doc.status}`;
      res.setHeader('Content-Disposition', `attachment; filename="${doc.filename || 'documento.txt'}"`);
      res.setHeader('Content-Type', 'text/plain');
      res.send(content);
    }
  })
);

/**
 * POST /api/v1/documents/:id/sign
 * Mark a document as signed
 */
router.post(
  '/:id/sign',
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Document);

    const doc = await repo.findOne({ where: { id, userId: firebaseUser.uid } });
    if (!doc) {
      res.status(404).json({ error: 'Documento no encontrado' });
      return;
    }

    doc.status = 'signed';
    await repo.save(doc);
    await logAction({ userId: firebaseUser.uid, action: 'document_sign', metadata: { documentId: doc.id, title: doc.title } });

    res.json({ message: 'Documento firmado', document: doc });
  })
);

export default router;
