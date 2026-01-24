import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Navigation } from 'lucide-react';
import SmartRouteOptimizer from '@/components/SmartRouteOptimizer';

export default function RouteOptimizer() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl('Home'))}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Otimizador de Rotas</h1>
            <p className="text-gray-600">Planeje visitas com inteligência artificial</p>
          </div>
          <Navigation className="w-8 h-8 text-blue-600 ml-auto" />
        </div>

        <SmartRouteOptimizer />
      </div>
    </div>
  );
}