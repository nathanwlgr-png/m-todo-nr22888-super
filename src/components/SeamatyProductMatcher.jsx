import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Target, DollarSign, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function SeamatyProductMatcher({ client }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.filter({ is_active: true })
  });

  const analyzeAndRecommend = async () => {
    if (equipment.length === 0) {
      toast.error('Nenhum equipamento cadastrado');
      return;
    }

    setAnalyzing(true);
    try {
      const catalogList = equipment.map(eq => 
        `- **${eq.name}** (R$ ${eq.price?.toLocaleString('pt-BR')}) - ${eq.specifications}`
      ).join('\n');

      const prompt = `Você é especialista em equipamentos veterinários Seamaty/Ciamat Brasil.

📋 CATÁLOGO DISPONÍVEL (USE APENAS ESTES):
${catalogList}

👤 PERFIL DO CLIENTE:
- Nome: ${client.first_name}
- Tipo: ${client.client_type}
- Decisor: ${client.decision_role}
- Equipamento Atual: ${client.current_equipment || 'Nenhum'}
- Volume Exames: ${client.current_volume || 'Não informado'}
- Orçamento: R$ ${client.available_budget?.toLocaleString('pt-BR') || 'Não informado'}
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Necessidades Lab: ${client.lab_needs?.join(', ') || 'Não definidas'}

🎯 TAREFA:
Recomende os 3 MELHORES equipamentos do catálogo acima para este cliente.

Retorne JSON:
{
  "primary_recommendation": {
    "equipment_name": "Nome exato do catálogo",
    "price": 23500,
    "fit_score": 95,
    "why_perfect": "Por que é perfeito para este cliente",
    "roi_months": 18,
    "key_benefits": ["Benefício 1", "Benefício 2", "Benefício 3"],
    "solves_pains": ["Dor resolvida 1", "Dor 2"],
    "competitive_edge": "Vantagem vs concorrentes"
  },
  "alternative_1": {
    "equipment_name": "Nome exato",
    "price": 28000,
    "fit_score": 85,
    "why_good": "Razão da recomendação",
    "when_choose": "Quando escolher esta opção"
  },
  "alternative_2": {
    "equipment_name": "Nome exato",
    "price": 31000,
    "fit_score": 75,
    "why_good": "Razão da recomendação",
    "when_choose": "Quando escolher esta opção"
  },
  "bundle_suggestion": {
    "total_value": 85000,
    "equipments": ["Equipamento 1", "Equipamento 2"],
    "discount_percentage": 15,
    "bundle_benefit": "Por que comprar o bundle"
  },
  "upsell_path": {
    "start_with": "Equipamento inicial",
    "upgrade_to": "Upgrade futuro",
    "timeline": "6-12 meses"
  }
}

IMPORTANTE: Use APENAS equipamentos que existem no catálogo fornecido.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            primary_recommendation: {
              type: "object",
              properties: {
                equipment_name: { type: "string" },
                price: { type: "number" },
                fit_score: { type: "number" },
                why_perfect: { type: "string" },
                roi_months: { type: "number" },
                key_benefits: { type: "array", items: { type: "string" } },
                solves_pains: { type: "array", items: { type: "string" } },
                competitive_edge: { type: "string" }
              }
            },
            alternative_1: {
              type: "object",
              properties: {
                equipment_name: { type: "string" },
                price: { type: "number" },
                fit_score: { type: "number" },
                why_good: { type: "string" },
                when_choose: { type: "string" }
              }
            },
            alternative_2: {
              type: "object",
              properties: {
                equipment_name: { type: "string" },
                price: { type: "number" },
                fit_score: { type: "number" },
                why_good: { type: "string" },
                when_choose: { type: "string" }
              }
            },
            bundle_suggestion: {
              type: "object",
              properties: {
                total_value: { type: "number" },
                equipments: { type: "array", items: { type: "string" } },
                discount_percentage: { type: "number" },
                bundle_benefit: { type: "string" }
              }
            },
            upsell_path: {
              type: "object",
              properties: {
                start_with: { type: "string" },
                upgrade_to: { type: "string" },
                timeline: { type: "string" }
              }
            }
          }
        }
      });

      setRecommendation(result);
      
      // Atualizar cliente com sugestão
      await base44.entities.Client.update(client.id, {
        equipment_suggestion: result.primary_recommendation.equipment_name,
        equipment_suggestion_reason: result.primary_recommendation.why_perfect,
        equipment_suggestion_alternative: `${result.alternative_1.equipment_name}, ${result.alternative_2.equipment_name}`
      });

      toast.success('Recomendação gerada!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar recomendação');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!recommendation) {
    return (
      <Card className="p-4 bg-gradient-to-r from-orange-500 to-red-600 border-none text-white shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold">Match Perfeito Seamaty</h4>
            <p className="text-xs text-white/80">Baseado no catálogo oficial</p>
          </div>
        </div>
        <Button
          onClick={analyzeAndRecommend}
          disabled={analyzing}
          className="w-full bg-white text-orange-700 hover:bg-white/90 font-bold"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando catálogo...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Encontrar Produtos Ideais
            </>
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Primary */}
      <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <Badge className="bg-green-600 text-white">🏆 RECOMENDAÇÃO PRINCIPAL</Badge>
          <Badge variant="outline" className="text-green-700 border-green-300">
            {recommendation.primary_recommendation.fit_score}% fit
          </Badge>
        </div>
        
        <h4 className="text-lg font-bold text-slate-900 mb-1">{recommendation.primary_recommendation.equipment_name}</h4>
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-green-700 text-white">
            <DollarSign className="w-3 h-3 mr-1" />
            R$ {recommendation.primary_recommendation.price?.toLocaleString('pt-BR')}
          </Badge>
          <Badge className="bg-blue-100 text-blue-700">
            ROI {recommendation.primary_recommendation.roi_months} meses
          </Badge>
        </div>

        <p className="text-sm text-slate-700 mb-3">{recommendation.primary_recommendation.why_perfect}</p>

        <div className="bg-white rounded-lg p-3 mb-2">
          <p className="text-xs font-semibold text-green-700 mb-1">✅ Benefícios</p>
          {recommendation.primary_recommendation.key_benefits.map((b, i) => (
            <p key={i} className="text-xs text-slate-700">• {b}</p>
          ))}
        </div>

        <div className="bg-green-100 rounded-lg p-2 border border-green-300">
          <p className="text-xs font-semibold text-green-800 mb-1">🎯 Resolve</p>
          {recommendation.primary_recommendation.solves_pains.map((p, i) => (
            <p key={i} className="text-xs text-green-700">✓ {p}</p>
          ))}
        </div>
      </Card>

      {/* Alternatives */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3 bg-blue-50 border-blue-200">
          <Badge className="bg-blue-600 text-white text-xs mb-2">Opção 2</Badge>
          <p className="font-bold text-sm text-slate-800">{recommendation.alternative_1.equipment_name}</p>
          <p className="text-xs text-blue-700 mb-1">R$ {recommendation.alternative_1.price?.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-slate-600">{recommendation.alternative_1.why_good}</p>
        </Card>

        <Card className="p-3 bg-purple-50 border-purple-200">
          <Badge className="bg-purple-600 text-white text-xs mb-2">Opção 3</Badge>
          <p className="font-bold text-sm text-slate-800">{recommendation.alternative_2.equipment_name}</p>
          <p className="text-xs text-purple-700 mb-1">R$ {recommendation.alternative_2.price?.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-slate-600">{recommendation.alternative_2.why_good}</p>
        </Card>
      </div>

      {/* Bundle */}
      <Card className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-orange-800">🎁 Pacote Completo</p>
          <Badge className="bg-orange-600 text-white">
            -{recommendation.bundle_suggestion.discount_percentage}%
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {recommendation.bundle_suggestion.equipments.map((eq, i) => (
            <Badge key={i} variant="outline" className="text-xs">{eq}</Badge>
          ))}
        </div>
        <p className="text-xs text-slate-700 mb-2">{recommendation.bundle_suggestion.bundle_benefit}</p>
        <p className="text-sm font-bold text-orange-700">
          R$ {recommendation.bundle_suggestion.total_value?.toLocaleString('pt-BR')}
        </p>
      </Card>

      {/* Upsell Path */}
      <Card className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <p className="text-xs font-bold text-indigo-700 mb-2">📈 Caminho de Crescimento</p>
        <div className="flex items-center gap-2 text-xs">
          <Badge className="bg-indigo-600 text-white">{recommendation.upsell_path.start_with}</Badge>
          <span>→</span>
          <Badge className="bg-purple-600 text-white">{recommendation.upsell_path.upgrade_to}</Badge>
        </div>
        <p className="text-xs text-slate-600 mt-2">{recommendation.upsell_path.timeline}</p>
      </Card>

      <Button
        onClick={() => setRecommendation(null)}
        variant="outline"
        size="sm"
        className="w-full"
      >
        Recalcular
      </Button>
    </div>
  );
}