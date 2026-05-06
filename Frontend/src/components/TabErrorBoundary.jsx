import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Componente Senior para aislar fallos en pestañas individuales.
 * Evita que un error en un componente (ej. un gráfico) rompa toda la aplicación.
 */
class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("❌ [TAB_ERROR]:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-2xl border border-red-100 animate-in fade-in duration-500">
          <div className="p-4 bg-red-100 rounded-full mb-6">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-900 mb-2">Algo salió mal en esta sección</h3>
          <p className="text-red-600 text-center mb-8 max-w-md">
            Hubo un error al cargar este componente. El resto de la aplicación sigue funcionando correctamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
          >
            <RefreshCw className="w-5 h-5" />
            Recargar aplicación
          </button>
          
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-gray-900 text-red-400 text-xs rounded-lg w-full overflow-auto max-h-40">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default TabErrorBoundary;
