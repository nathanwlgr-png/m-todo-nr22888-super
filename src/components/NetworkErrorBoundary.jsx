import React from 'react';
import { AlertCircle, RefreshCw, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Boundary para capturar erros de rede e permitir retry
 */
class NetworkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    const isNetworkError = 
      error?.message?.includes('Network Error') ||
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('NetworkError') ||
      error?.code === 'ERR_NETWORK';

    if (isNetworkError) {
      return { hasError: true, error };
    }
    
    return null;
  }

  componentDidCatch(error, errorInfo) {
    console.error('NetworkErrorBoundary capturou:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-8 h-8 text-red-600" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Erro de Conexão
            </h3>
            
            <p className="text-slate-600 mb-6">
              Não foi possível carregar os dados. Verifique sua conexão com a internet.
            </p>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>

              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                Ir para Home
              </Button>
            </div>

            {this.state.retryCount > 0 && (
              <p className="text-xs text-slate-500 mt-4">
                Tentativas: {this.state.retryCount}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;