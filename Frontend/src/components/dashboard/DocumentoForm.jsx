import React, { useState } from 'react';

export default function DocumentoForm({ onSubmit, onCancel, loading }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('Nómina');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (!nombre.trim() || !file) {
      setError('Nombre y archivo son obligatorios.');
      return;
    }
    setError('');
    onSubmit({ nombre, tipo, file });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 260 }}>
      <div>
        <label style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 6, display: 'block' }}>Nombre del documento*</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} autoFocus />
      </div>
      <div>
        <label style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 6, display: 'block' }}>Tipo*</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...inputStyle, padding: '10px 12px' }}>
          <option value="Nómina">Nómina</option>
          <option value="Contrato">Contrato</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 6, display: 'block' }}>Archivo*</label>
        <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={e => setFile(e.target.files[0])} style={{ marginTop: 2 }} />
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 4 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button type="submit" className="tp-btn tp-btn-primary" style={{ borderRadius: 10, padding: '10px 22px', fontSize: 14 }} disabled={loading}>Subir</button>
        <button type="button" className="tp-btn tp-btn-ghost" style={{ borderRadius: 10, padding: '10px 22px', fontSize: 14 }} onClick={onCancel} disabled={loading}>Cancelar</button>
      </div>
    </form>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--t0)', fontSize: 14, outline: 'none', marginTop: 2
};
