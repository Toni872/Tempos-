import { useCallback } from 'react';
import { getClientSession } from '@/lib/api';
import api, { createEmployee, updateEmployee } from '@/lib/api';
import { z } from 'zod';

const employeeSchema = z.object({
  displayName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("El formato del email no es válido"),
  role: z.enum(['admin', 'manager', 'employee'], {
    errorMap: () => ({ message: "Selecciona un rango de autoridad válido" })
  }),
  dni: z.string().min(8, "El DNI/NIE debe ser válido"),
  phone: z.string().optional(),
  hourlyRate: z.coerce.number().min(0, "La tarifa no puede ser negativa"),
  workCenterId: z.string().optional(),
  status: z.enum(['active', 'suspended'])
});

export function useEmployeeMutations({ showFeedback, refreshAllData }) {
  const handleEmployeeSubmit = useCallback(async (values, mode, modalData) => {
    const session = getClientSession();
    if (!session?.token) return;

    try {
      const validatedData = employeeSchema.parse(values);

      if (mode === 'edit') {
        await updateEmployee(session.token, modalData.id, validatedData);
      } else {
        const res = await createEmployee(session.token, validatedData);
        showFeedback('success', res?.message || `Invitación enviada a ${validatedData.email}.`);
        await refreshAllData();
        return;
      }

      await refreshAllData();
      showFeedback('success', `Usuario ${validatedData.displayName} actualizado correctamente.`);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstError = err.issues[0].message;
        showFeedback('error', `Dato inválido: ${firstError}`);
      } else {
        const msg = err.response?.data?.error || err.message || 'Error al guardar empleado.';
        showFeedback('error', msg);
      }
    }
  }, [showFeedback, refreshAllData]);

  const handleEmployeeDelete = useCallback(async (emp) => {
    const name = emp.displayName || emp.name || emp.email || 'este empleado';
    if (!confirm(`¿Dar de baja a ${name}?`)) return;

    const session = getClientSession();
    try {
      const uid = emp.uid || emp.id;
      if (!uid) throw new Error('UID no encontrado');
      await api.delete(`/api/v1/employees/${uid}`, { token: session?.token });
      await refreshAllData();
      showFeedback('success', `${name} dado de baja correctamente.`);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Error al dar de baja.';
      showFeedback('error', msg);
    }
  }, [showFeedback, refreshAllData]);

  return { handleEmployeeSubmit, handleEmployeeDelete };
}
