import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// IA otimizada para conexão lenta - respostas rápidas e compactas
export default function LightweightAI({ client, mode = 'quick_tip' }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runLightweightAI = async () => {
    setLoading(true);
    try {
      let prompt = '';
      
      if (mode === 'quick_tip') {
        prompt = `Cliente: ${client?.first_name || 'N/A'}, Status: ${client?.status}, Score: ${client?.purchase_score}
Dê UMA dica RÁPIDA (1 frase) para fechar venda HOJE.`;
      } else if (mode === 'best_approach') {
        prompt = `${client?.first_name}: Perfil ${client?.behavioral_profile}, Tom ${client?.client_tone}
Melhor abordagem em 2 FRASES.`;
      } else if (mode === 'objection') {
        prompt = `Cliente ${client?.first_name} disse "${mode.objection}"
Resposta MATADORA em 1 FRASE.`;
      }

      // IA compacta - sem internet pesada
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false // SEM internet para ser rápido
      });

      setResult(response);
      toast.success('Resposta rápida gerada!');

    } catch (error) {
      toast.error('Erro - tente offline');
      // Fallback offline
      setResult(getFallbackResponse(mode, client));
    } finally {
      setLoading(false);
    }
  };

  const getFallbackResponse = (mode, client) => {
    const fallbacks = {
      quick_tip: `Foque no ROI: mostre economia em R$ nos primeiros 30 dias.`,
      best_approach: `Seja direto e traga números. Perfil ${client?.behavioral_profile} decide por lógica.`
    };
    return fallbacks[mode] || 'Ligue e pergunte: "Qual sua maior dor hoje?"';
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={runLightweightAI}
        disabled={loading}
        size="sm"
        variant="outline"
        className="w-full"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <Zap className="w-3 h-3 mr-1" />
        )}
        Dica Rápida IA
      </Button>
      {result && (
        <div className="p-2 bg-purple-50 rounded text-xs text-purple-800">
          💡 {result}
        </div>
      )}
    </div>
  );
}