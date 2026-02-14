import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Zap, DollarSign, TrendingDown, AlertTriangle } from 'lucide-react';

export default function AIControlCenter() {
  const [aiMode, setAiMode] = useState(() => {
    return localStorage.getItem('nr22_ai_mode') || 'manual';
  });
  
  const [aiUsageCount, setAiUsageCount] = useState(() => {
    const saved = localStorage.getItem('nr22_ai_usage_count');
    return saved ? parseInt(saved) : 0;
  });
  
  const monthlyLimit = 200;

  const handleModeChange = (newMode) => {
    setAiMode(newMode);
    localStorage.setItem('nr22_ai_mode', newMode);
    
    let message = '';
    if (newMode === 'manual') {
      message = '🎯 Modo Manual: IA só quando você pedir explicitamente';
    } else if (newMode === 'economy') {
      message = '💰 Economia: IA otimizada, cache inteligente';
    } else if (newMode === 'performance') {
      message = '⚡ Performance: IA completa ativada';
    } else if (newMode === 'off') {
      message = '❌ IA Desligada: Sem uso de créditos';
    }
    
    toast.success(message, { duration: 3000 });
  };
  
  useEffect(() => {
    const count = parseInt(localStorage.getItem('nr22_ai_usage_count') || '0');
    if (count > monthlyLimit * 0.8) {
      toast.warning(`⚠️ ${count}/${monthlyLimit} calls IA usadas este mês`, { duration: 5000 });
    }
  }, []);

  const usagePercent = Math.round((aiUsageCount / monthlyLimit) * 100);
  const isNearLimit = usagePercent >= 80;

  return (
    <Card className={`p-4 border-2 ${isNearLimit ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-400' : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isNearLimit ? 'bg-red-600' : 'bg-gradient-to-br from-purple-600 to-pink-600'}`}>
          {isNearLimit ? <AlertTriangle className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-purple-900">🎛️ Controle de IA</h3>
          <p className="text-xs text-purple-600">
            {aiUsageCount}/{monthlyLimit} calls ({usagePercent}%)
          </p>
        </div>
        <Badge className={isNearLimit ? 'bg-red-600' : 'bg-purple-600'}>
          {aiMode === 'manual' ? '🎯 Manual' :
           aiMode === 'economy' ? '💰 Economia' :
           aiMode === 'performance' ? '⚡ Performance' : '❌ OFF'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => handleModeChange('manual')}
          variant={aiMode === 'manual' ? 'default' : 'outline'}
          className={aiMode === 'manual' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
          size="sm"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Manual
        </Button>
        <Button
          onClick={() => handleModeChange('economy')}
          variant={aiMode === 'economy' ? 'default' : 'outline'}
          className={aiMode === 'economy' ? 'bg-green-600 hover:bg-green-700' : ''}
          size="sm"
        >
          <DollarSign className="w-4 h-4 mr-1" />
          Economia
        </Button>
        <Button
          onClick={() => handleModeChange('performance')}
          variant={aiMode === 'performance' ? 'default' : 'outline'}
          className={aiMode === 'performance' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          size="sm"
        >
          <Zap className="w-4 h-4 mr-1" />
          Performance
        </Button>
        <Button
          onClick={() => handleModeChange('off')}
          variant={aiMode === 'off' ? 'default' : 'outline'}
          className={aiMode === 'off' ? 'bg-red-600 hover:bg-red-700' : ''}
          size="sm"
        >
          <TrendingDown className="w-4 h-4 mr-1" />
          OFF
        </Button>
      </div>
      
      {/* Barra de Uso */}
      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-purple-700">Uso Mensal</span>
          <span className="text-xs font-bold text-purple-900">{usagePercent}%</span>
        </div>
        <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${isNearLimit ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        {isNearLimit && (
          <p className="text-xs text-red-600 mt-2 font-semibold">
            ⚠️ Próximo do limite! Use modo Manual ou Economy
          </p>
        )}
      </div>

      <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
        <p className="text-xs text-slate-600">
          <strong>Manual:</strong> IA só quando clicar em botão específico<br/>
          <strong>Economia:</strong> Cache + IA seletiva<br/>
          <strong>Performance:</strong> IA completa (gasta mais)
        </p>
      </div>
    </Card>
  );
}