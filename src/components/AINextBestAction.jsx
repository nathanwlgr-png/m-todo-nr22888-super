import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Calendar, Phone, MessageSquare, FileText, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function AINextBestAction({ client, interactions = [], sales = [], visits = [] }) {
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  const generateNextAction = async () => {
    setLoading(true);
    try {
      const daysSinceLastInteraction = interactions.length > 0 ?
        Math.floor((Date.now() - new Date(interactions[0].created_date).getTime()) / (1000 * 60 * 60 * 24)) : 999;
      
      const prompt = `Análise rápida de próxima ação para venda consultiva.

CLIENTE: ${client.first_name}
Status: ${client.status} | Score: ${client.purchase_score}% | Health: ${client.health_score || 50}%
Pipeline: ${client.pipeline_stage || 'lead'}
LTV: R$ ${(client.ltv_estimate || 0).toLocaleString('pt-BR')}
Churn Risk: ${client.ai_sales_intelligence?.churn_risk || 0}%

CONTEXTO:
- Última interação: ${daysSinceLastInteraction} dias
- Vendas: ${sales.length} | Visitas: ${visits.length}
- Equipamento interesse: ${client.equipment_interest || 'Não definido'}

Com base em LTV, churn risk e funil, determine:
1. PRÓXIMA MELHOR AÇÃO (específica e acionável)
2. URGÊNCIA (1-10)
3. OBJETIVO claro
4. SCRIPT sugerido (2-3 frases)
5. TIMING ideal

Retorne JSON:`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            action_type: { 
              type: "string",
              enum: ["call", "whatsapp", "email", "visit", "proposal", "follow_up", "upsell"]
            },
            action_title: { type: "string" },
            urgency_score: { type: "number" },
            objective: { type: "string" },
            suggested_script: { type: "string" },
            optimal_timing: { type: "string" },
            expected_outcome: { type: "string" },
            success_probability: { type: "number" }
          }
        }
      });

      setAction(result);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar ação');
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async () => {
    setExecuting(true);
    try {
      // Criar tarefa automaticamente
      const taskType = action.action_type === 'call' ? 'ligacao' :
                       action.action_type === 'whatsapp' ? 'email' :
                       action.action_type === 'visit' ? 'visita' : 'follow_up';

      await base44.entities.Task.create({
        client_id: client.id,
        client_name: client.first_name,
        title: action.action_title,
        description: `${action.objective}\n\nSCRIPT SUGERIDO:\n${action.suggested_script}\n\nTIMING: ${action.optimal_timing}\n\nRESULTADO ESPERADO: ${action.expected_outcome}`,
        type: taskType,
        priority: action.urgency_score >= 7 ? 'alta' : action.urgency_score >= 4 ? 'media' : 'baixa',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        auto_created: true
      });

      toast.success('Tarefa criada automaticamente!');
      setAction(null);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar tarefa');
    } finally {
      setExecuting(false);
    }
  };

  const getActionIcon = (type) => {
    const icons = {
      call: Phone,
      whatsapp: MessageSquare,
      email: MessageSquare,
      visit: Calendar,
      proposal: FileText,
      follow_up: Target,
      upsell: Zap
    };
    return icons[type] || Target;
  };

  const getUrgencyColor = (urgency) => {
    if (urgency >= 8) return 'from-red-500 to-red-700';
    if (urgency >= 5) return 'from-orange-500 to-orange-600';
    return 'from-blue-500 to-blue-600';
  };

  if (!action) {
    return (
      <Card className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 border-none text-white shadow-lg">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">🎯 Próxima Melhor Ação IA</h3>
            <p className="text-xs text-white/80">Baseado em LTV, churn risk e funil</p>
          </div>
        </div>
        <Button
          onClick={generateNextAction}
          disabled={loading}
          className="w-full h-10 bg-white text-purple-700 hover:bg-white/90 font-bold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerar Recomendação'}
        </Button>
      </Card>
    );
  }

  const ActionIcon = getActionIcon(action.action_type);

  return (
    <Card className={`p-4 bg-gradient-to-r ${getUrgencyColor(action.urgency_score)} border-none text-white shadow-lg`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <ActionIcon className="w-5 h-5" />
          <h3 className="font-bold">{action.action_title}</h3>
        </div>
        <Badge className="bg-white/20 text-white">
          Urgência: {action.urgency_score}/10
        </Badge>
      </div>

      <div className="space-y-2 mb-3">
        <div className="bg-white/10 backdrop-blur rounded p-2">
          <p className="text-xs font-semibold mb-1">🎯 Objetivo:</p>
          <p className="text-sm">{action.objective}</p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded p-2">
          <p className="text-xs font-semibold mb-1">💬 Script Sugerido:</p>
          <p className="text-sm italic">"{action.suggested_script}"</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/10 backdrop-blur rounded p-2">
            <p className="text-white/70">Timing Ideal</p>
            <p className="font-bold">{action.optimal_timing}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded p-2">
            <p className="text-white/70">Prob. Sucesso</p>
            <p className="font-bold">{action.success_probability}%</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur rounded p-2">
          <p className="text-xs font-semibold mb-1">✓ Resultado Esperado:</p>
          <p className="text-xs">{action.expected_outcome}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={executeAction}
          disabled={executing}
          className="bg-white text-purple-700 hover:bg-white/90 font-bold"
        >
          {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : '✓ Criar Tarefa'}
        </Button>
        <Button
          onClick={() => setAction(null)}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          Nova Ação
        </Button>
      </div>
    </Card>
  );
}