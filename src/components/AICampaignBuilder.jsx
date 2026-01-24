import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Send, Target, Users, TrendingUp, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function AICampaignBuilder() {
  const [campaignGoal, setCampaignGoal] = useState('');
  const [targetCriteria, setTargetCriteria] = useState({});
  const [generating, setGenerating] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [executing, setExecuting] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const generateCampaign = async (execute = false) => {
    if (!campaignGoal.trim()) {
      toast.error('Defina o objetivo da campanha');
      return;
    }

    setGenerating(true);
    try {
      const result = await base44.functions.invoke('generateAICampaign', {
        campaign_goal: campaignGoal,
        target_criteria: targetCriteria,
        execute_campaign: execute
      });

      setCampaign(result.campaign);
      
      if (result.executed) {
        toast.success(`Campanha executada! ${result.messages_sent} mensagens enviadas`);
      } else {
        toast.success('Campanha gerada com sucesso!');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar campanha: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const executeCampaign = async () => {
    if (!campaign) return;

    setExecuting(true);
    try {
      const result = await base44.functions.invoke('generateAICampaign', {
        campaign_goal: campaignGoal,
        target_criteria: targetCriteria,
        execute_campaign: true
      });

      toast.success(`Campanha executada! ${result.messages_sent} mensagens enviadas`);
    } catch (error) {
      toast.error('Erro ao executar: ' + error.message);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Sparkles className="w-5 h-5" />
          Gerador de Campanhas IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!campaign ? (
          <Tabs defaultValue="goal">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="goal">1. Objetivo</TabsTrigger>
              <TabsTrigger value="target">2. Público-Alvo</TabsTrigger>
            </TabsList>

            <TabsContent value="goal" className="space-y-3">
              <div>
                <Label className="text-sm font-semibold">Objetivo da Campanha</Label>
                <Input
                  value={campaignGoal}
                  onChange={(e) => setCampaignGoal(e.target.value)}
                  placeholder="Ex: Reativar clientes inativos últimos 60 dias..."
                  className="mt-1"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  💡 <strong>Dica:</strong> Seja específico! Ex: "Converter clientes mornos em quentes oferecendo demonstração gratuita VG2"
                </p>
              </div>
            </TabsContent>

            <TabsContent value="target" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={targetCriteria.status || 'all'}
                    onValueChange={(value) => setTargetCriteria({
                      ...targetCriteria,
                      status: value === 'all' ? undefined : value
                    })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="quente">🔥 Quentes</SelectItem>
                      <SelectItem value="morno">🌡️ Mornos</SelectItem>
                      <SelectItem value="frio">❄️ Frios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Score Mínimo</Label>
                  <Input
                    type="number"
                    value={targetCriteria.min_score || ''}
                    onChange={(e) => setTargetCriteria({
                      ...targetCriteria,
                      min_score: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="0-100"
                    className="h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs">Pipeline</Label>
                  <Select
                    value={targetCriteria.pipeline_stage || 'all'}
                    onValueChange={(value) => setTargetCriteria({
                      ...targetCriteria,
                      pipeline_stage: value === 'all' ? undefined : value
                    })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="qualificado">Qualificado</SelectItem>
                      <SelectItem value="proposta">Proposta</SelectItem>
                      <SelectItem value="negociacao">Negociação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Dias sem contato</Label>
                  <Input
                    type="number"
                    value={targetCriteria.days_without_contact || ''}
                    onChange={(e) => setTargetCriteria({
                      ...targetCriteria,
                      days_without_contact: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Ex: 30"
                    className="h-9"
                  />
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-green-800 mb-1">
                  Público-alvo estimado: {
                    clients.filter(c => {
                      if (targetCriteria.status && c.status !== targetCriteria.status) return false;
                      if (targetCriteria.min_score && (c.purchase_score || 0) < targetCriteria.min_score) return false;
                      if (targetCriteria.pipeline_stage && c.pipeline_stage !== targetCriteria.pipeline_stage) return false;
                      return true;
                    }).length
                  } clientes
                </p>
              </div>
            </TabsContent>
          </Tabs>
        ) : null}

        {!campaign ? (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => generateCampaign(false)}
              disabled={generating || !campaignGoal.trim()}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Gerar Campanha
            </Button>
            <Button
              onClick={() => generateCampaign(true)}
              disabled={generating || !campaignGoal.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Gerar + Executar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border-2 border-orange-200">
              <h4 className="font-bold text-orange-900 text-lg mb-2">{campaign.campaign_name}</h4>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2 bg-orange-50 rounded text-center">
                  <Users className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                  <p className="text-xs text-gray-600">Público</p>
                  <p className="text-lg font-bold">{campaign.target_stats?.total}</p>
                </div>
                <div className="p-2 bg-green-50 rounded text-center">
                  <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-600" />
                  <p className="text-xs text-gray-600">Conversão</p>
                  <p className="text-lg font-bold">{campaign.success_metrics?.expected_conversion_rate}%</p>
                </div>
                <div className="p-2 bg-blue-50 rounded text-center">
                  <Target className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                  <p className="text-xs text-gray-600">Resposta</p>
                  <p className="text-lg font-bold">{campaign.success_metrics?.expected_response_rate}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <Badge className="bg-orange-600">
                  {campaign.primary_channel === 'email' ? <Mail className="w-3 h-3 mr-1" /> : <MessageSquare className="w-3 h-3 mr-1" />}
                  {campaign.primary_channel}
                </Badge>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border">
              <p className="text-sm font-semibold text-gray-800 mb-2">📧 {campaign.main_message?.subject}</p>
              <p className="text-sm text-gray-700 whitespace-pre-line mb-3">{campaign.main_message?.body}</p>
              <div className="p-2 bg-green-50 rounded-lg">
                <p className="text-xs font-semibold text-green-800">CTA: {campaign.main_message?.cta}</p>
              </div>
            </div>

            {campaign.strategy && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs font-semibold text-purple-800 mb-1">📊 Estratégia:</p>
                <p className="text-xs text-gray-700">{campaign.strategy}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={executeCampaign}
                disabled={executing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {executing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Executar Campanha
              </Button>
              <Button
                onClick={() => {
                  setCampaign(null);
                  toast.info('Gere uma nova campanha');
                }}
                variant="outline"
              >
                Nova Campanha
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}