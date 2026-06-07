import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, MapPin, Users, Navigation, Download, Loader2,
  ChevronLeft, ChevronRight, ArrowLeft, RefreshCw, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';

const MES_NOMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function getDiasDoMes(ano, mes) {
  const dias = [];
  const d = new Date(ano, mes, 1);
  while (d.getMonth() === mes) {
    dias.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

// Sexta = dia de escritório, Sáb/Dom = folga
const isDiaField = (d) => { const ds = d.getDay(); return ds >= 1 && ds <= 4; }

export default function AgendaMensal() {
  const now = new Date();
  const [mesRef, setMesRef] = useState(now.getMonth());
  const [anoRef, setAnoRef] = useState(now.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [gerando, setGerando] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['agenda-clients'],
    queryFn: () => base44.entities.Client.list('-purchase_score', 200),
    staleTime: 120000,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['agenda-visits-' + mesRef + anoRef],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 300),
    staleTime: 60000,
  });

  const queryClient = useQueryClient();

  // Visitas do mês atual
  const visitasMes = useMemo(() => {
    return visits.filter(v => {
      const d = new Date(v.scheduled_date);
      return d.getMonth() === mesRef && d.getFullYear() === anoRef;
    });
  }, [visits, mesRef, anoRef]);

  // Mapa dia -> visitas
  const visitasPorDia = useMemo(() => {
    const mapa = {};
    visitasMes.forEach(v => {
      const key = new Date(v.scheduled_date).toISOString().split('T')[0];
      if (!mapa[key]) mapa[key] = [];
      mapa[key].push(v);
    });
    return mapa;
  }, [visitasMes]);

  const dias = useMemo(() => getDiasDoMes(anoRef, mesRef), [anoRef, mesRef]);

  // Top clientes por cidade (para planejamento automático)
  const sugestoesPorCidade = useMemo(() => {
    const cidades = {};
    clients.forEach(c => {
      const cidade = c.city || 'Sem cidade';
      if (!cidades[cidade]) cidades[cidade] = [];
      cidades[cidade].push(c);
    });
    // Ordenar cada cidade por score
    Object.keys(cidades).forEach(cidade => {
      cidades[cidade].sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0));
    });
    return cidades;
  }, [clients]);

  const gerarAgendaAutomatica = async () => {
    setGerando(true);
    try {
      const diasField = dias.filter(d => isDiaField(d));
      let criadas = 0;

      // Agrupar cidades por ordem de prioridade
      const cidadesOrdenadas = Object.entries(sugestoesPorCidade)
        .filter(([c]) => c !== 'Sem cidade')
        .sort((a, b) => b[1].reduce((s, c) => s + (c.purchase_score || 0), 0) - a[1].reduce((s, c) => s + (c.purchase_score || 0), 0));

      for (let i = 0; i < diasField.length && i < cidadesOrdenadas.length; i++) {
        const dia = diasField[i];
        const [cidade, clientesDaCidade] = cidadesOrdenadas[i % cidadesOrdenadas.length];
        const top3 = clientesDaCidade.slice(0, 3);

        for (const cliente of top3) {
          const jaAgendado = visitasMes.some(v => v.client_id === cliente.id);
          if (jaAgendado) continue;

          const dateStr = `${dia.toISOString().split('T')[0]}T09:00:00`;
          await base44.entities.Visit.create({
            client_id: cliente.id,
            client_name: `${cliente.first_name || ''} ${cliente.clinic_name ? '— ' + cliente.clinic_name : ''}`.trim(),
            scheduled_date: dateStr,
            visit_type: 'primeira_visita',
            location: `${cidade}`,
            notes: `Visita gerada automaticamente. Score: ${cliente.purchase_score || 0}`,
            status: 'agendada',
          });
          criadas++;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['agenda-visits-' + mesRef + anoRef] });
      toast.success(`${criadas} visitas criadas na agenda de ${MES_NOMES[mesRef]}!`);
    } catch (err) {
      console.error('Erro ao gerar agenda:', err);
      toast.error('Erro ao gerar agenda. Tente novamente.');
    } finally {
      setGerando(false);
    }
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Agenda Mensal — ${MES_NOMES[mesRef]}/${anoRef}`, 15, y);
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    dias.filter(d => isDiaField(d)).forEach(d => {
      const key = d.toISOString().split('T')[0];
      const visitas = visitasPorDia[key] || [];
      doc.setFont('helvetica', 'bold');
      doc.text(`${DIAS_SEMANA[d.getDay()]} ${d.toLocaleDateString('pt-BR')}`, 15, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      if (visitas.length === 0) {
        doc.text('  — Livre / Prospecção local', 15, y);
        y += 6;
      } else {
        visitas.forEach(v => {
          doc.text(`  • ${v.client_name} — ${v.location || ''}`, 15, y);
          y += 5;
        });
      }
      if (y > 270) { doc.addPage(); y = 20; }
    });

    doc.save(`Agenda_${MES_NOMES[mesRef]}_${anoRef}.pdf`);
    toast.success('PDF exportado!');
  };

  const exportarCSV = () => {
    const linhas = [['Data', 'Dia', 'Cliente', 'Local', 'Status']];
    dias.filter(d => isDiaField(d)).forEach(d => {
      const key = d.toISOString().split('T')[0];
      const visitas = visitasPorDia[key] || [];
      if (visitas.length === 0) {
        linhas.push([d.toLocaleDateString('pt-BR'), DIAS_SEMANA[d.getDay()], 'Livre', '', '']);
      } else {
        visitas.forEach(v => {
          linhas.push([d.toLocaleDateString('pt-BR'), DIAS_SEMANA[d.getDay()], v.client_name, v.location || '', v.status]);
        });
      }
    });
    const csv = linhas.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Agenda_${MES_NOMES[mesRef]}_${anoRef}.csv`;
    a.click();
    toast.success('CSV exportado!');
  };

  const abrirRotaDoDia = () => {
    if (!diaSelecionado) { toast.info('Selecione um dia no calendário primeiro.'); return; }
    const key = diaSelecionado.toISOString().split('T')[0];
    const visitas = visitasPorDia[key] || [];
    if (visitas.length === 0) { toast.info('Nenhuma visita neste dia.'); return; }
    const enderecos = visitas.map(v => v.location || v.client_name).filter(Boolean).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(visitas[visitas.length - 1]?.location || '')}&waypoints=${encodeURIComponent(visitas.slice(0, -1).map(v => v.location || v.client_name).join('|'))}`;
    window.open(url, '_blank');
  };

  const prevMes = () => {
    if (mesRef === 0) { setMesRef(11); setAnoRef(a => a - 1); }
    else setMesRef(m => m - 1);
    setDiaSelecionado(null);
  };

  const nextMes = () => {
    if (mesRef === 11) { setMesRef(0); setAnoRef(a => a + 1); }
    else setMesRef(m => m + 1);
    setDiaSelecionado(null);
  };

  const visitasDiaSel = diaSelecionado
    ? (visitasPorDia[diaSelecionado.toISOString().split('T')[0]] || [])
    : [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-700 to-purple-700 px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <Link to="/">
            <button className="p-2 rounded-full hover:bg-white/20">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-300" /> Agenda Mensal
            </h1>
            <p className="text-indigo-200 text-xs">Planejamento de visitas por mês</p>
          </div>
        </div>

        {/* Navegação de mês */}
        <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2">
          <button onClick={prevMes} className="p-1 rounded-lg hover:bg-white/20">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <span className="text-white font-bold text-base">{MES_NOMES[mesRef]} {anoRef}</span>
          <button onClick={nextMes} className="p-1 rounded-lg hover:bg-white/20">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-3">
        {/* Ações */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={gerarAgendaAutomatica} disabled={gerando} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
            {gerando ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
            Gerar Agenda do Mês
          </Button>
          <Button onClick={abrirRotaDoDia} variant="outline" className="font-bold text-xs">
            <Navigation className="w-3 h-3 mr-1" /> Rota do Dia
          </Button>
          <Button onClick={gerarPDF} variant="outline" className="font-bold text-xs">
            <Download className="w-3 h-3 mr-1" /> PDF
          </Button>
          <Button onClick={exportarCSV} variant="outline" className="font-bold text-xs">
            <Download className="w-3 h-3 mr-1" /> CSV/Excel
          </Button>
        </div>

        {/* Calendário */}
        <Card>
          <CardContent className="pt-4 pb-3">
            {/* Cabeçalho dias */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DIAS_SEMANA.map(d => (
                <div key={d} className="text-center text-xs font-bold text-slate-500">{d}</div>
              ))}
            </div>

            {/* Dias em branco antes do dia 1 */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: dias[0].getDay() }).map((_, i) => (
                <div key={'blank-' + i} />
              ))}
              {dias.map(d => {
                const key = d.toISOString().split('T')[0];
                const qtd = visitasPorDia[key]?.length || 0;
                const isField = isDiaField(d);
                const isFriday = d.getDay() === 5;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const isSel = diaSelecionado?.toISOString().split('T')[0] === key;
                const isToday = d.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={key}
                    onClick={() => isWeekend ? null : setDiaSelecionado(d)}
                    disabled={isWeekend}
                    className={`
                      relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all
                      ${isWeekend ? 'opacity-30 cursor-default' : 'cursor-pointer'}
                      ${isSel ? 'bg-indigo-600 text-white' : isToday ? 'bg-orange-100 text-orange-700' : isField ? 'bg-slate-50 hover:bg-indigo-50 text-slate-700' : 'bg-yellow-50 text-yellow-700'}
                    `}
                  >
                    <span>{d.getDate()}</span>
                    {qtd > 0 && (
                      <span className={`absolute bottom-0.5 w-4 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-indigo-400'}`} />
                    )}
                    {isFriday && <span className="absolute top-0.5 right-0.5 text-[8px] text-yellow-600">📝</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 mt-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-3 h-1 bg-indigo-400 rounded-full inline-block" /> Visita agendada</span>
              <span className="flex items-center gap-1"><span className="text-yellow-600">📝</span> Sexta: escritório</span>
            </div>
          </CardContent>
        </Card>

        {/* Visitas do dia selecionado */}
        {diaSelecionado && (
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                {DIAS_SEMANA[diaSelecionado.getDay()]} {diaSelecionado.toLocaleDateString('pt-BR')}
                <Badge variant="outline" className="ml-auto">{visitasDiaSel.length} visita(s)</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-2">
              {visitasDiaSel.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  Nenhuma visita agendada. Clique em "Gerar Agenda" para sugestões automáticas.
                </p>
              ) : visitasDiaSel.map(v => (
                <Link key={v.id} to={`/ClientProfile?id=${v.client_id}`}>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{v.client_name}</p>
                        {v.location && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />{v.location}
                          </p>
                        )}
                        {v.notes && <p className="text-xs text-slate-400 mt-0.5">{v.notes}</p>}
                      </div>
                      <Badge className={v.status === 'realizada' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                        {v.status}
                      </Badge>
                    </div>
                    {v.location && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.location)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 mt-2 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" /> Abrir no Maps
                      </a>
                    )}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Resumo do mês */}
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm">Resumo de {MES_NOMES[mesRef]}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-black text-indigo-600">{visitasMes.length}</p>
                <p className="text-xs text-slate-500">Agendadas</p>
              </div>
              <div>
                <p className="text-2xl font-black text-green-600">
                  {visitasMes.filter(v => v.status === 'realizada').length}
                </p>
                <p className="text-xs text-slate-500">Realizadas</p>
              </div>
              <div>
                <p className="text-2xl font-black text-orange-600">
                  {dias.filter(d => isDiaField(d)).length}
                </p>
                <p className="text-xs text-slate-500">Dias campo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}