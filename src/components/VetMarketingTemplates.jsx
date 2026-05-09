import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

const VET_CAMPAIGNS = {
  check_up: {
    label: '💚 Check-up Preventivo',
    desc: 'Saúde preventiva, exame anual',
    focus: 'Prevenção, bem-estar',
    gatilho: 'Segurança animal'
  },
  emergencia: {
    label: '⚠️ Emergência/UTI',
    desc: 'Paciente crítico, diagnóstico imediato',
    focus: 'Urgência, vida do animal',
    gatilho: 'Prevenção de morte'
  },
  laboratorio: {
    label: '🔬 Laboratório Completo',
    desc: 'Exames bioquímicos, hemogasometria',
    focus: 'Precisão, múltiplos testes',
    gatilho: 'Confiança na precisão'
  },
  hemogasometria: {
    label: '📊 Hemogasometria',
    desc: 'Análise gases sanguíneos',
    focus: 'Paciente crítico, UTI',
    gatilho: 'Velocidade = vida'
  },
  imunofluorescencia: {
    label: '🧬 Imunofluorescência',
    desc: 'Diagnóstico de doenças específicas',
    focus: 'Precisão diagnóstica',
    gatilho: 'Especialização'
  },
  recorrencia: {
    label: '🔄 Campanha Recorrência',
    desc: 'Trazer cliente de volta (exame rotina)',
    focus: 'Fidelidade, conforto',
    gatilho: 'Pertencimento'
  },
};

export default function VetMarketingTemplates({ intensity = 3, onGenerate, loading = false }) {
  const [selectedCampaign, setSelectedCampaign] = useState('check_up');
  const [withEquipment, setWithEquipment] = useState(false);

  const handleGenerate = () => {
    onGenerate({
      type: 'vet_campaign',
      campaign: selectedCampaign,
      withEquipment,
      platform: 'instagram'
    });
  };

  const campaign = VET_CAMPAIGNS[selectedCampaign];

  return (
    <Card className="bg-white border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🐾 Campanhas Veterinárias — Educação + Venda
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* Tipo de Campanha */}
        <div>
          <label className="font-bold text-slate-900 block mb-3">Campanha</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(VET_CAMPAIGNS).map(([key, camp]) => (
              <button
                key={key}
                onClick={() => setSelectedCampaign(key)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedCampaign === key
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-green-300'
                }`}
              >
                <p className="font-semibold text-sm text-slate-900">{camp.label}</p>
                <p className="text-xs text-slate-600 mt-1">{camp.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Detalhes */}
        {campaign && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 space-y-3">
            <div>
              <p className="text-xs text-slate-600 font-semibold">Foco</p>
              <p className="text-green-900 font-bold">{campaign.focus}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-semibold">Gatilho Mental</p>
              <p className="text-green-900 font-bold">{campaign.gatilho}</p>
            </div>
          </div>
        )}

        {/* Incluir Equipamento */}
        <div>
          <label className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
            <input
              type="checkbox"
              checked={withEquipment}
              onChange={(e) => setWithEquipment(e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <div>
              <p className="font-bold text-blue-900">Incluir Equipamento Seamaty</p>
              <p className="text-xs text-blue-800">Campanha edu + "coincidência" de equipamento que faz isso</p>
            </div>
          </label>
        </div>

        {/* Variações */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="font-bold text-slate-900 mb-3">Variações Geradas:</p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>✓ Post educativo (cara teórica)</li>
            <li>✓ Story urgência (11h-13h, melhor horário)</li>
            <li>✓ Reel antes-depois (se houver cases)</li>
            <li>✓ Anúncio com CTA direto</li>
            <li>✓ Design prompt para Canva</li>
          </ul>
        </div>

        {/* Botão Gerar */}
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
          size="lg"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          {loading ? 'Gerando...' : 'Gerar Campanhas'}
        </Button>

      </CardContent>
    </Card>
  );
}