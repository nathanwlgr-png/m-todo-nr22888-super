import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home } from 'lucide-react';

export default function FloatingHomeButton() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Não mostrar na própria Home
  if (location.pathname === createPageUrl('Home') || location.pathname === '/') {
    return null;
  }

  return (
    <button
      onClick={() => navigate(createPageUrl('Home'))}
      className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-full shadow-lg shadow-orange-500/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 glow-orange"
      aria-label="Voltar para Home"
    >
      <Home className="w-6 h-6 text-white" />
    </button>
  );
}