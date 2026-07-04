import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare, Clock, Send, Zap, CheckCircle,
  AlertTriangle, Loader2, Play, Eye, Phone, RefreshCw
} from 'lucide-react';

const TEMPLATES = [
  {
    id: 'suave',
    label: '😊 Suave (score ≥ 700)',
    texto: (nome, equipamento) =>
      `Olá {nome_contato}! 😊\n\nPassou um tempinho desde nossa conversa e queria saber se você teve a chance de pensar na proposta do *{equipamento}*.\n\nSe tiver alguma dúvida ou quiser ajustar algum detalhe, estou à disposição!\n\nAbraços,\nEquipe SEAMATY Brasil 🐾`,
  },
  {
    id: 'consultivo',
    label: '🤝 Consultivo (score 500-699)',
    texto: (nome, equipamento) =>
      `Olá {nome_contato}! 👋\n\nEstava revisando nossa proposta do *{equipamento}* e queria entender melhor sua situação atual.\n\nPosso te mostrar como outros clientes conseguiram viabilizar a aquisição com condições especiais. Que tal conversarmos 10 minutinhos?\n\nEquipe SEAMATY Brasil`,
  },
  {
    id: 'urgente',
    label: '⚡ Urgente (score < 500)',
    texto: (nome, equipamento) =>
      `Olá {nome_contato}! ⚡\n\nNossa proposta do *{equipamento}* ainda está disponível, mas as condições de pagamento têm prazo.\n\nPara garantir as melhores condições — *pagamento via PIX com desconto especial* — precisamos de uma resposta até amanhã.\n\nMe chame agora! Equipe SEAMATY Brasil`,
  },
];

