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

  // CASO 2: CNPJ Real - São Paulo
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
          💡 <strong>Cliente Real SP:</strong> Análise profunda CNPJ real Jardim Paulista com contexto regional
        </p>
      </div>
    </Card>
  );
}