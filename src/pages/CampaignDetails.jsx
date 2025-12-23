import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Play,
  Pause,
  Copy,
  MessageCircle,
  Mail,
  Zap,
  Users,
  TrendingUp,
  Send,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import TeamChat from '@/components/TeamChat';
import CollaborationIndicator from '@/components/CollaborationIndicator';
import CampaignTemplateUploader from '@/components/CampaignTemplateUploader';
import FinancialTablesManager from '@/components/FinancialTablesManager';

export default function CampaignDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('id');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const campaigns = await base44.entities.Campaign.list('-created_date', 500);
      return campaigns.find(c => c.id === campaignId);
    },
    enabled: !!campaignId,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Campaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaign']);
      queryClient.invalidateQueries(['campaigns']);
    },
  });

  const toggleCampaignStatus = () => {
    if (!campaign) return;
    const newStatus = campaign.status === 'ativa' ? 'pausada' : 'ativa';
    updateCampaignMutation.mutate({
      id: campaign.id,
      data: { status: newStatus }
    });
    toast.success(`Campanha ${newStatus === 'ativa' ? 'ativada' : 'pausada'}!`);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const sendToClient = async (clientId, channel) => {
    if (!campaign?.automated_content) return;
    
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    if (channel === 'whatsapp') {
      const message = campaign.automated_content.whatsapp_message;
      copyToClipboard(message, 'Mensagem WhatsApp');
      toast.info('Mensagem copiada! Cole no WhatsApp');
    } else if (channel === 'email') {
      toast.info('Funcionalidade de envio de email em desenvolvimento');
    }

    // Registrar envio
    const sentTo = campaign.sent_to || [];
    sentTo.push({
      client_id: clientId,
      sent_date: new Date().toISOString(),
      channel,
      status: 'enviado'
    });

    updateCampaignMutation.mutate({
      id: campaign.id,
      data: { sent_to: sentTo }
    });
  };

  if (isLoading || !campaign) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Carregando...</div>;
  }

  const targetClients = clients.filter(c => campaign.target_clients?.includes(c.id));
  const sentCount = campaign.sent_to?.length || 0;
  const progress = campaign.metrics?.target_sales > 0 
    ? (campaign.metrics.current_sales / campaign.metrics.target_sales) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 px-4 pt-4 pb-16">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(createPageUrl('Campaigns'))} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">{campaign.name}</h1>
            <p className="text-sm text-purple-200">{campaign.equipment_focus}</p>
          </div>
          <Button
            onClick={toggleCampaignStatus}
            className={campaign.status === 'ativa' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}
          >
            {campaign.status === 'ativa' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-2xl font-bold text-white">{targetClients.length}</p>
            <p className="text-xs text-purple-200">Clientes Alvo</p>
          </Card>
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-2xl font-bold text-white">{sentCount}</p>
            <p className="text-xs text-purple-200">Enviados</p>
          </Card>
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-2xl font-bold text-white">{campaign.metrics?.current_sales || 0}</p>
            <p className="text-xs text-purple-200">Vendas</p>
          </Card>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Collaboration Indicator */}
        <CollaborationIndicator contextType="campaign" contextId={campaignId} />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Progresso da Campanha</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Vendas</span>
                    <span>{campaign.metrics?.current_sales || 0}/{campaign.metrics?.target_sales || 0}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">Leads</p>
                    <p className="text-xl font-bold text-slate-900">{campaign.metrics?.current_leads || 0}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">Reuniões</p>
                    <p className="text-xl font-bold text-slate-900">{campaign.metrics?.current_meetings || 0}</p>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-700">Receita Gerada</p>
                  <p className="text-2xl font-bold text-green-900">
                    R$ {(campaign.metrics?.current_revenue || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-3">Detalhes</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Período:</span>
                  <span className="font-medium">
                    {format(new Date(campaign.start_date), 'dd/MM/yy')} - {format(new Date(campaign.end_date), 'dd/MM/yy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Orçamento:</span>
                  <span className="font-medium">R$ {(campaign.budget || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Canais:</span>
                  <span className="font-medium">{campaign.channels?.join(', ')}</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            {campaign.automated_content?.catchphrases && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Frases de Efeito
                  </h3>
                </div>
                <div className="space-y-2">
                  {campaign.automated_content.catchphrases.map((phrase, i) => (
                    <div key={i} className="p-3 bg-purple-50 rounded-lg flex items-start gap-2">
                      <p className="flex-1 text-sm text-purple-900">{phrase}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(phrase, 'Frase')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {campaign.automated_content?.whatsapp_message && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    Template WhatsApp
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(campaign.automated_content.whatsapp_message, 'Mensagem')}
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Copiar
                  </Button>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {campaign.automated_content.whatsapp_message}
                  </p>
                </div>
              </Card>
            )}

            {campaign.automated_content?.email_body && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    Template Email
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(
                      `Assunto: ${campaign.automated_content.email_subject}\n\n${campaign.automated_content.email_body}`,
                      'Email'
                    )}
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Copiar
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700 mb-1">Assunto:</p>
                    <p className="font-semibold text-blue-900">{campaign.automated_content.email_subject}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {campaign.automated_content.email_body}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 mt-4">
            <CampaignTemplateUploader campaignId={campaignId} />

            <FinancialTablesManager />

            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">💡 Como usar:</p>
              <ol className="text-xs text-blue-800 space-y-1">
                <li>1. Faça upload da Tabela de Retorno Financeiro</li>
                <li>2. Envie o Modelo de Proposta</li>
                <li>3. Envie o Modelo de Contrato</li>
                <li>4. Configure as condições de pagamento</li>
                <li>5. Na aba "Clientes", gere propostas/contratos automaticamente</li>
              </ol>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-3">
            {targetClients.map(client => {
              const sent = campaign.sent_to?.find(s => s.client_id === client.id);
              
              return (
                <Card key={client.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-800">{client.first_name}</h4>
                      <p className="text-sm text-slate-600">{client.clinic_name || 'N/A'}</p>
                      {sent && (
                        <Badge className="mt-1 bg-green-100 text-green-700">
                          Enviado {format(new Date(sent.sent_date), 'dd/MM', { locale: ptBR })}
                        </Badge>
                      )}
                    </div>
                    <Badge className={
                      client.status === 'quente' ? 'bg-red-100 text-red-700' :
                      client.status === 'morno' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }>
                      {client.status}
                    </Badge>
                  </div>

                  {!sent && (
                    <div className="flex gap-2">
                      {campaign.channels?.includes('whatsapp') && client.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendToClient(client.id, 'whatsapp')}
                          className="flex-1"
                        >
                          <MessageCircle className="w-3 h-3 mr-2" />
                          WhatsApp
                        </Button>
                      )}
                      {campaign.channels?.includes('email') && client.email && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendToClient(client.id, 'email')}
                          className="flex-1"
                        >
                          <Mail className="w-3 h-3 mr-2" />
                          Email
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Team Chat */}
        <TeamChat 
          contextType="campaign" 
          contextId={campaignId} 
          contextName={campaign.name}
          compact={true}
        />
        </div>
        </div>
        );
        }