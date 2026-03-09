import React from 'react';
import SentimentAnalysisDashboard from '@/components/SentimentAnalysisDashboard';
import { Brain } from 'lucide-react';

export default function SentimentHub() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Análise de Sentimento</h1>
            <p className="text-sm text-slate-500">
              Monitoramento emocional de interações com clínicas e hospitais veterinários
            </p>
          </div>
        </div>
        <SentimentAnalysisDashboard />
      </div>
    </div>
  );
}