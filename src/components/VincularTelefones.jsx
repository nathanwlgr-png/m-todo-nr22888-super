import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Phone, Link, Loader2, MessageCircle, Zap, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function VincularTelefones() {
  const [expandido, setExpandido] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analising, setAnalising] = useState(false);
  const [vinculos, setVinculos] = useState([]);
  const [analises, setAnalises] = useState([]);
  const [inputNumeros, setInputNumeros] = useState('');
  const [inputMensagens, setInputMensagens] = useState('');

  const vincularNumeros = async () => {
    if (!inputNumeros.trim()) { toast.error('Cole os contatos no campo'); return; }
    setLoading(true);
    try {
      // Parse simples: linha por linha "Nome Número"
      const linhas = inputNumeros.split('\n').filter(l => l.trim());
      const contatos = linhas.map(l => {
        const parts = l.trim().split(/\s+/);
        const numero = parts.find(p => /^\+?\d{8,15}$/.test(p.replace(/[^\d+]/g, '')));
        const nome = parts.filter(p => !/^\+?\d/.test(p)).join(' ') || 'Desconhecido';
        return { nome_salvo: nome, numero: numero || l.replace(/[^\d]/g, '') };
      }).filter(c => c.numero);

      const res = await base44.functions.invoke('vincularTelefones', { contatos, acao: 'vincular' });
      if (res.data?.success) {
        setVinculos(res.data.vinculos || []);
        toast.success(`${res.data.total_vinculados} vinculados! ${res.data.total_sem_vinculo} sem match.`);
      }
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const analisarMensagens = async () => {
    if (!inputMensagens.trim()) { toast.error('Cole as mensagens'); return; }
    setAnalising(true);
    try {
      // Parse: "Número: mensagem"
      const linhas = inputMensagens.split('\n').filter(l => l.trim() && l.includes(':'));
      const mensagens = linhas.map(l => {
        const idx = l.indexOf(':');
        return { numero: l.substring(0, idx).replace(/\D/g, ''), texto: l.substring(idx + 1).trim(), data: new Date().toISOString().split('T')[0] };
      }).filter(m => m.numero && m.texto);

      const res = await base44.functions.invoke('vincularTelefones', { mensagens, acao: 'analisar_mensagens' });
      if (res.data?.success) {
        setAnalises(res.data.analises || []);
        toast.success(`${res.data.analises.length} mensagens analisadas!`);
      }
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setAnalising(false);
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-600" />
            Vincular Contatos & Analisar Mensagens
          </CardTitle>
          <button onClick={() => setExpandido(!expandido)}>
            {expandido ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </CardHeader>

      {expandido && (
        <CardContent className="space-y-4">
          {/* Vincular contatos */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">1. Cole contatos (Nome Número, um por linha):</p>
            <textarea
              value={inputNumeros}
              onChange={e => setInputNumeros(e.target.value)}
              placeholder={"Dr Marcos 5514999887766\nClínica Vet 5511987654321\n+55 14 99988-7766"}
              className="w-full border rounded-lg p-2 text-xs h-20 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <Button onClick={vincularNumeros} disabled={loading} size="sm" className="w-full mt-1.5 bg-blue-600 hover:bg-blue-700 h-8 text-xs">
              {loading ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Vinculando...</> : <><Link className="w-3 h-3 mr-1" />Vincular com CRM</>}
            </Button>
          </div>

          {/* Resultados vinculo */}
          {vinculos.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-green-700">✅ {vinculos.length} Vinculados:</p>
              {vinculos.map((v, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200 text-xs">
                  <CheckCircle className="w-3 h-3 text-green-600 shrink-0" />
                  <span className="text-slate-500">{v.contato_nome} →</span>
                  <span className="font-medium">{v.cliente_nome}</span>
                  {v.clinica && <span className="text-slate-400">({v.clinica})</span>}
                  <Badge className={`ml-auto text-xs ${v.status === 'quente' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{v.status}</Badge>
                </div>
              ))}
            </div>
          )}

          {/* Analisar mensagens */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">2. Cole mensagens para análise (Número: texto):</p>
            <textarea
              value={inputMensagens}
              onChange={e => setInputMensagens(e.target.value)}
              placeholder={"5514999887766: Preciso de orçamento urgente\n5511987654321: Quando vocês passam por aqui?"}
              className="w-full border rounded-lg p-2 text-xs h-20 resize-none focus:outline-none focus:ring-1 focus:ring-purple-400"
            />
            <Button onClick={analisarMensagens} disabled={analising} size="sm" className="w-full mt-1.5 bg-purple-600 hover:bg-purple-700 h-8 text-xs">
              {analising ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Analisando...</> : <><Zap className="w-3 h-3 mr-1" />Analisar + Dica Imediata</>}
            </Button>
          </div>

          {/* Resultados análise */}
          {analises.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-purple-700">💡 Dicas Imediatas:</p>
              {analises.map((a, i) => (
                <div key={i} className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{a.cliente_nome || a.numero}</span>
                    {a.urgencia && (
                      <Badge className={a.urgencia === 'alta' ? 'bg-red-500 text-white' : a.urgencia === 'média' ? 'bg-yellow-500 text-black' : 'bg-slate-400 text-white'}>
                        {a.urgencia}
                      </Badge>
                    )}
                  </div>
                  {a.intencao && <p className="text-slate-600">📌 {a.intencao}</p>}
                  {a.resposta_ideal && (
                    <div className="bg-white rounded p-2 border border-purple-200">
                      <p className="text-slate-700 italic">"{a.resposta_ideal}"</p>
                    </div>
                  )}
                  {a.whatsapp_link && (
                    <a href={a.whatsapp_link} target="_blank" rel="noreferrer">
                      <Button size="sm" className="h-6 text-xs bg-green-500 hover:bg-green-600 px-2 mt-1">
                        <MessageCircle className="w-3 h-3 mr-1" /> Responder
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}