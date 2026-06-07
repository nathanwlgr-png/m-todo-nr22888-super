import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Download, Loader2, Calendar, Target,
  TrendingUp, DollarSign, AlertTriangle, CheckCircle, ArrowLeft, Users, MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';

const MES_NOMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const safeQuery = (fn) => fn().catch(() => []);

export default function RelatorioRicardo() {
  const now = new Date();
  const [mesRef, setMesRef] = useState(now.getMonth());
  const [anoRef, setAnoRef] = useState(now.getFullYear());
  const [gerando, setGerando] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['relatorio-clients'],
    queryFn: () => safeQuery(() => base44.entities.Client.list('-updated_date', 300)),
    staleTime: 60000,
  });
  const { data: visits = [] } = useQuery({
    queryKey: ['relatorio-visits'],
    queryFn: () => safeQuery(() => base44.entities.Visit.list('-scheduled_date', 200)),
    staleTime: 60000,
  });
  const { data: sales = [] } = useQuery({
    queryKey: ['relatorio-sales'],
    queryFn: () => safeQuery(() => base44.entities.Sale.list('-sale_date', 200)),
    staleTime: 60000,
  });
  const { data: leads = [] } = useQuery({
    queryKey: ['relatorio-leads'],
    queryFn: () => safeQuery(() => base44.entities.Lead.list('-created_date', 200)),
    staleTime: 60000,
  });

  const dados = useMemo(() => {
    const inicio = new Date(anoRef, mesRef, 1);
    const fim = new Date(anoRef, mesRef + 1, 0, 23, 59, 59);
    const inRange = (d) => { const dt = new Date(d); return dt >= inicio && dt <= fim; };

    const visitasMes = visits.filter(v => inRange(v.scheduled_date));
    const salesMes = sales.filter(s => inRange(s.sale_date));
    const leadsMes = leads.filter(l => inRange(l.created_date));
    const fechamentos = salesMes.filter(s => ['fechada','entregue'].includes(s.status));
    const receitaMes = fechamentos.reduce((a, s) => a + (s.sale_value || 0), 0);
    const propostasAbertas = clients.filter(c => ['proposta','negociacao'].includes(c.pipeline_stage));
    const clientesQuentes = clients.filter(c => c.status === 'quente');

    const diasSemContato = (c, dias) => {
      if (!c.last_contact_date) return true;
      return (Date.now() - new Date(c.last_contact_date)) / 86400000 > dias;
    };
    const clientesParados30 = clients.filter(c => diasSemContato(c, 30)).slice(0, 10);
    const clientesParados60 = clients.filter(c => diasSemContato(c, 60)).slice(0, 5);
    const clientesParados90 = clients.filter(c => diasSemContato(c, 90)).slice(0, 5);

    // Cidades trabalhadas no mês
    const cidadesMes = [...new Set(visitasMes.map(v => v.location).filter(Boolean))];

    // Próximas cidades sugeridas (por score)
    const cidadesSugeridas = Object.entries(
      clients.reduce((acc, c) => {
        const cidade = c.city || '';
        if (!cidade) return acc;
        if (!acc[cidade]) acc[cidade] = 0;
        acc[cidade] += (c.purchase_score || 0);
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);

    const topOportunidades = clients
      .filter(c => ['proposta','negociacao'].includes(c.pipeline_stage))
      .sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0))
      .slice(0, 5);

    const proxMes = mesRef === 11 ? 0 : mesRef + 1;
    const proxAno = mesRef === 11 ? anoRef + 1 : anoRef;

    return {
      periodo: `${MES_NOMES[mesRef]}/${anoRef}`,
      visitasAgendadas: visitasMes.length,
      visitasRealizadas: visitasMes.filter(v => v.status === 'realizada').length,
      prospeccoes: leadsMes.length,
      propostasEnviadas: salesMes.filter(s => s.status === 'proposta').length,
      fechamentos: fechamentos.length,
      receitaMes,
      propostasAbertas,
      clientesQuentes,
      clientesParados30,
      clientesParados60,
      clientesParados90,
      cidadesMes,
      cidadesSugeridas,
      topOportunidades,
      proximoMes: `${MES_NOMES[proxMes]}/${proxAno}`,
    };
  }, [clients, visits, sales, leads, mesRef, anoRef]);

  const gerarPDF = async () => {
    setGerando(true);
    try {
      const doc = new jsPDF();
      let y = 18;
      const linha = (txt, size = 10, bold = false) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        const linhas = doc.splitTextToSize(txt, 180);
        linhas.forEach(l => {
          if (y > 275) { doc.addPage(); y = 18; }
          doc.text(l, 15, y);
          y += size * 0.45;
        });
        y += 1;
      };
      const sep = () => { if (y > 275) { doc.addPage(); y = 18; } doc.setDrawColor(200); doc.line(15, y, 195, y); y += 5; };

      linha('RELATÓRIO COMERCIAL MENSAL — SEAMATY BRASIL', 15, true);
      linha(`Período: ${dados.periodo}`, 11, true);
      linha(`Responsável: Nathan Rosa — Consultor Técnico Comercial`, 10);
      linha(`Destinatário: Ricardo`, 10);
      linha(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 9);
      sep();

      linha('1. RESUMO EXECUTIVO', 12, true);
      linha(`Visitas Agendadas: ${dados.visitasAgendadas}`);
      linha(`Visitas Realizadas: ${dados.visitasRealizadas}`);
      linha(`Prospecções Realizadas: ${dados.prospeccoes}`);
      linha(`Propostas Enviadas: ${dados.propostasEnviadas}`);
      linha(`Fechamentos: ${dados.fechamentos}`);
      linha(`Receita do Mês: R$ ${dados.receitaMes.toLocaleString('pt-BR')}`);
      linha(`Clientes Quentes: ${dados.clientesQuentes.length}`);
      sep();

      linha('2. OPORTUNIDADES ABERTAS', 12, true);
      dados.topOportunidades.forEach(c => linha(`  • ${c.first_name || c.full_name} — ${c.clinic_name || ''} — Score: ${c.purchase_score || 0} — ${c.pipeline_stage}`));
      if (!dados.topOportunidades.length) linha('  Nenhuma oportunidade em proposta/negociação.');
      sep();

      linha('3. CLIENTES PARADOS', 12, true);
      linha(`  +30 dias sem contato: ${dados.clientesParados30.length}`, 10, true);
      dados.clientesParados30.slice(0, 6).forEach(c => {
        const dias = c.last_contact_date ? Math.round((Date.now() - new Date(c.last_contact_date)) / 86400000) : 999;
        linha(`    • ${c.first_name || c.full_name} — ${c.city || ''} — ${dias === 999 ? 'Nunca' : dias + 'd'}`);
      });
      linha(`  +60 dias sem contato: ${dados.clientesParados60.length}`, 10, true);
      linha(`  +90 dias sem contato: ${dados.clientesParados90.length}`, 10, true);
      sep();

      linha('4. CIDADES TRABALHADAS NO MÊS', 12, true);
      linha(dados.cidadesMes.length ? dados.cidadesMes.join(', ') : 'Não registradas');
      linha('5. PRÓXIMAS CIDADES SUGERIDAS', 12, true);
      linha(dados.cidadesSugeridas.length ? dados.cidadesSugeridas.join(', ') : 'Analisar base de clientes');
      sep();

      linha('6. PRÓXIMAS AÇÕES SUGERIDAS', 12, true);
      linha(`  • Ligar para ${dados.clientesParados30.length} clientes sem contato há +30 dias`);
      linha(`  • Acompanhar ${dados.propostasAbertas.length} propostas abertas`);
      linha(`  • Prospectar novas clínicas nas cidades: ${dados.cidadesSugeridas.slice(0, 3).join(', ') || 'Marília, Bauru, Lins'}`);
      linha(`  • Reativar ${dados.clientesParados60.length} clientes parados há +60 dias`);
      sep();

      linha(`7. AGENDA SUGERIDA — ${dados.proximoMes}`, 12, true);
      linha('  Seg a Qui: Visitas externas 08h–18h, agrupadas por cidade (máx. 5/dia)');
      linha('  Sexta: Follow-up, propostas, CRM e relatório interno');
      linha(`  Prioridade de visita: ${dados.topOportunidades.map(c => c.city).filter(Boolean).join(', ') || 'Definir por score'}`);

      doc.save(`Relatorio_Ricardo_Seamaty_${MES_NOMES[mesRef]}_${anoRef}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error('Erro PDF:', err);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGerando(false);
    }
  };

  const exportarCSV = () => {
    try {
      const sep = ';';
      const linhas = [
        ['Métrica', 'Valor'],
        ['Período', dados.periodo],
        ['Responsável', 'Nathan Rosa'],
        ['Destinatário', 'Ricardo'],
        ['Visitas Agendadas', dados.visitasAgendadas],
        ['Visitas Realizadas', dados.visitasRealizadas],
        ['Prospecções', dados.prospeccoes],
        ['Propostas Enviadas', dados.propostasEnviadas],
        ['Fechamentos', dados.fechamentos],
        ['Receita Mês (R$)', dados.receitaMes],
        ['Clientes Quentes', dados.clientesQuentes.length],
        ['Propostas Abertas', dados.propostasAbertas.length],
        ['Parados +30d', dados.clientesParados30.length],
        ['Parados +60d', dados.clientesParados60.length],
        ['Parados +90d', dados.clientesParados90.length],
        ['Cidades Trabalhadas', dados.cidadesMes.join(', ')],
        ['Cidades Sugeridas', dados.cidadesSugeridas.join(', ')],
      ];
      const csv = '\uFEFF' + linhas.map(r => r.join(sep)).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Relatorio_Ricardo_Seamaty_${MES_NOMES[mesRef]}_${anoRef}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exportado! Abra com Excel.');
    } catch (err) {
      console.error('Erro CSV:', err);
      toast.error('Erro ao exportar CSV.');
    }
  };

  const kpis = [
    { label: 'Realizadas', value: dados.visitasRealizadas, Ic: CheckCircle, color: 'text-green-600' },
    { label: 'Fechamentos', value: dados.fechamentos, Ic: Target, color: 'text-blue-600' },
    { label: 'Receita', value: `R$${(dados.receitaMes / 1000).toFixed(0)}k`, Ic: DollarSign, color: 'text-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-br from-indigo-700 to-blue-700 px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <Link to="/">
            <button className="p-2 rounded-full hover:bg-white/20">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-300" /> Relatório Comercial Mensal
            </h1>
            <p className="text-indigo-200 text-xs">Seamaty Brasil — Nathan Rosa → Ricardo</p>
          </div>
        </div>
        <div className="flex gap-2 items-center bg-white/10 rounded-xl p-2">
          <select value={mesRef} onChange={e => setMesRef(Number(e.target.value))}
            className="flex-1 bg-transparent text-white text-sm font-bold outline-none">
            {MES_NOMES.map((m, i) => <option key={i} value={i} className="text-black">{m}</option>)}
          </select>
          <select value={anoRef} onChange={e => setAnoRef(Number(e.target.value))}
            className="bg-transparent text-white text-sm font-bold outline-none">
            {[2024, 2025, 2026].map(a => <option key={a} value={a} className="text-black">{a}</option>)}
          </select>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-3">
        <div className="flex gap-2 pt-3">
          <Button onClick={gerarPDF} disabled={gerando} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold">
            {gerando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            PDF
          </Button>
          <Button onClick={exportarCSV} variant="outline" className="flex-1 font-bold">
            <Download className="w-4 h-4 mr-2" /> CSV/Excel
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {kpis.map(({ label, value, Ic, color }) => (
            <Card key={label}>
              <CardContent className="pt-3 pb-3 text-center">
                <Ic className={`w-5 h-5 mx-auto mb-1 ${color}`} />
                <p className="text-xl font-black text-slate-800">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" /> Resumo — {dados.periodo}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-2">
            {[
              { label: 'Visitas Agendadas', value: dados.visitasAgendadas },
              { label: 'Visitas Realizadas', value: dados.visitasRealizadas },
              { label: 'Prospecções', value: dados.prospeccoes },
              { label: 'Propostas Enviadas', value: dados.propostasEnviadas },
              { label: 'Fechamentos', value: dados.fechamentos },
              { label: 'Propostas Abertas', value: dados.propostasAbertas.length },
              { label: 'Clientes Quentes', value: dados.clientesQuentes.length },
              { label: 'Parados +30d', value: dados.clientesParados30.length },
              { label: 'Parados +60d', value: dados.clientesParados60.length },
              { label: 'Parados +90d', value: dados.clientesParados90.length },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-600">{label}</span>
                <Badge variant="outline" className="font-bold">{value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Cidades */}
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-500" /> Cidades
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-2">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">Trabalhadas em {dados.periodo}:</p>
              <p className="text-sm text-slate-700">{dados.cidadesMes.join(', ') || 'Não registradas'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">Sugeridas para {dados.proximoMes}:</p>
              <p className="text-sm text-slate-700">{dados.cidadesSugeridas.join(', ') || 'Analisar base'}</p>
            </div>
          </CardContent>
        </Card>

        {dados.topOportunidades.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" /> Oportunidades em Aberto
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-2">
              {dados.topOportunidades.map(c => (
                <Link key={c.id} to={`/ClientProfile?id=${c.id}`}>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{c.first_name || c.full_name}</p>
                      <p className="text-xs text-slate-500">{c.clinic_name} · {c.city}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={c.pipeline_stage === 'negociacao' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}>
                        {c.pipeline_stage}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-0.5">Score {c.purchase_score || 0}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {dados.clientesParados30.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-4 h-4" /> Clientes Parados (+30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-2">
              {dados.clientesParados30.slice(0, 8).map(c => {
                const dias = c.last_contact_date
                  ? Math.round((Date.now() - new Date(c.last_contact_date)) / 86400000)
                  : 999;
                return (
                  <Link key={c.id} to={`/ClientProfile?id=${c.id}`}>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-bold text-slate-700">{c.first_name || c.full_name}</p>
                        <p className="text-xs text-slate-400">{c.city}</p>
                      </div>
                      <Badge className={dias > 60 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                        {dias === 999 ? 'Nunca' : `${dias}d`}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm text-indigo-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Agenda Sugerida — {dados.proximoMes}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-1.5">
            <p className="text-xs text-indigo-600">• <strong>Seg–Qui:</strong> Visitas externas 08h–18h, agrupadas por cidade (máx. 5/dia)</p>
            <p className="text-xs text-indigo-600">• <strong>Sexta:</strong> Follow-up, propostas, CRM e relatório interno</p>
            <p className="text-xs text-indigo-600">• <strong>Prioridade:</strong> {dados.propostasAbertas.length} propostas abertas primeiro</p>
            <p className="text-xs text-indigo-600">• <strong>Reativar:</strong> {dados.clientesParados30.length} clientes parados há +30 dias</p>
            <p className="text-xs text-indigo-600">• <strong>Cidades alvo:</strong> {dados.cidadesSugeridas.slice(0, 3).join(', ') || 'Definir por score'}</p>
          </CardContent>
        </Card>

        <div className="text-center pb-4">
          <p className="text-xs text-slate-400">Nathan Rosa · Consultor Técnico Comercial · Seamaty Brasil</p>
        </div>
      </div>
    </div>
  );
}