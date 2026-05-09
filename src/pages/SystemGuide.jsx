import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Settings, Zap, Shield, Download, AlertTriangle,
  MessageSquare, Instagram, Smartphone, ArrowRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export default function SystemGuide() {
  const [expandedSection, setExpandedSection] = useState(null);

  const generatePDF = async () => {
    toast.info('📄 Gerando PDF...');
    
    try {
      const element = document.getElementById('guide-content');
      const canvas = await html2canvas(element, { scale: 2 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('Seamaty-CRM-Manual-Completo.pdf');
      toast.success('✅ PDF baixado!');
    } catch (err) {
      toast.error('Erro ao gerar PDF: ' + err.message);
    }
  };

  const modules = [
    {
      id: 'dashboard',
      title: '📊 Dashboard Principal',
      icon: '🏠',
      description: 'Visão geral de todos os módulos e métricas',
      sections: [
        {
          title: 'KPIs Principais',
          content: 'Clientes, Vendas, Receita, Taxa de Conversão',
        },
        {
          title: 'Acesso Rápido',
          content: 'Clientes | PredictIVO | Ranking | WhatsApp | Marketing IA | DeepHunter',
        },
      ],
    },
    {
      id: 'predictive',
      title: '📈 Análise Preditiva',
      icon: '🎯',
      description: 'Probabilidades de fechamento + Funil com gargalos',
      sections: [
        {
          title: 'Como Usar',
          content: '1. Defina meta mensal (padrão: R$360k) 2. Clique "Calcular Probabilidades" 3. Visualize as 4 abas: Oportunidades por Probabilidade, Funil, Gargalos, Top Oportunidades',
        },
        {
          title: 'Interpretação',
          content: '🟢 80-100%: Alta probabilidade | 🟡 60-80%: Médio-Alta | 🟠 40-60%: Médio | 🔴 0-40%: Baixa. Foco em estágios com <50% conversão.',
        },
        {
          title: 'Ação: Gargalos',
          content: 'Se detectado gargalo, clique "Disparar Follow-up" para enviar mensagens automáticas via WhatsApp aos clientes naquele estágio.',
        },
      ],
    },
    {
      id: 'ranking',
      title: '🏆 Ranking do Dia',
      icon: '⭐',
      description: 'Top 10 prioridades + Gestão de Insumos',
      sections: [
        {
          title: 'Ranking do Dia',
          content: 'Clique "Gerar Ranking" para processar cliente,vendas e leads. Mostra top 10 oportunidades por score de conversão. Cada item tem botão WhatsApp direto.',
        },
        {
          title: 'Gestão de Insumos',
          content: 'Rastreia reagentes dos clientes. "Gerar Alertas" cria notificações 7 dias antes da reposição. "Novo Consumível" adiciona novo tracking automático.',
        },
      ],
    },
    {
      id: 'sales-analysis',
      title: '🎙️ Análise de Chamadas',
      icon: '📞',
      description: 'Padrões de objeção + Coaching semanal',
      sections: [
        {
          title: 'Analisar Interações',
          content: 'Selecione vendedor (ou "Todos") e clique "Analisar Interações". Sistema detecta: Objeções (preço, timing, etc), Sinais de Fechamento, Taxa de Tratamento.',
        },
        {
          title: 'Coaching Report',
          content: 'Mostra top performers vs vendedor selecionado. Recomenda 3 módulos de treinamento prioritários. Clique "Iniciar Treinamento" para acessar conteúdo.',
        },
        {
          title: 'Ações Rápidas',
          content: '📥 Baixar Relatório Semanal | 💬 Enviar Feedback via WhatsApp | 📞 Agendar Sessão 1:1 de Coaching',
        },
      ],
    },
    {
      id: 'segmentation',
      title: '🎯 Segmentação de Clientes',
      icon: '👥',
      description: 'Agrupa por comportamento + Campanhas automáticas',
      sections: [
        {
          title: 'Executar Segmentação',
          content: 'Clique "Executar Segmentação" para processar 300+ clientes em 5 grupos: VIP (12%), Growth (28%), At Risk (15%), Nurture (25%), Dormant (20%)',
        },
        {
          title: 'Grupos e Estratégias',
          content: '👑 VIP: Conta dedicada, semanal | 📈 Growth: Upsell, bi-semanal | ⚠️ At Risk: Re-engajamento, semanal | 🌱 Nurture: Educação, quinzenal | 😴 Dormant: Win-back, mensal',
        },
        {
          title: 'Disparar Campanhas',
          content: 'Clique em um segmento, depois "Disparar Campanhas". Sistema envia emails + WhatsApp personalizadas com template próprio para cada grupo.',
        },
      ],
    },
  ];

  const apiSetup = [
    {
      service: 'WhatsApp',
      steps: [
        '1. Acesse: https://developers.facebook.com',
        '2. Crie app > Tipo: Business',
        '3. Configure WhatsApp Business API',
        '4. Copie Access Token e Phone Number ID',
        '5. Em Dashboard > Settings, adicione tokens',
        '6. Teste: WhatsApp Hub > Enviar mensagem teste',
      ],
    },
    {
      service: 'Instagram',
      steps: [
        '1. Acesse: https://developers.instagram.com',
        '2. Crie conexão com conta Instagram',
        '3. Gere Access Token e Business Account ID',
        '4. Em Marketing AI Studio > Publicar Instagram',
        '5. Conecte conta (aparecerá formulário)',
        '6. Teste postando conteúdo',
      ],
    },
    {
      service: 'Google Calendar',
      steps: [
        '1. Acesse: https://console.cloud.google.com',
        '2. Crie projeto novo',
        '3. Ative Calendar API',
        '4. Crie credenciais OAuth 2.0',
        '5. Em Dashboard > Settings > Integrações',
        '6. Clique "Conectar Google Calendar"',
      ],
    },
  ];

  const buttons = [
    {
      name: 'Gerar Ranking',
      location: 'Ranking do Dia',
      action: 'Processa dados e mostra TOP 10 prioridades',
      shortcut: '⚡',
    },
    {
      name: 'Calcular Probabilidades',
      location: 'Análise Preditiva',
      action: 'Executa modelo preditivo baseado em histórico',
      shortcut: '🎯',
    },
    {
      name: 'Executar Segmentação',
      location: 'Segmentação de Clientes',
      action: 'Agrupa clientes em 5 segmentos automáticos',
      shortcut: '👥',
    },
    {
      name: 'Analisar Interações',
      location: 'Análise de Chamadas',
      action: 'Detecta padrões de objeção e sinais de fechamento',
      shortcut: '📞',
    },
    {
      name: 'Gerar Alertas (Insumos)',
      location: 'Ranking do Dia > Gestão Insumos',
      action: 'Cria lembretes de reposição automáticos',
      shortcut: '⏰',
    },
    {
      name: 'Disparar Campanhas',
      location: 'Segmentação > Selecione Segmento',
      action: 'Envia email/WhatsApp personalizados por grupo',
      shortcut: '📧',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-24 pt-4">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-indigo-600" />
              📖 Manual Completo Seamaty CRM
            </h1>
            <p className="text-slate-600 mt-2">Todos os botões, funções, APIs e como usar 👇</p>
          </div>
          <Button
            onClick={generatePDF}
            className="gap-2 bg-red-600 hover:bg-red-700"
            size="lg"
          >
            <Download className="w-5 h-5" />
            Baixar PDF Completo
          </Button>
        </div>

        <Tabs defaultValue="modules" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="modules">📚 Módulos</TabsTrigger>
            <TabsTrigger value="buttons">🔘 Botões</TabsTrigger>
            <TabsTrigger value="apis">🔑 APIs</TabsTrigger>
            <TabsTrigger value="faq">❓ FAQ</TabsTrigger>
          </TabsList>

          {/* MÓDULOS */}
          <TabsContent value="modules" className="space-y-4">
            <div id="guide-content" className="space-y-4">
              {modules.map((module) => (
                <Card key={module.id} className="border-2">
                  <CardHeader
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setExpandedSection(expandedSection === module.id ? null : module.id)}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-3">
                        <span className="text-4xl">{module.icon}</span>
                        {module.title}
                      </span>
                      <Badge className="bg-indigo-600">{module.description}</Badge>
                    </CardTitle>
                  </CardHeader>

                  {expandedSection === module.id && (
                    <CardContent className="space-y-4 border-t pt-4">
                      {module.sections.map((section, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <h4 className="font-bold text-slate-900 mb-2">{section.title}</h4>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{section.content}</p>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* BOTÕES */}
          <TabsContent value="buttons" className="space-y-4">
            <div className="grid gap-4">
              {buttons.map((btn, idx) => (
                <Card key={idx} className="border-purple-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{btn.shortcut}</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-slate-900">{btn.name}</h4>
                        <p className="text-xs text-slate-600 mt-1">📍 Localização: {btn.location}</p>
                        <p className="text-sm text-slate-700 mt-2">{btn.action}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* APIs */}
          <TabsContent value="apis" className="space-y-4">
            {apiSetup.map((api, idx) => (
              <Card key={idx} className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {api.service === 'WhatsApp' && <MessageSquare className="w-6 h-6" />}
                    {api.service === 'Instagram' && <Instagram className="w-6 h-6" />}
                    {api.service === 'Google Calendar' && <Smartphone className="w-6 h-6" />}
                    {api.service}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {api.steps.map((step, sidx) => (
                      <div key={sidx} className="flex gap-3 p-2 bg-white rounded border border-green-200">
                        <Badge className="bg-green-600 h-fit">{sidx + 1}</Badge>
                        <p className="text-sm text-slate-700">{step}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="space-y-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                  Perguntas Frequentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900">❓ Qual a diferença entre Dashboard e Análise Preditiva?</h4>
                  <p className="text-sm text-slate-700 mt-1">Dashboard mostra visão geral. Análise Preditiva calcula probabilidade de fechamento por oportunidade.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">❓ Posso desativar módulos para economizar recursos?</h4>
                  <p className="text-sm text-slate-700 mt-1">Sim! Cada módulo tem botão "Desativar" no topo. Ativa novamente quando necessário.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">❓ Como integrar WhatsApp para enviar mensagens automáticas?</h4>
                  <p className="text-sm text-slate-700 mt-1">Vá para aba "APIs", siga passos do WhatsApp. Depois em Settings {`>`} Integrações, cole tokens.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">❓ Qual módulo debo usar para encontrar oportunidades de venda?</h4>
                  <p className="text-sm text-slate-700 mt-1">"Análise Preditiva" mostra probabilidades. "Ranking do Dia" mostra TOP 10. "Segmentação" dispara campanhas automáticas.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">❓ Como enviar campanhas personalizadas por tipo de cliente?</h4>
                  <p className="text-sm text-slate-700 mt-1">Use "Segmentação de Clientes": Execute segmentação {`>`} Selecione grupo {`>`} Clique "Disparar Campanhas".</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* QUICK START */}
        <Card className="border-indigo-300 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              🚀 Início Rápido (5 min)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>1️⃣ <strong>Dashboard</strong>: Veja visão geral dos dados</p>
            <p>2️⃣ <strong>Análise Preditiva</strong>: Clique "Calcular Probabilidades" com meta de R$360k</p>
            <p>3️⃣ <strong>Ranking do Dia</strong>: Gere ranking para ver TOP 10 clientes</p>
            <p>4️⃣ <strong>Segmentação</strong>: Execute segmentação automática</p>
            <p>5️⃣ <strong>Campanhas</strong>: Dispare campanhas personalizadas por grupo</p>
            <Button className="mt-4 w-full gap-2">
              <Download className="w-4 h-4" />
              Baixar Este Manual em PDF
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}