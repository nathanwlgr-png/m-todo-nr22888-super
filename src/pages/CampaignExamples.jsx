import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CampaignMessagePreview from '@/components/CampaignMessagePreview';
import { Sparkles, MessageSquare, TrendingUp, Users, UserPlus, RefreshCw, Zap } from 'lucide-react';

export default function CampaignExamples() {
  const campaigns = [
    { 
      name: 'Campanha Leads Quentes', 
      icon: TrendingUp,
      description: 'Leads com alto score e demonstrando interesse ativo',
      color: 'text-red-600 bg-red-100'
    },
    { 
      name: 'Campanha Leads Quentes Mas Inativos',
      icon: RefreshCw,
      description: 'Leads que eram quentes mas pararam de responder',
      color: 'text-orange-600 bg-orange-100'
    },
    { 
      name: 'Campanha Clientes Quentes',
      icon: Sparkles,
      description: 'Clientes ativos com boa relação',
      color: 'text-purple-600 bg-purple-100'
    },
    { 
      name: 'Campanha Potenciais Clientes',
      icon: Users,
      description: 'Leads qualificados com potencial médio-alto',
      color: 'text-blue-600 bg-blue-100'
    },
    { 
      name: 'Campanha Clientes Sem Compras',
      icon: RefreshCw,
      description: 'Clientes antigos sem compras recentes (reativação)',
      color: 'text-yellow-600 bg-yellow-100'
    },
    { 
      name: 'Campanha Leads Fracos',
      icon: UserPlus,
      description: 'Leads com baixo engajamento ou informações limitadas',
      color: 'text-slate-600 bg-slate-100'
    },
    { 
      name: 'Campanha Leads Inativos',
      icon: Zap,
      description: 'Leads sem interação há muito tempo',
      color: 'text-gray-600 bg-gray-100'
    },
    { 
      name: 'Campanha Leads Novos',
      icon: Sparkles,
      description: 'Leads recém-capturados (primeiras 48h)',
      color: 'text-green-600 bg-green-100'
    },
    { 
      name: 'Campanha Novos Leads',
      icon: UserPlus,
      description: 'Leads que acabaram de entrar no sistema',
      color: 'text-teal-600 bg-teal-100'
    }
  ];

  const [selectedCampaign, setSelectedCampaign] = useState(campaigns[0]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <MessageSquare className="w-10 h-10 text-green-600" />
          Exemplos de Mensagens por Campanha
        </h1>
        <p className="text-slate-600 text-lg">
          Veja como cada campanha envia mensagens personalizadas e consultivas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seletor de Campanhas */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selecione a Campanha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {campaigns.map((campaign) => {
                const Icon = campaign.icon;
                return (
                  <button
                    key={campaign.name}
                    onClick={() => setSelectedCampaign(campaign)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                      selectedCampaign.name === campaign.name
                        ? 'border-green-600 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${campaign.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-slate-900 mb-1">
                          {campaign.name}
                        </div>
                        <div className="text-xs text-slate-600 leading-relaxed">
                          {campaign.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Preview da Mensagem */}
        <div className="lg:col-span-2">
          <CampaignMessagePreview campaign={selectedCampaign} />
        </div>
      </div>

      {/* Informações Adicionais */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardContent className="pt-6">
          <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Como o Sistema Funciona
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
            <div className="bg-white rounded-lg p-4">
              <div className="font-semibold mb-2">1️⃣ Segmentação Inteligente</div>
              <p className="text-purple-700">
                Cada cliente/lead é automaticamente categorizado com base em score, 
                comportamento, histórico e engajamento.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="font-semibold mb-2">2️⃣ Mensagens Personalizadas</div>
              <p className="text-purple-700">
                Cada mensagem é gerada com IA usando dados reais: nome, clínica, 
                histórico de compras, perfil numerológico e muito mais.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="font-semibold mb-2">3️⃣ Tom Consultivo</div>
              <p className="text-purple-700">
                Não são mensagens de vendedor chato. São mensagens de consultor 
                que realmente quer entender e ajudar.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="font-semibold mb-2">4️⃣ Envio Automatizado</div>
              <p className="text-purple-700">
                As campanhas rodam automaticamente, mas você sempre pode revisar 
                e aprovar as mensagens antes do envio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}