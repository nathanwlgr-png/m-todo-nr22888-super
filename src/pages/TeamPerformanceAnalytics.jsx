import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import SalesTeamPerformanceAnalyzer from '@/components/SalesTeamPerformanceAnalyzer';

export default function TeamPerformanceAnalytics() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              Análise de Performance da Equipe
            </h1>
            <p className="text-xs text-slate-600">
              Insights acionáveis com IA sobre vendas, coaching e comunicação
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-6xl mx-auto">
        <SalesTeamPerformanceAnalyzer />
      </div>
    </div>
  );
}