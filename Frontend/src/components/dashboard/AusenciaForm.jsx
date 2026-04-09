import React, { useState } from 'react';

export default function AusenciaForm({ initialValues = {}, onSubmit, onCancel, loading }) {
  const [motivo, setMotivo] = useState(initialValues.motivo || initialValues.reason || 'Vacaciones');
  const [dias, setDias] = useState(initialValues.dias || initialValues.days || 1);
  const [fechaInicio, setFechaInicio] = useState(initialValues.fechaInicio || initialValues.startDate || '');
  const [fechaFin, setFechaFin] = useState(initialValues.fechaFin || initialValues.endDate || '');
  const [error, setError] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin || dias < 1) {
      setError('Completa todos los campos correctamente.');
      return;
    }
    if (fechaFin < fechaInicio) {
      setError('La fecha fin no puede ser anterior a la fecha inicio.');
      return;
    }
    setError('');
    onSubmit({ motivo, dias, fechaInicio, fechaFin });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 260 }}>
      <div>
        <label style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 6, display: 'block' }}>Motivo*</label>
        <select value={motivo} onChange={e => setMotivo(e.target.value)} style={{ ...inputStyle, padding: '10px 12px' }}>
          <option value="Vacaciones">Vacaciones</option>
          <option value="Baja médica">Baja médica</option>
          <option value="Asuntos propios">Asuntos propios</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 6, display: 'block' }}>Días*</label>
        <input type="number" min={1} value={dias} onChange={e => setDias(Number(e.target.value))} style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 6, display: 'block' }}>Fecha inicio*</label>
        <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 6, display: 'block' }}>Fecha fin*</label>
        <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={inputStyle} />
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 4 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button type="submit" className="tp-btn tp-btn-primary" style={{ borderRadius: 10, padding: '10px 22px', fontSize: 14 }} disabled={loading}>Solicitar</button>
        <button type="button" className="tp-btn tp-btn-ghost" style={{ borderRadius: 10, padding: '10px 22px', fontSize: 14 }} onClick={onCancel} disabled={loading}>Cancelar</button>
      </div>
    </form>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--t0)', fontSize: 14, outline: 'none', marginTop: 2
};
