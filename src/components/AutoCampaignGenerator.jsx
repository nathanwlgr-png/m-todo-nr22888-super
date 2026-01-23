import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoCampaignGenerator() {
  const [campaigns, setCampaigns] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-campaigns'],
    queryFn: () => base44.entities.Client.list()
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data) => base44.entities.Campaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
    }
  });

  const generateCampaigns = async () => {
    setLoading(true);
    try {
      // Segmentar clientes
      const segments = {
        vip_high_ltv: clients.filter(c => c.ltv_estimate > 80000 && c.health_score > 70),
        high_churn_risk: clients.filter(c => (c.ai_sales_intelligence?.churn_risk || 0) > 60),
        champions: clients.filter(c => c.ai_segment === 'Champions'),
        potential: clients.filter(c => c.ai_segment === 'Potential' && c.purchase_score > 60),
        dormant: clients.filter(c => c.ai_segment === 'Dormant'),
        cold_reactivation: clients.filter(c => c.status === 'frio' && c.purchase_score < 40),
        hot_closing: clients.filter(c => c.status === 'quente' && c.pipeline_stage === 'negociacao')
      };

      const prompt = `GERADOR AUTOMÁTICO DE CAMPANHAS DE EMAIL MARKETING

SEGMENTOS DISPONÍVEIS:
1. VIP Alto LTV: ${segments.vip_high_ltv.length} clientes (LTV > R$ 80k, Health > 70%)
2. Alto Risco Churn: ${segments.high_churn_risk.length} clientes (Churn Risk > 60%)
3. Champions: ${segments.champions.length} clientes (Segmento Champions)
4. Potencial: ${segments.potential.length} clientes (Potential + Score > 60%)
5. Dormentes: ${segments.dormant.length} clientes (Dormant)
6. Frios para Reativação: ${segments.cold_reactivation.length} clientes
7. Quentes para Fechamento: ${segments.hot_closing.length} clientes

MISSÃO: Crie 5 campanhas de email altamente personalizadas.

Para cada campanha:
1. SEGMENTO ALVO (qual dos acima)
2. OBJETIVO claro e mensurável
3. SUBJECT LINE irresistível
4. MENSAGEM PRINCIPAL (2-3 parágrafos com gatilhos mentais)
5. CTA poderoso
6. TIMING ideal de envio
7. RESULTADO ESPERADO (métrica)

Use técnicas de:
- Copywriting persuasivo (AIDA, PAS)
- Urgência ética
- Personalização baseada em LTV/Churn
- Gatilhos emocionais

Seja ESTRATÉGICO e focado em CONVERSÃO.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            campaigns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  target_segment: { type: "string" },
                  objective: { type: "string" },
                  subject_line: { type: "string" },
                  email_body: { type: "string" },
                  cta: { type: "string" },
                  optimal_send_time: { type: "string" },
                  expected_conversion: { type: "number" },
                  target_count: { type: "number" }
                }
              }
            }
          }
        }
      });

      setCampaigns(result.campaigns);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const createAllCampaigns = async () => {
    setCreating(true);
    try {
      for (const campaign of campaigns) {
        await createCampaignMutation.mutateAsync({
          name: campaign.name,
          type: 'email',
          objective: campaign.objective,
          target_segment: campaign.target_segment,
          subject_line: campaign.subject_line,
          message_body: campaign.email_body,
          cta_text: campaign.cta,
          status: 'draft',
          send_time: campaign.optimal_send_time,
          expected_conversion_rate: campaign.expected_conversion,
          target_count: campaign.target_count,
          created_by_ai: true
        });
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      toast.success(`${campaigns.length} campanhas criadas!`);
      setCampaigns(null);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar campanhas');
    } finally {
      setCreating(false);
    }
  };

  if (!campaigns) {
    return (
      <Card className="p-4 bg-gradient-to-r from-pink-600 to-rose-600 border-none text-white shadow-lg">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">📧 Campanhas Automáticas IA</h3>
            <p className="text-xs text-white/80">Baseado em segmentação + LTV + Churn</p>
          </div>
        </div>
        <Button
          onClick={generateCampaigns}
          disabled={loading}
          className="w-full h-10 bg-white text-pink-700 hover:bg-white/90 font-bold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerar Campanhas IA'}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white shadow-lg border-2 border-pink-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Mail className="w-5 h-5 text-pink-600" />
          Campanhas Geradas pela IA
        </h3>
        <Badge className="bg-pink-600 text-white">{campaigns.length} campanhas</Badge>
      </div>

      <div className="space-y-2 mb-3 max-h-96 overflow-y-auto">
        {campaigns.map((campaign, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-semibold text-sm text-slate-800 mb-1">{campaign.name}</p>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {campaign.target_count} clientes
                  </Badge>
                  <Badge className="bg-green-500 text-white text-xs">
                    {campaign.expected_conversion}% conv.
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded p-2 border border-purple-200 mb-2">
              <p className="text-xs font-semibold text-purple-800 mb-1">🎯 Objetivo:</p>
              <p className="text-xs text-purple-700">{campaign.objective}</p>
            </div>

            <div className="bg-blue-50 rounded p-2 border border-blue-200 mb-2">
              <p className="text-xs font-semibold text-blue-800 mb-1">✉️ Subject:</p>
              <p className="text-xs text-blue-700 font-medium">"{campaign.subject_line}"</p>
            </div>

            <div className="bg-slate-100 rounded p-2 border border-slate-300 mb-2">
              <p className="text-xs font-semibold text-slate-800 mb-1">📝 Mensagem:</p>
              <p className="text-xs text-slate-700 line-clamp-3">{campaign.email_body}</p>
            </div>

            <div className="bg-green-50 rounded p-2 border border-green-200 mb-2">
              <p className="text-xs font-semibold text-green-800 mb-1">👆 CTA:</p>
              <p className="text-xs text-green-700 font-medium">{campaign.cta}</p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>📊 Segmento: {campaign.target_segment}</span>
              <span>⏰ {campaign.optimal_send_time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={createAllCampaigns}
          disabled={creating}
          className="bg-pink-600 hover:bg-pink-700 text-white"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4 mr-1" />
              Criar Todas
            </>
          )}
        </Button>
        <Button onClick={() => setCampaigns(null)} variant="outline">
          Cancelar
        </Button>
      </div>
    </Card>
  );
}