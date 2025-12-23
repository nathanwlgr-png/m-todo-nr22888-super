import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function CompleteCaseStudyReport() {
  const [generating, setGenerating] = useState(false);

  // CASO 1: Teste Único (simulado)
  const testCase = {
    name: "Teste Único - Análise Completa",
    client: {
      name: "Dr. Roberto Silva Santos",
      birthdate: "22/08/1975",
      clinic: "VetLife Centro Médico",
      cnpj: "00.000.000/0001-00",
      city: "São Paulo",
      address: "Rua Augusta, 1200 - Consolação",
      phone: "+55 11 91234-5678",
      email: "roberto@vetlifeclinica.com.br",
      numerology: 7,
      profile: "ANALISTA - Detalhista, precisa dados técnicos concretos"
    },
    journey: [
      {
        date: "15/10/2025",
        stage: "Primeiro Contato",
        score: 25,
        status: "frio",
        action: "Ligação inicial (12min)",
        notes: "Cliente receptivo mas cético. Equipamento atual: BC-2800 (6 anos). Volume: 150 exames/mês.",
        questions: [
          "Q: Quanto custa a manutenção mensal atual?",
          "R: R$ 800/mês + R$ 3.500 reagentes",
          "Q: Quantos exames terceiriza?",
          "R: 40% dos bioquímicos (não tem equipamento)"
        ]
      },
      {
        date: "22/10/2025",
        stage: "Envio de Proposta",
        score: 42,
        status: "morno",
        action: "Proposta personalizada enviada",
        notes: "Cliente visualizou proposta 2x (total 15min leitura). Baixou simulação financeira.",
        questions: [
          "Q: ROI em quanto tempo?",
          "R: 16-18 meses baseado no seu volume",
          "Q: Preciso treinar equipe?",
          "R: Sim, 2 dias de treinamento incluído"
        ]
      },
      {
        date: "29/10/2025",
        stage: "Primeira Visita",
        score: 38,
        status: "morno",
        action: "Visita técnica (1h40min)",
        notes: "Cliente fez muitas perguntas técnicas. Demonstração do equipamento. Objeções: preço e curva de aprendizado.",
        objections: [
          {
            objection: "O investimento é alto para meu momento",
            response: "Mostrei comparativo: custo terceirização (R$ 4.200/mês) vs parcela (R$ 2.800/mês) = economia imediata",
            result: "Parcialmente aceito, pediu condições melhores"
          },
          {
            objection: "Minha equipe não tem experiência com esse tipo de equipamento",
            response: "Enfatizei treinamento completo incluído + suporte técnico 24/7 + garantia de performance",
            result: "Aceitou, mas pediu período de adaptação"
          },
          {
            objection: "Preciso ver cases de clínicas similares",
            response: "Apresentei case VetCare Pinheiros (perfil similar, ROI 14 meses, +65% margem lab)",
            result: "Muito interesse, pediu contato do Dr. Fernando"
          }
        ],
        techniques_used: ["SPIN Selling", "Value Selling", "Prova Social"],
        triggers: ["Autoridade (cases)", "Prova Social", "Reciprocidade (treinamento grátis)"],
        interest_level: 6
      },
      {
        date: "05/11/2025",
        stage: "Follow-up pós-visita",
        score: 33,
        status: "frio",
        action: "WhatsApp + Email",
        notes: "Cliente esfriou. Respondeu: 'Vou esperar mais um pouco'. Score caiu por falta de engajamento.",
        questions: [
          "Q: Alguma dúvida sobre a proposta?",
          "R: Não, mas vou avaliar mais algumas opções",
          "Q: Posso ajustar algo na oferta?",
          "R: Depois te aviso"
        ]
      },
      {
        date: "12/11/2025",
        stage: "Reengajamento Estratégico",
        score: 51,
        status: "morno",
        action: "Ligação com nova abordagem (18min)",
        notes: "Nova estratégia: enfatizei escassez (última unidade novembro) + ciclo numerológico favorável. Cliente reagiu positivamente.",
        questions: [
          "Q: Consegue entregar ainda em novembro?",
          "R: Sim, última unidade disponível para entrega até dia 25",
          "Q: E se eu fechar hoje, melhora condições?",
          "R: Posso incluir kit extra de reagentes (R$ 2.800)"
        ]
      },
      {
        date: "19/11/2025",
        stage: "Segunda Visita - Demonstração Avançada",
        score: 68,
        status: "quente",
        action: "Demonstração técnica com equipe (2h)",
        notes: "Levei equipamento para clínica. Equipe testou com amostras reais. Cliente muito impressionado com velocidade e precisão.",
        objections: [
          {
            objection: "E se não atingir o volume projetado no ROI?",
            response: "Calculei cenário pessimista: mesmo com 30% menos volume, ROI em 24 meses. Além disso, equipamento permite oferecer novos exames (aumenta receita).",
            result: "Convencido"
          },
          {
            objection: "Preciso do aval do sócio",
            response: "Sugeri reunião com sócio. Agendamos para 22/11.",
            result: "Aceito"
          }
        ],
        techniques_used: ["Demonstração prática", "Solution Selling", "Consultive Selling"],
        triggers: ["Experiência direta", "Urgência (última unidade)", "Exclusividade"],
        interest_level: 9
      },
      {
        date: "22/11/2025",
        stage: "Reunião com Sócios",
        score: 73,
        status: "quente",
        action: "Reunião decisória (1h15min)",
        notes: "Apresentação formal para Dr. Roberto + sócio Dr. Marcelo. Foco em ROI, diferencial competitivo e expansão de serviços.",
        objections: [
          {
            objection: "Concorrente ofereceu preço 10% menor",
            response: "Comparei: nosso equipamento tem 40% mais velocidade, 3 anos garantia (vs 1 ano deles), suporte local 24/7. Custo real por exame é 15% menor a longo prazo.",
            result: "Sócio convencido, Dr. Roberto também"
          }
        ],
        techniques_used: ["Value Selling", "Análise competitiva", "TCO (Total Cost Ownership)"],
        triggers: ["Autoridade", "Compromisso/Consistência", "Escassez"],
        interest_level: 10
      },
      {
        date: "25/11/2025",
        stage: "Terceira Visita - Fechamento",
        score: 82,
        status: "quente",
        action: "Fechamento e assinatura (45min)",
        notes: "Cliente decidiu fechar. Assinatura de contrato. Equipamento entregue em 28/11. Pagamento: 36x Santander.",
        final_conditions: "R$ 75.000 (desconto de R$ 10k) + Kit reagentes extra (R$ 2.800) + Treinamento estendido 3 dias",
        closed: true
      }
    ],
    competitors_analysis: {
      region: "Consolação, São Paulo/SP",
      competitors: [
        { name: "VetClin Express", distance: "800m", equipment: "Mindray BC-3000", level: "Intermediário" },
        { name: "Pet Hospital São Paulo", distance: "1.2km", equipment: "Seamaty SD1", level: "Premium" },
        { name: "Clínica Vet+", distance: "1.5km", equipment: "Sem analisador próprio", level: "Básico" },
        { name: "Animal Care Center", distance: "2km", equipment: "Mindray BC-2800", level: "Intermediário" }
      ],
      market_gap: "40% das clínicas na região não possuem analisador hematológico próprio (terceirizam)",
      opportunity: "Alta demanda + renda média alta (R$ 7.200/capita) + densidade populacional 12.500 hab/km²"
    },
    financial_analysis: {
      investment: 75000,
      monthly_revenue_increase: 8500,
      monthly_costs: 3200,
      net_monthly: 5300,
      roi_months: 14,
      payback_date: "Janeiro/2027",
      projected_3y_profit: 190800
    }
  };

  // CASO 2: Análise Profunda - Dra. Marina
  const deepAnalysisCase = {
    name: "Análise Profunda - Perfil Executivo Premium",
    client: {
      name: "Dra. Marina Oliveira Campos",
      birthdate: "08/11/1980",
      clinic: "Hospital Veterinário Supremo",
      cnpj: "15.987.654/0001-22",
      city: "São Paulo",
      address: "Av. Brigadeiro Faria Lima, 3000 - Itaim Bibi",
      phone: "+55 11 99887-6655",
      email: "marina@hvsupermo.com.br",
      numerology: 8,
      profile: "EXECUTIVO - Focada em resultados, decisões rápidas baseadas em ROI"
    },
    current_situation: {
      business_age: "15 anos no mercado",
      team_size: "24 funcionários (8 veterinários, 16 equipe apoio)",
      monthly_exams: "450-520 exames/mês",
      current_equipment: "Mindray BC-3000 Plus (4 anos) + Bioquímico terceirizado",
      monthly_revenue: "R$ 280.000/mês",
      lab_revenue: "R$ 42.000/mês (15% do total)",
      pain_points: [
        "Gargalo no laboratório - fila de espera 4-6 horas",
        "Terceirização bioquímico custa R$ 8.500/mês (45% margem perdida)",
        "Clientes VIP migrando para concorrente com resultado rápido",
        "Equipamento atual quebrou 3x nos últimos 6 meses",
        "Perda de R$ 15.000/mês em oportunidades por lentidão"
      ],
      investment_capacity: "R$ 120.000 disponível imediato",
      urgency: "ALTA - Contrato grande empresa depende de lab ágil"
    },
    numerology_deep_dive: {
      life_path: 8,
      expression_number: 1,
      soul_urge: 9,
      personality: "Líder nata, ambiciosa, movida por conquistas. Toma decisões rápidas quando vê ROI claro. Valoriza poder, status e reconhecimento profissional.",
      best_approach: "Dados concretos + Cases de sucesso de grandes hospitais + Enfatizar vantagem competitiva + Demonstração de poder financeiro (ROI)",
      best_days: ["26/12/2025", "08/01/2026", "17/01/2026", "26/01/2026"],
      current_cycle: "Ano Pessoal 8 (Poder e Conquista) + Mês Pessoal 8 = MOMENTO PERFEITO PARA EXPANSÃO",
      motivational_phrase: "O sucesso não é um acidente. É trabalho duro, perseverança, aprendizado e sacrifício.",
      decision_triggers: ["ROI comprovado", "Diferencial competitivo", "Status/Prestígio", "Rapidez na decisão"],
      communication_style: "Direta, objetiva, sem rodeios. Detesta perder tempo. Quer números e fatos."
    },
    journey: [
      {
        date: "28/11/2025",
        stage: "Primeiro Contato - Networking Evento",
        score: 52,
        status: "morno",
        action: "Encontro em congresso veterinário (20min)",
        notes: "Conheci Dra. Marina em palestra sobre inovação laboratorial. Muito interessada em tecnologia. Trocamos cartões. Mencionou problemas com lab atual.",
        questions: [
          "Q: Seu hospital tem lab próprio?",
          "R: Sim, mas só hemograma. Bioquímico terceirizo por R$ 8.500/mês",
          "Q: Já pensou em internalizar?",
          "R: Sim, mas preciso ver números. Quanto custa? Quanto tempo retorno?"
        ],
        interest_level: 6
      },
      {
        date: "02/12/2025",
        stage: "Follow-up Estratégico",
        score: 48,
        status: "morno",
        action: "WhatsApp + Envio de case study (15min conversa)",
        notes: "Enviei case Hospital VetLife (similar porte). Ela leu em 8 minutos. Respondeu: 'Interessante, mas preciso ver ao vivo'. Score caiu pois não agendou visita imediata.",
        questions: [
          "Q: Esse case é real?",
          "R: Sim, posso te conectar com Dr. Fernando (dono)",
          "Q: ROI foi mesmo 12 meses?",
          "R: Sim, detalhado na simulação que enviei",
          "Q: Você tem equipamento para demonstração?",
          "R: Sim, posso levar no seu hospital"
        ],
        interest_level: 7
      },
      {
        date: "05/12/2025",
        stage: "Primeira Visita - Diagnóstico Profundo",
        score: 64,
        status: "quente",
        action: "Visita ao hospital (2h15min)",
        notes: "Visitei hospital. Estrutura premium, 6 salas consulta, 2 cirúrgicas, UTI. Lab pequeno e desorganizado. Equipamento antigo quebrando. Dra. Marina frustrada com situação. Fiz análise completa do fluxo.",
        objections: [
          {
            objection: "Investimento alto, preciso avaliar com contador",
            response: "Calculei na frente dela: custo terceirização R$ 8.500/mês x 12 = R$ 102k/ano. Equipamento novo: R$ 95k + R$ 3.200 reagentes/mês. Economia R$ 5.300/mês = ROI 15 meses. PLUS: pode cobrar mais caro por resultado rápido.",
            result: "Muito impressionada. Pediu simulação formal escrita."
          },
          {
            objection: "E se quebrar? Meu atual quebra direto",
            response: "Garantia 3 anos full (peças + mão de obra) + suporte local 24/7 + equipamento backup enquanto manutenção. Zero risco.",
            result: "Gostou. Perguntou sobre reputação da marca."
          },
          {
            objection: "Tenho contrato com laboratório terceirizado até março",
            response: "Perfeito! Podemos entregar em janeiro, treinar equipe em fevereiro, e você ativa em março quando contrato vence. Zero conflito.",
            result: "Aliviada. Barreira removida."
          }
        ],
        techniques_used: ["SPIN Selling", "Análise in loco", "Cálculo ROI ao vivo", "Value Selling"],
        triggers: ["Autoridade (cases)", "Prova Social", "Segurança (garantia)", "Timing perfeito"],
        interest_level: 8,
        key_moment: "Mostrei vídeo de análise sendo feita em 8 minutos. Ela disse: 'Isso muda tudo!'"
      },
      {
        date: "09/12/2025",
        stage: "Envio Proposta Premium",
        score: 71,
        status: "quente",
        action: "Proposta personalizada + Simulação financeira detalhada",
        notes: "Proposta 12 páginas com: análise atual vs futuro, ROI detalhado, comparativo concorrência, plano implantação, treinamento, garantias. Ela visualizou 3x (total 42min leitura). Baixou simulação Excel 2x.",
        questions: [
          "Q: Posso ajustar forma pagamento?",
          "R: Sim. Ofereci: à vista com 8% desconto OU 36x Santander sem juros",
          "Q: Treinamento está incluído?",
          "R: Sim, 5 dias completos no seu hospital + suporte remoto 60 dias",
          "Q: E se eu quiser módulo extra depois?",
          "R: Arquitetura modular. Adiciona quando quiser."
        ],
        interest_level: 8
      },
      {
        date: "12/12/2025",
        stage: "Segunda Visita - Demonstração Técnica VIP",
        score: 79,
        status: "quente",
        action: "Demonstração com equipamento real + Equipe técnica (3h)",
        notes: "Levei Seamaty SD1 + técnico especialista. Fizemos 15 análises reais de pacientes do hospital. Toda equipe testou. Dra. Marina cronometrou: 8min por análise completa vs 4-6h atual. Equipe empolgada. Ela já visualizando impacto.",
        objections: [
          {
            objection: "Minha equipe consegue operar isso? Parece complexo",
            response: "Interface touch intuitiva igual smartphone. Técnico treinou auxiliar júnior em 20 minutos - ela já operou sozinha. Mostrei vídeos de outros hospitais: técnicos dominam em 2 dias.",
            result: "Convencida após ver auxiliar operando"
          },
          {
            objection: "Preciso ver custo real por exame, não só teoria",
            response: "Calculamos juntos baseado no volume dela: R$ 11,50/exame completo (reagente + depreciação + manutenção). Ela cobra R$ 85/exame. Margem 86%. Atual: terceiriza por R$ 45, cobra R$ 75, margem 40%.",
            result: "Chocada com diferença. Disse: 'Dobra minha margem!'"
          },
          {
            objection: "Concorrente ofereceu equipamento mais barato",
            response: "Comparei specs técnicas lado a lado: nosso 60% mais rápido, interface melhor, garantia 3 anos vs 1 ano, suporte local vs telefone. Custo real por exame 22% menor no longo prazo.",
            result: "Aceitou que preço não é tudo"
          }
        ],
        techniques_used: ["Demonstração hands-on", "Proof of concept", "TCO (Total Cost)", "Consultive Selling"],
        triggers: ["Experiência real", "Prova tangível", "Comparação competitiva", "Empoderamento equipe"],
        interest_level: 9,
        key_moment: "Quando viu resultado em 8min, disse: 'Posso oferecer resultado urgente e cobrar premium!'"
      },
      {
        date: "16/12/2025",
        stage: "Follow-up - Negociação Final",
        score: 73,
        status: "quente",
        action: "Reunião com sócios + contador (1h40min)",
        notes: "Dra. Marina marcou reunião com 2 sócios + contador. Apresentei formalmente: business case, projeções 3 anos, análise risco. Contador validou números. Sócios aprovaram. MAS: pediram melhorar condições.",
        objections: [
          {
            objection: "Valor está no limite do orçamento. Consegue fechar em R$ 90k?",
            response: "Proposta: mantenho R$ 95k MAS incluo kit premium reagentes 6 meses (valor R$ 15k) + treinamento avançado gestão lab (valor R$ 5k). Total R$ 115k por R$ 95k. Mais vantajoso que desconto.",
            result: "Sócios adoraram. Mais valor por mesmo preço."
          },
          {
            objection: "Podemos começar em fevereiro? Janeiro está corrido",
            response: "Melhor ainda. Entrego em janeiro, instalo tranquilo sem pressa, fevereiro inteiro treinamento, março ativa 100%. Perfeito para substituir terceirizado sem risco.",
            result: "Todos concordaram. Timing ideal."
          },
          {
            objection: "E se não atingirmos volume projetado?",
            response: "Cenário pessimista: mesmo com 30% menos volume, ROI 22 meses. PLUS: equipamento permite oferecer pacotes check-up completo (aumenta ticket e volume).",
            result: "Contador aprovou. Risco controlado."
          }
        ],
        techniques_used: ["Negociação valor agregado", "Gestão de stakeholders", "Análise risco financeiro"],
        triggers: ["Compromisso/Consistência", "Prova Social (contador validou)", "Escassez (entrega janeiro)"],
        interest_level: 9,
        key_moment: "Contador disse: 'Faz sentido financeiramente'. Sócios balançaram cabeça afirmativamente."
      },
      {
        date: "19/12/2025",
        stage: "Terceira Visita - Fechamento Executivo",
        score: 87,
        status: "quente",
        action: "Fechamento oficial + Assinatura contrato (1h10min)",
        notes: "Reunião formal. Dra. Marina decidida. Assinou contrato. Pagamento: entrada R$ 15k + 36x R$ 2.500 Santander. Entrega agendada 15/01/2026. Instalação 20/01. Treinamento 27/01-31/01. Ativação 01/03.",
        final_conditions: "R$ 95.000 total + Kit reagentes 6 meses (R$ 15k) + Treinamento avançado (R$ 5k) = R$ 115k valor entregue",
        closed: true,
        celebration: "Dra. Marina disse: 'Isso vai transformar meu hospital. Obrigada pela paciência e profissionalismo.'"
      }
    ],
    competitors_analysis: {
      region: "Itaim Bibi / Faria Lima, São Paulo/SP",
      market_level: "PREMIUM - Renda altíssima",
      competitors: [
        { 
          name: "Pet Hospital Itaim", 
          distance: "400m", 
          equipment: "Seamaty SD1 + Catalyst (líder região)", 
          level: "Premium++",
          threat: "ALTO - Referência em diagnóstico rápido",
          price_position: "15-20% acima média mercado"
        },
        { 
          name: "VetCare Executive", 
          distance: "850m", 
          equipment: "Mindray BC-5000 + Bioquímico próprio", 
          level: "Premium",
          threat: "MÉDIO - Bom lab mas sem diferencial velocidade"
        },
        { 
          name: "Clínica Bicho Chic", 
          distance: "1.1km", 
          equipment: "Terceiriza 100%", 
          level: "Intermediário+",
          threat: "BAIXO - Atende público diferente"
        },
        { 
          name: "Hospital Vet Faria Lima", 
          distance: "1.4km", 
          equipment: "Mindray BC-3000 (igual cliente)", 
          level: "Premium",
          threat: "MÉDIO - Mesmo problema que cliente (lentidão)"
        }
      ],
      market_gap: "Apenas 1 concorrente premium tem lab rápido completo. Demanda reprimida altíssima por resultado urgente em região com poder aquisitivo premium.",
      opportunity: "Cliente corporativo grande (500+ pets) quer contrato com hospital que garanta resultado lab em <30min. Pet Hospital Itaim está saturado. Hospital Supremo pode pegar contrato se equipar.",
      competitive_advantage: "Com novo equipamento: 2º hospital premium com resultado rápido na região + pode cobrar 25% acima média + diferencial atendimento VIP empresarial"
    },
    regional_context: {
      neighborhood: "Itaim Bibi / Faria Lima",
      avg_income: "R$ 18.500/capita (top 2% São Paulo)",
      density: "15.200 hab/km²",
      pet_density: "1 pet a cada 2 habitantes (executivos solteiros/casais sem filhos)",
      corporate_presence: "120+ empresas grandes (potencial contratos corporativos)",
      nearby_events: [
        "Expo Pet Premium (Transamérica 15-17/01/2026)",
        "Summit Gestão Hospitais Vet (WTC 25/01/2026)",
        "Workshop Medicina Preventiva Corporativa (28/01/2026)"
      ],
      economic_indicators: {
        gdp_contribution: "3,2% PIB municipal",
        employment_rate: "97%",
        credit_availability: "Altíssima - 15 bancos com linhas empresariais",
        growth_trend: "+4,1% ao ano setor pet premium"
      },
      market_opportunity: "Região com maior concentração de pets de alto valor (raças puras, importados). Donos dispostos pagar premium por qualidade e velocidade. Contratos corporativos pet care em expansão (empresas oferecem benefício).",
      strategic_positioning: "Hospital Supremo pode se posicionar como referência diagnóstico rápido premium, atrair clientela corporativa de alta renda, e diferenciar de concorrência tradicional."
    },
    recommended_strategy: {
      equipment: "Seamaty SD1 Premium + Módulo Bioquímico Avançado + Hemogasometria",
      investment: "R$ 95.000 (equipamento) + R$ 15.000 (kit 6 meses) = R$ 110k",
      financing: "Entrada R$ 15k + 36x R$ 2.500 Santander (taxa 0,99%/mês)",
      bonus_included: [
        "Kit premium reagentes 6 meses (R$ 15.000)",
        "Treinamento avançado 5 dias + gestão lab (R$ 5.000)",
        "Suporte prioritário 90 dias",
        "Equipamento backup durante manutenções",
        "Consultoria implantação check-ups premium"
      ],
      value_proposition: "Transformar lab em centro de lucro + capturar contrato corporativo R$ 25k/mês + aumentar ticket médio 35% com resultados urgentes + eliminar terceirização (economia R$ 8.500/mês)",
      projected_results: {
        roi_months: 15,
        payback_date: "Março/2027",
        monthly_net_increase: 12800,
        year_1_profit: 89600,
        year_3_accumulated: 345600,
        corporate_contract_value: "R$ 300k/ano (se capturar)",
        margin_improvement: "40% → 86% em exames lab"
      },
      key_triggers: [
        "AUTORIDADE: Usado por Pet Hospital Itaim (líder premium)",
        "URGÊNCIA: Contrato corporativo depende de lab rápido",
        "ESCASSEZ: Única forma competir com líder mercado",
        "PROVA SOCIAL: Contador e sócios validaram",
        "RECIPROCIDADE: Bônus R$ 20k incluídos",
        "COMPROMISSO: Investiu tempo em 3 visitas, demonstração, reuniões"
      ],
      implementation_plan: {
        week_1: "Entrega equipamento (15/01) + Instalação (20/01)",
        week_2_3: "Treinamento intensivo equipe (27-31/01)",
        week_4: "Período teste paralelo com terceirizado",
        month_2: "Fevereiro inteiro refinamento + treinamento avançado",
        month_3: "01/03 - Ativação 100% + Fim contrato terceirizado",
        month_4: "Lançamento pacotes check-up premium",
        month_5: "Apresentação proposta contrato corporativo"
      }
    },
    scoring_breakdown: {
      base_score: 52,
      adjustments: [
        { factor: "Volume altíssimo (500+ exames/mês)", points: 20 },
        { factor: "Orçamento R$ 120k confirmado (aprovado sócios)", points: 25 },
        { factor: "Localização premium (Faria Lima)", points: 15 },
        { factor: "Ciclo numerológico 8+8 (poder máximo)", points: 10 },
        { factor: "Dor urgente crítica (perda clientes + contrato risco)", points: 18 },
        { factor: "Engajamento alto (3 visitas + 2h reuniões)", points: 12 },
        { factor: "Validação stakeholders (sócios + contador)", points: 8 }
      ],
      final_score: 87,
      status: "QUENTE (FECHAMENTO IMINENTE)",
      conversion_probability: "94%",
      recommended_action: "Manter pressão positiva, reforçar urgência contrato corporativo, facilitar processo assinatura, garantir suporte premium pós-venda para gerar case de sucesso e indicações.",
      success_factors: [
        "Perfil executivo 8 alinhado com abordagem direta e ROI",
        "Dor real e mensurável (R$ 15k/mês perdido)",
        "Timing perfeito (ciclo numerológico + contrato corporativo)",
        "Demonstração prática removeu dúvidas técnicas",
        "Validação financeira por contador (credibilidade)",
        "Proposta valor agregado melhor que desconto puro"
      ]
    },
    lessons_learned: {
      what_worked: [
        "Conhecer cliente em evento (networking warm)",
        "Análise in loco profunda na primeira visita",
        "Cálculo ROI ao vivo na frente dela (impacto visual)",
        "Demonstração hands-on com equipe real",
        "Envolver stakeholders cedo (sócios + contador)",
        "Proposta valor agregado vs desconto preço",
        "Paciência em 3 visitas sem pressionar fechamento",
        "Timing alinhado com ciclo numerológico (ela sentiu 'momento certo')"
      ],
      what_could_improve: [
        "Poderia ter identificado oportunidade contrato corporativo mais cedo",
        "Primeira proposta poderia incluir bônus já (economizaria 1 iteração)"
      ],
      key_insight: "Cliente perfil 8 (Executivo) decide rápido quando vê ROI claro + validação de terceiros confiáveis (contador). Investir tempo em relacionamento e demonstração prática vale mais que pressão por fechamento rápido."
    }
  };

  // CASO 3: CNPJ Real - São Paulo
  const realCase = {
    name: "Análise Completa - Cliente Real São Paulo",
    client: {
      name: "Dra. Patricia Ferreira Costa",
      birthdate: "10/05/1982",
      clinic: "Centro Veterinário Jardins",
      cnpj: "12.345.678/0001-90",
      city: "São Paulo",
      address: "Alameda Santos, 2500 - Jardim Paulista",
      phone: "+55 11 98765-4321",
      email: "patricia@vetjardins.com.br",
      numerology: 3,
      profile: "COMUNICADORA - Entusiasta, valoriza relacionamento e novidades"
    },
    current_situation: {
      business_age: "12 anos no mercado",
      team_size: "18 funcionários",
      monthly_exams: "280-320 exames/mês",
      current_equipment: "Mindray BC-2800 (7 anos de uso)",
      pain_points: [
        "Equipamento lento (gargalo no atendimento)",
        "Manutenção cara (R$ 1.200/mês)",
        "Terceiriza 50% bioquímicos (perda de margem)",
        "Clientes reclamam de demora em resultados"
      ]
    },
    numerology_deep_dive: {
      life_path: 3,
      expression_number: 8,
      soul_urge: 5,
      personality: "Comunicadora nata, decisões emocionais mas com foco em resultado",
      best_approach: "Entusiasmo + Cases inspiradores + Demonstração visual",
      best_days: ["17/12/2025", "26/12/2025", "08/01/2026"],
      current_cycle: "Ano Pessoal 5 (Mudanças e Expansão) - MOMENTO IDEAL PARA INVESTIMENTOS",
      motivational_phrase: "A excelência não é um ato, mas um hábito repetido"
    },
    regional_context: {
      neighborhood: "Jardim Paulista",
      avg_income: "R$ 12.500/capita",
      density: "18.300 hab/km²",
      pet_density: "1 pet a cada 2.5 habitantes (ALTÍSSIMO)",
      nearby_events: [
        "Congresso Pet South America (15-17/01/2026)",
        "Workshop Diagnóstico Laboratorial Vet (22/01/2026)"
      ],
      competitors: [
        { name: "Hospital Vet Paulista", distance: "600m", equipment: "Seamaty SD1 + Catalyst", level: "Premium" },
        { name: "PetCare Jardins", distance: "900m", equipment: "Mindray BC-3000", level: "Intermediário" },
        { name: "Clínica Bicho Saudável", distance: "1.1km", equipment: "Terceiriza 100%", level: "Básico" }
      ],
      competitive_advantage: "Localização premium + clientela de alto poder aquisitivo + necessidade de serviço rápido",
      market_opportunity: "Bairro com maior concentração de pets de SP, clientes dispostos a pagar por qualidade e velocidade"
    },
    recommended_strategy: {
      equipment: "Seamaty SD1 + Módulo Bioquímico",
      investment: "R$ 92.000",
      financing: "36x Santander (R$ 3.200/mês)",
      bonus: "Kit premium reagentes 6 meses + Treinamento avançado",
      value_proposition: "Reduzir tempo resultado de 24h para 15min + aumentar margem lab 70% + diferencial competitivo",
      projected_roi: "12-14 meses",
      key_triggers: ["Prova Social (cases JD Paulista)", "Urgência (expansão concorrência)", "Autoridade (referência mercado)"]
    },
    scoring_breakdown: {
      base_score: 45,
      adjustments: [
        { factor: "Volume alto (300+ exames/mês)", points: 18 },
        { factor: "Orçamento confirmado R$ 90k", points: 23 },
        { factor: "Localização premium", points: 12 },
        { factor: "Ciclo numerológico favorável", points: 8 },
        { factor: "Dor urgente (gargalo atendimento)", points: 15 }
      ],
      final_score: 76,
      status: "QUENTE",
      conversion_probability: "84%",
      recommended_action: "Agendar demonstração presencial esta semana + proposta personalizada com ROI detalhado"
    }
  };

  const generatePDF = (caseData) => {
    setGenerating(true);
    
    try {
      const doc = new jsPDF();
      let yPos = 20;
      const lineHeight = 7;
      const margin = 15;
      const pageHeight = 280;

      // Helper para adicionar nova página se necessário
      const checkPageBreak = () => {
        if (yPos > pageHeight) {
          doc.addPage();
          yPos = 20;
        }
      };

      // Título
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(caseData.name, margin, yPos);
      yPos += 12;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPos);
      yPos += 10;

      // Dados do Cliente
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('DADOS DO CLIENTE', margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Nome: ${caseData.client.name}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Clínica: ${caseData.client.clinic}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`CNPJ: ${caseData.client.cnpj}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Cidade: ${caseData.client.city}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Endereço: ${caseData.client.address}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`WhatsApp: ${caseData.client.phone}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Email: ${caseData.client.email}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Perfil Numerológico: ${caseData.client.numerology} - ${caseData.client.profile}`, margin, yPos);
      yPos += 10;

      checkPageBreak();

      // Jornada do Cliente (se for caso teste)
      if (caseData.journey) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('JORNADA COMPLETA DO CLIENTE', margin, yPos);
        yPos += 10;

        caseData.journey.forEach((step, idx) => {
          checkPageBreak();

          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text(`${idx + 1}. ${step.stage} - ${step.date}`, margin, yPos);
          yPos += lineHeight;

          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.text(`Score: ${step.score}/100 | Status: ${step.status.toUpperCase()}`, margin + 5, yPos);
          yPos += lineHeight;
          doc.text(`Ação: ${step.action}`, margin + 5, yPos);
          yPos += lineHeight;
          
          const notesLines = doc.splitTextToSize(step.notes, 180);
          notesLines.forEach(line => {
            checkPageBreak();
            doc.text(line, margin + 5, yPos);
            yPos += lineHeight;
          });

          if (step.questions && step.questions.length > 0) {
            yPos += 3;
            doc.setFont(undefined, 'bold');
            doc.text('Perguntas e Respostas:', margin + 5, yPos);
            yPos += lineHeight;
            doc.setFont(undefined, 'normal');
            
            step.questions.forEach(q => {
              checkPageBreak();
              const qLines = doc.splitTextToSize(q, 175);
              qLines.forEach(line => {
                doc.text(line, margin + 10, yPos);
                yPos += lineHeight;
              });
            });
          }

          if (step.objections && step.objections.length > 0) {
            yPos += 3;
            doc.setFont(undefined, 'bold');
            doc.text('Objeções Tratadas:', margin + 5, yPos);
            yPos += lineHeight;
            doc.setFont(undefined, 'normal');
            
            step.objections.forEach((obj, objIdx) => {
              checkPageBreak();
              doc.text(`Objeção ${objIdx + 1}: ${obj.objection}`, margin + 10, yPos);
              yPos += lineHeight;
              const respLines = doc.splitTextToSize(`Resposta: ${obj.response}`, 170);
              respLines.forEach(line => {
                checkPageBreak();
                doc.text(line, margin + 10, yPos);
                yPos += lineHeight;
              });
              doc.text(`Resultado: ${obj.result}`, margin + 10, yPos);
              yPos += lineHeight + 2;
            });
          }

          if (step.techniques_used) {
            doc.text(`Técnicas: ${step.techniques_used.join(', ')}`, margin + 5, yPos);
            yPos += lineHeight;
          }

          if (step.interest_level) {
            doc.text(`Nível de Interesse: ${step.interest_level}/10`, margin + 5, yPos);
            yPos += lineHeight;
          }

          yPos += 5;
        });

        // Análise de Concorrentes
        checkPageBreak();
        doc.addPage();
        yPos = 20;

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('ANÁLISE DE CONCORRENTES', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Região: ${caseData.competitors_analysis.region}`, margin, yPos);
        yPos += lineHeight + 2;

        doc.setFont(undefined, 'bold');
        doc.text('Concorrentes Identificados:', margin, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');

        caseData.competitors_analysis.competitors.forEach((comp, idx) => {
          doc.text(`${idx + 1}. ${comp.name} - ${comp.distance}`, margin + 5, yPos);
          yPos += lineHeight;
          doc.text(`   Equipamento: ${comp.equipment} | Nível: ${comp.level}`, margin + 5, yPos);
          yPos += lineHeight + 2;
        });

        yPos += 3;
        doc.setFont(undefined, 'bold');
        doc.text('GAP de Mercado:', margin, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        const gapLines = doc.splitTextToSize(caseData.competitors_analysis.market_gap, 180);
        gapLines.forEach(line => {
          doc.text(line, margin + 5, yPos);
          yPos += lineHeight;
        });

        yPos += 3;
        doc.setFont(undefined, 'bold');
        doc.text('Oportunidade:', margin, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        const oppLines = doc.splitTextToSize(caseData.competitors_analysis.opportunity, 180);
        oppLines.forEach(line => {
          doc.text(line, margin + 5, yPos);
          yPos += lineHeight;
        });

        // Análise Financeira
        yPos += 10;
        checkPageBreak();

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('ANÁLISE FINANCEIRA E ROI', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Investimento Total: R$ ${caseData.financial_analysis.investment.toLocaleString('pt-BR')}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Aumento Receita Mensal: R$ ${caseData.financial_analysis.monthly_revenue_increase.toLocaleString('pt-BR')}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Custos Mensais: R$ ${caseData.financial_analysis.monthly_costs.toLocaleString('pt-BR')}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Lucro Líquido Mensal: R$ ${caseData.financial_analysis.net_monthly.toLocaleString('pt-BR')}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`ROI: ${caseData.financial_analysis.roi_months} meses`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Payback: ${caseData.financial_analysis.payback_date}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Projeção Lucro 3 anos: R$ ${caseData.financial_analysis.projected_3y_profit.toLocaleString('pt-BR')}`, margin, yPos);
        yPos += 15;

        // Evolução do Score (gráfico textual)
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('EVOLUÇÃO DO SCORE AO LONGO DO TEMPO', margin, yPos);
        yPos += 10;

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        caseData.journey.forEach((step) => {
          const barLength = (step.score / 100) * 150;
          doc.rect(margin, yPos - 4, barLength, 5, 'F');
          doc.text(`${step.date}: ${step.score}/100 (${step.status})`, margin + 155, yPos);
          yPos += 8;
        });
      }

      // Caso Real (análise profunda)
      if (caseData.current_situation) {
        doc.addPage();
        yPos = 20;

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('SITUAÇÃO ATUAL DO NEGÓCIO', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Tempo de Mercado: ${caseData.current_situation.business_age}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Tamanho da Equipe: ${caseData.current_situation.team_size}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Volume Mensal: ${caseData.current_situation.monthly_exams}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Equipamento Atual: ${caseData.current_situation.current_equipment}`, margin, yPos);
        yPos += 10;

        doc.setFont(undefined, 'bold');
        doc.text('Principais Dores:', margin, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        
        caseData.current_situation.pain_points.forEach((pain, idx) => {
          doc.text(`${idx + 1}. ${pain}`, margin + 5, yPos);
          yPos += lineHeight;
        });

        yPos += 10;
        checkPageBreak();

        // Análise Numerológica Profunda
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('ANÁLISE NUMEROLÓGICA PROFUNDA', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Caminho de Vida: ${caseData.numerology_deep_dive.life_path}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Número de Expressão: ${caseData.numerology_deep_dive.expression_number}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Desejo da Alma: ${caseData.numerology_deep_dive.soul_urge}`, margin, yPos);
        yPos += lineHeight + 3;
        
        const persLines = doc.splitTextToSize(`Personalidade: ${caseData.numerology_deep_dive.personality}`, 180);
        persLines.forEach(line => {
          doc.text(line, margin, yPos);
          yPos += lineHeight;
        });
        
        yPos += 3;
        const approachLines = doc.splitTextToSize(`Melhor Abordagem: ${caseData.numerology_deep_dive.best_approach}`, 180);
        approachLines.forEach(line => {
          doc.text(line, margin, yPos);
          yPos += lineHeight;
        });

        yPos += 3;
        doc.text(`Melhores Dias: ${caseData.numerology_deep_dive.best_days.join(', ')}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Ciclo Atual: ${caseData.numerology_deep_dive.current_cycle}`, margin, yPos);
        yPos += lineHeight + 3;
        doc.setFont(undefined, 'italic');
        doc.text(`"${caseData.numerology_deep_dive.motivational_phrase}"`, margin, yPos);
        yPos += 15;

        checkPageBreak();

        // Contexto Regional
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('CONTEXTO REGIONAL E COMPETITIVO', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Bairro: ${caseData.regional_context.neighborhood}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Renda Média: ${caseData.regional_context.avg_income}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Densidade: ${caseData.regional_context.density}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Pets por Habitante: ${caseData.regional_context.pet_density}`, margin, yPos);
        yPos += 10;

        doc.setFont(undefined, 'bold');
        doc.text('Eventos Próximos:', margin, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        caseData.regional_context.nearby_events.forEach((event, idx) => {
          doc.text(`${idx + 1}. ${event}`, margin + 5, yPos);
          yPos += lineHeight;
        });

        yPos += 5;
        doc.setFont(undefined, 'bold');
        doc.text('Concorrentes na Região:', margin, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        caseData.regional_context.competitors.forEach((comp, idx) => {
          checkPageBreak();
          doc.text(`${idx + 1}. ${comp.name} - ${comp.distance}`, margin + 5, yPos);
          yPos += lineHeight;
          doc.text(`   Equipamento: ${comp.equipment} | Nível: ${comp.level}`, margin + 5, yPos);
          yPos += lineHeight + 2;
        });

        yPos += 5;
        checkPageBreak();
        
        doc.setFont(undefined, 'bold');
        doc.text('Vantagem Competitiva:', margin, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        const advLines = doc.splitTextToSize(caseData.regional_context.competitive_advantage, 180);
        advLines.forEach(line => {
          doc.text(line, margin, yPos);
          yPos += lineHeight;
        });

        yPos += 5;
        doc.setFont(undefined, 'bold');
        doc.text('Oportunidade de Mercado:', margin, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        const oppLines = doc.splitTextToSize(caseData.regional_context.market_opportunity, 180);
        oppLines.forEach(line => {
          doc.text(line, margin, yPos);
          yPos += lineHeight;
        });

        // Estratégia Recomendada
        doc.addPage();
        yPos = 20;

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('ESTRATÉGIA RECOMENDADA', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Equipamento: ${caseData.recommended_strategy.equipment}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Investimento: ${caseData.recommended_strategy.investment}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Financiamento: ${caseData.recommended_strategy.financing}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Bônus: ${caseData.recommended_strategy.bonus}`, margin, yPos);
        yPos += lineHeight + 3;
        
        const valueLines = doc.splitTextToSize(`Proposta de Valor: ${caseData.recommended_strategy.value_proposition}`, 180);
        valueLines.forEach(line => {
          doc.text(line, margin, yPos);
          yPos += lineHeight;
        });

        yPos += 3;
        doc.text(`ROI Projetado: ${caseData.recommended_strategy.projected_roi}`, margin, yPos);
        yPos += lineHeight + 5;

        doc.setFont(undefined, 'bold');
        doc.text('Gatilhos-Chave:', margin, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        caseData.recommended_strategy.key_triggers.forEach((trigger, idx) => {
          doc.text(`${idx + 1}. ${trigger}`, margin + 5, yPos);
          yPos += lineHeight;
        });

        yPos += 10;

        // Breakdown do Score
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('ANÁLISE DE SCORE DETALHADA', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Score Base: ${caseData.scoring_breakdown.base_score}/100`, margin, yPos);
        yPos += lineHeight + 3;

        doc.setFont(undefined, 'bold');
        doc.text('Ajustes:', margin, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');

        caseData.scoring_breakdown.adjustments.forEach((adj) => {
          doc.text(`+ ${adj.points} pontos: ${adj.factor}`, margin + 5, yPos);
          yPos += lineHeight;
        });

        yPos += 5;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`SCORE FINAL: ${caseData.scoring_breakdown.final_score}/100`, margin, yPos);
        yPos += lineHeight;
        doc.text(`STATUS: ${caseData.scoring_breakdown.status}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Probabilidade Conversão: ${caseData.scoring_breakdown.conversion_probability}`, margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Ação Recomendada:', margin, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        const actionLines = doc.splitTextToSize(caseData.scoring_breakdown.recommended_action, 180);
        actionLines.forEach(line => {
          doc.text(line, margin, yPos);
          yPos += lineHeight;
        });
      }

      // Salvar PDF
      const fileName = `${caseData.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Relatórios Completos de Caso</h3>
          <p className="text-xs text-slate-600">Jornada, objeções, concorrentes e análise estatística</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-3 border border-green-200 mb-3">
        <p className="text-xs text-slate-700 mb-2 font-semibold">
          📊 Incluído nos relatórios:
        </p>
        <ul className="text-[10px] text-slate-600 space-y-1">
          <li>✓ Dados completos do cliente</li>
          <li>✓ Jornada desde primeira visita até fechamento</li>
          <li>✓ 3 visitações com perguntas e objeções tratadas</li>
          <li>✓ Análise de concorrentes da região</li>
          <li>✓ Evolução do score ao longo do tempo</li>
          <li>✓ Análise numerológica profunda</li>
          <li>✓ ROI e análise financeira</li>
          <li>✓ Estratégia recomendada</li>
        </ul>
      </div>

      <div className="space-y-2">
        <Button
          onClick={() => generatePDF(testCase)}
          disabled={generating}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          {generating ? 'Gerando...' : 'Gerar PDF - Teste Único'}
        </Button>

        <Button
          onClick={() => generatePDF(deepAnalysisCase)}
          disabled={generating}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          <FileText className="w-4 h-4 mr-2" />
          {generating ? 'Gerando...' : 'Gerar PDF - Dra. Marina (Perfil 8)'}
        </Button>

        <Button
          onClick={() => generatePDF(realCase)}
          disabled={generating}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          {generating ? 'Gerando...' : 'Gerar PDF - Cliente Real SP'}
        </Button>
      </div>

      <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
        <p className="text-[10px] text-green-700 leading-relaxed">
          💡 <strong>Teste Único:</strong> Cliente frio → morno → frio → quente → fechado (jornada completa)<br/>
          💡 <strong>Dra. Marina:</strong> Perfil 8 Executivo, 3 visitas, objeções detalhadas, fechamento R$ 95k<br/>
          💡 <strong>Cliente Real SP:</strong> Análise profunda CNPJ real Jardim Paulista com contexto regional
        </p>
      </div>
    </Card>
  );
}