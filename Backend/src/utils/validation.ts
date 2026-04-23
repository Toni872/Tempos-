import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

function isRealDate(value: string): boolean {
  if (!dateRegex.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
}

function getMaxObjectDepth(value: unknown, depth = 0): number {
  if (value === null || typeof value !== 'object') {
    return depth;
  }

  if (Array.isArray(value)) {
    return value.reduce<number>((max, item) => Math.max(max, getMaxObjectDepth(item, depth + 1)), depth + 1);
  }

  const objectValues = Object.values(value as Record<string, unknown>);
  if (objectValues.length === 0) {
    return depth + 1;
  }

  return objectValues.reduce<number>((max, item) => Math.max(max, getMaxObjectDepth(item, depth + 1)), depth + 1);
}

const fichaMetadataSchema = z
  .record(z.string().max(80, 'metadata key admite maximo 80 caracteres.'), z.unknown())
  .superRefine((metadata, ctx) => {
    const rootKeys = Object.keys(metadata).length;
    if (rootKeys > 30) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['metadata'],
        message: 'metadata admite maximo 30 claves en el nivel raiz.',
      });
    }

    const depth = getMaxObjectDepth(metadata);
    if (depth > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['metadata'],
        message: 'metadata no puede superar 5 niveles de profundidad.',
      });
    }

    const serialized = JSON.stringify(metadata);
    if (serialized.length > 8_192) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['metadata'],
        message: 'metadata supera el tamaño máximo permitido (8192 bytes).',
      });
    }
  });

export const dateStringSchema = z
  .string()
  .regex(dateRegex, 'Formato de fecha invalido. Usa YYYY-MM-DD.')
  .refine(isRealDate, 'Fecha invalida.');

export const timeStringSchema = z
  .string()
  .regex(timeRegex, 'Formato de hora invalido. Usa HH:MM (24h).');

export const fichaStatusSchema = z.enum(['draft', 'confirmed', 'disputed', 'archived']);
export const absenceTypeSchema = z.enum(['vacation', 'sick_leave', 'personal_days', 'other']);
export const absenceStatusSchema = z.enum(['pending', 'approved', 'rejected', 'cancelled']);

export const createFichaSchema = z.object({
  date: dateStringSchema,
  startTime: timeStringSchema,
  endTime: timeStringSchema.optional(),
  description: z.string().trim().max(500, 'description admite maximo 500 caracteres.').optional(),
  projectCode: z.string().trim().max(80, 'projectCode admite maximo 80 caracteres.').optional(),
  metadata: fichaMetadataSchema.optional(),
}).superRefine((value, ctx) => {
  if (!value.endTime) {
    return;
  }

  if (toMinutes(value.endTime) < toMinutes(value.startTime)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endTime'],
      message: 'endTime no puede ser menor que startTime.',
    });
  }
});

export const listFichasQuerySchema = z.object({
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  status: fichaStatusSchema.optional(),
  userId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
}).superRefine((value, ctx) => {
  if (value.startDate && value.endDate && value.startDate > value.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['startDate'],
      message: 'startDate no puede ser mayor que endDate.',
    });
  }
});

export const updateFichaSchema = z.object({
  endTime: timeStringSchema.optional(),
  description: z.string().trim().max(500, 'description admite maximo 500 caracteres.').optional(),
  projectCode: z.string().trim().max(80, 'projectCode admite maximo 80 caracteres.').optional(),
  status: fichaStatusSchema.optional(),
  metadata: fichaMetadataSchema.optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar.',
});

export const dailyStatsQuerySchema = z.object({
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
}).superRefine((value, ctx) => {
  if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['startDate'],
      message: 'startDate y endDate deben enviarse juntos.',
    });
  }

  if (value.startDate && value.endDate && value.startDate > value.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['startDate'],
      message: 'startDate no puede ser mayor que endDate.',
    });
  }
});

export const requestFichaCorrectionSchema = z.object({
  startTime: timeStringSchema.optional(),
  endTime: timeStringSchema.optional(),
  description: z.string().trim().max(500, 'description admite maximo 500 caracteres.').optional(),
  projectCode: z.string().trim().max(80, 'projectCode admite maximo 80 caracteres.').optional(),
  reason: z.string().trim().min(10, 'reason debe tener al menos 10 caracteres.').max(500, 'reason admite maximo 500 caracteres.'),
}).superRefine((value, ctx) => {
  const hasAnyChange = value.startTime !== undefined
    || value.endTime !== undefined
    || value.description !== undefined
    || value.projectCode !== undefined;

  if (!hasAnyChange) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['reason'],
      message: 'Debes proponer al menos un cambio sobre la ficha.',
    });
  }
});

export const reviewFichaCorrectionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().trim().max(500, 'comment admite maximo 500 caracteres.').optional(),
});

export const closeFichaPeriodSchema = z.object({
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  userId: z.string().uuid('userId debe ser un UUID válido.').optional(),
}).superRefine((value, ctx) => {
  if (value.startDate > value.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['startDate'],
      message: 'startDate no puede ser mayor que endDate.',
    });
  }
});

export const createAbsenceSchema = z.object({
  type: absenceTypeSchema,
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  reason: z.string().trim().max(1000).optional(),
}).superRefine((value, ctx) => {
  if (value.startDate > value.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['startDate'],
      message: 'startDate no puede ser mayor que endDate.',
    });
  }
});

export const updateAuthProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'displayName debe tener al menos 2 caracteres.')
    .max(120, 'displayName admite maximo 120 caracteres.'),
});

export const userRoleSchema = z.enum(['admin', 'manager', 'auditor', 'employee']);
export const userStatusSchema = z.enum(['active', 'suspended', 'deleted']);

export const createEmployeeSchema = z.object({
  email: z.string().trim().email('Email inválido'),
  displayName: z.string().trim().min(2, 'Nombre demasiado corto').max(120, 'Nombre demasiado largo'),
  role: userRoleSchema.default('employee'),
  hourlyRate: z.coerce.number().min(0).optional(),
  overtimeRate: z.coerce.number().min(0).optional(),
  requiresGeolocation: z.boolean().optional(),
  requiresQR: z.boolean().optional(),
  kioskPin: z.string().regex(/^\d{4,10}$/, 'El PIN debe tener entre 4 y 10 dígitos').or(z.literal('')).optional(),
});

export const updateEmployeeSchema = z.object({
  displayName: z.string().trim().min(2, 'Nombre demasiado corto').max(120, 'Nombre demasiado largo').optional(),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
  overtimeRate: z.coerce.number().min(0).optional(),
  requiresGeolocation: z.boolean().optional(),
  requiresQR: z.boolean().optional(),
  kioskPin: z.string().regex(/^\d{4,10}$/, 'El PIN debe tener entre 4 y 10 dígitos').or(z.literal('')).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar',
});

export const clockInSchema = z.object({
  description: z.string().trim().max(500).optional(),
  projectCode: z.string().trim().max(80).optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  qrToken: z.string().optional(),
});

export const clockOutSchema = z.object({
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  qrToken: z.string().optional(),
});

export const scheduleSchema = z.object({
  name: z.string().trim().min(2).max(255),
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  daysOfWeek: z.array(z.number().min(1).max(7)).min(1),
  gracePeriodMinutes: z.number().int().min(0).max(120).default(0),
});

export const assignShiftSchema = z.object({
  userId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  startDate: dateStringSchema,
  endDate: dateStringSchema.optional(),
});

export function buildValidationError(error: z.ZodError): { error: string; details: string[] } {
  return {
    error: 'Parametros invalidos',
    details: error.issues.map((issue) => issue.message),
  };
}
