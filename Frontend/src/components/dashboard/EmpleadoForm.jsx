import React, { useState } from 'react';

export default function EmpleadoForm({ initialValues = {}, onSubmit, onCancel, loading }) {
  const [nombre, setNombre] = useState(initialValues.nombre || initialValues.name || '');
  const [puesto, setPuesto] = useState(initialValues.puesto || initialValues.position || '');
  const [sede, setSede] = useState(initialValues.sede || '');
  const [rol, setRol] = useState(initialValues.rol || initialValues.role || 'Usuario');
  const [error, setError] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (!nombre.trim() || !puesto.trim() || !sede.trim()) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    setError('');
    onSubmit({ nombre, puesto, sede, rol });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 260 }}>
      <div>
        <label style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 6, display: 'block' }}>Nombre completo*</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} autoFocus />
      </div>
      <div>
        <label style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 6, display: 'block' }}>Puesto*</label>
        <input value={puesto} onChange={e => setPuesto(e.target.value)} style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 6, display: 'block' }}>Sede*</label>
        <input value={sede} onChange={e => setSede(e.target.value)} style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 6, display: 'block' }}>Rol*</label>
        <select value={rol} onChange={e => setRol(e.target.value)} style={{ ...inputStyle, padding: '10px 12px' }}>
          <option value="Admin">Admin</option>
          <option value="Usuario">Usuario</option>
        </select>
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 4 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button type="submit" className="tp-btn tp-btn-primary" style={{ borderRadius: 10, padding: '10px 22px', fontSize: 14 }} disabled={loading}>Guardar</button>
        <button type="button" className="tp-btn tp-btn-ghost" style={{ borderRadius: 10, padding: '10px 22px', fontSize: 14 }} onClick={onCancel} disabled={loading}>Cancelar</button>
      </div>
    </form>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--t0)', fontSize: 14, outline: 'none', marginTop: 2
};
