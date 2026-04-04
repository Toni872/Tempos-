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
      <div className="tp-pwa-banner">
        <img src="/pwa-icon.svg" alt="Tempos" width="36" height="36" className="tp-pwa-banner__icon" />
        <div className="tp-pwa-banner__text">
          <p className="tp-pwa-banner__title">
            Instala Tempos
          </p>
          <p className="tp-pwa-banner__subtitle">
            Acceso rápido desde tu pantalla de inicio
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="tp-pwa-banner__install"
        >
          Instalar
        </button>
        <button
          onClick={dismissBanner}
          aria-label="Cerrar"
          className="tp-pwa-banner__close"
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
