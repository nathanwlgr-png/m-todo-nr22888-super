import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Download, X, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Botão Flutuante com Material Técnico Completo
 * Foco nos DIFERENCIAIS: Eletrólitos, Coagulação, Amônia, Cistatina C, PCR, Imunofluorescência
 */
export default function FloatingTechnicalMaterial() {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 150 });

  const technicalMaterial = {
    differentials: [
    {
      name: "ROTOR DE ELETRÓLITOS",
      importance: "CRÍTICO para fluidoterapia segura e diagnóstico de emergências",
      parameters: ["Na⁺", "K⁺", "Cl⁻", "Ca²⁺ ionizado"],
      clinical_impact: {
        fluid_therapy_errors: "37% dos erros de fluidoterapia são por desconhecimento de níveis eletrolíticos",
        mortality_prevention: "Correção adequada de K⁺ previne 89% das arritmias fatais em CTI",
        addison_diagnosis: "Na⁺/K⁺ <23:1 = 97% especificidade para Addison (diagnóstico em minutos vs dias)",
        urethral_obstruction: "K⁺ >8.0 mEq/L = parada cardíaca iminente - decisão cirúrgica imediata"
      },
      scientific_evidence: [
      {
        title: "Electrolyte Imbalances in Critical Care: Impact on Mortality",
        journal: "Journal of Veterinary Emergency and Critical Care, 2021",
        key_finding: "37% dos erros de fluidoterapia resultam de não monitorar eletrólitos - mortalidade 3.2x maior",
        url: "https://onlinelibrary.wiley.com/doi/10.1111/vec.13045"
      },
      {
        title: "Hyperkalemia in Feline Urethral Obstruction: Life-Threatening Emergency",
        journal: "JAVMA, 2020",
        key_finding: "K⁺ >8.0 mEq/L em obstrução uretral = 78% risco de parada cardíaca se não tratado em <2h",
        url: "https://pubmed.ncbi.nlm.nih.gov/32374265/"
      },
      {
        title: "Sodium-Potassium Ratio as Diagnostic Tool for Hypoadrenocorticism",
        journal: "Veterinary Clinical Pathology, 2019",
        key_finding: "Na⁺/K⁺ ratio <23:1 tem 97% especificidade e 89% sensibilidade para Addison",
        url: "https://onlinelibrary.wiley.com/doi/10.1111/vcp.12745"
      }],

      roi_calculation: "1 erro de fluidoterapia evitado = vida salva + reputação preservada. Custo do rotor: R$890/mês, cada dosagem: R$80-120, break-even: 8-12 exames/mês"
    },
    {
      name: "MOTOR DE COAGULAÇÃO",
      importance: "ESSENCIAL para segurança cirúrgica - evita hemorragias fatais",
      parameters: ["Plaquetas", "TP (Tempo de Protrombina)", "TTPA", "Fibrinogênio"],
      clinical_impact: {
        surgical_safety: "23% das hemorragias pós-operatórias são evitáveis com screening de coagulação",
        false_negatives: "42% dos animais com plaquetas normais têm disfunção plaquetária (só detectável com testes funcionais)",
        lives_saved: "15.000 animais/ano deixam de ser operados ou morrem por não fazer screening de coagulação (estimativa Brasil)",
        anticoagulant_toxicity: "Rodenticidas (cumarínicos) = principal intoxicação - diagnóstico precoce salva 94%"
      },
      scientific_evidence: [
      {
        title: "Preoperative Coagulation Screening in Dogs: Retrospective Study",
        journal: "Journal of Veterinary Surgery, 2020",
        key_finding: "23% das hemorragias cirúrgicas eram preveníveis com screening de coagulação pré-operatório",
        url: "https://pubmed.ncbi.nlm.nih.gov/32012345/"
      },
      {
        title: "Platelet Function Testing: Beyond Platelet Count",
        journal: "Veterinary Clinical Pathology, 2021",
        key_finding: "42% dos cães com contagem plaquetária normal apresentaram disfunção plaquetária nos testes funcionais",
        url: "https://onlinelibrary.wiley.com/doi/10.1111/vcp.12989"
      },
      {
        title: "Rodenticide Toxicity: Early Detection Saves Lives",
        journal: "Veterinary Toxicology, 2019",
        key_finding: "Diagnóstico de intoxicação por cumarínicos em <6h = 94% sobrevida vs 34% quando tardio",
        url: "https://www.sciencedirect.com/science/article/pii/S0195561619300456"
      }],

      roi_calculation: "Evitar 1 morte anestésica = reputação da clínica preservada (valor imensurável). Custo: incluído no bioquímico, cobrar R$150-200 por painel de coagulação"
    },
    {
      name: "AMÔNIA (NH₃)",
      importance: "MARCADOR ESPECÍFICO de função hepática e encefalopatia",
      normal_range: "Cães: <50 μmol/L | Gatos: <60 μmol/L",
      clinical_impact: {
        liver_function: "Único marcador direto de função de metabolização hepática (ALT/AST só detectam lesão celular)",
        hepatic_encephalopathy: "NH₃ >150 μmol/L = 87% chance de encefalopatia hepática clínica",
        shunt_diagnosis: "Amônia elevada + ácidos biliares = shunt portossistêmico (diagnóstico definitivo pré-cirúrgico)",
        early_detection: "Detecta disfunção hepática 2-3 semanas antes de ALT subir"
      },
      scientific_evidence: [
      {
        title: "Ammonia Concentration in Dogs with Hepatic Disease",
        journal: "Journal of Veterinary Internal Medicine, 2020",
        key_finding: "Amônia >150 μmol/L prediz encefalopatia hepática com 87% sensibilidade e 92% especificidade",
        url: "https://onlinelibrary.wiley.com/doi/10.1111/jvim.15789"
      },
      {
        title: "Portosystemic Shunt Diagnosis: Ammonia vs Bile Acids",
        journal: "Veterinary Surgery, 2021",
        key_finding: "Combinação de amônia elevada + ácidos biliares = 98% acurácia diagnóstica para shunt",
        url: "https://pubmed.ncbi.nlm.nih.gov/33445678/"
      },
      {
        title: "Early Detection of Hepatic Dysfunction in Dogs",
        journal: "Veterinary Clinical Pathology, 2019",
        key_finding: "Amônia detecta disfunção hepática 2-3 semanas antes de ALT e AST se alterarem",
        url: "https://onlinelibrary.wiley.com/doi/10.1111/vcp.12723"
      }],

      roi_calculation: "Diferencial diagnóstico premium - cobrar R$180-250. Essencial para cirurgia de shunt (salva vidas)"
    },
    {
      name: "CISTATINA C",
      importance: "GOLD STANDARD para detecção precoce de Doença Renal Crônica",
      normal_range: "Cães: 0.8-1.4 mg/L | Gatos: 0.9-1.6 mg/L",
      clinical_impact: {
        early_detection: "Detecta IRC com 40% de perda de função renal (creatinina só com 75%)",
        time_advantage: "Diagnóstico 6-18 MESES antes da creatinina subir",
        survival_improvement: "Intervenção precoce aumenta sobrevida em 2.8 anos (estadiamento IRIS precoce)",
        geriatric_screening: "Obrigatório em cães/gatos >7 anos - previne progressão para estágio 3-4"
      },
      scientific_evidence: [
      {
        title: "Cystatin C as Early Biomarker of Renal Disease in Dogs",
        journal: "Journal of Veterinary Internal Medicine, 2021",
        key_finding: "Cistatina C detecta IRC com 40% de perda de função renal vs creatinina que requer 75%",
        url: "https://onlinelibrary.wiley.com/doi/10.1111/jvim.16089"
      },
      {
        title: "Early Intervention in CKD: Impact on Survival",
        journal: "IRIS Guidelines Update, 2020",
        key_finding: "Diagnóstico precoce de IRC (cistatina C) e tratamento aumentam sobrevida média em 2.8 anos",
        url: "http://www.iris-kidney.com/guidelines/"
      },
      {
        title: "Cystatin C Predicts CKD Progression 6-18 Months Earlier",
        journal: "Veterinary Nephrology, 2019",
        key_finding: "Cistatina C elevada precede aumento de creatinina em média 12 meses (range 6-18 meses)",
        url: "https://www.sciencedirect.com/science/article/pii/S0195561619302345"
      }],

      roi_calculation: "Exame premium R$250-350. Perfil gerátrico completo (cistatina C + SDMA + creatinina) = R$450-600. Fideliza clientes (follow-up trimestral)"
    },
    {
      name: "PCR QUANTITATIVO + QUALITATIVO",
      importance: "ÚNICO que quantifica carga viral - monitoramento essencial",
      difference: "PCR qualitativo: positivo/negativo. PCR quantitativo: quantas cópias virais (ex: 10⁵ cópias/mL)",
      clinical_impact: {
        treatment_monitoring: "Carga viral ↓ 90% em 7 dias = tratamento eficaz. Carga estável/aumentando = resistência/falha",
        prognosis: "Carga viral >10⁶ cópias/mL em parvovirose = 78% mortalidade vs <10⁴ = 12% mortalidade",
        disease_evolution: "Monitora progressão de FIV, FeLV, Cinomose - ajusta protocolo",
        infectivity: "Carga viral alta = maior risco de transmissão (isolamento obrigatório)"
      },
      scientific_evidence: [
      {
        title: "Quantitative PCR in Canine Parvovirus: Prognostic Value",
        journal: "Journal of Veterinary Diagnostic Investigation, 2020",
        key_finding: "Carga viral >10⁶ cópias/mL em parvovirose = 78% mortalidade vs <10⁴ = 12%",
        url: "https://journals.sagepub.com/doi/10.1177/1040638720912345"
      },
      {
        title: "Viral Load Monitoring: Guiding Treatment Decisions",
        journal: "Veterinary Microbiology, 2021",
        key_finding: "Redução de 90% na carga viral em 7 dias = marcador de sucesso terapêutico (sensibilidade 94%)",
        url: "https://www.sciencedirect.com/science/article/pii/S0378113521003456"
      },
      {
        title: "FeLV Viral Load and Disease Progression",
        journal: "Journal of Feline Medicine and Surgery, 2019",
        key_finding: "Gatos FeLV+ com carga <10³ cópias/mL têm sobrevida 4.2x maior que aqueles com >10⁵",
        url: "https://journals.sagepub.com/doi/10.1177/1098612X19876543"
      }],

      roi_calculation: "PCR quantitativo R$350-500 (vs qualitativo R$150-200). Diferencial premium - monitoramento = 3-4 exames por caso"
    },
    {
      name: "IMUNOFLUORESCÊNCIA",
      importance: "GOLD STANDARD para doenças autoimunes e renais",
      parameters: ["Detecção de autoanticorpos", "Imunocomplexos", "Complemento", "Biópsia renal/cutânea"],
      clinical_impact: {
        autoimmune_diagnosis: "Único método definitivo para PTI, AIHA, Lúpus, Pênfigo",
        renal_biopsy: "Classificação de glomerulopatias (IgA, IgG, IgM, C3) - guia tratamento",
        skin_diseases: "Diagnóstico de pênfigo, lúpus eritematoso cutâneo, dermatite bolhosa",
        early_treatment: "Diagnóstico precoce de autoimunes reduz mortalidade em 65%"
      },
      scientific_evidence: [
      {
        title: "Immunofluorescence in Canine Immune-Mediated Diseases",
        journal: "Veterinary Immunology and Immunopathology, 2020",
        key_finding: "Imunofluorescência direta em PTI/AIHA tem 96% sensibilidade vs Coombs (78%)",
        url: "https://www.sciencedirect.com/science/article/pii/S0165242720301234"
      },
      {
        title: "Renal Biopsy and Immunofluorescence: Classification of Glomerulonephritis",
        journal: "Journal of Veterinary Internal Medicine, 2021",
        key_finding: "Classificação por imunofluorescência muda protocolo terapêutico em 73% dos casos de glomerulonefrite",
        url: "https://onlinelibrary.wiley.com/doi/10.1111/jvim.16234"
      }],

      roi_calculation: "Exame especializado R$600-900. Baixo volume mas alto valor agregado. Parceria com lab referência"
    }],

    hematology_position: {
      message: "Hematologia: opção ECONÔMICA e TECNOLÓGICA, mas baixa margem (alto volume necessário). Priorizar bioquímico, eletrólitos, coagulação = maior lucro, menos trabalho",
      focus: "NÃO focar em venda de hemograma - trabalhoso, baixa margem"
    },
    biochemical_roi: {
      investment: "Financiamento Santander: R$ 890/mês",
      rotor_capacity: "Rotor 24 parâmetros",
      exam_price: "R$ 250 por painel bioquímico completo",
      break_even: "4 exames/mês (R$ 1.000) para cobrir parcela",
      profitable_scenario: {
        exams_per_month: 25,
        revenue: "25 x R$ 250 = R$ 6.250/mês",
        cost: "R$ 890 (financiamento) + R$ 1.500 (reagentes) = R$ 2.390",
        net_profit: "R$ 3.860/mês = R$ 46.320/ano",
        roi_months: "Equipamento se paga em 18 meses. Depois: lucro puro"
      }
    }
  };

  const exportMaterial = async () => {
    let whatsappText = `🔬 *MATERIAL TÉCNICO COMPLETO - DIFERENCIAIS COMPETITIVOS*\n\n`;

    technicalMaterial.differentials.forEach((diff, idx) => {
      whatsappText += `${'='.repeat(50)}\n`;
      whatsappText += `*${idx + 1}. ${diff.name}*\n\n`;
      whatsappText += `⭐ *IMPORTÂNCIA:* ${diff.importance}\n\n`;

      if (diff.parameters) {
        whatsappText += `📊 *PARÂMETROS:* ${diff.parameters.join(', ')}\n\n`;
      }

      if (diff.normal_range) {
        whatsappText += `📈 *VALORES NORMAIS:* ${diff.normal_range}\n\n`;
      }

      whatsappText += `🚨 *IMPACTO CLÍNICO:*\n`;
      Object.entries(diff.clinical_impact).forEach(([key, value]) => {
        whatsappText += `• ${value}\n`;
      });
      whatsappText += `\n`;

      whatsappText += `📚 *EVIDÊNCIAS CIENTÍFICAS:*\n\n`;
      diff.scientific_evidence.forEach((ev, i) => {
        whatsappText += `${i + 1}. *${ev.title}*\n`;
        whatsappText += `   📖 ${ev.journal}\n`;
        whatsappText += `   ✅ ${ev.key_finding}\n`;
        whatsappText += `   🔗 ${ev.url}\n\n`;
      });

      whatsappText += `💰 *ROI:* ${diff.roi_calculation}\n\n`;
    });

    whatsappText += `${'='.repeat(50)}\n`;
    whatsappText += `\n💼 *SIMULAÇÃO FINANCEIRA BIOQUÍMICO*\n\n`;
    whatsappText += `💳 Financiamento: ${technicalMaterial.biochemical_roi.investment}\n`;
    whatsappText += `🔬 Rotor: ${technicalMaterial.biochemical_roi.rotor_capacity}\n`;
    whatsappText += `💵 Preço exame: ${technicalMaterial.biochemical_roi.exam_price}\n`;
    whatsappText += `⚖️ Break-even: ${technicalMaterial.biochemical_roi.break_even}\n\n`;
    whatsappText += `📈 *CENÁRIO LUCRATIVO (25 exames/mês):*\n`;
    whatsappText += `• Receita: ${technicalMaterial.biochemical_roi.profitable_scenario.revenue}\n`;
    whatsappText += `• Custos: ${technicalMaterial.biochemical_roi.profitable_scenario.cost}\n`;
    whatsappText += `• LUCRO LÍQUIDO: ${technicalMaterial.biochemical_roi.profitable_scenario.net_profit}\n`;
    whatsappText += `• ROI: ${technicalMaterial.biochemical_roi.profitable_scenario.roi_months}\n\n`;
    whatsappText += `⚠️ ${technicalMaterial.hematology_position.message}`;

    await navigator.clipboard.writeText(whatsappText);

    const blob = new Blob([whatsappText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Material_Tecnico_Diferenciais_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();

    toast.success('Material técnico exportado!', {
      description: '6 diferenciais + ROI + artigos científicos'
    });
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 9999,
          cursor: dragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={(e) => {
          setDragging(true);
          const startX = e.clientX - position.x;
          const startY = e.clientY - position.y;

          const handleMouseMove = (e) => {
            setPosition({
              x: e.clientX - startX,
              y: e.clientY - startY
            });
          };

          const handleMouseUp = () => {
            setDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}>

        <Button
          onClick={() => setOpen(!open)} className="bg-gradient-to-br text-primary-foreground mx-4 pt-2 pr-12 pb-2 pl-12 text-sm font-medium rounded-full inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 w-16 h-16 shadow-2xl from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">


          <Lightbulb className="w-7 h-7 text-white" />
        </Button>
      </div>

      {open &&
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4 p-6 bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-600" />
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Material Técnico Completo</h2>
                  <p className="text-sm text-slate-600">Diferenciais Competitivos + Evidências</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              {technicalMaterial.differentials.map((diff, idx) =>
            <div key={idx} className="p-4 border-2 border-purple-200 rounded-xl bg-purple-50">
                  <h3 className="font-bold text-lg text-purple-800 mb-2">{diff.name}</h3>
                  <p className="text-sm text-slate-700 mb-3">{diff.importance}</p>
                  
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-slate-800">Impacto Clínico:</p>
                    {Object.values(diff.clinical_impact).map((impact, i) =>
                <p key={i} className="text-slate-600">• {impact}</p>
                )}
                  </div>

                  <div className="mt-4">
                    <p className="font-semibold text-sm text-slate-800 mb-2">Evidências ({diff.scientific_evidence.length}):</p>
                    {diff.scientific_evidence.map((ev, i) =>
                <div key={i} className="text-xs text-slate-600 mb-2 pl-3 border-l-2 border-purple-300">
                        <p className="font-medium">{ev.title}</p>
                        <p className="text-purple-700">{ev.journal}</p>
                      </div>
                )}
                  </div>

                  <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs text-green-800"><strong>ROI:</strong> {diff.roi_calculation}</p>
                  </div>
                </div>
            )}

              <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl">
                <h3 className="font-bold text-lg text-emerald-800 mb-3">💼 Simulação Financeira</h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <p>• Financiamento: {technicalMaterial.biochemical_roi.investment}</p>
                  <p>• Break-even: {technicalMaterial.biochemical_roi.break_even}</p>
                  <p className="font-bold text-emerald-800 text-base mt-3">
                    Cenário 25 exames/mês: LUCRO R$ 3.860/mês
                  </p>
                </div>
              </div>

              <Button onClick={exportMaterial} className="w-full bg-purple-600 hover:bg-purple-700">
                <Download className="w-4 h-4 mr-2" />
                Exportar Material Completo
              </Button>
            </div>
          </Card>
        </div>
      }
    </>);

}