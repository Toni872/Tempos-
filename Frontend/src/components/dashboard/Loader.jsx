import React from 'react';

export default function Loader({ text = 'Cargando...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 24 }}>
      <div className="tp-loader" style={{ width: 36, height: 36, border: '4px solid var(--mg2)', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'tp-spin 1s linear infinite' }} />
      <span style={{ color: 'var(--t1)', fontSize: 14 }}>{text}</span>
      <style>{`@keyframes tp-spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
