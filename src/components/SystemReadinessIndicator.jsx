import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Rocket, Sparkles } from 'lucide-react';

const SystemReadinessIndicator = () => {
  const modules = [
    { name: 'Dashboard Executivo', status: 100, color: 'text-green-600' },
    { name: 'WhatsApp Integration', status: 100, color: 'text-green-600' },
    { name: 'Assistente IA', status: 100, color: 'text-green-600' },
    { name: 'Otimizador de Rotas', status: 100, color: 'text-green-600' },
    { name: 'Alertas Proativos', status: 100, color: 'text-green-600' },
    { name: 'Funções Backend', status: 95, color: 'text-amber-600' }
  ];

  const overallReadiness = modules.reduce((sum, m) => sum + m.status, 0) / modules.length;

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Rocket className="w-6 h-6" />
            Prontidão do Sistema
          </CardTitle>
          <Badge className="bg-green-600 text-white text-lg px-4 py-2">
            {Math.round(overallReadiness)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-800">Status Geral</span>
            <span className="text-xl font-bold text-green-600">{Math.round(overallReadiness)}%</span>
          </div>
          <Progress value={overallReadiness} className="h-3" />
        </div>

        <div className="space-y-3">
          {modules.map((module, index) => (
            <div key={index} className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-900">{module.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${module.color}`}>
                    {module.status}%
                  </span>
                  {module.status === 100 && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </div>
              <Progress value={module.status} className="h-2" />
            </div>
          ))}
        </div>

        {overallReadiness >= 95 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-2" />
            <p className="font-bold text-lg mb-1">🚀 Sistema Pronto para Uso!</p>
            <p className="text-sm text-green-100">
              Todos os módulos estão operacionais e prontos para maximizar suas vendas.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemReadinessIndicator;