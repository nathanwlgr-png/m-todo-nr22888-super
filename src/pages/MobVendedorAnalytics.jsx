import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SalesTrendAnalyzer from '@/components/SalesTrendAnalyzer';
import SalesForecastAI from '@/components/SalesForecastAI';
import LowPerformanceAnalyzer from '@/components/LowPerformanceAnalyzer';

export default function MobVendedorAnalytics() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics mobVendedor</h1>
            <p className="text-sm text-slate-600">Análise de vendas, previsões e produtos com baixo desempenho</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Tendências de Vendas */}
        <SalesTrendAnalyzer />

        {/* Previsão de Vendas */}
        <SalesForecastAI />

        {/* Produtos com Baixo Desempenho */}
        <LowPerformanceAnalyzer />

        {/* Info Card */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h3 className="font-semibold text-slate-800 mb-3">📊 Como usar</h3>
          <ul className="text-sm text-slate-700 space-y-2">
            <li>✓ <strong>Tendências:</strong> Veja quais equipamentos vendem mais e sazonalidade</li>
            <li>✓ <strong>Previsão:</strong> IA prevê vendas dos próximos meses baseado em histórico</li>
            <li>✓ <strong>Baixo Desempenho:</strong> Identifique produtos com problemas e ações recomendadas</li>
            <li>✓ <strong>Dados Automáticos:</strong> Sincronizados a cada 15 minutos do mobVendedor</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}