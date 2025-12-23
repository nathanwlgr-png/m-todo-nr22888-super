import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, Loader2, TrendingUp, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Inteligência de Vendas Avançada
 * Análise profunda com IA para cada cliente
 */
export default function AdvancedSalesIntelligence() {
  const [analyzing, setAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 200),
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['all-interactions'],
    queryFn: () => base44.entities.Interaction.list('-interaction_date', 500),
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['clients'])
  });

  const runAdvancedAnalysis = async () => {
    setAnalyzing(true);
    try {
      const hotClients = clients.filter(c => c.status === 'quente' || c.purchase_score > 60);
      
      for (const client of hotClients.slice(0, 10)) {
        const clientInteractions = interactions.filter(i => i.client_id === client.id);
        const similarClients = clients.filter(c => 
          c.client_type === client.client_type && 
          c.id !== client.id
        );
        const similarSales = sales.filter(s => 
          similarClients.some(sc => sc.id === s.client_id)
        );

        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Você é um especialista em inteligência de vendas B2B com IA avançada.

🎯 CLIENTE ANALISADO:
Nome: ${client.first_name}
Empresa: ${client.clinic_name}
Porte: ${client.company_size || 'N/A'}
Tipo: ${client.client_type}
Status: ${client.status}
Score: ${client.purchase_score}%
Perfil: ${client.behavioral_profile}
Dores: ${client.main_pains?.join(', ') || 'N/A'}
Objeções: ${client.real_objections?.join(', ') || 'N/A'}
Último contato: ${client.last_contact_date || 'N/A'}

📊 CONTEXTO:
- Interações registradas: ${clientInteractions.length}
- Clientes similares: ${similarClients.length}
- Taxa de conversão similar: ${similarSales.length > 0 ? ((similarSales.length / similarClients.length) * 100).toFixed(1) : 0}%

📈 ANÁLISE PROFUNDA:
1. Calcule probabilidade REAL de conversão (0-100) baseado em:
   - Score atual
   - Histórico de interações
   - Taxa de conversão de clientes similares
   - Tempo desde último contato
   - Dores vs soluções oferecidas

2. Identifique a MELHOR ABORDAGEM:
   - Técnica de vendas mais efetiva (SPIN, BANT, Challenger, etc)
   - Tom de comunicação ideal
   - Tipo de conteúdo (técnico, emocional, ROI)

3. HORÁRIO ÓTIMO para contato:
   - Baseado em perfil comportamental
   - Histórico de respostas (se houver)

4. GATILHOS MENTAIS mais efetivos:
   - Escassez, urgência, autoridade, prova social, etc
   - Ranqueados por efetividade para este perfil

5. OBJEÇÕES PREVISTAS:
   - 3-5 objeções mais prováveis
   - Com base em histórico e tipo de cliente

6. CONTEÚDOS RECOMENDADOS:
   - Materiais específicos para enviar
   - Ordem estratégica`,
          response_json_schema: {
            type: "object",
            properties: {
              conversion_probability: { type: "number" },
              best_approach: { type: "string" },
              optimal_contact_time: { type: "string" },
              key_triggers: { type: "array", items: { type: "string" } },
              predicted_objections: { type: "array", items: { type: "string" } },
              recommended_content: { type: "array", items: { type: "string" } },
              detailed_reasoning: { type: "string" }
            }
          }
        });

        await updateClientMutation.mutateAsync({
          id: client.id,
          data: {
            ai_sales_intelligence: {
              ...analysis,
              last_ai_analysis: new Date().toISOString()
            }
          }
        });
      }

      toast.success(`✅ Análise IA completa em ${hotClients.slice(0, 10).length} clientes!`);
    } catch (error) {
      console.error(error);
      toast.error('Erro na análise');
    } finally {
      setAnalyzing(false);
    }
  };

  const clientsWithIntelligence = clients.filter(c => c.ai_sales_intelligence);

  return (
    <Card className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Inteligência de Vendas IA</h3>
          <p className="text-xs text-slate-600">{clientsWithIntelligence.length} clientes analisados</p>
        </div>
      </div>

      <Button
        onClick={runAdvancedAnalysis}
        disabled={analyzing}
        className="w-full bg-indigo-600 hover:bg-indigo-700 mb-4"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analisando com IA profunda...
          </>
        ) : (
          <>
            <Brain className="w-4 h-4 mr-2" />
            Executar Análise Inteligente
          </>
        )}
      </Button>

      {clientsWithIntelligence.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {clientsWithIntelligence.slice(0, 5).map(client => (
            <div key={client.id} className="p-3 bg-white rounded-lg border border-indigo-200">
              <p className="font-semibold text-sm text-slate-800 mb-1">{client.first_name}</p>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs font-semibold text-green-600">
                  {client.ai_sales_intelligence.conversion_probability}% conversão
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-1">
                <Clock className="w-3 h-3 inline mr-1" />
                {client.ai_sales_intelligence.optimal_contact_time}
              </p>
              <p className="text-xs text-indigo-700">
                <Zap className="w-3 h-3 inline mr-1" />
                {client.ai_sales_intelligence.best_approach}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}