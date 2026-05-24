import React from 'react';

/**
 * Error Boundary que captura errores de componentes hijos
 * y muestra una pantalla de fallback en lugar de romper toda la app.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Error capturado:', error, errorInfo);
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg0)',
          color: 'var(--t0)',
          padding: 40,
          textAlign: 'center',
          fontFamily: 'var(--ff-body)',
        }}>
          <h1 style={{ fontSize: 48, marginBottom: 16, fontFamily: 'var(--ff-head)' }}>
            Algo salió mal
          </h1>
          <p style={{ color: 'var(--t1)', marginBottom: 24, maxWidth: 400, lineHeight: 1.6 }}>
            Hubo un error inesperado. No te preocupes, ya registramos el incidente.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 32px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--mg)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Recargar página
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre style={{ marginTop: 32, fontSize: 12, color: '#f87171', maxWidth: '90vw', overflow: 'auto' }}>
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
