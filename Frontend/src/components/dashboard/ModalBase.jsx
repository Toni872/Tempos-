import React, { useEffect } from 'react';

export default function ModalBase({ open, onClose, children, title }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="tp-modal-overlay" role="dialog" aria-modal="true" aria-label={title || 'Diálogo'} style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.32)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tp-fade-in 0.2s'
    }} onClick={onClose}>
      <div className="tp-modal-content" style={{
        background: 'var(--bg1)', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: 36, minWidth: 340, maxWidth: 420, width: '100%', position: 'relative',
        animation: 'tp-slide-up 0.25s',
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Cerrar" style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: 'var(--t2)', fontSize: 22, cursor: 'pointer' }}>&times;</button>
        {title && <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 700, marginBottom: 18 }}>{title}</h2>}
        {children}
      </div>
    </div>
  );
}
