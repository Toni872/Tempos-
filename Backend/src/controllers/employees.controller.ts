import { Router, Request, Response } from 'express';
import { firebaseAuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// In-memory store (dev only)
const employees: any[] = [
  { id: '1', name: 'Ana García', email: 'ana@local', role: 'admin', sede: 'Madrid HQ', status: 'active' },
  { id: '2', name: 'Carlos Mendoza', email: 'carlos@local', role: 'user', sede: 'Remoto', status: 'off' },
];

router.get('/', firebaseAuthMiddleware, (_req: Request, res: Response) => {
  res.json({ data: employees });
});

router.post('/', firebaseAuthMiddleware, (req: Request, res: Response) => {
  const payload = req.body || {};
  const id = String(Date.now());
  const record = { id, ...payload };
  employees.push(record);
  res.status(201).json({ message: 'Empleado creado', employee: record });
});

router.put('/:id', firebaseAuthMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = employees.findIndex(e => e.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Empleado no encontrado' });
    return;
  }
  employees[idx] = { ...employees[idx], ...req.body };
  res.json({ message: 'Empleado actualizado', employee: employees[idx] });
});

router.delete('/:id', firebaseAuthMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = employees.findIndex(e => e.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Empleado no encontrado' });
    return;
  }
  employees.splice(idx, 1);
  res.json({ message: 'Empleado eliminado', id });
});

export default router;
