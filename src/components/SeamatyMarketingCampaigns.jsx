import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';

const SEAMATY_PRODUCTS = {
  'SMT-120VP': {
    name: 'SMT-120VP',
    desc: 'Analisador Hematológico Veterinário',
    features: ['26 parâmetros', '3-5 min', 'Amostra pequena'],
    price: '~R$35-45k'
  },
  'VG2': {
    name: 'VG2',
    desc: 'Analisador Hematológico Premium',
    features: ['Precisão máxima', 'Velocidade', 'Confiabilidade'],
    price: '~R$40-50k'
  },
  'VG1': {
    name: 'VG1',
    desc: 'Analisador Compacto',
    features: ['Espaço mínimo', 'Resultado rápido', 'Custo menor'],
    price: '~R$25-30k'
  },
  'VI1': {
    name: 'VI1',
    desc: 'Bioquímica Analítica',
    features: ['Múltiplos testes', 'Automatizado', 'Eficiente'],
    price: '~R$30-35k'
  },
  'QT3': {
    name: 'QT3',
    desc: 'Contador de Células',
    features: ['Leucometria', 'Precisão', 'Rápido'],
    price: '~R$15-20k'
  },
  '3DX': {
    name: '3DX',
    desc: 'Ultrassom Portátil',
    features: ['Mobilidade', 'Qualidade', 'Prático'],
    price: '~R$20-25k'
  },
};

const CAMPAIGN_ANGLES = {
  roi: { label: '💰 ROI', desc: 'Foco em retorno financeiro (8-12 meses)' },
  velocidade: { label: '⚡ Velocidade', desc: 'Diagnóstico em 5 minutos' },
  retencao: { label: '🔄 Retenção', desc: 'Cliente não sai mais para exame fora' },
  qualidade: { label: '🏆 Qualidade', desc: 'Precisão e confiabilidade máximas' },
  diferenciais: { label: '🌟 Diferencial', desc: 'Vantagem competitiva' },
  atualizacao: { label: '🔧 Atualização', desc: 'Modernizar laboratório' },
};

export default function SeamatyMarketingCampaigns({ intensity = 3, onGenerate, loading = false }) {
  const [selectedProduct, setSelectedProduct] = useState('SMT-120VP');
  const [selectedAngle, setSelectedAngle] = useState('roi');
  const [contentType, setContentType] = useState('post');

  const handleGenerate = () => {
    onGenerate({
      type: 'seamaty_campaign',
      product: selectedProduct,
      angle: selectedAngle,
      contentType,
      platform: 'instagram'
    });
  };

  const product = SEAMATY_PRODUCTS[selectedProduct];

  return (
    <Card className="bg-white border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏥 Campanhas Seamaty — ROI + Retenção
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* Produtos */}
        <div>
          <label className="font-bold text-slate-900 block mb-3">Equipamento</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(SEAMATY_PRODUCTS).map(([key, prod]) => (
              <button
                key={key}
                onClick={() => setSelectedProduct(key)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedProduct === key
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-slate-200 hover:border-orange-300'
                }`}
              >
                <p className="font-bold text-sm">{prod.name}</p>
                <p className="text-xs text-slate-600 mt-1">{prod.price}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Características do Produto Selecionado */}
        {product && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
            <p className="font-bold text-orange-900 mb-2">{product.desc}</p>
            <div className="flex flex-wrap gap-2">
              {product.features.map((f, i) => (
                <Badge key={i} variant="secondary">{f}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Ângulo de Venda */}
        <div>
          <label className="font-bold text-slate-900 block mb-3">Ângulo de Venda</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(CAMPAIGN_ANGLES).map(([key, angle]) => (
              <button
                key={key}
                onClick={() => setSelectedAngle(key)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedAngle === key
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-slate-200 hover:border-pink-300'
                }`}
              >
                <p className="font-semibold text-sm text-slate-900">{angle.label}</p>
                <p className="text-xs text-slate-600 mt-1">{angle.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tipo de Conteúdo */}
        <div>
          <label className="font-bold text-slate-900 block mb-3">Formato</label>
          <div className="flex gap-2">
            {['post', 'story', 'reel', 'anuncio'].map(type => (
              <button
                key={type}
                onClick={() => setContentType(type)}
                className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-semibold ${
                  contentType === type
                    ? 'border-purple-500 bg-purple-100 text-purple-900'
                    : 'border-slate-200 text-slate-700 hover:border-purple-300'
                }`}
              >
                {type === 'post' && '📱 Post'}
                {type === 'story' && '📸 Story'}
                {type === 'reel' && '🎬 Reel'}
                {type === 'anuncio' && '📢 Anúncio'}
              </button>
            ))}
          </div>
        </div>

        {/* Aviso Verdade Absoluta */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-900">
            <strong>✅ Modo Verdade Absoluta:</strong> Nunca prometemos resultado falso. Se disserem "R$1 por exame = ROI em 8 meses", validamos volume DELES, não inventamos número.
          </p>
        </div>

        {/* Botão Gerar */}
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 gap-2"
          size="lg"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          {loading ? 'Gerando...' : 'Gerar Campanha'}
        </Button>

      </CardContent>
    </Card>
  );
}