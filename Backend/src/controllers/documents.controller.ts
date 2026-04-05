import { Router, Request, Response } from 'express';
import { firebaseAuthMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppDataSource } from '../database.js';
import { Document } from '../entities/Document.js';
import { User } from '../entities/User.js';
import { logAction } from '../utils/auditLog.js';
import busboy from 'busboy';
import { appUserContextMiddleware, getAuthContext } from '../middleware/request-context.middleware.js';
import { documentStorageService } from '../services/document-storage.service.js';

const router = Router();

async function findScopedDocument(id: string, companyId: string, userId: string): Promise<Document | null> {
  return AppDataSource.getRepository(Document)
    .createQueryBuilder('document')
    .innerJoin(User, 'user', 'user.uid = document.userId')
    .where('document.id = :id', { id })
    .andWhere('document.userId = :userId', { userId })
    .andWhere('user.companyId = :companyId', { companyId })
    .getOne();
}

/**
 * GET /api/v1/documents
 * List documents for the authenticated user
 */
router.get(
  '/',
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const repo = AppDataSource.getRepository(Document);
    const docs = await repo.find({
      where: { userId: auth.uid },
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
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const contentType = req.headers['content-type'] || '';

    const repo = AppDataSource.getRepository(Document);

    if (contentType.includes('multipart/form-data')) {
      // File upload via busboy
      const bb = busboy({ headers: req.headers });
      const fields: Record<string, string> = {};
      const fileChunks: Buffer[] = [];
      let originalFilename = '';
      let detectedMimeType = 'application/octet-stream';

      await new Promise<void>((resolve, reject) => {
        bb.on('file', (_name, stream, info) => {
          originalFilename = info.filename || 'documento.bin';
          detectedMimeType = info.mimeType || 'application/octet-stream';
          stream.on('data', (chunk: Buffer) => {
            fileChunks.push(Buffer.from(chunk));
          });
          stream.on('error', reject);
        });

        bb.on('field', (key, value) => {
          fields[key] = value;
        });

        bb.on('error', reject);
        bb.on('close', resolve);
        req.pipe(bb);
      });

      const content = Buffer.concat(fileChunks);
      const uploadResult = await documentStorageService.save({
        filename: originalFilename,
        mimeType: fields['mimeType'] || detectedMimeType,
        content,
        userId: auth.uid,
      });

      const doc = repo.create({
        userId: auth.uid,
        title: fields['title'] || uploadResult.filename,
        type: (fields['type'] as any) || 'other',
        status: 'delivered',
        filename: uploadResult.filename,
        fileUrl: uploadResult.fileUrl,
        mimeType: fields['mimeType'] || detectedMimeType,
      });

      await repo.save(doc);
      await logAction({ userId: auth.uid, companyId: auth.companyId, action: 'document_upload', metadata: { documentId: doc.id, title: doc.title } });
      res.status(201).json({ message: 'Documento subido', document: doc });
    } else {
      // JSON metadata only (e.g. admin creates doc record without binary)
      const { title, type, filename, fileUrl, mimeType } = req.body;
      const doc = repo.create({
        userId: auth.uid,
        title: title || 'Documento sin título',
        type: type || 'other',
        status: 'delivered',
        filename,
        fileUrl,
        mimeType,
      });
      await repo.save(doc);
      await logAction({ userId: auth.uid, companyId: auth.companyId, action: 'document_create', metadata: { documentId: doc.id } });
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
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { id } = req.params;
    const doc = await findScopedDocument(id, auth.companyId, auth.uid);
    if (!doc) {
      res.status(404).json({ error: 'Documento no encontrado' });
      return;
    }

    const readStream = await documentStorageService.openReadStream(doc.fileUrl || '');
    if (readStream) {
      res.setHeader('Content-Disposition', `attachment; filename="${doc.filename || 'documento'}"`);
      res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
      readStream.pipe(res);
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
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Document);

    const doc = await findScopedDocument(id, auth.companyId, auth.uid);
    if (!doc) {
      res.status(404).json({ error: 'Documento no encontrado' });
      return;
    }

    doc.status = 'signed';
    await repo.save(doc);
    await logAction({ userId: auth.uid, companyId: auth.companyId, action: 'document_sign', metadata: { documentId: doc.id, title: doc.title } });

    res.json({ message: 'Documento firmado', document: doc });
  })
);

export default router;
