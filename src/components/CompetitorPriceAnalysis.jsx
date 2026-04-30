import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Target, TrendingDown, MapPin, Building2, Loader2 } from 'lucide-react';

// Dados de concorrentes (offline - sem IA)
const COMPETITOR_DATA = {
  idexx: {
    name: "IDEXX",
    products: [
      { name: "Catalyst One", type: "Bioquímica", price_range: "R$ 80.000 - R$ 120.000", features: "17 parâmetros" },
      { name: "ProCyte One", type: "Hematologia", price_range: "R$ 60.000 - R$ 90.000", features: "Contador 5 partes" },
      { name: "VetLab Station", type: "Combo", price_range: "R$ 150.000 - R$ 200.000", features: "Bioquímica + Hematologia" }
    ],
    weaknesses: [
      "Preço elevado",
      "Reagentes caros (lock-in)",
      "Manutenção complexa",
      "Treinamento demorado"
    ]
  },
  zoetis: {
    name: "ZOETIS",
    products: [
      { name: "Vetscan VS2", type: "Bioquímica", price_range: "R$ 70.000 - R$ 100.000", features: "Resultados 8 min" },
      { name: "VetScan HM5", type: "Hematologia", price_range: "R$ 55.000 - R$ 85.000", features: "Contador automático" }
    ],
    weaknesses: [
      "Equipamento antigo (tecnologia 2015)",
      "Interface complexa",
      "Consumíveis importados caros"
    ]
  },
  seamaty_advantages: {
    vg2: {
      name: "VG2 - Seamaty",
      price: "R$ 45.000 - R$ 65.000",
      advantages: [
        "💰 30-40% mais barato que IDEXX",
        "⚡ Resultados em 10min (vs 12-15min)",
        "🔬 Hemogasometria + Imunofluorescência juntos",
        "📊 Menor custo por teste",
        "🌍 Sem lock-in de reagentes"
      ]
    },
    qt3: {
      name: "QT3 - Seamaty",
      price: "R$ 70.000 - R$ 95.000",
      advantages: [
        "💰 40% mais barato que VetLab Station (IDEXX)",
        "⚡ Sistema dual-rotor (2x mais rápido)",
        "🔬 Bioquímica + Coagulação + Gases",
        "📊 Cartuchos inteligentes pré-calibrados"
      ]
    },
    smt120: {
      name: "SMT-120VP - Seamaty",
      price: "R$ 35.000 - R$ 50.000",
      advantages: [
        "💰 50% mais barato que Catalyst (IDEXX)",
        "⚡ 24 parâmetros bioquímicos",
        "📊 Pronto para usar (plug & play)"
      ]
    }
  }
};

export default function CompetitorPriceAnalysis() {
  const [city, setCity] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const analyzeCompetitors = () => {
    setAnalyzing(true);
    
    // Simulação de análise (sem IA, usando dados estáticos)
    setTimeout(() => {
      setResults({
        city: city,
        competitors_found: [
          { name: "IDEXX Representante Local", distance: "15km", products: ["Catalyst", "ProCyte"] },
          { name: "Zoetis Distribuidor", distance: "30km", products: ["VetScan"] }
        ],
        price_comparison: COMPETITOR_DATA,
        seamaty_advantages: COMPETITOR_DATA.seamaty_advantages,
        recommendation: `Em ${city}, você compete principalmente com IDEXX e Zoetis. Destaque economia de 30-40% e tecnologia superior.`
      });
      
      setAnalyzing(false);
      toast.success('Análise concluída!');
    }, 1500);
  };

  return (
    <div className="space-y-3">
      <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-red-900">🎯 Análise de Concorrentes</h3>
            <p className="text-xs text-red-700">IDEXX, Zoetis e comparativos de preço</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Digite a cidade..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={analyzeCompetitors}
            disabled={!city || analyzing}
            className="bg-red-600 hover:bg-red-700"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
          </Button>
        </div>
      </Card>

      {results && (
        <Card className="p-4">
          <h4 className="font-bold text-slate-900 mb-3">Análise: {results.city}</h4>
          
          {/* Comparativo de Preços */}
          <div className="space-y-3">
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <p className="font-semibold text-red-900 mb-2">🏢 IDEXX</p>
              {results.price_comparison.idexx.products.map((product, idx) => (
                <div key={idx} className="text-xs mb-2 bg-white p-2 rounded">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-slate-600">{product.price_range}</p>
                </div>
              ))}
            </div>

            <div className="bg-green-50 rounded-lg p-3 border-2 border-green-400">
              <p className="font-semibold text-green-900 mb-2">✅ SEAMATY - VANTAGENS</p>
              {Object.values(results.seamaty_advantages).map((product, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg mb-2">
                  <p className="font-bold text-slate-900 text-sm">{product.name}</p>
                  <p className="text-green-700 font-semibold text-xs mb-2">{product.price}</p>
                  <ul className="text-xs text-slate-700 space-y-1">
                    {product.advantages.map((adv, i) => (
                      <li key={i}>{adv}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-orange-50 rounded-lg p-3 border border-orange-300">
              <p className="font-semibold text-orange-900 mb-2">💡 Recomendação</p>
              <p className="text-sm text-slate-700">{results.recommendation}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}