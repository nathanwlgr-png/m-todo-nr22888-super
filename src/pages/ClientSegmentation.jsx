import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, TrendingUp, Zap, Target, Award, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function ClientSegmentation() {
  const queryClient = useQueryClient();

  const { data: segments = [], isLoading } = useQuery({
    queryKey: ['segments'],
    queryFn: () => base44.entities.ClientSegment.list(),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.NurturingCampaign.list(),
  });

  const segmentMutation = useMutation({
    mutationFn: () => base44.functions.invoke('aiClientSegmentation', {}),
    onSuccess: () => {
      queryClient.invalidateQueries(['segments']);
      toast.success('Segmentação concluída!');
    }
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (segmentId) => {
      const segment = segments.find(s => s.id === segmentId);
      
      // Criar campanha baseada no tipo de segmento
      let campaignType = 'engagement';
      let steps = [];

      if (segment.priority_level === 'at_risk') {
        campaignType = 'reactivation';
        steps = [
          {
            step_number: 1,
            delay_days: 0,
            channel: 'whatsapp',
            content_template: 'Oi [nome]! Faz tempo que não conversamos... 😊 Como estão as coisas por aí?',
            trigger_condition: 'Reativação de cliente inativo'
          },
          {
            step_number: 2,
            delay_days: 3,
            channel: 'whatsapp',
            content_template: '[nome], tenho novidades especiais pra você! Quer saber?',
            trigger_condition: 'Após 3 dias se não responder'
          },
          {
            step_number: 3,
            delay_days: 7,
            channel: 'email',
            subject: 'Oferta Exclusiva de Retorno',
            content_template: 'Sentimos sua falta! Preparamos uma condição especial...',
            trigger_condition: 'Oferta final'
          }
        ];
      } else if (segment.priority_level === 'vip') {
        campaignType = 'loyalty';
        steps = [
          {
            step_number: 1,
            delay_days: 0,
            channel: 'whatsapp',
            content_template: '[nome], você é VIP! Temos lançamentos exclusivos pra você.',
            trigger_condition: 'Acesso antecipado'
          },
          {
            step_number: 2,
            delay_days: 14,
            channel: 'whatsapp',
            content_template: 'Como está indo com [equipamento]? Algum feedback?',
            trigger_condition: 'Check-in proativo'
          }
        ];
      } else if (segment.priority_level === 'high') {
        campaignType = 'upsell';
        steps = [
          {
            step_number: 1,
            delay_days: 0,
            channel: 'whatsapp',
            content_template: '[nome], baseado no seu uso, identificamos uma oportunidade perfeita!',
            trigger_condition: 'Oportunidade de upsell'
          },
          {
            step_number: 2,
            delay_days: 5,
            channel: 'email',
            subject: 'Proposta Personalizada para [empresa]',
            content_template: 'Análise detalhada de como você pode aumentar seus resultados...',
            trigger_condition: 'Proposta formal'
          }
        ];
      } else {
        steps = [
          {
            step_number: 1,
            delay_days: 0,
            channel: 'whatsapp',
            content_template: 'Oi [nome]! Tudo bem? Como posso ajudar hoje?',
            trigger_condition: 'Engajamento padrão'
          },
          {
            step_number: 2,
            delay_days: 7,
            channel: 'whatsapp',
            content_template: 'Tenho conteúdo interessante sobre [tema]. Quer receber?',
            trigger_condition: 'Nutrição educacional'
          }
        ];
      }

      return base44.entities.NurturingCampaign.create({
        campaign_name: `Campanha ${segment.segment_name}`,
        segment_id: segmentId,
        campaign_type: campaignType,
        status: 'draft',
        steps,
        personalization_rules: {
          use_numerology: true,
          adapt_tone: true,
          include_specific_offers: true
        },
        performance: {
          sent: 0,
          opened: 0,
          replied: 0,
          converted: 0,
          open_rate: 0,
          conversion_rate: 0
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      toast.success('Campanha criada!');
    }
  });

  const activateCampaignMutation = useMutation({
    mutationFn: async (campaignId) => {
      const campaign = campaigns.find(c => c.id === campaignId);
      const segment = segments.find(s => s.id === campaign.segment_id);

      // Criar execuções para cada cliente do segmento
      for (const clientId of segment.client_ids) {
        await base44.entities.CampaignExecution.create({
          campaign_id: campaignId,
          client_id: clientId,
          current_step: 0,
          next_action_date: new Date().toISOString(),
          status: 'active',
          messages_sent: []
        });
      }

      // Ativar campanha
      return base44.entities.NurturingCampaign.update(campaignId, {
        status: 'active',
        active_from: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      toast.success('Campanha ativada! Mensagens serão enviadas após aprovação.');
    }
  });

  return (
    <div className="space-y-4 pb-20">
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Segmentação Inteligente & Nutrição</CardTitle>
              <p className="text-purple-100">IA analisa padrões e cria campanhas personalizadas</p>
            </div>
            <Button
              onClick={() => segmentMutation.mutate()}
              disabled={segmentMutation.isPending}
              className="bg-white text-purple-600"
            >
              {segmentMutation.isPending ? <Zap className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {segmentMutation.isPending ? 'Analisando...' : 'Analisar Clientes'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {segments.map(segment => (
          <Card key={segment.id} className={`border-l-4 ${
            segment.priority_level === 'vip' ? 'border-l-purple-500' :
            segment.priority_level === 'high' ? 'border-l-green-500' :
            segment.priority_level === 'at_risk' ? 'border-l-red-500' : 'border-l-blue-500'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{segment.segment_name}</CardTitle>
                <Badge className={
                  segment.priority_level === 'vip' ? 'bg-purple-500' :
                  segment.priority_level === 'high' ? 'bg-green-500' :
                  segment.priority_level === 'at_risk' ? 'bg-red-500' : 'bg-blue-500'
                }>
                  {segment.priority_level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">{segment.description}</p>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-slate-600">Clientes</p>
                  <p className="font-bold text-lg">{segment.client_count}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-slate-600">LTV Médio</p>
                  <p className="font-bold text-lg">R$ {(segment.avg_ltv / 1000).toFixed(0)}k</p>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-slate-600">Engajamento</p>
                  <p className="font-bold text-lg">{segment.avg_engagement_score?.toFixed(0) || 0}</p>
                </div>
              </div>

              {segment.recommended_actions && segment.recommended_actions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Ações Recomendadas:</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    {segment.recommended_actions.slice(0, 3).map((action, i) => (
                      <li key={i}>• {action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {campaigns.find(c => c.segment_id === segment.id) ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const campaign = campaigns.find(c => c.segment_id === segment.id);
                      if (campaign.status === 'draft') {
                        activateCampaignMutation.mutate(campaign.id);
                      }
                    }}
                  >
                    {campaigns.find(c => c.segment_id === segment.id).status === 'active' ? (
                      <>✅ Campanha Ativa</>
                    ) : (
                      <>▶️ Ativar Campanha</>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => createCampaignMutation.mutate(segment.id)}
                  className="w-full bg-indigo-600"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Criar Campanha
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campanhas de Nutrição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <div className="flex-1">
                  <p className="font-semibold">{campaign.campaign_name}</p>
                  <p className="text-xs text-slate-600">
                    {campaign.steps?.length || 0} passos • {campaign.campaign_type}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  {campaign.performance && (
                    <>
                      <div>
                        <p className="text-slate-600">Taxa Abertura</p>
                        <p className="font-bold">{campaign.performance.open_rate}%</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Conversão</p>
                        <p className="font-bold">{campaign.performance.conversion_rate}%</p>
                      </div>
                    </>
                  )}
                  <Badge className={campaign.status === 'active' ? 'bg-green-500' : 'bg-slate-500'}>
                    {campaign.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}