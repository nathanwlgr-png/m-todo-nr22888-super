/**
 * MODO INSUMOS — Sistema Inteligente de Recorrência
 * 
 * Detecta:
 * - Clientes esfriando (sem compra >30 dias)
 * - Queda de compra (volume reduzido)
 * - Recompra prevista (baseado em histórico)
 * - Aumento de exames (oportunidade upsell)
 * 
 * Gera:
 * - Alertas de recompra
 * - WhatsApp sugerido
 * - Follow-up inteligente
 */

import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Package, AlertCircle, TrendingDown, TrendingUp, Clock,
  CheckCircle2, Send, ChevronRight, Loader2, Filter, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ModoInsumos() {
  const [filterType, setFilterType] = useState('all'); // all, cooling, upsell, urgent
  const [sortBy, setSortBy] = useState('urgency'); // urgency, revenue, days
  const [selectedClient, setSelectedClient] = useState(null);
  const [generatingMessage, setGeneratingMessage] = useState(false);

  // Buscar clientes com histórico de compra
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['consumable-clients'],
    queryFn: async () => {
      try {
        const list = await base44.entities.Client.list('-last_purchase_date', 50);
        return list.filter(c => c.last_purchase_date && c.average_purchase_value);
      } catch {
        return [];
      }
    },
    staleTime: 3600000, // 1 hora
  });

  // Buscar pedidos de insumos
  const { data: consumableOrders = [] } = useQuery({
    queryKey: ['consumable-orders'],
    queryFn: async () => {
      try {
        return await base44.entities.ConsumableOrder?.list().catch(() => []);
      } catch {
        return [];
      }
    },
    staleTime: 3600000,
  });

  // Analisar clientes e gerar alertas
  const analysis = useMemo(() => {
    const now = new Date();
    const alerts = clients.map(client => {
      const lastPurchase = new Date(client.last_purchase_date);
      const daysSinceLastPurchase = Math.floor((now - lastPurchase) / (1000 * 60 * 60 * 24));
      
      // Verificar padrão de compra
      const clientOrders = consumableOrders.filter(o => o.client_id === client.id);
      const avgIntervalDays = clientOrders.length > 1
        ? Math.round(daysSinceLastPurchase / clientOrders.length)
        : 30;

      // Detectar padrões
      const isCooling = daysSinceLastPurchase > (avgIntervalDays * 1.3);
      const isDeclining = clientOrders.length > 0 && clientOrders[0].monthly_revenue_potential < client.average_purchase_value * 0.7;
      const isUpsell = client.current_equipment && !client.equipment_purchase_history?.some(e => e.equipment_name === 'VG2' || e.equipment_name === 'SMT-120VP');
      
      const daysUntilReorder = avgIntervalDays - daysSinceLastPurchase;
      const urgencyScore = isCooling ? 95 : Math.max(50, 100 - (daysUntilReorder * 2));

      return {
        clientId: client.id,
        clientName: client.clinic_name || client.first_name,
        ownerName: client.full_name,
        phone: client.phone,
        daysSincePurchase: daysSinceLastPurchase,
        avgIntervalDays,
        daysUntilReorder,
        monthlyRevenue: clientOrders[0]?.monthly_revenue_potential || client.average_purchase_value,
        status: isCooling ? 'cooling' : isDeclining ? 'declining' : isUpsell ? 'upsell' : 'normal',
        urgencyScore,
        isCooling,
        isDeclining,
        isUpsell,
        lastOrder: clientOrders[0],
      };
    }).filter(a => a.status !== 'normal');

    // Filtrar e ordenar
    let filtered = alerts;
    if (filterType === 'cooling') filtered = alerts.filter(a => a.isCooling);
    else if (filterType === 'upsell') filtered = alerts.filter(a => a.isUpsell);
    else if (filterType === 'urgent') filtered = alerts.filter(a => a.urgencyScore > 80);

    filtered.sort((a, b) => {
      if (sortBy === 'urgency') return b.urgencyScore - a.urgencyScore;
      if (sortBy === 'revenue') return b.monthlyRevenue - a.monthlyRevenue;
      if (sortBy === 'days') return b.daysSincePurchase - a.daysSincePurchase;
      return 0;
    });

    return {
      total: alerts.length,
      cooling: alerts.filter(a => a.isCooling).length,
      upsell: alerts.filter(a => a.isUpsell).length,
      declining: alerts.filter(a => a.isDeclining).length,
      alerts: filtered,
    };
  }, [clients, consumableOrders, filterType, sortBy]);

  // Gerar mensagem WhatsApp
  const handleGenerateMessage = async (alert) => {
    setGeneratingMessage(true);
    try {
      const prompt = alert.isCooling
        ? `Crie uma mensagem WhatsApp amigável para reativar compra de insumos de ${alert.ownerName} (${alert.clientName}). Última compra foi há ${alert.daysSincePurchase} dias.`
        : alert.isDeclining
        ? `Crie uma mensagem WhatsApp para ${alert.ownerName} sugerindo aumento de volume de insumos. Está usando menos que antes.`
        : `Crie uma mensagem WhatsApp para ${alert.ownerName} sugerindo um novo equipamento (${alert.clientName} não tem VG2 ainda).`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            cta: { type: 'string' },
          },
        },
      });

      setSelectedClient({
        ...alert,
        generatedMessage: res.message,
        cta: res.cta,
      });
    } catch (err) {
      console.error('Erro ao gerar mensagem:', err);
    }
    setGeneratingMessage(false);
  };

  const getStatusColor = (status) => {
    if (status === 'cooling') return 'bg-red-900 border-red-500/50';
    if (status === 'declining') return 'bg-orange-900 border-orange-500/50';
    if (status === 'upsell') return 'bg-blue-900 border-blue-500/50';
    return 'bg-slate-900 border-slate-700';
  };

  const getStatusIcon = (alert) => {
    if (alert.isCooling) return <AlertCircle className="w-5 h-5 text-red-400" />;
    if (alert.isDeclining) return <TrendingDown className="w-5 h-5 text-orange-400" />;
    if (alert.isUpsell) return <TrendingUp className="w-5 h-5 text-blue-400" />;
    return <Package className="w-5 h-5" />;
  };

  const getStatusLabel = (status) => {
    if (status === 'cooling') return '🔴 Esfriando';
    if (status === 'declining') return '⚠️ Declínio';
    if (status === 'upsell') return '💡 Oportunidade';
    return 'Normal';
  };

  return (
    <div className="min-h-screen pb-20 px-4 py-6" style={{ background: '#0a0a0a' }}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ══════ HEADER ══════ */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-green-400">📦 Modo Insumos</h1>
            <p className="text-green-200 text-sm mt-1">Sistema Inteligente de Recorrência</p>
          </div>
          <Button size="lg" variant="outline" className="text-green-400 border-green-500">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* ══════ MÉTRICAS ══════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-red-950 border-red-500/50">
            <CardContent className="pt-4">
              <p className="text-red-600 text-xs font-bold">ESFRIANDO</p>
              <p className="text-3xl font-black text-red-400">{analysis.cooling}</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-950 border-orange-500/50">
            <CardContent className="pt-4">
              <p className="text-orange-600 text-xs font-bold">EM DECLÍNIO</p>
              <p className="text-3xl font-black text-orange-400">{analysis.declining}</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-950 border-blue-500/50">
            <CardContent className="pt-4">
              <p className="text-blue-600 text-xs font-bold">UPSELL</p>
              <p className="text-3xl font-black text-blue-400">{analysis.upsell}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-950 border-green-500/50">
            <CardContent className="pt-4">
              <p className="text-green-600 text-xs font-bold">TOTAL</p>
              <p className="text-3xl font-black text-green-400">{analysis.total}</p>
            </CardContent>
          </Card>
        </div>

        {/* ══════ FILTROS ══════ */}
        <Card className="bg-slate-950 border-slate-700">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'cooling', label: '🔴 Esfriando' },
                  { value: 'declining', label: '⚠️ Declínio' },
                  { value: 'upsell', label: '💡 Upsell' },
                  { value: 'urgent', label: '🚨 Urgentes' },
                ].map(f => (
                  <Button
                    key={f.value}
                    size="sm"
                    variant={filterType === f.value ? 'default' : 'outline'}
                    onClick={() => setFilterType(f.value)}
                    className="text-xs"
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <span className="text-xs text-gray-400">Ordenar:</span>
                {[
                  { value: 'urgency', label: 'Urgência' },
                  { value: 'revenue', label: 'Receita' },
                  { value: 'days', label: 'Dias' },
                ].map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSortBy(s.value)}
                    className={`text-xs px-2 py-1 rounded ${sortBy === s.value ? 'bg-green-900 text-green-300' : 'text-gray-500'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ══════ ALERTAS ══════ */}
        {loadingClients ? (
          <Card className="bg-slate-950 border-slate-700">
            <CardContent className="pt-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-400 text-sm mt-2">Analisando clientes...</p>
            </CardContent>
          </Card>
        ) : analysis.alerts.length === 0 ? (
          <Card className="bg-slate-950 border-slate-700">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto text-green-400 mb-2" />
              <p className="text-gray-300">Nenhum alerta de insumo no momento</p>
              <p className="text-gray-500 text-xs mt-1">Todos os clientes estão em dia com suas compras</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {analysis.alerts.map((alert, idx) => (
              <Card key={idx} className={`${getStatusColor(alert.status)} cursor-pointer hover:opacity-80 transition-opacity`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Info principal */}
                      <div className="flex items-start gap-3 mb-3">
                        {getStatusIcon(alert)}
                        <div className="flex-1">
                          <p className="font-bold text-white">{alert.clientName}</p>
                          <p className="text-xs text-gray-400">{alert.ownerName}</p>
                        </div>
                        <Badge className="text-xs">
                          {getStatusLabel(alert.status)}
                        </Badge>
                      </div>

                      {/* Métricas */}
                      <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-gray-500">Última Compra</p>
                          <p className="font-bold text-white">{alert.daysSincePurchase}d</p>
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-gray-500">Intervalo</p>
                          <p className="font-bold text-white">{alert.avgIntervalDays}d</p>
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-gray-500">Receita</p>
                          <p className="font-bold text-white">R${(alert.monthlyRevenue).toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-gray-500">Urgência</p>
                          <p className="font-bold text-white">{alert.urgencyScore}%</p>
                        </div>
                      </div>

                      {/* Barra de urgência */}
                      <Progress value={alert.urgencyScore} className="h-2 mb-3" />

                      {/* Motivo */}
                      <p className="text-xs text-gray-300 mb-3">
                        {alert.isCooling && `⚠️ Não compra há ${alert.daysSincePurchase} dias (padrão: ${alert.avgIntervalDays}d)`}
                        {alert.isDeclining && `⚠️ Volume de compra em declínio`}
                        {alert.isUpsell && `💡 Potencial para novo equipamento`}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-xs h-8"
                        onClick={() => handleGenerateMessage(alert)}
                        disabled={generatingMessage}
                      >
                        {generatingMessage ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                        Preparar rascunho
                        </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8"
                      >
                        Detalhes
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ══════ MENSAGEM GERADA ══════ */}
        {selectedClient && selectedClient.generatedMessage && (
          <Card className="bg-green-950 border-green-500/50 fixed bottom-20 left-4 right-4 max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center gap-2">
                💬 Mensagem Sugerida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-black/30 p-3 rounded-lg text-green-100 text-sm">
                {selectedClient.generatedMessage}
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => {
                  navigator.clipboard.writeText(selectedClient.generatedMessage);
                }}>
                  <Send className="w-3 h-3 mr-1" />
                  Copiar rascunho
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedClient(null)}
                >
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}