export default function FollowUpAutomationModule() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [dias, setDias] = useState(3);
  const [preview, setPreview] = useState(null);
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients-followup-auto'],
    queryFn: () => base44.entities.Client.filter({ pipeline_stage: 'negociacao' }),
  });

  const { data: consultas = [] } = useQuery({
    queryKey: ['cnpj-consultas-followup'],
    queryFn: () => base44.entities.CNPJConsulta.list('-created_date', 100),
  });

  // Clientes sem resposta há N dias
  const clientesPendentes = clients.filter(c => {
    if (!c.last_contact_date) return true;
    const diff = (Date.now() - new Date(c.last_contact_date).getTime()) / (1000 * 60 * 60 * 24);
    return diff >= dias;
  });

  const getScore = (client) => {
    const cnpj = (client.cnpj || '').replace(/\D/g, '');
    const consulta = consultas.find(q => q.cnpj === cnpj);
    return consulta?.score_estimado || null;
  };

  const getTemplate = (score) => {
    if (!score || score >= 700) return TEMPLATES[0];
    if (score >= 500) return TEMPLATES[1];
    return TEMPLATES[2];
  };

  const buildMensagem = (client, template) => {
    const nome = client.first_name || client.full_name?.split(' ')[0] || 'cliente';
    const equipamento = client.equipment_interest || client.equipment_sold || 'Seamaty VG2';
    return template.texto()
      .replace(/{nome_contato}/g, nome)
      .replace(/{equipamento}/g, equipamento);
  };

  const handleDispararTodos = async () => {
    setRunning(true);
    setResults(null);
    try {
      const resp = await base44.functions.invoke('followUpWhatsApp', {
        dias_sem_resposta: dias,
        client_ids: clientesPendentes.map(c => c.id),
      });
      setResults(resp.data);
      qc.invalidateQueries({ queryKey: ['clients-followup-auto'] });
    } catch (e) {
      setResults({ error: e.message });
    } finally {
      setRunning(false);
    }
  };

  const handleAbrirWhatsApp = (client) => {
    const score = getScore(client);
    const template = getTemplate(score);
    const mensagem = buildMensagem(client, template);
    const phone = (client.phone || '').replace(/\D/g, '');
    if (!phone) return alert('Cliente sem telefone cadastrado.');
    const phoneIntl = phone.startsWith('55') ? phone : `55${phone}`;
    window.open(`https://api.whatsapp.com/send?phone=${phoneIntl}&text=${encodeURIComponent(mensagem)}`, '_blank');
    // Atualiza last_contact_date
    base44.entities.Client.update(client.id, { last_contact_date: new Date().toISOString().slice(0, 10) });
    qc.invalidateQueries({ queryKey: ['clients-followup-auto'] });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Automação de Follow-up WhatsApp
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Clientes em negociação sem resposta → mensagem automática personalizada
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">Sem resposta há</span>
            <Input
              type="number"
              value={dias}
              onChange={e => setDias(Number(e.target.value))}
              className="w-14 h-7 text-center text-sm p-1"
              min={1}
              max={30}
            />
            <span className="text-sm text-slate-600">dias</span>
          </div>
          <Button
            onClick={() => qc.invalidateQueries({ queryKey: ['clients-followup-auto'] })}
            variant="outline"
            size="icon"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-black text-yellow-600">{clientesPendentes.length}</p>
            <p className="text-sm text-yellow-700 font-semibold">Aguardando Follow-up</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-black text-blue-600">{clients.length}</p>
            <p className="text-sm text-blue-700 font-semibold">Em Negociação Total</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-black text-green-600">
              {clients.length - clientesPendentes.length}
            </p>
            <p className="text-sm text-green-700 font-semibold">Contato Recente</p>
          </CardContent>
        </Card>
      </div>

      {/* Templates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">📝 Templates por Score de Crédito</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TEMPLATES.map(t => (
            <div
              key={t.id}
              onClick={() => setPreview(preview?.id === t.id ? null : t)}
              className={`border-2 rounded-xl p-3 cursor-pointer transition-all hover:shadow-md ${
                preview?.id === t.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-semibold text-sm">{t.label}</p>
              <p className="text-xs text-slate-500 mt-1">Clique para visualizar</p>
            </div>
          ))}
        </CardContent>
        {preview && (
          <CardContent className="pt-0">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Prévia — {preview.label}
              </p>
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                {preview.texto()
                  .replace(/{nome_contato}/g, 'Dr. Carlos')
                  .replace(/{equipamento}/g, 'Seamaty VG2')}
              </pre>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lista de pendentes */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Clientes Pendentes de Follow-up ({clientesPendentes.length})
          </CardTitle>
          {clientesPendentes.length > 0 && (
            <Button
              onClick={handleDispararTodos}
              disabled={running}
              className="bg-yellow-500 hover:bg-yellow-600 text-white gap-2"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Disparar Todos ({clientesPendentes.length})
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && (
            <div className="text-center py-8 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Carregando clientes...</p>
            </div>
          )}
          {!isLoading && clientesPendentes.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto text-green-300 mb-2" />
              <p className="font-semibold">Todos os clientes foram contactados recentemente!</p>
              <p className="text-xs mt-1">Nenhum cliente em negociação sem resposta há {dias}+ dias.</p>
            </div>
          )}
          {clientesPendentes.map(c => {
            const score = getScore(c);
            const template = getTemplate(score);
            const diasSem = c.last_contact_date
              ? Math.floor((Date.now() - new Date(c.last_contact_date).getTime()) / (1000 * 60 * 60 * 24))
              : null;
            return (
              <div key={c.id} className="flex items-center justify-between gap-4 p-3 bg-white border rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{c.clinic_name || c.full_name}</span>
                    <Badge variant="outline" className="text-xs">{c.city || 'Sem cidade'}</Badge>
                    {score && (
                      <Badge className={`text-xs ${score >= 700 ? 'bg-green-100 text-green-800' : score >= 500 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        Score {score}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {diasSem !== null ? `${diasSem} dias sem contato` : 'Nunca contactado'}
                    </span>
                    <span>{c.equipment_interest || c.equipment_sold || 'Equipamento não informado'}</span>
                  </div>
                  <p className="text-xs text-indigo-600 font-medium mt-0.5">{template.label}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreview(template)}
                    className="text-xs gap-1 h-8"
                  >
                    <Eye className="w-3 h-3" /> Ver msg
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAbrirWhatsApp(c)}
                    className="bg-green-600 hover:bg-green-700 text-white gap-1 h-8 text-xs"
                    disabled={!c.phone}
                  >
                    <Send className="w-3 h-3" />
                    {c.phone ? 'Enviar' : 'Sem tel.'}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Resultado disparo em massa */}
      {results && !results.error && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <p className="font-bold text-green-700 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Disparo concluído: {results.enviados} WhatsApps abertos
            </p>
            {results.sem_telefone > 0 && (
              <p className="text-xs text-yellow-700 mt-1">⚠️ {results.sem_telefone} cliente(s) sem telefone cadastrado</p>
            )}
          </CardContent>
        </Card>
      )}
      {results?.error && (
        <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
          ❌ {results.error}
        </div>
      )}
    </div>
  );
}