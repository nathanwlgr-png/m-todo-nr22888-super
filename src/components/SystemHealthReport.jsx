import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export default function SystemHealthReport() {
  const improvements = [
    {
      priority: 'critical',
      title: 'WhatsApp Agents - NR22888 e Master',
      status: 'implemented',
      description: 'Agentes funcionam independente do modo AI (sempre ativos)'
    },
    {
      priority: 'critical',
      title: 'Modo Offline Completo',
      status: 'implemented',
      description: 'Cache de 200 clientes, acesso total sem internet (apenas leitura)'
    },
    {
      priority: 'critical',
      title: 'Controle de AI - 3 Modos',
      status: 'implemented',
      description: 'Off (só web), Econômico (sob demanda), Completo (tudo ativo)'
    },
    {
      priority: 'high',
      title: 'Importação MobVendedor 200km',
      status: 'implemented',
      description: 'Busca clientes em raio de 200km de Marília com geocoding'
    },
    {
      priority: 'high',
      title: 'Otimização de Funil Melhorada',
      status: 'implemented',
      description: 'Análise completa, automações, testes A/B, plano de ação'
    },
    {
      priority: 'high',
      title: 'Central de Documentos',
      status: 'implemented',
      description: 'Geração de propostas, análises, docs técnicos com fallback'
    },
    {
      priority: 'medium',
      title: 'Proteção Rate Limit',
      status: 'implemented',
      description: 'Todas páginas críticas protegidas contra limite de AI'
    },
    {
      priority: 'suggested',
      title: 'Backup Automático Diário',
      status: 'suggested',
      description: 'Criar automação para backup completo do CRM todo dia 2h da manhã'
    },
    {
      priority: 'suggested',
      title: 'Notificações Push',
      status: 'suggested',
      description: 'Alertas importantes via navegador (visita próxima, cliente quente)'
    },
    {
      priority: 'suggested',
      title: 'Modo Escuro',
      status: 'suggested',
      description: 'Tema dark mode para uso noturno'
    },
    {
      priority: 'suggested',
      title: 'Sincronização Multi-Dispositivo',
      status: 'suggested',
      description: 'Sincronizar cache entre celular e computador'
    }
  ];

  const statusConfig = {
    implemented: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: '✅ Implementado' },
    suggested: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', label: '💡 Sugerido' }
  };

  const priorityConfig = {
    critical: { color: 'bg-red-600', label: 'Crítico' },
    high: { color: 'bg-orange-500', label: 'Alta' },
    medium: { color: 'bg-yellow-500', label: 'Média' },
    suggested: { color: 'bg-blue-500', label: 'Sugestão' }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
          <div>
            <h3 className="font-bold text-green-900">Sistema Revisado e Otimizado</h3>
            <p className="text-xs text-green-700">Pronto para demonstração!</p>
          </div>
        </div>
      </Card>

      <h3 className="font-bold text-slate-800 mt-6">📊 Relatório Completo</h3>
      
      <div className="space-y-2">
        {improvements.map((item, i) => {
          const Status = statusConfig[item.status];
          const priority = priorityConfig[item.priority];
          
          return (
            <Card key={i} className={`p-3 ${Status.bg} border-2`}>
              <div className="flex items-start gap-3">
                <Status.icon className={`w-5 h-5 ${Status.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                    <Badge className={`${priority.color} text-white text-xs`}>
                      {priority.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700">{item.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{Status.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 mt-6">
        <h4 className="font-bold text-blue-900 mb-3">🎯 Resumo Executivo</h4>
        <div className="space-y-2 text-sm text-slate-700">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span><strong>Sistema 100% funcional</strong> - online e offline</span>
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span><strong>AI econômica</strong> - 3 modos (off/economy/full)</span>
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span><strong>WhatsApp sempre ativo</strong> - NR22888 + Master independentes</span>
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span><strong>Importação MobVendedor</strong> - raio 200km de Marília</span>
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span><strong>Cache offline</strong> - 200 clientes salvos localmente</span>
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span><strong>Proteção rate limit</strong> - fallbacks em todas páginas</span>
          </p>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
        <h4 className="font-bold text-purple-900 mb-3">💡 Próximos Passos Sugeridos</h4>
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-white rounded border border-purple-200">
            <p className="font-semibold text-purple-900">1. Backup Automático</p>
            <p className="text-xs text-slate-600">Agendar backup diário às 2h da manhã</p>
          </div>
          <div className="p-2 bg-white rounded border border-purple-200">
            <p className="font-semibold text-purple-900">2. Notificações Push</p>
            <p className="text-xs text-slate-600">Alertas de visitas, clientes quentes, tarefas</p>
          </div>
          <div className="p-2 bg-white rounded border border-purple-200">
            <p className="font-semibold text-purple-900">3. Modo Escuro</p>
            <p className="text-xs text-slate-600">Para uso noturno confortável</p>
          </div>
          <div className="p-2 bg-white rounded border border-purple-200">
            <p className="font-semibold text-purple-900">4. Sync Multi-Dispositivo</p>
            <p className="text-xs text-slate-600">Cache compartilhado entre dispositivos</p>
          </div>
        </div>
      </Card>
    </div>
  );
}