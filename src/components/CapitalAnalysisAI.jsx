import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

export default function CapitalAnalysisAI({ client, onAnalysisComplete }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeCapital = async () => {
    if (!client.cnpj) {
      alert('CNPJ não cadastrado. Adicione o CNPJ do cliente primeiro.');
      return;
    }

    setAnalyzing(true);
    try {
      const prompt = `Você é um especialista em análise financeira e avaliação de capacidade de pagamento B2B.

TAREFA: Faça uma ANÁLISE COMPLETA de capacidade financeira e poder de capitalização da empresa.

DADOS DO CLIENTE:
- CNPJ: ${client.cnpj}
- Razão Social: ${client.razao_social || 'Não informada'}
- Nome Fantasia/Clínica: ${client.clinic_name || 'Não informada'}
- Cidade: ${client.city || 'Não informada'}
- Tipo de negócio: ${client.client_type || 'Não informado'}
- Endereço: ${client.address || 'Não informado'}

INSTRUÇÕES:
1. Pesquise informações públicas sobre esta empresa no Google
2. Busque dados em redes sociais (LinkedIn, Instagram, Facebook)
3. Procure por:
   - Tamanho da clínica/hospital (fotos, número de funcionários)
   - Reputação online (avaliações, comentários)
   - Presença digital (site profissional, redes ativas)
   - Indicadores de estrutura (equipamentos visíveis em fotos)
   - Tempo de mercado
   - Expansão/crescimento recente

4. Retorne JSON estruturado:
{
  "credit_score": 75,
  "capital_level": "medio_alto",
  "payment_capacity": "boa",
  "risk_level": "baixo",
  "recommended_budget": 85000,
  "confidence": 80,
  "found_data": {
    "company_size": "Clínica de médio porte com X funcionários",
    "market_time": "X anos no mercado",
    "online_reputation": "4.5 estrelas no Google",
    "social_presence": "Ativo no Instagram com X seguidores",
    "visible_infrastructure": "Descrição do que foi encontrado"
  },
  "positive_indicators": [
    "Indicador positivo 1",
    "Indicador positivo 2"
  ],
  "negative_indicators": [
    "Indicador negativo 1 (se houver)"
  ],
  "financing_recommendation": "Sugestão de condições de pagamento",
  "analysis_summary": "Resumo executivo em 2-3 frases"
}

IMPORTANTE:
- Se não encontrar dados suficientes, seja honesto e indique baixa confiança
- Considere indicadores indiretos (fotos da clínica, estrutura)
- Analise presença digital como proxy de investimento em marketing
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            credit_score: { type: "number" },
            capital_level: { type: "string" },
            payment_capacity: { type: "string" },
            risk_level: { type: "string" },
            recommended_budget: { type: "number" },
            confidence: { type: "number" },
            found_data: {
              type: "object",
              properties: {
                company_size: { type: "string" },
                market_time: { type: "string" },
                online_reputation: { type: "string" },
                social_presence: { type: "string" },
                visible_infrastructure: { type: "string" }
              }
            },
            positive_indicators: {
              type: "array",
              items: { type: "string" }
            },
            negative_indicators: {
              type: "array",
              items: { type: "string" }
            },
            financing_recommendation: { type: "string" },
            analysis_summary: { type: "string" }
          }
        }
      });

      setAnalysis(result);

      // Atualizar cliente com orçamento recomendado e valor real de poder de compra
      if (onAnalysisComplete) {
        onAnalysisComplete({
          available_budget: result.recommended_budget,
          valor_real_poder_compra: result.recommended_budget,
          notes: `${client.notes || ''}\n\n[ANÁLISE IA - ${new Date().toLocaleDateString('pt-BR')}]\nCapacidade: ${result.payment_capacity}\nScore: ${result.credit_score}/100\n${result.analysis_summary}`
        });
      }

    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao analisar. Verifique o CNPJ e tente novamente.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'baixo': return 'bg-green-100 text-green-700 border-green-300';
      case 'medio': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'alto': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getCapitalIcon = (level) => {
    switch (level) {
      case 'alto': return '💰💰💰';
      case 'medio_alto': return '💰💰';
      case 'medio': return '💰';
      case 'baixo': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-300 shadow-lg">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-800 mb-1">💎 Análise de Capitalização</h3>
          <p className="text-xs text-slate-600">IA avalia capacidade financeira via Google e redes sociais</p>
        </div>
      </div>

      {!analysis && (
        <Button
          onClick={analyzeCapital}
          disabled={analyzing || !client.cnpj}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando CNPJ, Google e Redes Sociais...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analisar Capacidade Financeira
            </>
          )}
        </Button>
      )}

      {analysis && (
        <div className="space-y-3">
          {/* Score e Confiança */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 border-2 border-emerald-200">
              <p className="text-xs text-slate-500 mb-1">Credit Score</p>
              <p className="text-3xl font-bold text-emerald-600">{analysis.credit_score}</p>
              <div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  style={{ width: `${analysis.credit_score}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
              <p className="text-xs text-slate-500 mb-1">Confiança IA</p>
              <p className="text-3xl font-bold text-blue-600">{analysis.confidence}%</p>
              <p className="text-xs text-slate-500 mt-1">Dados encontrados</p>
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border-2 border-emerald-200">
            <p className="text-xs font-semibold text-emerald-700 mb-2">📊 Resumo Executivo</p>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.analysis_summary}</p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-xs text-slate-500 mb-1">Nível Capital</p>
              <p className="font-bold text-slate-800">
                {getCapitalIcon(analysis.capital_level)} {analysis.capital_level?.replace('_', ' ').toUpperCase()}
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border">
              <p className="text-xs text-slate-500 mb-1">Capacidade Pgto</p>
              <p className="font-bold text-slate-800 capitalize">{analysis.payment_capacity}</p>
            </div>
          </div>

          {/* Risco */}
          <div className={`rounded-lg p-3 border-2 ${getRiskColor(analysis.risk_level)}`}>
            <div className="flex items-center gap-2 mb-1">
              {analysis.risk_level === 'baixo' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <p className="text-xs font-semibold">Risco: {analysis.risk_level?.toUpperCase()}</p>
            </div>
          </div>

          {/* Orçamento Recomendado */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-green-700">💰 ORÇAMENTO RECOMENDADO</p>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-700">
              R$ {analysis.recommended_budget?.toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Dados Encontrados */}
          <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
            <p className="text-xs font-semibold text-indigo-700 mb-2">🔍 Dados Encontrados</p>
            <div className="space-y-1 text-xs text-slate-700">
              {analysis.found_data?.company_size && (
                <p>• <span className="font-medium">Tamanho:</span> {analysis.found_data.company_size}</p>
              )}
              {analysis.found_data?.market_time && (
                <p>• <span className="font-medium">Mercado:</span> {analysis.found_data.market_time}</p>
              )}
              {analysis.found_data?.online_reputation && (
                <p>• <span className="font-medium">Reputação:</span> {analysis.found_data.online_reputation}</p>
              )}
              {analysis.found_data?.social_presence && (
                <p>• <span className="font-medium">Redes:</span> {analysis.found_data.social_presence}</p>
              )}
              {analysis.found_data?.visible_infrastructure && (
                <p>• <span className="font-medium">Infraestrutura:</span> {analysis.found_data.visible_infrastructure}</p>
              )}
            </div>
          </div>

          {/* Indicadores */}
          <div className="grid grid-cols-2 gap-2">
            {analysis.positive_indicators?.length > 0 && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs font-semibold text-green-700 mb-1">✓ Positivos</p>
                <ul className="text-xs text-green-600 space-y-0.5">
                  {analysis.positive_indicators.map((indicator, i) => (
                    <li key={i}>• {indicator}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.negative_indicators?.length > 0 && (
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <p className="text-xs font-semibold text-red-700 mb-1">⚠ Atenção</p>
                <ul className="text-xs text-red-600 space-y-0.5">
                  {analysis.negative_indicators.map((indicator, i) => (
                    <li key={i}>• {indicator}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recomendação de Financiamento */}
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <p className="text-xs font-semibold text-purple-700 mb-1">💳 Recomendação de Pagamento</p>
            <p className="text-sm text-slate-700">{analysis.financing_recommendation}</p>
          </div>

          {/* Ações */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={analyzeCapital}
              variant="outline"
              size="sm"
              disabled={analyzing}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Atualizar
            </Button>
            <Button
              onClick={() => setAnalysis(null)}
              variant="outline"
              size="sm"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}

      {!client.cnpj && (
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 text-center">
          <p className="text-xs text-yellow-700">⚠️ CNPJ não cadastrado. Adicione o CNPJ para analisar.</p>
        </div>
      )}
    </Card>
  );
}