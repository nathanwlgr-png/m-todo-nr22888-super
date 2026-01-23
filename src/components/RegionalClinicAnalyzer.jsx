import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
  const navigate = useNavigate();
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
      const prompt = `Você é um especialista em pesquisa de mercado veterinário e inteligência comercial.

🎯 MISSÃO: Pesquise e analise TODAS as clínicas veterinárias na cidade de ${city}.

📊 DADOS A COLETAR (pesquise Google Maps, Google, redes sociais, CNPJ):

Para CADA clínica encontrada, retorne JSON estruturado:

{
  "total_clinics_found": 15,
  "market_overview": {
    "city_name": "${city}",
    "total_market_potential": 2500000,
    "competition_level": "média/alta/baixa",
    "growth_trend": "crescendo/estável/declinando",
    "key_insights": "Insights do mercado local"
  },
  "clinics": [
    {
      "clinic_name": "Nome oficial completo",
      "cnpj": "00.000.000/0001-00",
      "razao_social": "Razão Social LTDA",
      "address": "Endereço completo com número",
      "cep": "00000-000",
      "neighborhood": "Bairro",
      "phone": "5511999999999",
      "whatsapp": "5511999999999",
      "email": "contato@clinica.com",
      "website": "www.clinica.com.br",
      "instagram": "@clinica",
      "facebook": "facebook.com/clinica",
      "google_rating": 4.5,
      "total_reviews": 234,
      "google_maps_url": "URL do Google Maps",
      
      "business_intelligence": {
        "estimated_employees": 12,
        "estimated_monthly_exams": 180,
        "clinic_size": "pequena/média/grande",
        "clinic_type": "geral/especializada/hospital",
        "specialties": ["Cirurgia", "Ortopedia"],
        "operation_years": 8,
        "growth_indicators": "Em expansão/Estável/Declinando"
      },
      
      "equipment_analysis": {
        "detected_equipment": ["Equipamento 1", "Equipamento 2"],
        "equipment_photos_found": true,
        "technology_level": "avançado/intermediário/básico",
        "lab_setup": "completo/parcial/terceirizado",
        "modernization_need": "alta/média/baixa"
      },
      
      "financial_indicators": {
        "estimated_revenue_annual": 1200000,
        "cnpj_capital_social": 500000,
        "purchase_power_score": 75,
        "credit_capacity": "alta/média/baixa",
        "investment_pattern": "agressivo/moderado/conservador"
      },
      
      "decision_maker": {
        "name": "Dr. Nome do Proprietário",
        "role": "Proprietário/Sócio/Veterinário",
        "linkedin": "linkedin.com/in/pessoa",
        "background": "Formação e experiência"
      },
      
      "sales_opportunity": {
        "priority_score": 85,
        "recommended_product": "VG2 - Hemogasometria + Imunofluorescência",
        "product_fit_reason": "Por que este produto é ideal",
        "alternative_products": ["SMT-120VP", "QT3"],
        "estimated_deal_size": 95000,
        "probability_closing": 70,
        "urgency_level": "alta/média/baixa",
        "key_pain_points": ["Dor 1", "Dor 2", "Dor 3"],
        "competitive_threat": "alta/média/baixa"
      },
      
      "visit_strategy": {
        "best_approach": "Consultiva/Técnica/ROI",
        "best_day_week": "terça-feira",
        "best_time": "14h-16h",
        "key_talking_points": ["Ponto 1", "Ponto 2"],
        "expected_objections": ["Objeção 1", "Objeção 2"]
      }
    }
  ],
  
  "visit_route_optimization": {
    "optimal_sequence": [1, 3, 5, 2, 4],
    "route_description": "Rota otimizada por região",
    "estimated_total_time": "6 horas",
    "geographic_clusters": ["Centro", "Zona Sul", "Zona Norte"]
  }
}

🎯 CATÁLOGO SEAMATY/CIAMAT BRASIL - USE APENAS ESTES PRODUTOS:

**EQUIPAMENTOS DISPONÍVEIS:**
- **SMT-120VP** (R$ 23.500) - Analisador químico multifuncional automático veterinário
- **QT3** (R$ 31.000) - Analisador químico multifuncional automático veterinário QT3
- **VG1** (R$ 28.000) - Analisador de gases e eletrólitos veterinário
- **VG2** (R$ 33.000) - Analisador de imunoensaio fluorescente e gases sanguíneos veterinário
- **3DX** (R$ 55.000) - Analisador multifuncional veterinário minilab 3DX
- **VBC50A** (R$ 70.000) - Analisador hematológico 5 partes veterinária 50A
- **Vi1** (R$ 8.500) - Analisador de imunoensaio fluorescente
- **VQ1** (R$ 45.000) - Analisador PCR

IMPORTANTE: Sugira SOMENTE equipamentos desta lista. Considere:
- Clínicas pequenas → SMT-120VP, Vi1, VG1
- Clínicas médias → QT3, VG2, 3DX
- Hospitais/grandes → VBC50A, VQ1, 3DX

INSTRUÇÕES CRÍTICAS:
- Pesquise PROFUNDAMENTE em Google Maps, Google Search, Instagram, Facebook
- CNPJ obrigatório quando possível (Receita Federal)
- Número de funcionários: estime por fotos, reviews, estrutura
- Equipamentos: procure fotos no Instagram/Facebook da clínica
- Capital social: consulte CNPJ na Receita
- Ordene por PRIORIDADE de visita (maior potencial primeiro)
- Seja específico e baseado em DADOS REAIS encontrados`;

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
      toast.error('Erro ao analisar mercado');
    } finally {
      setLoading(false);
    }
  };

  const createClientFromClinic = async (clinic) => {
    try {
      const clientData = {
        first_name: clinic.decision_maker?.name?.split(' ')[0] || clinic.clinic_name.split(' ')[0],
        full_name: clinic.decision_maker?.name,
        cnpj: clinic.cnpj,
        razao_social: clinic.razao_social,
        email: clinic.email,
        phone: clinic.whatsapp || clinic.phone,
        address: clinic.address,
        cep: clinic.cep,
        city: city,
        clinic_name: clinic.clinic_name,
        instagram_handle: clinic.instagram?.replace('@', ''),
        facebook_url: clinic.facebook,
        website: clinic.website,
        client_type: clinic.business_intelligence.clinic_size === 'grande' ? 'hospital_veterinario' : 
                     clinic.business_intelligence.clinic_size === 'média' ? 'clinica_media' : 'clinica_pequena',
        decision_role: clinic.decision_maker?.role === 'Proprietário' ? 'proprietario' : 'veterinario_responsavel',
        current_equipment: clinic.equipment_analysis.detected_equipment?.join(', '),
        equipment_suggestion: clinic.sales_opportunity.recommended_product,
        equipment_suggestion_reason: clinic.sales_opportunity.product_fit_reason,
        equipment_suggestion_alternative: clinic.sales_opportunity.alternative_products?.join(', '),
        available_budget: clinic.sales_opportunity.estimated_deal_size,
        valor_real_poder_compra: clinic.financial_indicators.cnpj_capital_social,
        main_pains: clinic.sales_opportunity.key_pain_points,
        purchase_score: clinic.sales_opportunity.priority_score,
        status: clinic.sales_opportunity.urgency_level === 'alta' ? 'quente' : 'morno',
        projected_revenue: clinic.sales_opportunity.estimated_deal_size,
        priority_level: clinic.sales_opportunity.priority_score > 80 ? 1 : clinic.sales_opportunity.priority_score > 60 ? 2 : 3,
        notes: `[ANÁLISE REGIONAL IA - ${new Date().toLocaleDateString('pt-BR')}]
        
📊 INTELIGÊNCIA DE MERCADO:
- Funcionários: ${clinic.business_intelligence.estimated_employees}
- Exames/mês: ${clinic.business_intelligence.estimated_monthly_exams}
- Avaliação Google: ${clinic.google_rating}⭐ (${clinic.total_reviews} reviews)
- Nível Tecnológico: ${clinic.equipment_analysis.technology_level}

💰 INDICADORES FINANCEIROS:
- Receita Anual: R$ ${clinic.financial_indicators.estimated_revenue_annual?.toLocaleString('pt-BR')}
- Capital Social: R$ ${clinic.financial_indicators.cnpj_capital_social?.toLocaleString('pt-BR')}
- Poder de Compra: ${clinic.financial_indicators.purchase_power_score}/100

🎯 OPORTUNIDADE:
- Probabilidade Fechamento: ${clinic.sales_opportunity.probability_closing}%
- Ameaça Competitiva: ${clinic.sales_opportunity.competitive_threat}
- Abordagem: ${clinic.visit_strategy.best_approach}
- Melhor Dia: ${clinic.visit_strategy.best_day_week} às ${clinic.visit_strategy.best_time}`
      };

      const newClient = await base44.entities.Client.create(clientData);
      toast.success('Cliente criado!');
      navigate(createPageUrl(`ClientProfile?id=${newClient.id}`));
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error('Erro ao criar cliente');
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
              Sistema analisa <strong>TODAS clínicas da cidade</strong>: CNPJ, funcionários, equipamentos (fotos), capital social, fluxo estimado, redes sociais. Gera rota otimizada e prioridade de visita.
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
            <p className="font-bold">R$ {(clinics.market_overview.total_market_potential / 1000).toFixed(0)}k</p>
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
        {clinics.clinics
          .sort((a, b) => b.sales_opportunity.priority_score - a.sales_opportunity.priority_score)
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
                  <p className="font-bold text-slate-800">R$ {(clinic.financial_indicators.cnpj_capital_social / 1000).toFixed(0)}k</p>
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
                onClick={() => createClientFromClinic(clinic)}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Criar Cliente + Perfil Completo
              </Button>
            </Card>
          ))}
      </div>
    </div>
  );
}