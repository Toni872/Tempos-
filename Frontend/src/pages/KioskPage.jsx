import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function KioskPage() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState({ type: 'idle', msg: '' });
  const [authMode, setAuthMode] = useState('pin'); // 'pin' | 'qr'

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleKeyClick = (num) => {
    if (status.type !== 'idle') return;
    if (pin.length < 4) setPin(pin + num);
  };

  const handleBackspace = () => {
    if (status.type !== 'idle') return;
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setStatus({ type: 'idle', msg: '' });
  };

  useEffect(() => {
    if (pin.length === 4) {
      // TODO: Replace with backend kiosk-auth endpoint (POST /api/kiosk/identify)
      // Currently in demo mode — no real PIN validation or clock event.
      setStatus({ type: 'loading', msg: 'Validando identidad...' });
      setTimeout(() => {
        setStatus({
          type: 'success',
          msg: 'Modo demo — Fichaje por kiosco disponible próximamente. PIN introducido: ****',
        });
        
        setTimeout(() => {
          setPin('');
          setStatus({ type: 'idle', msg: '' });
        }, 3500);
      }, 800);
    }
  }, [pin]);

  return (
    <>
      <style>{`
        .tp-kiosk-keys { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 0 auto; max-width: 320px; }
        .tp-kiosk-key { 
          aspect-ratio: 1; border-radius: 50%; font-size: 28px; font-weight: 600; font-family: var(--ff-mono);
          background: rgba(255,255,255,0.03); border: 1px solid var(--border);
          color: var(--t0); cursor: pointer; transition: all 0.2s var(--ease-spring);
          display: flex; align-items: center; justify-content: center;
        }
        .tp-kiosk-key:active { transform: scale(0.9); background: var(--mg); border-color: var(--mg); color: #fff; }
        .tp-kiosk-key:hover { background: rgba(255,255,255,0.08); }
        .tp-kiosk-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--border); transition: all 0.2s; }
        .tp-kiosk-dot.filled { background: var(--mg); border-color: var(--mg); box-shadow: 0 0 12px var(--mg); }
        @keyframes tp-scan-line { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
      `}</style>
      
      <div className="tp-root" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg0)', color: 'var(--t0)', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        
        {/* Ambient Backlight */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80vw', height: '80vw', background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }}/>

        {/* Exit Button */}
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 32, left: 32, background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Salir de Modo Kiosko
        </button>

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, padding: 40, textAlign: 'center' }}>
          
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 20, fontWeight: 700, letterSpacing: 1.5, color: 'var(--mg)', marginBottom: 24, textTransform: 'uppercase' }}>Tempos Kiosk</div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 72, fontWeight: 700, color: 'var(--t0)', lineHeight: 1, letterSpacing: -2, marginBottom: 8 }}>
              {time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ color: 'var(--t1)', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 500 }}>
              {time.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 40 }}>
            <button onClick={() => setAuthMode('pin')} className={`tp-btn ${authMode === 'pin' ? 'tp-btn-primary' : 'tp-btn-ghost'}`} style={{ padding: '8px 24px', borderRadius: 20 }}>Teclado PIN</button>
            <button onClick={() => setAuthMode('qr')} className={`tp-btn ${authMode === 'qr' ? 'tp-btn-primary' : 'tp-btn-ghost'}`} style={{ padding: '8px 24px', borderRadius: 20 }}>Escanear QR / Cámara</button>
          </div>

          <div style={{ minHeight: 160 }}>
            {authMode === 'pin' ? (
              <>
                {status.type === 'idle' && (
                  <>
                    <div style={{ color: 'var(--t0)', fontSize: 18, marginBottom: 32, fontWeight: 500 }}>Introduce tu PIN:</div>
                    <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 40 }}>
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`tp-kiosk-dot ${i < pin.length ? 'filled' : ''}`} />
                      ))}
                    </div>
                  </>
                )}

                {status.type === 'loading' && (
                  <div style={{ color: 'var(--mg2)', fontSize: 18, fontWeight: 500, animation: 'tp-pulse-ring 1s infinite alternate', margin: '40px 0' }}>{status.msg}</div>
                )}

                {status.type === 'success' && (
                  <div style={{ margin: '20px 0', padding: '24px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 16, color: '#22c55e', fontSize: 18, fontWeight: 600, animation: 'tp-reveal-up 0.4s var(--ease-spring)' }}>
                    {status.msg}
                  </div>
                )}

                {status.type === 'error' && (
                  <div style={{ margin: '20px 0', padding: '24px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, color: '#ef4444', fontSize: 18, fontWeight: 600, animation: 'tp-reveal-up 0.4s var(--ease-spring)' }}>
                    {status.msg}
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ color: 'var(--t0)', fontSize: 18, marginBottom: 24, fontWeight: 500 }}>Apunta tu código QR a la cámara:</div>
                <div style={{ width: 220, height: 220, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '2px dashed var(--mg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--mg)', animation: 'tp-scan-line 2s linear infinite', boxShadow: '0 0 10px var(--mg)' }} />
                  <svg width="48" height="48" fill="none" stroke="var(--mg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ opacity: 0.5 }}><path d="M4 4h16v16H4z"/><path d="M4 12h16"/><path d="M12 4v16"/></svg>
                </div>
                <div style={{ marginTop: 20, fontSize: 13, color: 'var(--t2)', maxWidth: 280, lineHeight: 1.5 }}>
                  Sitúa el código generado en tu app móvil frente a la cámara del dispositivo.
                </div>
              </div>
            )}
          </div>

          <div className={`tp-kiosk-keys ${status.type !== 'idle' ? 'tp-reveal' : ''}`} style={{ transition: 'opacity 0.3s', opacity: authMode === 'pin' && status.type === 'idle' ? 1 : 0.1, pointerEvents: authMode === 'pin' && status.type === 'idle' ? 'auto' : 'none' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button key={num} onClick={() => handleKeyClick(num.toString())} className="tp-kiosk-key">{num}</button>
            ))}
            <button onClick={handleClear} className="tp-kiosk-key" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, backgroundColor: 'rgba(239,68,68,0.05)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>C</button>
            <button onClick={() => handleKeyClick('0')} className="tp-kiosk-key">0</button>
            <button onClick={handleBackspace} className="tp-kiosk-key">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" x2="12" y1="9" y2="15"/><line x1="12" x2="18" y1="9" y2="15"/></svg>
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
