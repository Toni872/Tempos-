import { Suspense, lazy, useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'

const AuthPage = lazy(() => import('@/pages/AuthPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const KioskPage = lazy(() => import('@/pages/KioskPage'))
const TrialPage = lazy(() => import('@/pages/TrialPage'))
const MarketingPage = lazy(() => import('@/pages/MarketingPage'))

function App() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      // Mostrar banner solo si el usuario no lo ha descartado antes
      if (!sessionStorage.getItem('pwa-banner-dismissed')) {
        setShowBanner(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    setShowBanner(false)
    setInstallPrompt(null)
  }

  const dismissBanner = () => {
    sessionStorage.setItem('pwa-banner-dismissed', '1')
    setShowBanner(false)
  }

  return (
    <>
    {showBanner && (
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
        background: 'rgba(10,10,12,0.97)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(37,99,235,0.3)',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <img src="/pwa-icon.svg" alt="Tempos" width="36" height="36" style={{ borderRadius: 8, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#f5f5f3', lineHeight: 1.3 }}>
            Instala Tempos
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#8e8e89', lineHeight: 1.4 }}>
            Acceso rápido desde tu pantalla de inicio
          </p>
        </div>
        <button
          onClick={handleInstall}
          style={{
            background: '#2563eb', color: '#fff', border: 'none',
            borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          Instalar
        </button>
        <button
          onClick={dismissBanner}
          aria-label="Cerrar"
          style={{
            background: 'none', border: 'none', color: '#71716d',
            cursor: 'pointer', padding: 6, fontSize: 18, lineHeight: 1, flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    )}
    <Suspense
      fallback={
        <div
          className="tp-root"
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: 'var(--bg0)',
            color: 'var(--t1)',
            fontFamily: 'var(--ff-body)',
          }}
        >
          Cargando interfaz...
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/funcionalidades" element={<MarketingPage kind="funcionalidades" />} />
        <Route path="/faqs" element={<MarketingPage kind="faqs" />} />
        <Route path="/blog" element={<MarketingPage kind="blog" />} />
        <Route path="/contacto" element={<MarketingPage kind="contacto" />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/kiosk" element={<KioskPage />} />
        <Route path="/trial" element={<TrialPage />} />
      </Routes>
    </Suspense>
    </>
  )
}

export default App
