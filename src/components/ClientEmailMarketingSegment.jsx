import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Copy, Check, Zap, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const SEGMENTS = {
  'VIP': { label: '👑 VIP', color: 'bg-purple-500 text-white', desc: 'Cliente de alto valor, compra recorrente', campaign: 'fidelidade' },
  'Champions': { label: '🏆 Champions', color: 'bg-green-500 text-white', desc: 'Alto engajamento e conversão', campaign: 'upsell' },
  'Potential': { label: '⭐ Potential', color: 'bg-blue-500 text-white', desc: 'Perfil forte, ainda não comprou', campaign: 'nurturing' },
  'Nurture': { label: '🌱 Nurture', color: 'bg-yellow-500 text-white', desc: 'Fase de amadurecimento', campaign: 'educativo' },
  'At Risk': { label: '⚠️ At Risk', color: 'bg-red-500 text-white', desc: 'Risco de churn, requer atenção', campaign: 'reativacao' },
  'Cold': { label: '❄️ Cold', color: 'bg-gray-500 text-white', desc: 'Baixo engajamento', campaign: 'reengajamento' },
};

export default function ClientEmailMarketingSegment({ client, sales = [], interactions = [] }) {
  const [generating, setGenerating] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [copied, setCopied] = useState(false);

  const segment = client?.ai_segment || 'Nurture';
  const segConfig = SEGMENTS[segment] || SEGMENTS['Nurture'];

  const generateCampaign = async () => {
    setGenerating(true);
    try {
      const closedSales = sales.filter(s => s.status === 'fechada');
      const totalRev = closedSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `MÉTODO NR22 — CAMPANHA DE EMAIL MARKETING PERSONALIZADA

Cliente: ${client?.first_name} | Clínica: ${client?.clinic_name || '-'}
Segmento CRM: ${segment} (${segConfig.desc})
Numerologia: ${client?.numerology_number} — ${client?.behavioral_profile}
Status: ${client?.status} | Score: ${client?.purchase_score}%
Equip. Interesse: ${client?.equipment_interest || '-'}
Receita Total: R$ ${totalRev.toLocaleString('pt-BR')}
Dores: ${client?.main_pains?.join(', ') || 'não identificadas'}
Motivadores: ${client?.purchase_motivators?.join(', ') || 'não identificados'}
Campanha: ${segConfig.campaign}

Gere uma campanha de email marketing em 3 mensagens sequenciais (cadência: D+0, D+3, D+7).
Cada mensagem deve ter: assunto irresistível, corpo personalizado (2-3 parágrafos), CTA claro.
Adapte o tom ao perfil numerológico ${client?.numerology_number} e ao segmento ${segment}.
Use gatilhos de Cialdini relevantes para cada mensagem.
Responda em JSON.`,
        response_json_schema: {
          type: 'object',
          properties: {
            segmento: { type: 'string' },
            campanha_nome: { type: 'string' },
            mensagens: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  dia: { type: 'string' },
                  assunto: { type: 'string' },
                  corpo: { type: 'string' },
                  cta: { type: 'string' },
                  gatilho: { type: 'string' }
                }
              }
            },
            tags_sugeridas: { type: 'array', items: { type: 'string' } },
            melhor_horario: { type: 'string' }
          }
        }
      });
      setCampaign(result);
      toast.success('Campanha gerada!');
    } catch (e) {
      toast.error('Erro ao gerar campanha');
    } finally {
      setGenerating(false);
    }
  };

  const copyCampaign = () => {
    if (!campaign) return;
    const text = campaign.mensagens?.map(m =>
      `=== ${m.dia} ===\nAssunto: ${m.assunto}\n\n${m.corpo}\n\nCTA: ${m.cta}\nGatilho: ${m.gatilho}`
    ).join('\n\n---\n\n');
    navigator.clipboard.writeText(text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Campanha copiada!');
  };

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Mail className="w-4 h-4 text-orange-600" />
          Email Marketing — Segmentação IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Segmento atual */}
        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-orange-200">
          <div>
            <p className="text-[10px] text-slate-500">Segmento CRM</p>
            <Badge className={`${segConfig.color} text-xs mt-0.5`}>{segConfig.label}</Badge>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Campanha Ideal</p>
            <p className="text-xs font-semibold text-orange-700 capitalize">{segConfig.campaign}</p>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 italic">{segConfig.desc}</p>

        {/* Tags sugeridas */}
        {campaign?.tags_sugeridas && (
          <div className="flex flex-wrap gap-1">
            {campaign.tags_sugeridas.map((tag, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
            ))}
          </div>
        )}

        {!campaign ? (
          <Button onClick={generateCampaign} disabled={generating} className="w-full bg-orange-600 hover:bg-orange-700 h-9 text-xs gap-2">
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {generating ? 'Gerando campanha 3 emails...' : 'Gerar Campanha Personalizada'}
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">📧 {campaign.campanha_nome}</p>
            {campaign.melhor_horario && (
              <p className="text-[10px] text-slate-500">⏰ Melhor horário: {campaign.melhor_horario}</p>
            )}
            {campaign.mensagens?.map((msg, i) => (
              <div key={i} className="p-2 bg-white rounded border border-orange-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">{msg.dia}</Badge>
                  <span className="text-[10px] text-orange-600">{msg.gatilho}</span>
                </div>
                <p className="font-semibold text-slate-800">✉️ {msg.assunto}</p>
                <p className="text-slate-600 line-clamp-2">{msg.corpo}</p>
                <p className="text-blue-600 font-medium">👉 {msg.cta}</p>
              </div>
            ))}
            <div className="flex gap-2">
              <Button size="sm" onClick={copyCampaign} variant="outline" className="flex-1 h-8 text-xs gap-1">
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                Copiar Tudo
              </Button>
              <Button size="sm" onClick={() => setCampaign(null)} variant="ghost" className="h-8 text-xs">
                Nova
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}