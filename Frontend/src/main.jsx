import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { SplashScreen } from '@capacitor/splash-screen';

// Ocultar Splash Screen lo antes posible
if (typeof window !== 'undefined') {
  SplashScreen.hide().catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
