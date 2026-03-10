import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Phone, MessageCircle, Send, Link2, CheckCircle, 
  Clock, User, Zap, Settings, History, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function WhatsAppIntegrationHub() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [automationStage, setAutomationStage] = useState('');

  // Buscar dados
  const { data: leads = [] } = useQuery({
    queryKey: ['leads-whatsapp'],
    queryFn: () => base44.entities.Lead.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-whatsapp'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['whatsapp-messages'],
    queryFn: () => base44.entities.WhatsAppMessage.list(),
  });

  const { data: automationRules = [] } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => base44.entities.LeadAutomationRule?.list() || [],
  });

  // Vincular telefone ao lead
  const linkPhoneMutation = useMutation({
    mutationFn: async ({ leadId, phone }) => {
      return await base44.entities.Lead.update(leadId, { phone });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads-whatsapp']);
      toast.success('Telefone vinculado com sucesso!');
      setPhoneNumber('');
      setSelectedLead(null);
    },
  });

  // Enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async ({ contactId, contactName, phone, message }) => {
      // Salvar no histórico
      await base44.entities.WhatsAppMessage.create({
        contact_id: contactId,
        contact_name: contactName,
        contact_phone: phone,
        direction: 'sent',
        message: message,
        status: 'sent',
        sent_by: (await base44.auth.me()).email,
        sent_by_name: (await base44.auth.me()).full_name
      });

      // Aqui você integraria com a API real do WhatsApp
      // Por enquanto, apenas simula o envio
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['whatsapp-messages']);
      toast.success('Mensagem enviada e salva no histórico!');
      setMessageContent('');
    },
  });

  // Criar regra de automação
  const createAutomationMutation = useMutation({
    mutationFn: async (ruleData) => {
      return await base44.entities.LeadAutomationRule.create(ruleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-rules']);
      toast.success('Regra de automação criada!');
    },
  });

  // Templates de mensagens por estágio
  const messageTemplates = {
    novo: 'Olá {nome}! 👋 Vi que você demonstrou interesse em nossos equipamentos veterinários. Como posso ajudar?',
    qualificado: 'Oi {nome}! Analisei o perfil da {empresa} e acredito que temos a solução perfeita para vocês. Posso agendar uma demonstração?',
    proposta: 'Olá {nome}! Preparei uma proposta personalizada para a {empresa}. Quando podemos conversar sobre os detalhes?',
    negociacao: 'Oi {nome}! Estou à disposição para esclarecer qualquer dúvida sobre nossa proposta. Tem alguma questão específica?',
  };

  const leadsWithPhone = leads.filter(l => l.phone);
  const leadsWithoutPhone = leads.filter(l => !l.phone);

  const handleSendMessage = (lead) => {
    if (!messageContent) {
      toast.error('Digite uma mensagem');
      return;
    }

    sendMessageMutation.mutate({
      contactId: lead.id,
      contactName: lead.full_name,
      phone: lead.phone,
      message: messageContent
    });
  };

  const handleLinkPhone = () => {
    if (!selectedLead || !phoneNumber) {
      toast.error('Selecione um lead e digite o telefone');
      return;
    }

    // Validar formato do telefone (55 + DDD + número)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 11) {
      toast.error('Telefone inválido. Use formato: 5511999999999');
      return;
    }

    linkPhoneMutation.mutate({
      leadId: selectedLead,
      phone: cleanPhone
    });
  };

  const handleCreateAutomation = (stage) => {
    createAutomationMutation.mutate({
      name: `Mensagem automática - ${stage}`,
      trigger_type: 'lead_status_change',
      trigger_condition: { pipeline_stage: stage },
      action_type: 'send_whatsapp',
      action_config: {
        message_template: messageTemplates[stage] || '',
        delay_minutes: 5
      },
      active: true
    });
  };

  const getLeadMessages = (leadId) => {
    return messages.filter(m => m.contact_id === leadId).sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">💬 Hub de Integração WhatsApp</h1>
          <p className="text-slate-600">
            Vincule números, automatize mensagens e gerencie o histórico de conversas
          </p>
        </div>

        <Tabs defaultValue="link" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="link">
              <Link2 className="w-4 h-4 mr-2" />
              Vincular Números
            </TabsTrigger>
            <TabsTrigger value="send">
              <Send className="w-4 h-4 mr-2" />
              Enviar Mensagens
            </TabsTrigger>
            <TabsTrigger value="automation">
              <Zap className="w-4 h-4 mr-2" />
              Automações
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Vincular Números */}
          <TabsContent value="link">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Leads Sem Telefone ({leadsWithoutPhone.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Select value={selectedLead} onValueChange={setSelectedLead}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um lead" />
                      </SelectTrigger>
                      <SelectContent>
                        {leadsWithoutPhone.map(lead => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.full_name} - {lead.company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Telefone (5511999999999)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />

                    <Button 
                      onClick={handleLinkPhone}
                      disabled={linkPhoneMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Vincular Telefone
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Leads Vinculados ({leadsWithPhone.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {leadsWithPhone.map(lead => (
                      <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-semibold text-sm">{lead.full_name}</div>
                          <div className="text-xs text-slate-600">{lead.company}</div>
                          <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </div>
                        </div>
                        <Badge>{lead.pipeline_stage}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 2: Enviar Mensagens */}
          <TabsContent value="send">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Enviar Mensagem</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um lead com telefone" />
                      </SelectTrigger>
                      <SelectContent>
                        {leadsWithPhone.map(lead => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.full_name} - {lead.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={6}
                    />

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          if (leadsWithPhone[0]) {
                            handleSendMessage(leadsWithPhone[0]);
                          }
                        }}
                        disabled={sendMessageMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Mensagem
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Templates Rápidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(messageTemplates).map(([stage, template]) => (
                      <Button
                        key={stage}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left text-xs"
                        onClick={() => setMessageContent(template)}
                      >
                        {stage}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 3: Automações */}
          <TabsContent value="automation">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Criar Automação por Estágio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Configure mensagens automáticas que são enviadas quando um lead muda de estágio no funil
                  </p>

                  <div className="space-y-3">
                    {Object.entries(messageTemplates).map(([stage, template]) => (
                      <div key={stage} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="capitalize">{stage}</Badge>
                          <Button
                            size="sm"
                            onClick={() => handleCreateAutomation(stage)}
                            disabled={createAutomationMutation.isPending}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Ativar
                          </Button>
                        </div>
                        <p className="text-xs text-slate-600">{template}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Automações Ativas ({automationRules.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {automationRules.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        Nenhuma automação configurada ainda
                      </div>
                    ) : (
                      automationRules.map(rule => (
                        <div key={rule.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{rule.name}</div>
                              <div className="text-xs text-slate-600 mt-1">
                                Gatilho: {rule.trigger_type}
                              </div>
                            </div>
                            <Badge className="bg-green-600">Ativa</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 4: Histórico */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Conversas ({messages.length} mensagens)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leadsWithPhone.slice(0, 10).map(lead => {
                    const leadMessages = getLeadMessages(lead.id);
                    if (leadMessages.length === 0) return null;

                    return (
                      <div key={lead.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{lead.full_name}</h3>
                            <p className="text-sm text-slate-600">{lead.company}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(createPageUrl('LeadProfile') + `?id=${lead.id}`)}
                          >
                            Ver Perfil
                          </Button>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {leadMessages.map(msg => (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-lg ${
                                msg.direction === 'sent' 
                                  ? 'bg-green-100 ml-8' 
                                  : 'bg-slate-100 mr-8'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold">
                                  {msg.direction === 'sent' ? msg.sent_by_name : lead.full_name}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {new Date(msg.created_date).toLocaleString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-sm">{msg.message}</p>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {msg.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {messages.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      Nenhuma mensagem enviada ainda
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}