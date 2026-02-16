import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Mail, Calendar, Database, BarChart3, MessageSquare, 
  Check, X, Settings, RefreshCw, ExternalLink, Zap
} from 'lucide-react';
import { toast } from 'sonner';

export default function Integrations() {
  const [activeTab, setActiveTab] = useState('email_marketing');
  const queryClient = useQueryClient();

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => base44.entities.Integration.list(),
  });

  const createIntegrationMutation = useMutation({
    mutationFn: (data) => base44.entities.Integration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['integrations']);
      toast.success('Integração criada!');
    }
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Integration.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['integrations']);
      toast.success('Integração atualizada!');
    }
  });

  const syncMutation = useMutation({
    mutationFn: async ({ provider, action, params }) => {
      const functionMap = {
        mailchimp: 'mailchimpSync',
        calendly: 'calendlySync',
        slack: 'slackNotify',
        google_analytics: 'analyticsTrack',
        sap: 'erpSync',
        oracle_netsuite: 'erpSync'
      };

      const response = await base44.functions.invoke(functionMap[provider], {
        action,
        ...params
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Sincronização concluída!');
    },
    onError: (error) => {
      toast.error('Erro na sincronização: ' + error.message);
    }
  });

  const getIntegrationByProvider = (provider) => {
    return integrations.find(i => i.provider === provider);
  };

  const IntegrationCard = ({ icon: Icon, title, description, provider, type, features }) => {
    const integration = getIntegrationByProvider(provider);
    const [showConfig, setShowConfig] = useState(false);
    const [config, setConfig] = useState(integration?.config || {});

    const handleSave = () => {
      if (integration) {
        updateIntegrationMutation.mutate({
          id: integration.id,
          data: { config, status: 'active' }
        });
      } else {
        createIntegrationMutation.mutate({
          name: title,
          type,
          provider,
          status: 'active',
          config,
          features_enabled: features
        });
      }
      setShowConfig(false);
    };

    const handleToggle = () => {
      if (integration) {
        updateIntegrationMutation.mutate({
          id: integration.id,
          data: { status: integration.status === 'active' ? 'inactive' : 'active' }
        });
      }
    };

    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Icon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="text-sm">{description}</CardDescription>
              </div>
            </div>
            <Badge className={integration?.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}>
              {integration?.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!showConfig ? (
            <>
              {integration && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Última Sync:</span>
                    <span>{integration.last_sync ? new Date(integration.last_sync).toLocaleString('pt-BR') : 'Nunca'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Registros Sincronizados:</span>
                    <span>{integration.sync_stats?.records_synced || 0}</span>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowConfig(true)}
                  variant="outline"
                  className="flex-1"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
                
                {integration && (
                  <>
                    <Button
                      onClick={handleToggle}
                      variant={integration.status === 'active' ? 'destructive' : 'default'}
                    >
                      {integration.status === 'active' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </Button>
                    
                    <Button
                      onClick={() => syncMutation.mutate({ provider, action: 'sync', params: {} })}
                      disabled={syncMutation.isLoading || integration.status !== 'active'}
                      variant="outline"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncMutation.isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {provider === 'mailchimp' && (
                <>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={config.api_key || ''}
                      onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                      placeholder="xxxxxxxxxxxxx-us1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>List ID</Label>
                    <Input
                      value={config.list_id || ''}
                      onChange={(e) => setConfig({ ...config, list_id: e.target.value })}
                      placeholder="xxxxxxxxxx"
                    />
                  </div>
                </>
              )}

              {provider === 'calendly' && (
                <>
                  <div className="space-y-2">
                    <Label>API Key (Personal Access Token)</Label>
                    <Input
                      type="password"
                      value={config.api_key || ''}
                      onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>User URI</Label>
                    <Input
                      value={config.user_uri || ''}
                      onChange={(e) => setConfig({ ...config, user_uri: e.target.value })}
                      placeholder="https://api.calendly.com/users/XXXXXX"
                    />
                  </div>
                </>
              )}

              {provider === 'slack' && (
                <>
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      type="password"
                      value={config.webhook_url || ''}
                      onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Canal Padrão</Label>
                    <Input
                      value={config.default_channel || ''}
                      onChange={(e) => setConfig({ ...config, default_channel: e.target.value })}
                      placeholder="#vendas"
                    />
                  </div>
                </>
              )}

              {provider === 'google_analytics' && (
                <>
                  <div className="space-y-2">
                    <Label>Measurement ID (GA4)</Label>
                    <Input
                      value={config.measurement_id || ''}
                      onChange={(e) => setConfig({ ...config, measurement_id: e.target.value })}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Secret</Label>
                    <Input
                      type="password"
                      value={config.api_secret || ''}
                      onChange={(e) => setConfig({ ...config, api_secret: e.target.value })}
                    />
                  </div>
                </>
              )}

              {(provider === 'sap' || provider === 'oracle_netsuite') && (
                <>
                  <div className="space-y-2">
                    <Label>API URL</Label>
                    <Input
                      value={config.api_url || ''}
                      onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Credenciais</Label>
                    <Input
                      type="password"
                      value={config.credentials || ''}
                      onChange={(e) => setConfig({ ...config, credentials: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">Salvar</Button>
                <Button onClick={() => setShowConfig(false)} variant="outline">Cancelar</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 pb-20">
      <div className="max-w-6xl mx-auto space-y-4">
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-indigo-600" />
              <div>
                <CardTitle>Integrações</CardTitle>
                <p className="text-sm text-slate-600">Conecte seu CRM com ferramentas externas</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="email_marketing">
              <Mail className="w-4 h-4 mr-1" />
              Email
            </TabsTrigger>
            <TabsTrigger value="scheduling">
              <Calendar className="w-4 h-4 mr-1" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value="erp">
              <Database className="w-4 h-4 mr-1" />
              ERP
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-1" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="communication">
              <MessageSquare className="w-4 h-4 mr-1" />
              Comunicação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email_marketing" className="space-y-4">
            <IntegrationCard
              icon={Mail}
              title="Mailchimp"
              description="Email marketing e campanhas automatizadas"
              provider="mailchimp"
              type="email_marketing"
              features={['contacts_sync', 'campaigns', 'segments']}
            />
            <IntegrationCard
              icon={Mail}
              title="Sendinblue"
              description="Marketing por email e SMS"
              provider="sendinblue"
              type="email_marketing"
              features={['contacts_sync', 'campaigns', 'automation']}
            />
          </TabsContent>

          <TabsContent value="scheduling" className="space-y-4">
            <IntegrationCard
              icon={Calendar}
              title="Calendly"
              description="Agendamento online de demonstrações e reuniões"
              provider="calendly"
              type="scheduling"
              features={['scheduling_links', 'event_sync', 'notifications']}
            />
          </TabsContent>

          <TabsContent value="erp" className="space-y-4">
            <IntegrationCard
              icon={Database}
              title="SAP Business One"
              description="Sincronização de clientes e vendas"
              provider="sap"
              type="erp"
              features={['clients_sync', 'sales_sync', 'products_sync']}
            />
            <IntegrationCard
              icon={Database}
              title="Oracle NetSuite"
              description="ERP completo em nuvem"
              provider="oracle_netsuite"
              type="erp"
              features={['clients_sync', 'sales_sync', 'inventory_sync']}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <IntegrationCard
              icon={BarChart3}
              title="Google Analytics 4"
              description="Rastreamento de eventos e comportamento"
              provider="google_analytics"
              type="analytics"
              features={['event_tracking', 'conversion_tracking', 'custom_reports']}
            />
          </TabsContent>

          <TabsContent value="communication" className="space-y-4">
            <IntegrationCard
              icon={MessageSquare}
              title="Slack"
              description="Notificações e colaboração em equipe"
              provider="slack"
              type="communication"
              features={['notifications', 'alerts', 'team_collaboration']}
            />
            <IntegrationCard
              icon={MessageSquare}
              title="Microsoft Teams"
              description="Chat e notificações corporativas"
              provider="microsoft_teams"
              type="communication"
              features={['notifications', 'alerts', 'meetings']}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}