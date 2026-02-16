import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Zap, MessageSquare, Clock, Sparkles, CheckCircle2, ArrowRight,
  BookOpen, Settings, Play
} from 'lucide-react';

export default function AutomationGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 rounded-full text-white mb-4">
            <Zap className="w-5 h-5" />
            <span className="font-semibold">GUIA COMPLETO</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Automação de Mensagens NR22</h1>
          <p className="text-lg text-slate-600">Ative mensagens automáticas e aumente suas conversões</p>
        </div>

        {/* Quick Start */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center gap-2">
            <Play className="w-6 h-6" />
            Início Rápido (3 passos)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { num: 1, title: 'Acesse Automação', desc: 'Vá para Automação Msgs no menu', page: 'AutomationSettings' },
              { num: 2, title: 'Configure', desc: 'Escolha horário e tipos de msgs', page: 'AutomationSettings' },
              { num: 3, title: 'Ative', desc: 'Clique no botão verde "Ativar"', page: 'AutomationSettings' }
            ].map((step) => (
              <Link to={createPageUrl(step.page)} key={step.num}>
                <div className="bg-white p-4 rounded-lg hover:shadow-lg transition cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-600 text-white font-bold flex items-center justify-center">
                      {step.num}
                    </div>
                    <h3 className="font-semibold text-slate-900">{step.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600">{step.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              6 Tipos de Mensagens
            </h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>✅ <strong>Turbo Venda:</strong> Para clientes quentes</li>
              <li>✅ <strong>Follow-up:</strong> Para clientes sem contato há 7+ dias</li>
              <li>✅ <strong>Conquistar:</strong> Para leads novos</li>
              <li>✅ <strong>Reativação:</strong> Para clientes inativos</li>
              <li>✅ <strong>Proposta:</strong> Quando há proposta pendente</li>
              <li>✅ <strong>Lembrança Visita:</strong> Antes de agendamentos</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Recursos Inteligentes
            </h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>✅ <strong>IA Personalizada:</strong> Análise do cliente</li>
              <li>✅ <strong>Timing Otimizado:</strong> Melhor horário</li>
              <li>✅ <strong>Limite Diário:</strong> Controle de volume</li>
              <li>✅ <strong>Integração WhatsApp:</strong> Envio direto</li>
              <li>✅ <strong>Agendamento:</strong> Frequência automática</li>
              <li>✅ <strong>Relatórios:</strong> Taxa de conversão</li>
            </ul>
          </Card>
        </div>

        {/* How it Works */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Como Funciona
          </h2>
          <div className="space-y-4">
            {[
              { title: 'Análise do Cliente', desc: 'Sistema analisa status e interações', icon: '📊' },
              { title: 'IA Gera Mensagem', desc: 'LLM cria msg personalizada', icon: '🤖' },
              { title: 'Agendamento Inteligente', desc: 'Calcula melhor horário', icon: '⏰' },
              { title: 'Envio Automático', desc: 'Envia no horário configurado', icon: '📱' },
              { title: 'Rastreamento', desc: 'Registra respostas', icon: '📈' }
            ].map((step, i) => (
              <div key={i} className="flex gap-4 pb-4 border-b last:border-b-0">
                <div className="text-3xl min-w-fit">{step.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">{step.title}</h4>
                  <p className="text-sm text-slate-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Integration */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <h2 className="text-2xl font-bold text-indigo-900 mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Integração
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-indigo-900 mb-3">1️⃣ WhatsApp Hub</h3>
              <p className="text-sm text-indigo-800 mb-3">Centralize conversas e use IA para sugestões.</p>
              <Link to={createPageUrl('WhatsAppHub')}>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 w-full">
                  Abrir WhatsApp Hub <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div>
              <h3 className="font-bold text-indigo-900 mb-3">2️⃣ IA Follow-up</h3>
              <p className="text-sm text-indigo-800 mb-3">Sugestões automáticas personalizadas.</p>
              <Link to={createPageUrl('WhatsAppHub')}>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 w-full">
                  Usar IA Follow-up <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div>
              <h3 className="font-bold text-indigo-900 mb-3">3️⃣ Automação</h3>
              <p className="text-sm text-indigo-800 mb-3">Configure envios automáticos diários.</p>
              <Link to={createPageUrl('AutomationSettings')}>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full">
                  Configurar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div>
              <h3 className="font-bold text-indigo-900 mb-3">4️⃣ Relatórios</h3>
              <p className="text-sm text-indigo-800 mb-3">Acompanhe taxa de resposta e conversão.</p>
              <Link to={createPageUrl('CustomDashboard')}>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 w-full">
                  Ver Relatórios <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Best Practices */}
        <Card className="p-6 mb-8 bg-amber-50 border-amber-200">
          <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" />
            Melhores Práticas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-900">
            <div>
              <p>✅ <strong>Horário:</strong> 9-11am ou 2-4pm</p>
              <p>✅ <strong>Frequência:</strong> Máximo 20 msgs/dia</p>
              <p>✅ <strong>Segmentação:</strong> Por status</p>
            </div>
            <div>
              <p>✅ <strong>Personalização:</strong> Usar nome e contexto</p>
              <p>✅ <strong>CTA:</strong> Chamar para ação</p>
              <p>✅ <strong>Teste:</strong> Antes de agendar</p>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Link to={createPageUrl('AutomationSettings')}>
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <Zap className="w-5 h-5 mr-2" />
              Ativar Automação Agora
            </Button>
          </Link>
          <p className="text-sm text-slate-600 mt-4">
            💡 Combine automação + IA Follow-up para 3x melhores resultados!
          </p>
        </div>
      </div>
    </div>
  );
}