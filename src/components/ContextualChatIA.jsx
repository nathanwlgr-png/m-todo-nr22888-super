import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send, Loader2, Bot, MapPin, Navigation, Clock, User,
  CheckCircle, MessageCircle, Sparkles, Mic, X, Timer,
  ChevronRight, Route, Calendar
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const QUICK_CMDS = [
  { label: '📍 Onde estou', cmd: 'onde estou agora' },
  { label: '🗺️ Rota do dia', cmd: 'resumo da minha rota hoje' },
  { label: '🔥 Próx. quente', cmd: 'qual o próximo cliente quente mais próximo' },
  { label: '📋 Minha agenda', cmd: 'minha agenda de hoje' },
  { label: '✅ Tarefas', cmd: 'minhas tarefas pendentes' },
  { label: '📊 Performance', cmd: 'minha performance do mês' },
];

function Msg({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-indigo-600' : 'bg-gradient-to-br from-purple-600 to-indigo-600'}`}>
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
      </div>
      <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${isUser ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border shadow-sm rounded-tl-sm text-slate-800'}`}>
        {isUser ? (
          <p className="text-sm">{msg.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none text-slate-800">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
        {msg.actions && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {msg.actions.map((a, i) => (
              <button key={i} onClick={a.onClick}
                className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full hover:bg-indigo-100">
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContextualChatIA({ clients = [], visitaEmAndamento = null, rotaAtiva = null }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [posAtual, setPosAtual] = useState(null);
  const [localizandoGPS, setLocalizandoGPS] = useState(false);
  const endRef = useRef(null);
  const qc = useQueryClient();

  const { data: visits = [] } = useQuery({ queryKey: ['visits-ctx'], queryFn: () => base44.entities.Visit.filter({ status: 'agendada' }) });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks-ctx'], queryFn: () => base44.entities.Task.filter({ status: 'pendente' }) });
  const { data: sales = [] } = useQuery({ queryKey: ['sales-ctx'], queryFn: () => base44.entities.Sale.list('-sale_date', 20) });
  const { data: user } = useQuery({ queryKey: ['me-ctx'], queryFn: () => base44.auth.me() });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  useEffect(() => {
    if (msgs.length === 0) {
      const hora = new Date().getHours();
      const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
      const quentes = clients.filter(c => c.status === 'quente').length;
      setMsgs([{
        role: 'assistant',
        content: `${saudacao}! 👋 Sou seu **Assistente de Rota e CRM**.\n\n📊 Tenho acesso a **${clients.length} clientes** (${quentes} quentes), **${visits.length} visitas agendadas** e **${tasks.length} tarefas pendentes**.\n\nDigite ou use os atalhos abaixo. Também posso registrar visitas e notas direto por aqui!`,
      }]);
    }
  }, [clients.length, visits.length, tasks.length]);

  const getGPS = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('GPS indisponível')); return; }
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
      e => reject(e),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });

  const buildContext = () => {
    const hoje = new Date().toISOString().split('T')[0];
    const visitasHoje = visits.filter(v => v.scheduled_date?.startsWith(hoje));
    const quentes = clients.filter(c => c.status === 'quente').slice(0, 5);
    const overdue = tasks.filter(t => t.due_date && t.due_date < hoje);
    const receitaMes = sales.filter(s => s.sale_date?.startsWith(new Date().toISOString().slice(0,7)))
      .reduce((s, x) => s + (x.sale_value || 0), 0);

    return `
CONTEXTO DO VENDEDOR (${new Date().toLocaleString('pt-BR')}):
- GPS atual: ${posAtual ? `Lat ${posAtual.lat.toFixed(4)}, Lng ${posAtual.lng.toFixed(4)} (precisão ${Math.round(posAtual.acc)}m)` : 'não disponível'}
- Visitas hoje: ${visitasHoje.length} agendadas (${visitasHoje.map(v => v.client_name).join(', ') || 'nenhuma'})
- Rota ativa: ${rotaAtiva ? JSON.stringify(rotaAtiva) : 'nenhuma rota ativa'}
- Visita em andamento: ${visitaEmAndamento ? `${visitaEmAndamento.clientName} (desde ${new Date(visitaEmAndamento.startTime).toLocaleTimeString('pt-BR')})` : 'nenhuma'}
- Tarefas vencidas: ${overdue.length}
- Tarefas pendentes: ${tasks.length}
- Clientes quentes: ${quentes.map(c => `${c.first_name} (${c.city}, score ${c.purchase_score}%)`).join('; ')}
- Total clientes: ${clients.length}
- Receita mês: R$ ${receitaMes.toLocaleString('pt-BR')}
- Vendas: ${sales.length}

CAPACIDADES ESPECIAIS:
- Posso registrar notas de visitas: "anota para [cliente]: [texto]"
- Posso dar abordagem por perfil: "como abordar [nome]"
- Posso resumir a rota: "rota de hoje" ou "rota da semana"
- Posso buscar cliente por nome/cidade: "detalhes de [nome]"
- GPS: "onde estou" ativa GPS e mostra clientes próximos
`;
  };

  const resolverComando = async (text) => {
    const t = text.toLowerCase();

    // GPS / Localização
    if (t.includes('onde estou') || t.includes('minha localiz') || t.includes('gps')) {
      setLocalizandoGPS(true);
      try {
        const pos = await getGPS();
        setPosAtual(pos);
        const url = `https://www.google.com/maps?q=${pos.lat},${pos.lng}`;
        const proximos = clients.filter(c => c.city).slice(0, 3);
        return {
          content: `📍 **Localização obtida!**\n\nLat: ${pos.lat.toFixed(5)}, Lng: ${pos.lng.toFixed(5)}\nPrecisão: ${Math.round(pos.acc)}m\n\n[Abrir no Maps](${url})\n\n🏥 **Clientes na região:**\n${proximos.map(c => `• ${c.first_name} — ${c.city} (${c.status})`).join('\n')}`,
          actions: [
            { label: '🗺️ Abrir Maps', onClick: () => window.open(url, '_blank') },
            { label: '📍 Waze', onClick: () => window.open(`https://waze.com/ul?ll=${pos.lat},${pos.lng}`, '_blank') },
          ]
        };
      } catch (e) {
        return { content: `❌ GPS não disponível: ${e.message}\n\nAtive o GPS no seu celular e tente novamente.` };
      } finally {
        setLocalizandoGPS(false);
      }
    }

    // Anotar nota em visita
    const anotaMatch = t.match(/anota(?:r)? (?:para |no |pra )?(.+?)[:]\s*(.+)/);
    if (anotaMatch) {
      const nomeCliente = anotaMatch[1].trim();
      const nota = anotaMatch[2].trim();
      const cliente = clients.find(c =>
        c.first_name?.toLowerCase().includes(nomeCliente) ||
        c.clinic_name?.toLowerCase().includes(nomeCliente)
      );
      if (cliente) {
        const visitsCliente = await base44.entities.Visit.filter({ client_id: cliente.id });
        if (visitsCliente.length > 0) {
          const ultima = visitsCliente.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))[0];
          await base44.entities.Visit.update(ultima.id, {
            result_notes: (ultima.result_notes || '') + `\n[Chat IA ${new Date().toLocaleTimeString('pt-BR')}]: ${nota}`,
          });
          qc.invalidateQueries(['visits-ctx']);
          return { content: `✅ **Nota registrada!**\n\nCliente: **${cliente.first_name}**\nNota: "${nota}"\n\nSalvo na última visita do CRM.` };
        } else {
          await base44.entities.Visit.create({
            client_id: cliente.id,
            client_name: cliente.first_name,
            scheduled_date: new Date().toISOString(),
            status: 'realizada',
            visit_type: 'followup',
            result_notes: nota,
            notes: `[Criado via Chat IA]`,
          });
          qc.invalidateQueries(['visits-ctx']);
          return { content: `✅ **Visita criada com nota!**\n\nCliente: **${cliente.first_name}**\nNota: "${nota}"` };
        }
      }
      return { content: `❌ Cliente "${nomeCliente}" não encontrado.\n\nTente: *anota para [nome exato]: [nota]*` };
    }

    // Detalhes de um cliente
    const detalheMatch = t.match(/(?:detalhe|info|perfil|status)\s+(?:de |do |da )?(.+)/);
    if (detalheMatch) {
      const nome = detalheMatch[1].trim();
      const c = clients.find(cl =>
        cl.first_name?.toLowerCase().includes(nome) ||
        cl.clinic_name?.toLowerCase().includes(nome)
      );
      if (c) {
        const visitasC = await base44.entities.Visit.filter({ client_id: c.id });
        return {
          content: `📋 **${c.first_name}** ${c.clinic_name ? `· ${c.clinic_name}` : ''}\n\n🏷️ Status: **${c.status}** | Score: **${c.purchase_score || 0}%**\n📍 Cidade: ${c.city || 'N/A'}\n🔄 Pipeline: ${c.pipeline_stage || 'lead'}\n📞 Telefone: ${c.phone || 'não cadastrado'}\n🧠 Perfil: ${c.behavioral_profile || 'N/A'}\n📅 Última visita: ${c.last_visit_date || 'N/A'}\n🎯 Visitas: ${visitasC.length}\n⚡ Próxima ação: ${c.next_action || 'N/A'}\n${c.main_pains?.length ? `\n💢 Dores: ${c.main_pains.join(', ')}` : ''}`,
          actions: c.phone ? [
            { label: '💬 WhatsApp', onClick: () => window.open(`https://wa.me/${c.phone}`, '_blank') },
            { label: '🗺️ Navegar', onClick: () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.city + ', SP')}&travelmode=driving`, '_blank') },
          ] : []
        };
      }
    }

    // Como abordar cliente
    const abordarMatch = t.match(/(?:como abordar|abordagem|estratégia)\s+(?:para |do |da |de )?(.+)/);
    if (abordarMatch) {
      const nome = abordarMatch[1].trim();
      const c = clients.find(cl => cl.first_name?.toLowerCase().includes(nome) || cl.clinic_name?.toLowerCase().includes(nome));
      if (c) {
        // Vai para o LLM via contexto
        return null; // deixa cair para o LLM com contexto do cliente
      }
    }

    // Rota do dia
    if (t.includes('rota') || t.includes('agenda') || t.includes('visitasHoje') || t.includes('hoje')) {
      const hoje = new Date().toISOString().split('T')[0];
      const visitasHoje = visits.filter(v => v.scheduled_date?.startsWith(hoje));
      if (visitasHoje.length === 0) {
        return { content: `📅 **Nenhuma visita agendada para hoje.**\n\nUse a aba **📅 Agenda** para gerar sua rota inteligente!` };
      }
      const linhas = visitasHoje.map((v, i) => `${i+1}. **${v.client_name}** — ${v.scheduled_date?.split('T')[1]?.slice(0,5) || ''} (${v.visit_type || 'visita'})`).join('\n');
      return {
        content: `📅 **Rota de Hoje (${visitasHoje.length} visitas):**\n\n${linhas}`,
        actions: [{ label: '🗺️ Abrir rota no Maps', onClick: () => {
          const dest = visitasHoje.map(v => encodeURIComponent(v.location || v.client_name)).join('|');
          window.open(`https://www.google.com/maps/dir/?api=1&origin=Marília,SP&waypoints=${dest}&travelmode=driving`, '_blank');
        }}]
      };
    }

    return null; // nenhum comando específico → LLM
  };

  const sendMsg = async (text) => {
    const txt = text || input;
    if (!txt.trim() || loading) return;
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', content: txt }]);
    setLoading(true);

    try {
      // Tentar resolver localmente primeiro
      const resolved = await resolverComando(txt);
      if (resolved) {
        setMsgs(prev => [...prev, { role: 'assistant', ...resolved }]);
        setLoading(false);
        return;
      }

      // LLM com contexto total
      const history = msgs.slice(-6).map(m => `${m.role === 'user' ? 'Vendedor' : 'IA'}: ${m.content}`).join('\n');
      const ctx = buildContext();

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente de CRM e rotas de vendas. Responda em PORTUGUÊS, de forma CONCISA e PRÁTICA para uso mobile (máx 250 palavras).

${ctx}

CLIENTES (resumo top 10 por score):
${clients.slice(0, 10).map(c => `- ${c.first_name} | ${c.city} | ${c.status} | ${c.purchase_score}% | pipeline: ${c.pipeline_stage}`).join('\n')}

HISTÓRICO:
${history}

Pergunta do vendedor: ${txt}

INSTRUÇÕES:
- Se pedir abordagem/estratégia de um cliente específico, use numerologia (${clients.find(c => txt.toLowerCase().includes(c.first_name?.toLowerCase()))?.numerology_number || 'N/A'}) e perfil
- Se pedir rota, liste de forma clara com horários
- Use markdown simples (negrito, listas)
- Para navegação, sugira links clicáveis do Maps/Waze quando fizer sentido
- NUNCA diga que não tem acesso a dados — você TEM o contexto acima`
      });

      setMsgs(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setMsgs(prev => [...prev, { role: 'assistant', content: '⚠️ Erro ao processar. Tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl overflow-hidden border">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-4 py-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">Chat IA — Rota & CRM</p>
          <p className="text-indigo-200 text-xs">{clients.length} clientes · {visits.length} visitas · contexto GPS ativo</p>
        </div>
        {posAtual && <Badge className="bg-green-500 text-white text-xs">📍 GPS</Badge>}
        {visitaEmAndamento && (
          <Badge className="bg-orange-400 text-white text-xs flex items-center gap-1">
            <Timer className="w-3 h-3" /> Em visita
          </Badge>
        )}
      </div>

      {/* Atalhos rápidos */}
      <div className="flex gap-1.5 overflow-x-auto px-3 py-2 bg-white border-b shrink-0">
        {QUICK_CMDS.map(({ label, cmd }) => (
          <button key={cmd} onClick={() => sendMsg(cmd)}
            className="shrink-0 text-xs px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 hover:bg-indigo-100 whitespace-nowrap">
            {label}
          </button>
        ))}
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {msgs.map((m, i) => <Msg key={i} msg={m} />)}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border rounded-2xl rounded-tl-sm px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-3 flex gap-2 shrink-0">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
          placeholder="Pergunte sobre clientes, rota, visitas... ou 'anota para João: ótima conversa'"
          className="flex-1 h-10 text-sm"
          disabled={loading}
        />
        <Button onClick={() => sendMsg()} disabled={loading || !input.trim()}
          className="h-10 w-10 p-0 bg-indigo-600 hover:bg-indigo-700">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}