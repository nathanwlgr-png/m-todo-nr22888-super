import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Search, 
  Loader2, 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign,
  Phone,
  Mail,
  Instagram,
  Target,
  Zap,
  Route
} from 'lucide-react';
import { toast } from 'sonner';

export default function RegionalClinicAnalyzer() {
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState([]);

  const analyzeCityMarket = async () => {
    if (!city.trim()) {
      toast.error('Digite o nome da cidade');
      return;
    }

    setLoading(true);
    try {
      const aiMode = localStorage.getItem('nr22_ai_mode') || 'economy';
      
      if (aiMode === 'off') {
        toast.error('IA desligada - Ative na Home para análise regional');
        setLoading(false);
        return;
      }

      const prompt = `Você é um pesquisador de mercado veterinário em modo estritamente consultivo e somente leitura.

Localize clínicas veterinárias em ${city} usando apenas informações públicas verificáveis.

REGRAS OBRIGATÓRIAS:
- Não invente nem estime CNPJ, endereço, telefone, equipe, especialidade, equipamento, volume de exames, receita, capital, potencial comercial, prioridade, probabilidade ou fonte.
- Para qualquer dado sem fonte verificável, omita o campo ou escreva "informação não confirmada".
- Não crie registros e não afirme que dados foram salvos no CRM.
- Produtos, valores e condições comerciais só podem ser mencionados quando estiverem expressamente presentes em fonte oficial verificável; caso contrário, use "informação não confirmada".
- Diferencie fatos públicos de sugestões comerciais.
- Retorne as clínicas encontradas como sugestões para validação humana.

Use o formato JSON solicitado pelo schema. Mantenha os objetos esperados, mas deixe campos não confirmados vazios ou com zero apenas quando o schema exigir número.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            total_clinics_found: { type: "number" },
            market_overview: {
              type: "object",
              properties: {
                city_name: { type: "string" },
                total_market_potential: { type: "number" },
                competition_level: { type: "string" },
                growth_trend: { type: "string" },
                key_insights: { type: "string" }
              }
            },
            clinics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  clinic_name: { type: "string" },
                  cnpj: { type: "string" },
                  razao_social: { type: "string" },
                  address: { type: "string" },
                  cep: { type: "string" },
                  neighborhood: { type: "string" },
                  phone: { type: "string" },
                  whatsapp: { type: "string" },
                  email: { type: "string" },
                  website: { type: "string" },
                  instagram: { type: "string" },
                  facebook: { type: "string" },
                  google_rating: { type: "number" },
                  total_reviews: { type: "number" },
                  google_maps_url: { type: "string" },
                  business_intelligence: {
                    type: "object",
                    properties: {
                      estimated_employees: { type: "number" },
                      estimated_monthly_exams: { type: "number" },
                      clinic_size: { type: "string" },
                      clinic_type: { type: "string" },
                      specialties: { type: "array", items: { type: "string" } },
                      operation_years: { type: "number" },
                      growth_indicators: { type: "string" }
                    }
                  },
                  equipment_analysis: {
                    type: "object",
                    properties: {
                      detected_equipment: { type: "array", items: { type: "string" } },
                      equipment_photos_found: { type: "boolean" },
                      technology_level: { type: "string" },
                      lab_setup: { type: "string" },
                      modernization_need: { type: "string" }
                    }
                  },
                  financial_indicators: {
                    type: "object",
                    properties: {
                      estimated_revenue_annual: { type: "number" },
                      cnpj_capital_social: { type: "number" },
                      purchase_power_score: { type: "number" },
                      credit_capacity: { type: "string" },
                      investment_pattern: { type: "string" }
                    }
                  },
                  decision_maker: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      role: { type: "string" },
                      linkedin: { type: "string" },
                      background: { type: "string" }
                    }
                  },
                  sales_opportunity: {
                    type: "object",
                    properties: {
                      priority_score: { type: "number" },
                      recommended_product: { type: "string" },
                      product_fit_reason: { type: "string" },
                      alternative_products: { type: "array", items: { type: "string" } },
                      estimated_deal_size: { type: "number" },
                      probability_closing: { type: "number" },
                      urgency_level: { type: "string" },
                      key_pain_points: { type: "array", items: { type: "string" } },
                      competitive_threat: { type: "string" }
                    }
                  },
                  visit_strategy: {
                    type: "object",
                    properties: {
                      best_approach: { type: "string" },
                      best_day_week: { type: "string" },
                      best_time: { type: "string" },
                      key_talking_points: { type: "array", items: { type: "string" } },
                      expected_objections: { type: "array", items: { type: "string" } }
                    }
                  }
                }
              }
            },
            visit_route_optimization: {
              type: "object",
              properties: {
                optimal_sequence: { type: "array", items: { type: "number" } },
                route_description: { type: "string" },
                estimated_total_time: { type: "string" },
                geographic_clusters: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      setClinics(result);
      toast.success(`${result.total_clinics_found} clínicas encontradas!`);
    } catch (error) {
      console.error('Erro:', error);
      if (error.message?.includes('limit')) {
        toast.error('Limite de IA atingido - Use importação MobVendedor');
      } else {
        toast.error('Erro ao analisar mercado');
      }
    } finally {
      setLoading(false);
    }
  };

  const requestClientValidation = async (clinic) => {
    try {
      await base44.entities.CRMUpdateQueue.create({
        origem: 'manual',
        texto_original: `Validar possível clínica encontrada em ${city}: ${clinic.clinic_name || 'nome não confirmado'}`,
        comando_interpretado: 'Validar dados públicos antes de qualquer criação no CRM',
        tipo_atualizacao: 'validar_novo_cliente',
        campo_alvo: 'Client',
        valor_novo: JSON.stringify(clinic),
        status: 'pendente',
        risco: 'alto',
        exige_aprovacao: true,
        agente_origem: 'RegionalClinicAnalyzer',
        modelo_ia_usado: 'InvokeLLM com pesquisa pública',
        data_criacao: new Date().toISOString(),
        observacao: 'Sugestão não validada. Nenhum cliente ou dado comercial foi criado ou alterado.'
      });
      toast.success('Sugestão enviada para validação. Nenhum cliente foi criado.');
    } catch (error) {
      console.error('Erro ao registrar sugestão:', error);
      toast.error('Erro ao registrar sugestão para validação');
    }
  };

  if (!clinics.clinics) {
    return (
      <Card className="p-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 border-none shadow-2xl">
        <div className="text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Análise Regional Completa</h3>
              <p className="text-xs text-white/80">Pesquisa + CNPJ + Redes Sociais + Rota</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-3 mb-3">
            <p className="text-xs text-white/90 leading-relaxed">
              Pesquisa dados públicos de clínicas e apresenta sugestões para validação humana, sem criar ou alterar registros comerciais.
            </p>
          </div>

          <div className="relative mb-3">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-white/60" />
            <Input
              placeholder="Digite o nome da cidade..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzeCityMarket()}
              className="pl-9 h-10 bg-white/20 border-white/30 text-white placeholder:text-white/60"
            />
          </div>

          <Button
            onClick={analyzeCityMarket}
            disabled={loading}
            className="w-full h-12 bg-white text-indigo-700 hover:bg-white/90 font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analisando mercado...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Analisar Cidade Completa
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Market Overview */}
      <Card className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 border-none text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg">{clinics.market_overview.city_name}</h3>
            <p className="text-xs text-white/80">{clinics.total_clinics_found} clínicas encontradas</p>
          </div>
          <Button
            onClick={() => setClinics([])}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            Nova Busca
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white/10 backdrop-blur rounded p-2">
            <p className="text-xs text-white/70">Potencial Mercado</p>
            <p className="font-bold">
              {Number.isFinite(Number(clinics.market_overview.total_market_potential)) && Number(clinics.market_overview.total_market_potential) > 0
                ? `R$ ${(Number(clinics.market_overview.total_market_potential) / 1000).toFixed(0)}k`
                : 'Informação não confirmada'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded p-2">
            <p className="text-xs text-white/70">Competição</p>
            <p className="font-bold capitalize">{clinics.market_overview.competition_level}</p>
          </div>
        </div>

        <p className="text-xs text-white/90">{clinics.market_overview.key_insights}</p>
      </Card>

      {/* Route Optimization */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <Route className="w-5 h-5 text-green-600" />
          <h4 className="font-bold text-slate-800">Rota Otimizada</h4>
        </div>
        <p className="text-sm text-slate-700 mb-2">{clinics.visit_route_optimization.route_description}</p>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>⏱️ {clinics.visit_route_optimization.estimated_total_time}</span>
          <span>•</span>
          <span>{clinics.visit_route_optimization.geographic_clusters.join(' → ')}</span>
        </div>
      </Card>

      {/* Clinics List */}
      <div className="space-y-3">
        {[...clinics.clinics]
          .sort((a, b) => Number(b.sales_opportunity?.priority_score || 0) - Number(a.sales_opportunity?.priority_score || 0))
          .map((clinic, index) => (
            <Card key={index} className="p-4 hover:shadow-lg transition-all border-2">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-800">{clinic.clinic_name}</h4>
                    <Badge className={
                      clinic.sales_opportunity.priority_score > 80 ? 'bg-red-500 text-white' :
                      clinic.sales_opportunity.priority_score > 60 ? 'bg-orange-500 text-white' :
                      'bg-yellow-500 text-white'
                    }>
                      {clinic.sales_opportunity.priority_score} pts
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">{clinic.neighborhood}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  #{clinics.visit_route_optimization.optimal_sequence.indexOf(index) + 1} visita
                </Badge>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-blue-50 rounded p-2">
                  <p className="text-blue-600">Funcionários</p>
                  <p className="font-bold text-slate-800">{clinic.business_intelligence.estimated_employees}</p>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <p className="text-green-600">Exames/mês</p>
                  <p className="font-bold text-slate-800">{clinic.business_intelligence.estimated_monthly_exams}</p>
                </div>
                <div className="bg-purple-50 rounded p-2">
                  <p className="text-purple-600">Avaliação</p>
                  <p className="font-bold text-slate-800">⭐ {clinic.google_rating} ({clinic.total_reviews})</p>
                </div>
                <div className="bg-amber-50 rounded p-2">
                  <p className="text-amber-600">Capital</p>
                  <p className="font-bold text-slate-800">
                    {Number.isFinite(Number(clinic.financial_indicators?.cnpj_capital_social)) && Number(clinic.financial_indicators?.cnpj_capital_social) > 0
                      ? `R$ ${(Number(clinic.financial_indicators.cnpj_capital_social) / 1000).toFixed(0)}k`
                      : 'Não confirmado'}
                  </p>
                </div>
              </div>

              {/* Equipment Detected */}
              {clinic.equipment_analysis.detected_equipment?.length > 0 && (
                <div className="bg-slate-50 rounded p-2 mb-2">
                  <p className="text-xs text-slate-600 mb-1">Equipamentos Detectados:</p>
                  <div className="flex flex-wrap gap-1">
                    {clinic.equipment_analysis.detected_equipment.map((eq, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{eq}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Product */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 mb-3 border border-indigo-200">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <p className="text-xs font-bold text-indigo-700">PRODUTO RECOMENDADO</p>
                </div>
                <p className="font-bold text-slate-800 mb-1">{clinic.sales_opportunity.recommended_product}</p>
                <p className="text-xs text-slate-700 mb-2">{clinic.sales_opportunity.product_fit_reason}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Deal Size: <strong>R$ {clinic.sales_opportunity.estimated_deal_size?.toLocaleString('pt-BR')}</strong></span>
                  <span className="text-green-600">Prob: <strong>{clinic.sales_opportunity.probability_closing}%</strong></span>
                </div>
              </div>

              {/* Visit Strategy */}
              <div className="bg-green-50 rounded-lg p-2 mb-3 border border-green-200">
                <p className="text-xs font-bold text-green-700 mb-1">🎯 Estratégia de Visita</p>
                <div className="text-xs text-slate-700 space-y-1">
                  <p><strong>Abordagem:</strong> {clinic.visit_strategy.best_approach}</p>
                  <p><strong>Melhor Momento:</strong> {clinic.visit_strategy.best_day_week} às {clinic.visit_strategy.best_time}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-2 mb-3 text-xs">
                {clinic.phone && (
                  <a href={`tel:${clinic.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                    <Phone className="w-3 h-3" />
                    Ligar
                  </a>
                )}
                {clinic.whatsapp && (
                  <a href={`https://wa.me/${clinic.whatsapp}`} target="_blank" className="flex items-center gap-1 text-green-600 hover:underline">
                    <Phone className="w-3 h-3" />
                    WhatsApp
                  </a>
                )}
                {clinic.instagram && (
                  <a href={`https://instagram.com/${clinic.instagram.replace('@', '')}`} target="_blank" className="flex items-center gap-1 text-pink-600 hover:underline">
                    <Instagram className="w-3 h-3" />
                    Instagram
                  </a>
                )}
                {clinic.google_maps_url && (
                  <a href={clinic.google_maps_url} target="_blank" className="flex items-center gap-1 text-indigo-600 hover:underline">
                    <MapPin className="w-3 h-3" />
                    Maps
                  </a>
                )}
              </div>

              {/* Actions */}
              <Button
                onClick={() => requestClientValidation(clinic)}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Solicitar validação da clínica
              </Button>
            </Card>
          ))}
      </div>
    </div>
  );
}