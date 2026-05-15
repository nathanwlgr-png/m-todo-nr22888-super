import * as React from 'react';
const { useState, useCallback } = React;
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Brain, Zap, Users, MessageSquare, Camera, Route,
  Search, Hash, Copy, Check, Loader2, ChevronRight, AlertCircle
} from 'lucide-react';

const ACTIONS = [
  { id: 'briefing',       label: 'Briefing Diário',       icon: Zap,          color: '#ff6b00', desc: 'Top 5 ações do dia, rota sugerida e postagem Instagram' },
  { id: 'ranking',        label: 'Ranking do Dia',         icon: Users,        color: '#f59e0b', desc: 'Top 10 clientes por prioridade e oportunidade' },
  { id: 'prepare_visit',  label: 'Preparar Visita',        icon: ChevronRight, color: '#10b981', desc: 'Briefing SPIN, objeções e fechamento sugerido' },
  { id: 'whatsapp',       label: 'Gerar WhatsApp',         icon: MessageSquare,color: '#25d366', desc: '3 versões de mensagem para aprovação' },
  { id: 'marketing',      label: 'Marketing IA',           icon: Camera,       color: '#ec4899', desc: 'Legenda Instagram, Story e campanha por equipamento' },
  { id: 'route',          label: 'Rota Inteligente',       icon: Route,        color: '#3b82f6', desc: 'Combina visitas e clientes por prioridade e GPS' },
  { id: 'field_research', label: 'Investigação de Campo',  icon: Search,       color: '#8b5cf6', desc: 'Leads próximos e lacunas de dados no CRM' },
  { id: 'numerology',     label: 'Numerologia Comercial',  icon: Hash,         color: '#f43f5e', desc: 'Inteligência numerológica para timing de vendas' },
];

function ResultCard({ result, onCopy, copied }) {
  return (
    <div className="rounded-2xl p-4 mt-4 relative" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.3)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black text-orange-400 uppercase tracking-widest">Resposta IA</span>
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-all"
          style={{ background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,107,0,0.15)', color: copied ? '#10b981' : '#ff9500' }}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <pre className="text-sm text-orange-100 whitespace-pre-wrap leading-relaxed font-sans">{result}</pre>
    </div>
  );
}

function ActionCard({ action, onSelect, active }) {
  const Icon = action.icon;
  return (
    <button
      onClick={() => onSelect(action.id)}
      className="rounded-xl p-3 text-left transition-all w-full"
      style={{
        background: active ? `rgba(${action.color === '#ff6b00' ? '255,107,0' : action.color === '#f59e0b' ? '245,158,11' : action.color === '#10b981' ? '16,185,129' : action.color === '#25d366' ? '37,211,102' : action.color === '#ec4899' ? '236,72,153' : action.color === '#3b82f6' ? '59,130,246' : action.color === '#8b5cf6' ? '139,92,246' : '244,63,94'},0.2)` : '#161616',
        border: active ? `1px solid ${action.color}` : '1px solid rgba(255,107,0,0.15)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color: action.color }} />
        <span className="text-sm font-black text-white">{action.label}</span>
      </div>
      <p className="text-xs text-orange-600 leading-tight">{action.desc}</p>
    </button>
  );
}

export default function CentralIAMaster() {
  const [selectedAction, setSelectedAction] = useState(null);
  const [message, setMessage] = useState('');
  const [clientId, setClientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [useGPS, setUseGPS] = useState(false);

  const handleRun = useCallback(async () => {
    if (!selectedAction) return;
    setLoading(true);
    setError('');
    setResult('');
    setCopied(false);

    let location = null;
    if (useGPS && navigator.geolocation) {
      try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch { /* GPS indisponível — continuar sem */ }
    }

    try {
      const res = await base44.functions.invoke('aiCommandCenter', {
        action: selectedAction,
        message,
        client_id: clientId || undefined,
        location,
      });
      setResult(res.data?.response || 'Sem resposta.');
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Erro ao chamar a IA. Verifique se OPENAI_API_KEY está configurada.');
    }
    setLoading(false);
  }, [selectedAction, message, clientId, useGPS]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result]);

  const selectedMeta = ACTIONS.find(a => a.id === selectedAction);

  return (
    <div className="min-h-screen pb-20 px-4 pt-4" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #1a0800, #2a1000)', border: '1px solid rgba(255,107,0,0.4)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,107,0,0.2)' }}>
          <Brain className="w-7 h-7 text-orange-400" />
        </div>
        <div>
          <h1 className="text-lg font-black text-orange-400">🧠 Central IA Master</h1>
          <p className="text-xs text-orange-600">NR22888 • Copiloto Comercial Nathan Rosa • Seamaty</p>
        </div>
      </div>

      {/* Grid de ações */}
      <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2 px-1">Escolha uma ação:</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {ACTIONS.map(action => (
          <ActionCard
            key={action.id}
            action={action}
            onSelect={setSelectedAction}
            active={selectedAction === action.id}
          />
        ))}
      </div>

      {/* Campos extras */}
      {selectedAction && (
        <div className="rounded-xl p-4 mb-4 space-y-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
          <p className="text-xs font-black text-orange-400 uppercase tracking-widest">
            {selectedMeta?.label}
          </p>

          {/* Mensagem adicional */}
          <textarea
            placeholder={`Detalhe adicional para ${selectedMeta?.label || 'ação'}... (opcional)`}
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            className="w-full rounded-xl px-3 py-2 text-sm text-orange-100 placeholder-orange-800 resize-none focus:outline-none"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.3)' }}
          />

          {/* Client ID — só para ações que precisam */}
          {['prepare_visit', 'whatsapp'].includes(selectedAction) && (
            <input
              placeholder="ID do cliente (cole do CRM — obrigatório para esta ação)"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm text-orange-100 placeholder-orange-800 focus:outline-none"
              style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.3)' }}
            />
          )}

          {/* GPS toggle — para route e briefing */}
          {['briefing', 'route', 'field_research'].includes(selectedAction) && (
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setUseGPS(v => !v)}
                className="w-10 h-6 rounded-full transition-all relative"
                style={{ background: useGPS ? '#ff6b00' : '#333' }}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${useGPS ? 'left-4.5' : 'left-0.5'}`} style={{ left: useGPS ? '18px' : '2px' }} />
              </div>
              <span className="text-xs text-orange-300">Usar GPS atual para rota</span>
            </label>
          )}

          <Button
            onClick={handleRun}
            disabled={loading}
            className="w-full font-black text-white"
            style={{ background: loading ? '#333' : 'linear-gradient(90deg, #ff6b00, #ff9500)', border: 'none' }}
          >
            {loading ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processando IA...</span>
            ) : (
              <span className="flex items-center gap-2"><Brain className="w-4 h-4" /> Executar {selectedMeta?.label}</span>
            )}
          </Button>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="rounded-xl p-3 mb-4 flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)' }}>
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Resultado */}
      {result && <ResultCard result={result} onCopy={handleCopy} copied={copied} />}

      {/* Aviso de segurança */}
      <div className="mt-6 rounded-xl p-3" style={{ background: '#0f0f0f', border: '1px solid rgba(255,107,0,0.1)' }}>
        <p className="text-[10px] text-orange-700 leading-relaxed">
          🔒 A chave OpenAI nunca é exposta no frontend — todas as chamadas passam pelo backend seguro.<br/>
          ⚠️ WhatsApp e Instagram nunca são enviados/publicados sem aprovação explícita do Nathan.
        </p>
      </div>
    </div>
  );
}