import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Copy, CheckCircle, MessageSquare, Mail, Phone } from 'lucide-react';

const CHANNEL_ICONS = { whatsapp: MessageSquare, email: Mail, ligacao: Phone };
const CHANNEL_COLORS = { whatsapp: 'bg-green-100 text-green-700', email: 'bg-blue-100 text-blue-700', ligacao: 'bg-orange-100 text-orange-700' };

export default function FollowUpSequenceAI({ client }) {
  const [loading, setLoading] = useState(false);
  const [sequence, setSequence] = useState(null);
  const [copied, setCopied] = useState(null);

  const generateSequence = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Gere uma sequência de follow-up de 7 passos personalizada para este cliente veterinário:

CLIENTE: ${client.first_name} ${client.full_name || ''}
CLÍNICA: ${client.clinic_name || 'N/A'}
CIDADE: ${client.city || 'N/A'}
SCORE DE COMPRA: ${client.purchase_score || 50}/100
STATUS: ${client.status || 'morno'}
PIPELINE: ${client.pipeline_stage || 'lead'}
PERFIL COMPORTAMENTAL: ${client.behavioral_profile || 'não definido'}
ESTILO DE DECISÃO: ${client.decision_style || 'não definido'}
EQUIPAMENTO DE INTERESSE: ${client.equipment_interest || 'VBC-50A'}
DORES PRINCIPAIS: ${(client.main_pains || []).join(', ') || 'não mapeadas'}
OBJEÇÕES REAIS: ${(client.real_objections || []).join(', ') || 'nenhuma'}
DICA NUMEROLÓGICA: ${client.numerology_tip || 'não calculada'}
ÚLTIMO CONTATO: ${client.last_contact_date || 'desconhecido'}
PRÓXIMA AÇÃO: ${client.next_action || 'follow-up'}

Crie uma sequência de 7 touchpoints (dias 1, 2, 4, 7, 14, 21, 30) adaptada ao perfil, score e estágio do cliente.
Para cada passo, considere o canal mais adequado (whatsapp, email ou ligacao) com base nas preferências do perfil.

Retorne JSON exatamente com este formato:
{
  "objetivo": "string (objetivo geral da sequência)",
  "estrategia": "string (abordagem estratégica em 1 frase)",
  "passos": [
    {
      "dia": number,
      "canal": "whatsapp|email|ligacao",
      "assunto": "string (assunto/título)",
      "mensagem": "string (mensagem completa pronta para usar)",
      "gatilho": "string (gatilho mental usado)",
      "objetivo_passo": "string (objetivo deste passo específico)"
    }
  ]
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            objetivo: { type: 'string' },
            estrategia: { type: 'string' },
            passos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  dia: { type: 'number' },
                  canal: { type: 'string' },
                  assunto: { type: 'string' },
                  mensagem: { type: 'string' },
                  gatilho: { type: 'string' },
                  objetivo_passo: { type: 'string' }
                }
              }
            }
          }
        }
      });
      setSequence(result);
    } finally {
      setLoading(false);
    }
  };

  const copyMsg = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">🔄 IA 23 — Sequência de Follow-Up</h3>
          <p className="text-sm text-slate-500">7 touchpoints personalizados com base no perfil e score</p>
        </div>
        <Button onClick={generateSequence} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
          {loading ? 'Gerando...' : 'Gerar Sequência'}
        </Button>
      </div>

      {sequence && (
        <div className="space-y-3">
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <p className="text-sm font-semibold text-indigo-800">🎯 {sequence.objetivo}</p>
            <p className="text-sm text-indigo-600 mt-1">📌 {sequence.estrategia}</p>
          </div>

          {(sequence.passos || []).map((passo, idx) => {
            const Icon = CHANNEL_ICONS[passo.canal] || MessageSquare;
            return (
              <Card key={idx} className="border border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                          D{passo.dia}
                        </div>
                        <Icon className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-slate-800">{passo.assunto}</span>
                          <Badge className={`text-xs ${CHANNEL_COLORS[passo.canal]}`}>{passo.canal}</Badge>
                          <Badge variant="outline" className="text-xs">{passo.gatilho}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{passo.objetivo_passo}</p>
                        <div className="bg-slate-50 rounded p-3 text-sm text-slate-700 whitespace-pre-wrap border">
                          {passo.mensagem}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyMsg(passo.mensagem, idx)}
                      className="flex-shrink-0"
                    >
                      {copied === idx ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}