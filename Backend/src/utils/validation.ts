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
  metadata: z.record(z.string(), z.unknown()).optional(),
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
  metadata: z.record(z.string(), z.unknown()).optional(),
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

export function buildValidationError(error: z.ZodError): { error: string; details: string[] } {
  return {
    error: 'Parametros invalidos',
    details: error.issues.map((issue) => issue.message),
  };
}
