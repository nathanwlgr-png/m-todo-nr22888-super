import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

/**
 * Handler global para erros de entidades não encontradas
 * Captura erros "Entity X with ID Y not found" e redireciona para Home
 */
class EntityNotFoundHandler extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Verifica se é erro de entidade não encontrada ou rede
    if (error?.message?.includes('not found') || 
        error?.message?.includes('Entity') ||
        error?.message?.includes('Network Error') ||
        error?.response?.data?.error?.includes('not found')) {
      return { hasError: true };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    console.warn('EntityNotFoundHandler capturou erro:', error);
    
    // Redirecionar para Home após 1 segundo
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Registro não encontrado</h2>
            <p className="text-slate-600 mb-4">Redirecionando para Home...</p>
            <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para uso manual
export function useEntityNotFoundProtection(entityId, redirectPath = 'Home') {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!entityId || 
        entityId === 'undefined' || 
        entityId === 'null' || 
        entityId.length < 20) {
      toast.error('ID inválido');
      navigate(createPageUrl(redirectPath));
    }
  }, [entityId, redirectPath, navigate]);
}

export default EntityNotFoundHandler;