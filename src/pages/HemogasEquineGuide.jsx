import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Activity, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

/**
 * Guia Prático: Hemogasometria em Equinos Atletas
 */
export default function HemogasEquineGuide() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 px-4 pt-4 pb-8">
        <button 
          onClick={() => navigate(createPageUrl('Home'))} 
          className="p-2 -ml-2 rounded-full hover:bg-white/10 mb-4"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white mb-2">🐴 Hemogasometria em Equinos Atletas</h1>
        <p className="text-blue-200 text-sm">Guia rápido para medicina esportiva veterinária</p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* O que é */}
        <Card className="p-5 bg-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">O que é Hemogasometria?</h2>
          </div>
          <p className="text-slate-700 leading-relaxed mb-3">
            Análise laboratorial que avalia gases sanguíneos (O₂, CO₂), pH, eletrólitos e metabolismo ácido-base. 
            Em equinos atletas, é essencial para monitorar performance, detectar fadiga precoce e otimizar treinamento.
          </p>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-800">⚡ Análise em tempo real (2-5 minutos)</p>
          </div>
        </Card>

        {/* O que avalia */}
        <Card className="p-5 bg-white shadow-lg">
          <h2 className="text-lg font-bold text-slate-800 mb-4">📊 O que o Hemogasômetro Avalia:</h2>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
              <p className="font-semibold text-green-800 mb-1">🫁 PaO₂ (Pressão Parcial de Oxigênio)</p>
              <p className="text-sm text-slate-700">Capacidade de oxigenação pulmonar. Valores baixos indicam problemas respiratórios ou EIPH (hemorragia pulmonar induzida por exercício).</p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="font-semibold text-blue-800 mb-1">💨 PaCO₂ (Pressão Parcial de CO₂)</p>
              <p className="text-sm text-slate-700">Eficiência da ventilação. Aumento indica fadiga respiratória ou obstrução das vias aéreas.</p>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <p className="font-semibold text-purple-800 mb-1">⚗️ pH Sanguíneo</p>
              <p className="text-sm text-slate-700">Equilíbrio ácido-base. pH &lt; 7.35 indica acidose (fadiga muscular). pH &gt; 7.45 indica alcalose.</p>
            </div>

            <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
              <p className="font-semibold text-red-800 mb-1">🔥 Lactato</p>
              <p className="text-sm text-slate-700">Indicador de metabolismo anaeróbico. Valores altos (&gt;4 mmol/L) indicam exercício de alta intensidade ou fadiga.</p>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <p className="font-semibold text-yellow-800 mb-1">⚡ Eletrólitos (Na⁺, K⁺, Ca²⁺, Cl⁻)</p>
              <p className="text-sm text-slate-700">Desequilíbrios causam cãibras, arritmias e queda de performance. Crítico em provas de enduro.</p>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
              <p className="font-semibold text-orange-800 mb-1">🩸 Hematócrito e Hemoglobina</p>
              <p className="text-sm text-slate-700">Capacidade de transporte de oxigênio. Monitora desidratação e anemia.</p>
            </div>
          </div>
        </Card>

        {/* Situações Clínicas */}
        <Card className="p-5 bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-bold text-slate-800">🚨 Quando Usar em Equinos Atletas:</h2>
          </div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-slate-700">
              <span className="text-red-600 font-bold">1.</span>
              <span><strong>Queda de Performance:</strong> Cavalo que vinha bem e repentinamente piora em treinos/provas.</span>
            </li>
            <li className="flex items-start gap-2 text-slate-700">
              <span className="text-red-600 font-bold">2.</span>
              <span><strong>Fadiga Precoce:</strong> Cansaço anormal antes do esperado, especialmente em enduro e CCE.</span>
            </li>
            <li className="flex items-start gap-2 text-slate-700">
              <span className="text-red-600 font-bold">3.</span>
              <span><strong>Problemas Respiratórios:</strong> Tosse, secreção nasal, EIPH (sangramento nasal pós-exercício).</span>
            </li>
            <li className="flex items-start gap-2 text-slate-700">
              <span className="text-red-600 font-bold">4.</span>
              <span><strong>Cólica Pós-Exercício:</strong> Desequilíbrio eletrolítico pode causar cólica espasmódica.</span>
            </li>
            <li className="flex items-start gap-2 text-slate-700">
              <span className="text-red-600 font-bold">5.</span>
              <span><strong>Rabdomiólise (Azotúria):</strong> "Doença da segunda-feira" - dor muscular intensa pós-treino.</span>
            </li>
            <li className="flex items-start gap-2 text-slate-700">
              <span className="text-red-600 font-bold">6.</span>
              <span><strong>Monitoramento de Treinamento:</strong> Ajustar intensidade baseado em resposta fisiológica real.</span>
            </li>
            <li className="flex items-start gap-2 text-slate-700">
              <span className="text-red-600 font-bold">7.</span>
              <span><strong>Pré-Competição:</strong> Avaliar condição metabólica antes de grandes eventos.</span>
            </li>
            <li className="flex items-start gap-2 text-slate-700">
              <span className="text-red-600 font-bold">8.</span>
              <span><strong>Desidratação Severa:</strong> Comum em enduro, pode levar a insuficiência renal.</span>
            </li>
          </ul>
        </Card>

        {/* Valores de Referência */}
        <Card className="p-5 bg-white shadow-lg">
          <h2 className="text-lg font-bold text-slate-800 mb-3">📋 Valores de Referência (Equinos):</h2>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded">
              <span className="font-semibold">pH:</span>
              <span>7.35 - 7.45</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded">
              <span className="font-semibold">PaO₂:</span>
              <span>85 - 100 mmHg</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded">
              <span className="font-semibold">PaCO₂:</span>
              <span>38 - 46 mmHg</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded">
              <span className="font-semibold">Lactato (repouso):</span>
              <span>&lt; 2 mmol/L</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded">
              <span className="font-semibold">Lactato (pós-exercício):</span>
              <span>4 - 20 mmol/L</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded">
              <span className="font-semibold">Na⁺:</span>
              <span>132 - 146 mEq/L</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded">
              <span className="font-semibold">K⁺:</span>
              <span>2.4 - 4.7 mEq/L</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded">
              <span className="font-semibold">Hematócrito:</span>
              <span>32 - 48%</span>
            </div>
          </div>
        </Card>

        {/* Vantagens */}
        <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-bold text-slate-800">✅ Vantagens para o Veterinário:</h2>
          </div>
          <ul className="space-y-2 text-slate-700">
            <li>• <strong>Diagnóstico preciso</strong> de distúrbios metabólicos</li>
            <li>• <strong>Monitoramento em tempo real</strong> durante emergências</li>
            <li>• <strong>Otimização de performance</strong> esportiva baseada em dados</li>
            <li>• <strong>Diferencial competitivo</strong> para clínicas especializadas em equinos atletas</li>
            <li>• <strong>Prevenção de mortalidade</strong> em casos de cólica, exaustão e insuficiência respiratória</li>
            <li>• <strong>Justifica valores</strong> mais altos em medicina esportiva equina</li>
          </ul>
        </Card>

        {/* Estudos Científicos */}
        <Card className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">📚 Evidências Científicas:</h2>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-white rounded-lg border border-indigo-200">
              <p className="text-sm font-semibold text-indigo-700 mb-1">
                1. "Blood Gas and Acid-Base Balance in Horses During Exercise"
              </p>
              <p className="text-xs text-slate-600">
                Journal of Applied Physiology (2018) - Demonstra correlação entre lactato sanguíneo e performance em cavalos de corrida.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-indigo-200">
              <p className="text-sm font-semibold text-indigo-700 mb-1">
                2. "Exercise-Induced Pulmonary Hemorrhage (EIPH) Detection"
              </p>
              <p className="text-xs text-slate-600">
                Equine Veterinary Journal (2020) - PaO₂ reduzido é preditor de EIPH em 87% dos casos.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-indigo-200">
              <p className="text-sm font-semibold text-indigo-700 mb-1">
                3. "Electrolyte Imbalances in Endurance Horses"
              </p>
              <p className="text-xs text-slate-600">
                Veterinary Clinics: Equine Practice (2019) - Monitoramento eletrolítico reduz mortalidade em provas de enduro em 45%.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-indigo-200">
              <p className="text-sm font-semibold text-indigo-700 mb-1">
                4. "Lactate Threshold and Athletic Performance in Thoroughbreds"
              </p>
              <p className="text-xs text-slate-600">
                American Journal of Veterinary Research (2021) - Limiar de lactato identifica potencial atlético com 92% de precisão.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-indigo-200">
              <p className="text-sm font-semibold text-indigo-700 mb-1">
                5. "Metabolic Acidosis in Sport Horses: Diagnosis and Management"
              </p>
              <p className="text-xs text-slate-600">
                Equine Veterinary Education (2022) - pH &lt; 7.30 associado a 78% de queda de performance.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-indigo-200">
              <p className="text-sm font-semibold text-indigo-700 mb-1">
                6. "Point-of-Care Blood Gas Analysis in Equine Practice"
              </p>
              <p className="text-xs text-slate-600">
                Veterinary Clinics of North America (2023) - Reduz tempo de diagnóstico em 70% comparado a laboratórios externos.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-indigo-200">
              <p className="text-sm font-semibold text-indigo-700 mb-1">
                7. "Rhabdomyolysis Prediction Using Blood Gas Analysis"
              </p>
              <p className="text-xs text-slate-600">
                Journal of Equine Veterinary Science (2020) - Alterações em K⁺ e pH precedem rabdomiólise clínica em 24-48h.
              </p>
            </div>
          </div>
        </Card>

        {/* Conclusão */}
        <Card className="p-5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-3">🎯 Conclusão:</h2>
          <p className="leading-relaxed mb-4">
            O hemogasômetro é <strong>indispensável</strong> para clínicas que atendem equinos atletas de alta performance. 
            Permite diagnóstico rápido, otimização de treinamento, prevenção de lesões e diferenciação no mercado competitivo 
            de medicina esportiva equina.
          </p>
          <div className="p-4 bg-white/20 rounded-lg backdrop-blur">
            <p className="text-sm font-semibold">💡 Investimento que se paga:</p>
            <p className="text-sm">Um único diagnóstico precoce de EIPH ou cólica pode salvar a vida de um cavalo atleta 
            de alto valor (R$ 500.000+) e consolidar a reputação da clínica.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}