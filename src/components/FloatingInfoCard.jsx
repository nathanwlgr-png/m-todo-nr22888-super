import React from 'react';
import { X, ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Card flutuante que aparece temporariamente sobre a tela
 * Fecha sozinho após 8s ou pelo botão, com opção de editar/voltar
 */
export default function FloatingInfoCard({ titulo, children, onFechar, onEditar, autoClose = 8000 }) {
  React.useEffect(() => {
    if (!autoClose) return;
    const t = setTimeout(onFechar, autoClose);
    return () => clearTimeout(t);
  }, [onFechar, autoClose]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-4 px-3">
      <div className="pointer-events-auto w-full max-w-md bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden animate-in slide-in-from-top-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between">
          <span className="text-white font-semibold text-sm">{titulo}</span>
          <div className="flex gap-2">
            {onEditar && (
              <button onClick={onEditar} className="text-white/80 hover:text-white">
                <Edit className="w-4 h-4" />
              </button>
            )}
            <button onClick={onFechar} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Conteúdo */}
        <div className="p-4 max-h-64 overflow-y-auto">
          {children}
        </div>
        {/* Footer */}
        <div className="px-4 pb-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={onFechar} className="flex-1 h-8 text-xs">
            <ArrowLeft className="w-3 h-3 mr-1" /> Voltar
          </Button>
          {onEditar && (
            <Button size="sm" onClick={onEditar} className="flex-1 h-8 text-xs bg-indigo-600">
              <Edit className="w-3 h-3 mr-1" /> Editar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}