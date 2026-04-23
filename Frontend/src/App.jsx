import { Suspense, lazy, useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from '@/pages/LandingPage'

const AuthPage = lazy(() => import('@/pages/AuthPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const KioskPage = lazy(() => import('@/pages/KioskPage'))
const TrialPage = lazy(() => import('@/pages/TrialPage'))
const MarketingPage = lazy(() => import('@/pages/MarketingPage'))
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('@/pages/TermsOfService'))

function App() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
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
            <p className="tp-pwa-banner__title">Instala Tempos</p>
            <p className="tp-pwa-banner__subtitle">Acceso rápido desde tu pantalla de inicio</p>
          </div>
          <button onClick={handleInstall} className="tp-pwa-banner__install">Instalar</button>
          <button onClick={dismissBanner} aria-label="Cerrar" className="tp-pwa-banner__close">×</button>
        </div>
      )}

      <Suspense
        fallback={
          <div className="tp-root h-screen grid place-items-center bg-[#0a0a0c] text-zinc-500 font-sans">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm font-medium tracking-tight">Cargando interfaz...</span>
            </div>
          </div>
        }
      >
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
            <Route path="/funcionalidades" element={<PageWrapper><MarketingPage kind="funcionalidades" /></PageWrapper>} />
            <Route path="/faqs" element={<PageWrapper><MarketingPage kind="faqs" /></PageWrapper>} />
            <Route path="/blog" element={<PageWrapper><MarketingPage kind="blog" /></PageWrapper>} />
            <Route path="/contacto" element={<PageWrapper><MarketingPage kind="contacto" /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><AuthPage mode="login" /></PageWrapper>} />
            <Route path="/register" element={<PageWrapper><AuthPage mode="register" /></PageWrapper>} />
            <Route path="/dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
            <Route path="/kiosk" element={<PageWrapper><KioskPage /></PageWrapper>} />
            <Route path="/trial" element={<PageWrapper><TrialPage /></PageWrapper>} />
            <Route path="/legal/privacidad" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
            <Route path="/legal/terminos" element={<PageWrapper><TermsOfService /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  )
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default App
