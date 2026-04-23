import React from 'react';

export default function ShiftAssignForm({ initialValues, employees, schedules, onSubmit, onCancel }) {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      onSubmit({
        userId: fd.get('userId'),
        scheduleId: fd.get('scheduleId'),
        startDate: fd.get('startDate'),
      });
    }} className="space-y-4 pt-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white/70">Empleado</label>
        <select name="userId" defaultValue={initialValues?.userId || ''} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none">
          <option value="" disabled>Seleccionar empleado...</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.displayName || emp.email}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white/70">Horario / Plantilla</label>
        <select name="scheduleId" defaultValue={initialValues?.scheduleId || ''} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none">
          <option value="" disabled>Seleccionar horario...</option>
          {schedules.map(sch => (
            <option key={sch.id} value={sch.id}>{sch.name} ({sch.startTime} - {sch.endTime})</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white/70">Fecha de Inicio</label>
        <input name="startDate" type="date" defaultValue={initialValues?.startDate || new Date().toISOString().split('T')[0]} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none" style={{ colorScheme: 'dark' }} />
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 rounded-xl text-white/50 hover:bg-white/5 transition-all font-bold">Cancelar</button>
        <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl transition-all shadow-lg shadow-blue-600/20">Asignar Turno</button>
      </div>
    </form>
  );
}
