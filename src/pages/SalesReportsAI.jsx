import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Sparkles,
  Download,
  Loader2,
  FileText,
  BarChart3,
  TrendingDown
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import PredictiveSalesAI from '@/components/PredictiveSalesAI';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function SalesReportsAI() {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedReport, setSelectedReport] = useState('vendedor');
  const [aiSummary, setAiSummary] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 500)
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 500)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  // Filtrar vendas por período
  const filteredSales = useMemo(() => {
    const days = parseInt(selectedPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= cutoffDate;
    });
  }, [sales, selectedPeriod]);

  // 1. Performance por Vendedor
  const salesByUser = useMemo(() => {
    const grouped = {};
    
    filteredSales.forEach(sale => {
      const seller = sale.created_by || 'Sem vendedor';
      if (!grouped[seller]) {
        grouped[seller] = {
          vendedor: users.find(u => u.email === seller)?.full_name || seller,
          total: 0,
          quantidade: 0,
          ticket_medio: 0
        };
      }
      grouped[seller].total += sale.sale_value || 0;
      grouped[seller].quantidade += 1;
    });

    return Object.values(grouped).map(item => ({
      ...item,
      ticket_medio: item.quantidade > 0 ? item.total / item.quantidade : 0
    })).sort((a, b) => b.total - a.total);
  }, [filteredSales, users]);

  // 2. Produtos Mais Vendidos
  const topProducts = useMemo(() => {
    const grouped = {};
    
    filteredSales.forEach(sale => {
      const product = sale.equipment_name || 'Sem produto';
      if (!grouped[product]) {
        grouped[product] = {
          produto: product,
          quantidade: 0,
          receita: 0
        };
      }
      grouped[product].quantidade += 1;
      grouped[product].receita += sale.sale_value || 0;
    });

    return Object.values(grouped)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10);
  }, [filteredSales]);

  // 3. Pipeline por Estágio
  const pipelineByStage = useMemo(() => {
    const stages = {
      proposta: { nome: 'Proposta', quantidade: 0, valor: 0 },
      aguardando_assinatura: { nome: 'Aguardando Assinatura', quantidade: 0, valor: 0 },
      fechada: { nome: 'Fechada', quantidade: 0, valor: 0 },
      entregue: { nome: 'Entregue', quantidade: 0, valor: 0 },
      cancelada: { nome: 'Cancelada', quantidade: 0, valor: 0 }
    };

    filteredSales.forEach(sale => {
      const status = sale.status || 'proposta';
      if (stages[status]) {
        stages[status].quantidade += 1;
        stages[status].valor += sale.sale_value || 0;
      }
    });

    return Object.values(stages);
  }, [filteredSales]);

  // 4. Análise de Churn
  const churnAnalysis = useMemo(() => {
    const threeMonthsAgo = subMonths(new Date(), 3);
    const sixMonthsAgo = subMonths(new Date(), 6);

    const activeClients = clients.filter(c => {
      const lastContact = c.last_contact_date || c.last_visit_date || c.created_date;
      return lastContact && new Date(lastContact) >= threeMonthsAgo;
    });

    const atRiskClients = clients.filter(c => {
      const lastContact = c.last_contact_date || c.last_visit_date || c.created_date;
      return lastContact && new Date(lastContact) < threeMonthsAgo && new Date(lastContact) >= sixMonthsAgo;
    });

    const churnedClients = clients.filter(c => {
      const lastContact = c.last_contact_date || c.last_visit_date || c.created_date;
      return lastContact && new Date(lastContact) < sixMonthsAgo;
    });

    return [
      { status: 'Ativos', quantidade: activeClients.length, cor: '#10b981' },
      { status: 'Em Risco', quantidade: atRiskClients.length, cor: '#f59e0b' },
      { status: 'Inativos', quantidade: churnedClients.length, cor: '#ef4444' }
    ];
  }, [clients]);

  // Métricas Gerais
  const metrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const totalSales = filteredSales.length;
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const closedSales = filteredSales.filter(s => s.status === 'fechada' || s.status === 'entregue').length;
    const conversionRate = totalSales > 0 ? (closedSales / totalSales) * 100 : 0;

    return { totalRevenue, totalSales, avgTicket, conversionRate };
  }, [filteredSales]);

  // Gerar Resumo Executivo com IA
  const generateAISummary = async () => {
    setGeneratingAI(true);
    try {
      const context = `
RELATÓRIO DE VENDAS - PERÍODO: ${selectedPeriod} DIAS

MÉTRICAS GERAIS:
- Receita Total: R$ ${metrics.totalRevenue.toLocaleString('pt-BR')}
- Total de Vendas: ${metrics.totalSales}
- Ticket Médio: R$ ${metrics.avgTicket.toLocaleString('pt-BR')}
- Taxa de Conversão: ${metrics.conversionRate.toFixed(1)}%

PERFORMANCE POR VENDEDOR:
${salesByUser.slice(0, 5).map((v, i) => `${i+1}. ${v.vendedor}: R$ ${v.total.toLocaleString('pt-BR')} (${v.quantidade} vendas)`).join('\n')}

TOP PRODUTOS:
${topProducts.slice(0, 5).map((p, i) => `${i+1}. ${p.produto}: ${p.quantidade} vendas (R$ ${p.receita.toLocaleString('pt-BR')})`).join('\n')}

PIPELINE:
${pipelineByStage.map(s => `- ${s.nome}: ${s.quantidade} vendas (R$ ${s.valor.toLocaleString('pt-BR')})`).join('\n')}

ANÁLISE DE CHURN:
- Ativos: ${churnAnalysis[0].quantidade}
- Em Risco: ${churnAnalysis[1].quantidade}
- Inativos: ${churnAnalysis[2].quantidade}

Crie um RESUMO EXECUTIVO completo e profissional com:
1. Análise da performance geral
2. Destaques e conquistas
3. Pontos de atenção e riscos
4. Recomendações estratégicas
5. Previsão de tendências
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: context,
        response_json_schema: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            analise_geral: { type: "string" },
            destaques: { type: "array", items: { type: "string" } },
            pontos_atencao: { type: "array", items: { type: "string" } },
            recomendacoes: { type: "array", items: { type: "string" } },
            previsao: { type: "string" },
            score_saude: { type: "number", description: "0-100" }
          }
        }
      });

      setAiSummary(result);
      toast.success('Resumo executivo gerado!');
    } catch (error) {
      toast.error('Erro ao gerar resumo');
    } finally {
      setGeneratingAI(false);
    }
  };

  const isLoading = loadingSales || loadingClients;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 px-4 pt-4 pb-20 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Relatórios de Vendas IA</h1>
            <p className="text-sm text-purple-100">Análises inteligentes e automáticas</p>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 bg-white/10 backdrop-blur-sm border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-white" />
              <p className="text-xs text-purple-100">Receita Total</p>
            </div>
            <p className="text-xl font-bold text-white">
              R$ {(metrics.totalRevenue / 1000).toFixed(0)}k
            </p>
          </Card>
          <Card className="p-3 bg-white/10 backdrop-blur-sm border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-white" />
              <p className="text-xs text-purple-100">Vendas</p>
            </div>
            <p className="text-xl font-bold text-white">{metrics.totalSales}</p>
          </Card>
          <Card className="p-3 bg-white/10 backdrop-blur-sm border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-white" />
              <p className="text-xs text-purple-100">Ticket Médio</p>
            </div>
            <p className="text-xl font-bold text-white">
              R$ {(metrics.avgTicket / 1000).toFixed(1)}k
            </p>
          </Card>
          <Card className="p-3 bg-white/10 backdrop-blur-sm border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-white" />
              <p className="text-xs text-purple-100">Conversão</p>
            </div>
            <p className="text-xl font-bold text-white">
              {metrics.conversionRate.toFixed(1)}%
            </p>
          </Card>
        </div>
      </div>

      <div className="px-4 -mt-12 space-y-4">
        {/* Controles */}
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="180">Últimos 6 meses</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateAISummary}
              disabled={generatingAI}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {generatingAI ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Gerar Resumo Executivo IA
            </Button>
          </div>
        </Card>

        {/* Resumo Executivo IA */}
        {aiSummary && (
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  {aiSummary.titulo}
                </CardTitle>
                <Badge className="bg-purple-600">
                  Score: {aiSummary.score_saude}/100
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-700 leading-relaxed">{aiSummary.analise_geral}</p>
              </div>

              {aiSummary.destaques?.length > 0 && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-green-700 mb-2">✓ Destaques</p>
                  <ul className="text-sm text-green-600 space-y-1">
                    {aiSummary.destaques.map((d, i) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSummary.pontos_atencao?.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-xs font-semibold text-yellow-700 mb-2">⚠ Pontos de Atenção</p>
                  <ul className="text-sm text-yellow-600 space-y-1">
                    {aiSummary.pontos_atencao.map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSummary.recomendacoes?.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-2">💡 Recomendações</p>
                  <ul className="text-sm text-blue-600 space-y-1">
                    {aiSummary.recomendacoes.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSummary.previsao && (
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <p className="text-xs font-semibold text-purple-700 mb-1">🔮 Previsão</p>
                  <p className="text-sm text-purple-600">{aiSummary.previsao}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 1. Performance por Vendedor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Performance por Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesByUser.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Sem dados</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={salesByUser}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="vendedor" angle={-45} textAnchor="end" height={80} fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    <Legend />
                    <Bar dataKey="total" fill="#8b5cf6" name="Receita Total" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  {salesByUser.slice(0, 5).map((user, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-600">{i + 1}</Badge>
                        <span className="text-sm font-medium">{user.vendedor}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-purple-600">
                          R$ {user.total.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {user.quantidade} vendas • Ticket: R$ {user.ticket_medio.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 2. Produtos Mais Vendidos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Sem dados</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={topProducts.slice(0, 7)}
                      dataKey="receita"
                      nameKey="produto"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.produto.substring(0, 15)}...`}
                      fontSize={10}
                    >
                      {topProducts.slice(0, 7).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  {topProducts.slice(0, 5).map((product, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {product.produto}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-600">
                          {product.quantidade} vendas
                        </p>
                        <p className="text-xs text-slate-500">
                          R$ {product.receita.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 3. Pipeline por Estágio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Pipeline de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pipelineByStage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={10} />
                <YAxis dataKey="nome" type="category" width={120} fontSize={10} />
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                <Bar dataKey="valor" fill="#3b82f6" name="Valor Total" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {pipelineByStage.map((stage, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm font-medium">{stage.nome}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">
                      {stage.quantidade} vendas
                    </p>
                    <p className="text-xs text-slate-500">
                      R$ {stage.valor.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. Análise de Churn */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Análise de Churn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={churnAnalysis}
                  dataKey="quantidade"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label
                >
                  {churnAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {churnAnalysis.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.cor }}
                    />
                    <span className="text-sm font-medium">{item.status}</span>
                  </div>
                  <Badge variant="outline">{item.quantidade} clientes</Badge>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-700">
                💡 <strong>Dica:</strong> Clientes "Em Risco" não tiveram contato nos últimos 3 meses. 
                "Inativos" não tiveram contato há mais de 6 meses.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* IA Preditiva */}
        <div className="mt-4">
          <PredictiveSalesAI />
        </div>
      </div>
    </div>
  );
}