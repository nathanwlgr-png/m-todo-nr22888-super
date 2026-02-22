import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Zap, Send, Users, TrendingUp, Target, MessageCircle, Link } from 'lucide-react';
import { toast } from 'sonner';
import NR22MasterHub from '@/components/NR22MasterHub';

// Painel de Controle Master - Acesso Total
export default function MasterControlPanel() {
  const [loading, setLoading] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['master-stats'],
    queryFn: async () => {
      try {
        const result = await base44.functions.invoke('whatsappMasterOrchestrator', {
          action: 'getSalesIntelligence'
        });
        return result.data?.intelligence;
      } catch (e) {
        return null;
      }
    }
  });

  const quickActions = [
    { emoji: '📊', label: 'Relatório', action: 'report' },
    { emoji: '🔥', label: 'Quentes', action: 'hot' },
    { emoji: '💼', label: 'Proposta', action: 'proposal' },
    { emoji: '🗺️', label: 'Rota', action: 'route' },
    { emoji: '💬', label: 'Chat IA', action: 'chat' },
    { emoji: '📞', label: 'Call', action: 'call' }
  ];

  const handleAction = async (action) => {
    setLoading(true);
    try {
      if (action === 'chat') {
        window.location.href = '?page=WhatsAppAgentMaster';
      } else if (action === 'report') {
        toast.success('Gerando relatório...');
      } else if (action === 'proposal') {
        toast.success('Preparando proposta IA...');
      }
    } catch (e) {
      toast.error('Erro ao executar ação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Hub Principal */}
      <NR22MasterHub />

      {/* Inteligência de Vendas */}
      {stats && (
        <Card className="border-indigo-200">
          <CardContent className="p-3">
            <p className="text-xs font-bold text-indigo-700 mb-2">🧠 INTELIGÊNCIA DE VENDAS AGORA</p>
            
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'Receita', value: `R$${(stats.metrics.totalRevenue / 1000).toFixed(0)}k`, color: 'text-green-600' },
                { label: 'Conversão', value: `${stats.metrics.conversionRate}%`, color: 'text-blue-600' },
                { label: 'Quentes', value: stats.metrics.hotCount, color: 'text-red-600' }
              ].map((kpi, idx) => (
                <div key={idx} className="bg-slate-50 p-2 rounded text-center">
                  <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-[9px] text-slate-500">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Top Clientes */}
            {stats.topHotClients.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-700">Top Clientes Quentes:</p>
                {stats.topHotClients.map((client, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[9px] bg-white p-1.5 rounded border border-slate-200">
                    <div className="flex-1">
                      <p className="font-semibold">{client.name}</p>
                      <p className="text-slate-500">{client.city}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-red-100 text-red-700 text-[7px]">Score {client.score}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ações Rápidas */}
      <Card>
        <CardContent className="p-3">
          <p className="text-xs font-bold text-slate-700 mb-2">⚡ AÇÕES RÁPIDAS</p>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleAction(action.action)}
                disabled={loading}
                className="h-12 flex-col text-xs"
              >
                <span className="text-lg mb-1">{action.emoji}</span>
                <span>{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-3">
          <p className="text-xs font-bold text-emerald-700 mb-2">🔗 INTEGRAÇÕES ATIVAS</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'Google Slides', icon: '📊', status: 'online' },
              { name: 'Notion', icon: '📝', status: 'online' },
              { name: 'WhatsApp API', icon: '💬', status: 'online' },
              { name: 'Google Maps', icon: '🗺️', status: 'online' }
            ].map((int, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-white rounded border border-emerald-200">
                <span>{int.icon} {int.name}</span>
                <Badge className="bg-green-100 text-green-700 text-[7px]">● {int.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Direct */}
      <Card className="border-green-300 bg-green-50">
        <CardContent className="p-3">
          <p className="text-xs font-bold text-green-700 mb-2">💬 ACESSO WhatsApp</p>
          <Button className="w-full bg-green-600 hover:bg-green-700 h-10 text-sm">
            <MessageCircle className="w-4 h-4 mr-2" />
            Abrir WhatsApp Master
          </Button>
          <p className="text-[8px] text-slate-500 mt-2 text-center">Todos os comandos disponíveis via chat WhatsApp</p>
        </CardContent>
      </Card>
    </div>
  );
}