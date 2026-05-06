import { z } from 'zod';

/**
 * Esquema para el Usuario (Profile)
 */
export const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable().optional(),
  role: z.enum(['admin', 'manager', 'employee', 'auditor']).default('employee'),
  companyId: z.string().optional(),
  hasAcceptedTerms: z.boolean().default(false),
  requiresGeolocation: z.boolean().default(false),
  requiresQR: z.boolean().default(false),
  status: z.string().default('active'),
}).passthrough(); // Permite campos adicionales sin romper

/**
 * Esquema para un Evento de Fichaje
 */
export const TimeEntryEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  timestampUtc: z.string(),
  metadata: z.record(z.any()).optional().nullable(),
}).passthrough();

/**
 * Esquema para una Ficha (Jornada)
 */
export const FichaSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string().nullable().optional(),
  status: z.string(),
  events: z.array(TimeEntryEventSchema).optional().default([]),
}).passthrough();

/**
 * Esquema para Empleado
 */
export const EmployeeSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable().optional(),
  role: z.string().default('employee'),
  status: z.string().default('active'),
  companyId: z.string().optional(),
}).passthrough();

/**
 * Esquema para Centro de Trabajo
 */
export const WorkCenterSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  status: z.string().default('active'),
}).passthrough();

/**
 * Esquema para Documento
 */
export const DocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  status: z.string(),
  createdAt: z.string(),
}).passthrough();

/**
 * Esquema para Ausencia
 */
export const AbsenceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
}).passthrough();
