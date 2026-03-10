import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { 
  DollarSign, 
  Zap, 
  AlertCircle, 
  Info,
  TrendingDown,
  TrendingUp 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function EconomicModeToggle() {
  const [economicMode, setEconomicMode] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Carregar estado do modo econômico do localStorage
    const savedMode = localStorage.getItem('ai_economic_mode');
    if (savedMode === 'true') {
      setEconomicMode(true);
    }

    // Configurar interceptador global para uso econômico
    if (economicMode) {
      window.__AI_ECONOMIC_MODE__ = true;
    } else {
      window.__AI_ECONOMIC_MODE__ = false;
    }
  }, [economicMode]);

  const toggleEconomicMode = (checked) => {
    setEconomicMode(checked);
    localStorage.setItem('ai_economic_mode', checked.toString());
    window.__AI_ECONOMIC_MODE__ = checked;
    
    if (checked) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
    }
  };

  return (
    <div className="relative">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={economicMode ? "default" : "outline"}
            size="sm"
            className={`gap-2 ${
              economicMode 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'border-slate-300'
            }`}
          >
            {economicMode ? (
              <>
                <TrendingDown className="w-4 h-4" />
                Modo Econômico
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Modo Normal
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  Modo Econômico de IA
                </h4>
                <Switch
                  checked={economicMode}
                  onCheckedChange={toggleEconomicMode}
                />
              </div>
              <p className="text-xs text-slate-600">
                Ative para economizar créditos de IA usando modelos mais eficientes
              </p>
            </div>

            <div className="space-y-3 border-t pt-3">
              <div className="flex items-start gap-2 text-xs">
                <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Quando Ativo:</p>
                  <ul className="list-disc list-inside text-slate-600 mt-1 space-y-1">
                    <li>Usa modelos mais baratos (Gemini Flash)</li>
                    <li>Reduz uso de contexto da internet</li>
                    <li>Respostas mais concisas</li>
                    <li>Economia de até 70% em créditos</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Limitações:</p>
                  <ul className="list-disc list-inside text-slate-600 mt-1 space-y-1">
                    <li>Análises menos detalhadas</li>
                    <li>Menor contexto em respostas</li>
                    <li>Qualidade ligeiramente reduzida</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs bg-blue-50 p-2 rounded">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-700">
                  <strong>Dica:</strong> Ative quando estiver fazendo tarefas simples ou consultando muitos dados. Desative para análises complexas e propostas importantes.
                </p>
              </div>
            </div>

            {economicMode && (
              <Badge className="w-full justify-center bg-green-100 text-green-800 border-green-300">
                ✓ Economizando Créditos Agora
              </Badge>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {showWarning && economicMode && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-green-50 border border-green-200 rounded-lg p-3 shadow-lg animate-in slide-in-from-top-2">
          <p className="text-xs text-green-800">
            ✓ Modo Econômico Ativado! Suas próximas operações de IA usarão menos créditos.
          </p>
        </div>
      )}
    </div>
  );
}

// Função helper global para usar em integrações
export function getAIModelPreference() {
  const economicMode = window.__AI_ECONOMIC_MODE__ || false;
  
  if (economicMode) {
    return {
      model: 'gemini_3_flash',
      add_context_from_internet: false,
      instructions: 'Seja conciso e objetivo. Priorize economia de tokens.'
    };
  }
  
  return {
    model: 'automatic',
    add_context_from_internet: true,
    instructions: ''
  };
}