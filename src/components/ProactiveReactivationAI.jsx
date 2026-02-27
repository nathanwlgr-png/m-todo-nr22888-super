import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Copy, CheckCircle, Flame, AlertTriangle } from 'lucide-react';

export default function ProactiveReactivationAI() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-reactivation'],
    queryFn: () => base44.entities.Client.list('-updated_date', 200)
  });

  // Identifica clientes inativos ou com score baixo
  const inactiveClients = clients.filter(c => {
    const score = c.purchase_score || 0;
    const lastContact = c.last_contact_date ? new Date(c.last_contact_date) : null;
    const daysSinceContact = lastContact ? Math.floor((Date.now() - lastContact.getTime()) / 86400000) : 999;
    return score < 40 || daysSinceContact > 30 || c.status === 'frio';
  }).slice(0, 15);

  const runReactivation = async () => {
    setLoading(true);
    try {
      const clientSummaries = inactiveClients.map(c => ({
        id: c.id,
        nome: c.first_name || c.full_name,
        clinica: c.clinic_name,
        score: c.purchase_score || 0,
        status: c.status,
        ultimo_contato: c.last_contact_date,
        equipamento_interesse: c.equipment_interest,
        perfil: c.behavioral_profile,
        dores: (c.main_pains || []).join(', '),
        objecoes: (c.real_objections || []).join(', '),
        pipeline: c.pipeline_stage
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é especialista em reativação de clientes para o Método NR22 (equipamentos diagnóstico veterinário Seamaty).

CLIENTES INATIVOS/SCORE BAIXO (${inactiveClients.length} clientes):
${JSON.stringify(clientSummaries, null, 2)}

Para CADA cliente, crie:
1. Uma mensagem de reativação PERSONALIZADA (WhatsApp-ready) usando gatilhos mentais (escassez, prova social, reciprocidade)
2. O gatilho principal recomendado
3. A oferta/hook ideal para este perfil
4. Nível de urgência (1-3)

Responda em JSON:
{
  "total_analisados": number,
  "estrategia_geral": "string",
  "clientes": [
    {
      "id": "string",
      "nome": "string",
      "score_reativacao": number (0-100),
      "gatilho": "string",
      "oferta_hook": "string",
      "mensagem_reativacao": "string (mensagem completa pronta para WhatsApp)",
      "urgencia": number (1-3),
      "motivo": "string (por que este cliente pode ser reativado)"
    }
  ]
}

Ordene por score_reativacao decrescente (mais fácil de reativar primeiro).`,
        response_json_schema: {
          type: 'object',
          properties: {
            total_analisados: { type: 'number' },
            estrategia_geral: { type: 'string' },
            clientes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  nome: { type: 'string' },
                  score_reativacao: { type: 'number' },
                  gatilho: { type: 'string' },
                  oferta_hook: { type: 'string' },
                  mensagem_reativacao: { type: 'string' },
                  urgencia: { type: 'number' },
                  motivo: { type: 'string' }
                }
              }
            }
          }
        }
      });
      setResults(result);
    } finally {
      setLoading(false);
    }
  };

  const copyMsg = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const urgencyBadge = (u) => {
    if (u >= 3) return <Badge className="bg-red-100 text-red-700">🔴 Alta</Badge>;
    if (u >= 2) return <Badge className="bg-orange-100 text-orange-700">🟡 Média</Badge>;
    return <Badge className="bg-green-100 text-green-700">🟢 Baixa</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">🔥 IA 25 — Motor de Reativação Proativa</h3>
          <p className="text-sm text-slate-500">
            {inactiveClients.length} clientes inativos ou score baixo identificados
          </p>
        </div>
        <Button onClick={runReactivation} disabled={loading || inactiveClients.length === 0} className="bg-orange-600 hover:bg-orange-700">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {loading ? 'Analisando...' : `Reativar ${inactiveClients.length} Clientes`}
        </Button>
      </div>

      {/* Preview dos clientes inativos */}
      {!results && inactiveClients.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="font-semibold text-orange-800 text-sm">Clientes que serão analisados:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {inactiveClients.map((c, i) => (
              <Badge key={i} variant="outline" className="border-orange-300 text-orange-700">
                {c.first_name || c.full_name} (score: {c.purchase_score || 0})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">🔥 Motor de Reativação Ativo</p>
                <p className="text-orange-100 text-sm">{results.total_analisados} clientes analisados</p>
              </div>
              <Flame className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm mt-2 opacity-90">{results.estrategia_geral}</p>
          </div>

          {(results.clientes || []).map((c, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">{c.nome}</span>
                      {urgencyBadge(c.urgencia)}
                      <Badge className="bg-indigo-100 text-indigo-700">Score Reativ: {c.score_reativacao}</Badge>
                      <Badge variant="outline">{c.gatilho}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{c.motivo}</p>
                    <p className="text-xs text-blue-600 mt-0.5">💡 {c.oferta_hook}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => copyMsg(c.mensagem_reativacao, idx)}>
                    {copied === idx ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="bg-slate-50 rounded p-3 text-sm text-slate-700 whitespace-pre-wrap border border-slate-200">
                  {c.mensagem_reativacao}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}