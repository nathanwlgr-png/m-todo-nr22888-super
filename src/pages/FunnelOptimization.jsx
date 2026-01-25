import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import FunnelOptimizationAI from '@/components/FunnelOptimizationAI';

export default function FunnelOptimization() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-slate-800">Otimização de Funil IA</h1>
            <p className="text-xs text-slate-600">Análise preditiva e automações</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <FunnelOptimizationAI />
      </div>
    </div>
  );
}