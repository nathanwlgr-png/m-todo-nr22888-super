import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';

const CALENDAR_SUGGESTIONS = [
  {
    week: 'Semana 1 (Maio 1-7)',
    campaign: '💚 Check-up Preventivo',
    desc: 'Começar mês com educação',
    type: 'post',
  },
  {
    week: 'Semana 2 (Maio 8-14)',
    campaign: '⚡ Diagnóstico Rápido',
    desc: 'Foco velocidade',
    type: 'reel',
  },
  {
    week: 'Semana 3 (Maio 15-21)',
    campaign: '🏆 Autoridade Regional',
    desc: 'Case de sucesso (real)',
    type: 'story',
  },
  {
    week: 'Semana 4 (Maio 22-31)',
    campaign: '🔄 Recorrência',
    desc: 'Anúncio com CTA urgência',
    type: 'anuncio',
  },
];

const MONTHLY_THEMES = {
  maio: { theme: '🏥 Saúde Preventiva', focus: 'Check-up, exame anual' },
  junho: { theme: '⚠️ Emergência/UTI', focus: 'Diagnóstico rápido, urgência' },
  julho: { theme: '🔬 Laboratório', focus: 'Exames completos, precisão' },
  agosto: { theme: '🌟 Especialização', focus: 'Imunofluorescência, avançado' },
};

export default function MarketingCalendar({ intensity = 3, onGenerate, loading = false }) {
  return (
    <div className="space-y-6">
      
      {/* Tema do Mês */}
      <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300">
        <CardHeader>
          <CardTitle>📅 Tema do Mês: Maio 2026</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(MONTHLY_THEMES).map(([mes, data]) => (
              <div key={mes} className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="font-bold capitalize text-slate-900">{mes}</p>
                <p className="text-sm text-slate-700">📌 {data.theme}</p>
                <p className="text-xs text-slate-600 mt-1">Foco: {data.focus}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sugestões Semana a Semana */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Campanhas Sugeridas — Maio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {CALENDAR_SUGGESTIONS.map((item, i) => (
            <div
              key={i}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-purple-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-slate-900">{item.week}</p>
                <Badge variant="outline">{item.type}</Badge>
              </div>
              <p className="font-semibold text-slate-900 mb-1">{item.campaign}</p>
              <p className="text-sm text-slate-600 mb-3">{item.desc}</p>
              
              <Button
                size="sm"
                onClick={() => onGenerate({
                  type: 'calendar_campaign',
                  week: item.week,
                  contentType: item.type,
                  platform: 'instagram'
                })}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Gerar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Datas Importantes */}
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle>📌 Datas Importante — Criar Campanhas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-white rounded border border-orange-200">
            <p className="font-bold text-orange-900">🎂 Aniversários do CRM</p>
            <p className="text-sm text-slate-700">Parabéns + promoção (validar datas no CRM)</p>
          </div>
          <div className="p-3 bg-white rounded border border-orange-200">
            <p className="font-bold text-orange-900">🏥 Aniversário de Clínica</p>
            <p className="text-sm text-slate-700">Parabenizar cliente (se data confirmada)</p>
          </div>
          <div className="p-3 bg-white rounded border border-orange-200">
            <p className="font-bold text-orange-900">📊 Inauguração Equipamento</p>
            <p className="text-sm text-slate-700">Se vendeu VG2, criar campanha de lançamento local</p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}