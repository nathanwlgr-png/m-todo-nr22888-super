import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Calendar, MapPin, Clock, Users, Target, Zap, CheckCircle, Loader2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AgendaComandoPanel({ onAgendaGerada }) {
  const [loading, setLoading] = useState(false);
  const [agenda, setAgenda] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [comando, setComando] = useState('');

  // Config form
  const [tipo, setTipo] = useState('semana');
  const [cidadesInput, setCidadesInput] = useState('');
  const [criarVisitas, setCriarVisitas] = useState(true);
  const [maxPorDia, setMaxPorDia] = useState(5);

  const parseCidadesDoTexto = (texto) => {
    // Detecta cidades no texto
    const conhecidas = ['Marília', 'Bauru', 'Botucatu', 'Lins', 'Ourinhos', 'Assis', 'Tupã', 'Jaú', 'Avaré', 
      'Presidente Prudente', 'São Paulo', 'Campinas', 'Ribeirão Preto', 'São José do Rio Preto'];
    const encontradas = [];
    conhecidas.forEach(c => {
      if (texto.toLowerCase().includes(c.toLowerCase())) encontradas.push(c);
    });
    return encontradas;
  };

  const processarComando = async () => {
    if (!comando.trim()) return;
    
    const texto = comando.toLowerCase();
    const tipoDetectado = texto.includes('mês') || texto.includes('mes') ? 'mes' : 'semana';
    const cidadesDetectadas = parseCidadesDoTexto(comando);
    
    if (cidadesDetectadas.length > 0) {
      setCidadesInput(cidadesDetectadas.join(', '));
    }
    setTipo(tipoDetectado);
    setExpanded(true);
    toast.info(`Detectado: ${tipoDetectado} ${cidadesDetectadas.length ? '• Cidades: ' + cidadesDetectadas.join(', ') : ''}`);
  };

  const gerarAgenda = async () => {
    setLoading(true);
    toast.info('Gerando agenda inteligente...');
    try {
      const cidades = cidadesInput.split(',').map(c => c.trim()).filter(Boolean);
      const res = await base44.functions.invoke('agendaInteligente', {
        tipo,
        cidades,
        criar_visitas: criarVisitas,
        max_por_dia: maxPorDia,
        prioridade: 'score',
      });

      if (res.data?.success) {
        setAgenda(res.data);
        if (onAgendaGerada) onAgendaGerada(res.data);
        toast.success(`Agenda gerada! ${res.data.resumo?.total_visitas} visitas em ${res.data.resumo?.total_dias} dias`);
        if (res.data.resumo?.visitas_criadas_crm > 0) {
          toast.success(`${res.data.resumo.visitas_criadas_crm} visitas criadas no CRM!`);
        }
      } else {
        toast.error('Erro ao gerar agenda');
      }
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const enviarWhatsApp = () => {
    if (!agenda?.whatsapp_preview) return;
    // Dividir em chunks se necessário
    const msg = encodeURIComponent(agenda.whatsapp_preview.substring(0, 3800));
    window.open(`https://wa.me/5514991676428?text=${msg}`, '_blank');
    toast.success('WhatsApp aberto!');
  };

  const statusColor = { quente: 'bg-red-100 text-red-700', morno: 'bg-yellow-100 text-yellow-700', frio: 'bg-blue-100 text-blue-700' };

  return (
    <Card className="border-indigo-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Agenda Inteligente por Cidade
          <button onClick={() => setExpanded(!expanded)} className="ml-auto">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Comando rápido */}
        <div className="flex gap-2">
          <Input
            placeholder='Ex: "faça agenda da semana em Marília" ou "agenda do mês"'
            value={comando}
            onChange={e => setComando(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && processarComando()}
            className="flex-1 text-sm"
          />
          <Button size="sm" variant="outline" onClick={processarComando} className="text-indigo-600 border-indigo-300">
            <Zap className="w-4 h-4" />
          </Button>
        </div>

        {expanded && (
          <div className="space-y-2 bg-slate-50 p-3 rounded-lg">
            <div className="flex gap-2">
              <button
                onClick={() => setTipo('semana')}
                className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${tipo === 'semana' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}
              >📅 Semana</button>
              <button
                onClick={() => setTipo('mes')}
                className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${tipo === 'mes' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}
              >📆 Mês</button>
            </div>

            <Input
              placeholder="Cidades (ex: Marília, Bauru, Lins)"
              value={cidadesInput}
              onChange={e => setCidadesInput(e.target.value)}
              className="text-sm"
            />

            <div className="flex gap-3 items-center">
              <label className="text-xs text-slate-600 flex items-center gap-1">
                <input type="checkbox" checked={criarVisitas} onChange={e => setCriarVisitas(e.target.checked)} />
                Criar visitas no CRM
              </label>
              <label className="text-xs text-slate-600">
                Máx/dia:
                <input type="number" value={maxPorDia} onChange={e => setMaxPorDia(+e.target.value)} min={1} max={10} className="w-12 ml-1 border rounded px-1 text-xs" />
              </label>
            </div>

            <Button onClick={gerarAgenda} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-sm h-8">
              {loading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Gerando...</> : <><Calendar className="w-4 h-4 mr-1" />Gerar Agenda</>}
            </Button>
          </div>
        )}

        {/* Resultado da agenda */}
        {agenda && (
          <div className="space-y-2">
            {/* Resumo */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { icon: Users, label: 'Visitas', value: agenda.resumo?.total_visitas, color: 'text-indigo-600' },
                { icon: MapPin, label: 'Cidades', value: agenda.resumo?.cidades_cobertas?.length, color: 'text-purple-600' },
                { icon: Target, label: 'Quentes', value: agenda.resumo?.clientes_quentes, color: 'text-red-600' },
                { icon: CheckCircle, label: 'Fechamento', value: agenda.resumo?.potencial_fechamento, color: 'text-green-600' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-white border rounded p-2 text-center">
                  <Icon className={`w-3 h-3 mx-auto mb-0.5 ${color}`} />
                  <p className={`text-lg font-bold ${color}`}>{value || 0}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Dias da agenda */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {agenda.agenda?.map((dia, i) => (
                <div key={i} className="bg-white border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-indigo-500" />
                      <span className="text-xs font-semibold text-slate-700">{dia.dia_semana} {dia.data}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-indigo-600 font-medium">{dia.cidade}</span>
                      {dia.quentes > 0 && <Badge className="bg-red-100 text-red-700 text-xs h-4">🔥{dia.quentes}</Badge>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {dia.clientes?.map((c, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span className="text-slate-500 w-10 shrink-0">{c.horario_sugerido}</span>
                        <span className="font-medium text-slate-700 flex-1 truncate">{c.nome} {c.clinica ? `(${c.clinica})` : ''}</span>
                        <Badge className={`${statusColor[c.status] || 'bg-slate-100 text-slate-600'} text-xs h-4`}>{c.status}</Badge>
                        <span className="text-slate-400">{c.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <Button size="sm" onClick={enviarWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700 text-xs">
                <Send className="w-3 h-3 mr-1" /> Enviar WhatsApp
              </Button>
              <Button size="sm" variant="outline" onClick={gerarAgenda} disabled={loading} className="text-xs">
                <Zap className="w-3 h-3 mr-1" /> Refazer
              </Button>
            </div>

            {agenda.resumo?.visitas_criadas_crm > 0 && (
              <p className="text-xs text-green-600 text-center">
                ✅ {agenda.resumo.visitas_criadas_crm} visitas criadas no CRM automaticamente
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}