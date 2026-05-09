import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Trophy, Zap, AlertTriangle, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const PRIORITY_COLORS = {
  'urgente': 'bg-red-100 text-red-900 border-red-300',
  'quente': 'bg-orange-100 text-orange-900 border-orange-300',
  'potencial': 'bg-blue-100 text-blue-900 border-blue-300',
  'frio': 'bg-slate-100 text-slate-900 border-slate-300',
};

export default function RankingDoDia() {
  const [loading, setLoading] = useState(false);
  const [ranking, setRanking] = useState(null);

  // Carregar dados para ranking
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-ranking'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100),
    staleTime: 5 * 60 * 1000,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-recent'],
    queryFn: () => base44.entities.Sale.filter({ status: 'fechada' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-hot'],
    queryFn: () => base44.entities.Lead?.filter({ status: 'qualificado' }).catch(() => []),
    staleTime: 5 * 60 * 1000,
  });

  const { data: consumables = [] } = useQuery({
    queryKey: ['consumables-alert'],
    queryFn: () => base44.entities.ConsumableOrder?.filter({ status: 'ativo', alert_generated: false }).catch(() => []),
    staleTime: 5 * 60 * 1000,
  });

  // Gerar ranking
  const computeRanking = useMutation({
    mutationFn: async () => {
      setLoading(true);
      toast.info('🧠 Processando ranking...');

      const result = await base44.functions.invoke('calculateRankingDoDia', {
        clients: clients.slice(0, 50),
        sales: sales.slice(0, 30),
        leads: leads.slice(0, 20),
        consumables: consumables.slice(0, 10),
      });

      return result.data;
    },
    onSuccess: (data) => {
      setRanking(data);
      setLoading(false);
      toast.success('✅ Ranking gerado!');
    },
    onError: (err) => {
      toast.error('Erro: ' + err.message);
      setLoading(false);
    }
  });

  const handleGenerateRanking = () => {
    computeRanking.mutate();
  };

  if (!ranking) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-600" />
            🏆 Ranking do Dia
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-slate-600 mb-4">Clique para processar prioridades do dia</p>
          <Button
            onClick={handleGenerateRanking}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Gerar Ranking
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-orange-600" />
          TOP 10 Prioridades
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateRanking}
          disabled={loading}
        >
          🔄 Atualizar
        </Button>
      </div>

      {/* RESUMO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-red-700 font-bold">🔥 URGENTE</p>
            <p className="text-xl font-black text-red-600">{ranking.summary?.urgente || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-orange-700 font-bold">🔥 QUENTE</p>
            <p className="text-xl font-black text-orange-600">{ranking.summary?.quente || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-blue-700 font-bold">💡 POTENCIAL</p>
            <p className="text-xl font-black text-blue-600">{ranking.summary?.potencial || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-green-700 font-bold">📦 INSUMOS</p>
            <p className="text-xl font-black text-green-600">{ranking.summary?.consumables || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* TOP 10 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Prioritárias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {ranking.priorities?.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border-2 ${PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.frio}`}
            >
              
              {/* Posição */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-white bg-slate-600">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-xs">{item.city}</p>
                  </div>
                </div>
                <Badge className="bg-slate-600 text-white">
                  {item.score}%
                </Badge>
              </div>

              {/* Tipo de ação */}
              <div className="flex flex-wrap gap-1 mb-2">
                {item.action_type === 'venda_equipamento' && (
                  <Badge className="bg-amber-600">💾 Equipamento</Badge>
                )}
                {item.action_type === 'reposicao_insumo' && (
                  <Badge className="bg-green-600">📦 Insumo</Badge>
                )}
                {item.action_type === 'follow_up' && (
                  <Badge className="bg-blue-600">📞 Follow-up</Badge>
                )}
                {item.action_type === 'reativacao' && (
                  <Badge className="bg-purple-600">🔄 Reativação</Badge>
                )}
              </div>

              {/* Descrição */}
              <p className="text-sm mb-2">{item.action_description}</p>

              {/* Detalhes */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                {item.last_contact && (
                  <p><span className="font-bold">Último contato:</span> {item.last_contact}</p>
                )}
                {item.potential_value && (
                  <p><span className="font-bold">Potencial:</span> R$ {item.potential_value.toLocaleString('pt-BR')}</p>
                )}
              </div>

              {/* Botão WhatsApp */}
              {item.phone && (
                <Button
                  size="sm"
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => window.open(`https://wa.me/${item.phone.replace(/\D/g, '')}`, '_blank')}
                >
                  <MessageSquare className="w-3 h-3" />
                  WhatsApp
                </Button>
              )}

            </div>
          ))}
        </CardContent>
      </Card>

      {/* RESUMO ESTRATÉGICO */}
      {ranking.insights && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">💡 Insights do Dia</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-1">
            {ranking.insights.map((insight, i) => (
              <p key={i}>• {insight}</p>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}