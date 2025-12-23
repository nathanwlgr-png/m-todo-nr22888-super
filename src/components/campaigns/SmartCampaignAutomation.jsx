import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Loader2, CheckCircle2, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartCampaignAutomation() {
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 100),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Campaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
  });

  const runAutomation = async () => {
    setProcessing(true);
    try {
      const activeCampaigns = campaigns.filter(c => c.status === 'ativa');
      
      for (const campaign of activeCampaigns) {
        // Analisar desempenho da campanha com IA
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise esta campanha de vendas e sugira ações de otimização:

CAMPANHA: ${campaign.name}
EQUIPAMENTO FOCO: ${campaign.equipment_focus}
PÚBLICO-ALVO: ${campaign.target_clients?.length || 0} clientes
ENVIADOS: ${campaign.sent_to?.length || 0}
CANAIS: ${campaign.channels?.join(', ')}

MÉTRICAS ATUAIS:
- Leads: ${campaign.metrics?.current_leads || 0}/${campaign.metrics?.target_leads || 0}
- Reuniões: ${campaign.metrics?.current_meetings || 0}/${campaign.metrics?.target_meetings || 0}
- Vendas: ${campaign.metrics?.current_sales || 0}/${campaign.metrics?.target_sales || 0}
- Receita: R$ ${campaign.metrics?.current_revenue || 0}/${campaign.metrics?.target_revenue || 0}

CLIENTES AINDA NÃO CONTATADOS:
${clients.filter(c => campaign.target_clients?.includes(c.id) && !campaign.sent_to?.some(s => s.client_id === c.id))
  .slice(0, 10)
  .map(c => `- ${c.first_name} (${c.clinic_name}): Status ${c.status}, Score ${c.purchase_score}`)
  .join('\n')}

RETORNE JSON com:
1. performance_score (0-100): Como está a campanha?
2. next_actions: Array de 3-5 ações CONCRETAS para melhorar
3. clients_to_prioritize: Array com IDs dos 5 clientes mais promissores
4. optimization_tips: Dicas específicas para esta campanha`,
          response_json_schema: {
            type: "object",
            properties: {
              performance_score: { type: "number" },
              next_actions: { type: "array", items: { type: "string" } },
              clients_to_prioritize: { type: "array", items: { type: "string" } },
              optimization_tips: { type: "array", items: { type: "string" } },
              recommended_message_adjustment: { type: "string" }
            }
          }
        });

        // Criar tarefas para ações prioritárias
        if (analysis.clients_to_prioritize?.length > 0) {
          for (const clientId of analysis.clients_to_prioritize.slice(0, 3)) {
            const client = clients.find(c => c.id === clientId);
            if (client) {
              await createTaskMutation.mutateAsync({
                client_id: client.id,
                client_name: client.first_name,
                title: `[Campanha IA] Contato prioritário - ${campaign.equipment_focus}`,
                description: `Cliente identificado pela IA como alta prioridade para campanha "${campaign.name}".\n\n${analysis.next_actions?.[0] || 'Entrar em contato'}`,
                type: 'follow_up',
                priority: 'alta',
                due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                auto_created: true
              });
            }
          }
        }

        toast.success(`Campanha ${campaign.name} otimizada!`);
      }

      setLastRun(new Date());
      toast.success('Automação concluída para todas as campanhas ativas!');
      queryClient.invalidateQueries(['tasks']);
      
    } catch (error) {
      console.error('Erro na automação:', error);
      toast.error('Erro ao processar automação');
    } finally {
      setProcessing(false);
    }
  };

  const activeCampaignsCount = campaigns.filter(c => c.status === 'ativa').length;

  return (
    <Card className="p-5 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-yellow-300" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-1">Automação Inteligente</h3>
          <p className="text-sm text-purple-200">IA otimiza suas campanhas automaticamente</p>
        </div>
        {processing && <Loader2 className="w-5 h-5 animate-spin text-yellow-300" />}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-white/10 rounded-lg backdrop-blur">
          <p className="text-2xl font-bold">{activeCampaignsCount}</p>
          <p className="text-xs text-purple-200">Campanhas Ativas</p>
        </div>
        <div className="p-3 bg-white/10 rounded-lg backdrop-blur">
          <p className="text-xs text-purple-200 mb-1">Última Análise</p>
          <p className="text-sm font-semibold">
            {lastRun ? lastRun.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Nunca'}
          </p>
        </div>
      </div>

      <Button
        onClick={runAutomation}
        disabled={processing || activeCampaignsCount === 0}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Executar Automação IA
          </>
        )}
      </Button>

      <div className="mt-4 p-3 bg-white/10 rounded-lg backdrop-blur">
        <p className="text-xs text-purple-200">
          A IA analisa performance, prioriza clientes promissores e cria tarefas automaticamente.
        </p>
      </div>
    </Card>
  );
}