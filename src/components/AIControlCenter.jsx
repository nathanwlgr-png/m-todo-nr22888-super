import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Zap, ZapOff, Globe, Bot, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const AI_MODE_KEY = 'nr22_ai_mode';
const AI_WHATSAPP_KEY = 'nr22_ai_whatsapp';

export default function AIControlCenter() {
  const [aiMode, setAiMode] = useState(() => {
    return localStorage.getItem(AI_MODE_KEY) || 'economy';
  });
  
  const [whatsappAI, setWhatsappAI] = useState(() => {
    return localStorage.getItem(AI_WHATSAPP_KEY) !== 'false';
  });

  useEffect(() => {
    localStorage.setItem(AI_MODE_KEY, aiMode);
  }, [aiMode]);

  useEffect(() => {
    localStorage.setItem(AI_WHATSAPP_KEY, whatsappAI);
  }, [whatsappAI]);

  const modes = {
    off: {
      label: 'Desligado',
      icon: ZapOff,
      color: 'text-gray-500',
      bg: 'bg-gray-100',
      description: 'Todas as IAs desligadas, usa apenas busca web'
    },
    economy: {
      label: 'Econômico',
      icon: Zap,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      description: 'IA ativada apenas quando solicitado manualmente'
    },
    full: {
      label: 'Completo',
      icon: Bot,
      color: 'text-green-600',
      bg: 'bg-green-100',
      description: 'Todas as IAs ativas automaticamente'
    }
  };

  const handleModeChange = (newMode) => {
    setAiMode(newMode);
    const modeInfo = modes[newMode];
    toast.success(`Modo ${modeInfo.label} ativado!`, {
      description: modeInfo.description
    });
  };

  const currentMode = modes[aiMode];
  const Icon = currentMode.icon;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${currentMode.color}`} />
          Controle de IA - Modo {currentMode.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seletor de Modo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Modo de Operação:</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(modes).map(([key, mode]) => {
              const ModeIcon = mode.icon;
              return (
                <Button
                  key={key}
                  variant={aiMode === key ? 'default' : 'outline'}
                  onClick={() => handleModeChange(key)}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <ModeIcon className={`w-5 h-5 ${aiMode === key ? 'text-white' : mode.color}`} />
                  <span className="text-xs">{mode.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Status atual */}
        <div className={`p-4 rounded-lg ${currentMode.bg}`}>
          <p className="text-sm text-slate-700">{currentMode.description}</p>
        </div>

        {/* WhatsApp AI */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium">WhatsApp AI Master</p>
              <p className="text-xs text-slate-600">Mantém IA do WhatsApp sempre ativa</p>
            </div>
          </div>
          <Switch
            checked={whatsappAI}
            onCheckedChange={(checked) => {
              setWhatsappAI(checked);
              toast.success(checked ? 'WhatsApp AI ativado' : 'WhatsApp AI desativado');
            }}
          />
        </div>

        {/* Resumo de funcionalidades */}
        <div className="space-y-2 text-sm">
          <p className="font-medium">Status dos Recursos:</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {aiMode === 'off' ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
              <span>Análises com IA: {aiMode === 'off' ? 'Desativadas' : aiMode === 'economy' ? 'Sob demanda' : 'Ativas'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Busca Web: Sempre ativa</span>
            </div>
            <div className="flex items-center gap-2">
              {whatsappAI ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span>WhatsApp AI: {whatsappAI ? 'Ativo' : 'Desativado'}</span>
            </div>
          </div>
        </div>

        {/* Alternativas sem IA */}
        {aiMode === 'off' && (
          <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded">
            <div className="flex items-start gap-2">
              <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Modo Web Ativo</p>
                <p className="text-xs text-blue-700 mt-1">
                  Sistema usando busca na internet para análises e dados de mercado
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook para verificar se IA está ativa
export const useAIMode = () => {
  const [aiMode, setAiMode] = useState(() => {
    return localStorage.getItem(AI_MODE_KEY) || 'economy';
  });

  const [whatsappAI] = useState(() => {
    return localStorage.getItem(AI_WHATSAPP_KEY) !== 'false';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setAiMode(localStorage.getItem(AI_MODE_KEY) || 'economy');
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    aiMode,
    isAIEnabled: aiMode !== 'off',
    isWhatsAppAIEnabled: whatsappAI,
    needsManualActivation: aiMode === 'economy'
  };
};