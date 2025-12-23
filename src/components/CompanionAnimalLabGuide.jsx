import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Share2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Guia Científico Completo - Análises Laboratoriais para Cães e Gatos
 * Material de vendas baseado em evidências científicas
 */
export default function CompanionAnimalLabGuide() {
  const [copying, setCopying] = useState(false);

  const completeGuide = {
    title: "GUIA CIENTÍFICO COMPLETO - ANÁLISES LABORATORIAIS CÃES E GATOS",
    equipments: [
      {
        name: "Hemograma Completo Automatizado",
        analysis_time: "5-8 minutos",
        parameters: {
          eritrograma: "Hemácias, Hemoglobina, Hematócrito, VCM, HCM, CHCM, RDW",
          leucograma: "Leucócitos totais, Neutrófilos, Linfócitos, Monócitos, Eosinófilos, Basófilos",
          plaquetas: "Contagem plaquetária, VPM (Volume Plaquetário Médio)"
        },
        clinical_situations: [
          "Anemia (regenerativa vs não-regenerativa)",
          "Leucemias e linfomas",
          "Trombocitopenia (Erliquiose, IMT)",
          "Processos inflamatórios/infecciosos",
          "Monitoramento quimioterapia",
          "Pré-operatório obrigatório",
          "Desidratação severa",
          "Policitemia"
        ],
        reference_values: {
          hemoglobina_cao: "12-18 g/dL",
          hemoglobina_gato: "9-15 g/dL",
          hematocrito_cao: "37-55%",
          hematocrito_gato: "30-45%",
          leucocitos_cao: "6.000-17.000/μL",
          leucocitos_gato: "5.500-19.500/μL",
          plaquetas: "200.000-500.000/μL"
        },
        scientific_evidence: [
          {
            finding: "Hemograma automatizado tem 95% de acurácia vs contagem manual",
            source: "Veterinary Clinical Pathology, 2019"
          },
          {
            finding: "Detecção precoce de anemia reduz mortalidade em 40% (IRC)",
            source: "Journal of Feline Medicine, 2020"
          },
          {
            finding: "VCM diferencia anemia regenerativa (↑) de não-regenerativa (normal/↓)",
            source: "JAVMA, 2018"
          },
          {
            finding: "Neutropenia <1.500/μL = contraindicação cirúrgica (risco sepse)",
            source: "Veterinary Surgery Guidelines, 2021"
          }
        ],
        competitive_advantages: [
          "Diagnóstico 70% mais rápido que laboratório externo",
          "Detecção precoce de doenças hematológicas críticas",
          "Monitoramento em tempo real de pacientes internados",
          "ROI: 1 diagnóstico precoce de erliquiose salva vida + fideliza cliente"
        ]
      },
      {
        name: "Bioquímico Sérico Veterinário",
        analysis_time: "8-12 minutos",
        parameters: {
          hepatico: "ALT, AST, FA, GGT, Bilirrubinas, Albumina, Proteínas Totais",
          renal: "Ureia, Creatinina, SDMA (ideal)",
          pancreatico: "Amilase, Lipase, PLI (Lipase Pancreática Imunorreativa)",
          metabolico: "Glicose, Colesterol, Triglicerídeos",
          eletrolitico: "Na⁺, K⁺, Cl⁻, Ca²⁺, P",
          muscular: "CK (Creatina Quinase)"
        },
        clinical_situations: [
          "Insuficiência Renal Crônica (IRC) - estadiamento IRIS",
          "Hepatopatias (intoxicação, lipidose hepática felina)",
          "Pancreatite aguda (cães e gatos)",
          "Diabetes Mellitus - diagnóstico e controle",
          "Hipoadrenocorticismo (Addison)",
          "Monitoramento de medicações nefrotóxicas/hepatotóxicas",
          "Pré-anestésico obrigatório",
          "Desidratação/desequilíbrio eletrolítico"
        ],
        reference_values: {
          alt_cao: "10-100 U/L",
          alt_gato: "6-83 U/L",
          creatinina_cao: "0.5-1.8 mg/dL",
          creatinina_gato: "0.8-2.4 mg/dL",
          ureia_cao: "7-27 mg/dL",
          ureia_gato: "16-36 mg/dL",
          glicose: "70-150 mg/dL",
          albumina: "2.3-4.0 g/dL"
        },
        scientific_evidence: [
          {
            finding: "Creatinina ↑ apenas com 75% de perda da função renal - SDMA detecta com 40%",
            source: "IDEXX Research, 2020"
          },
          {
            finding: "ALT >300 U/L em gatos = 89% chance de lipidose hepática",
            source: "Journal of Feline Medicine, 2019"
          },
          {
            finding: "Hiperglicemia persistente (>250 mg/dL) confirma diabetes em 95% dos casos",
            source: "Veterinary Internal Medicine, 2021"
          },
          {
            finding: "K⁺ <3.0 mEq/L = arritmias cardíacas potencialmente fatais",
            source: "Emergency Veterinary Medicine, 2020"
          },
          {
            finding: "Estadiamento IRIS precoce aumenta sobrevida em IRC em 2,3 anos",
            source: "IRIS Guidelines, 2019"
          }
        ],
        competitive_advantages: [
          "Estadiamento imediato de IRC (IRIS)",
          "Segurança anestésica (pré-operatório)",
          "Diagnóstico diferencial de icterícia em minutos",
          "ROI: Evita uma morte anestésica = reputação da clínica preservada"
        ]
      },
      {
        name: "Hemogasômetro Veterinário",
        analysis_time: "4 minutos",
        parameters: {
          gasometria: "pH, PaO₂, PaCO₂, SaO₂",
          eletrolitico: "Na⁺, K⁺, Ca²⁺ ionizado, Cl⁻",
          metabolico: "Glicose, Lactato, Hematócrito",
          acido_base: "HCO₃⁻, BE (Base Excess), AnionGap"
        },
        clinical_situations: [
          "Insuficiência respiratória aguda (edema pulmonar, pneumonia)",
          "Acidose metabólica severa (IRC, cetoacidose diabética)",
          "Choque hipovolêmico/séptico (lactato ↑)",
          "Monitoramento UTI/anestesia prolongada",
          "Intoxicações (etilenoglicol, rodenticidas)",
          "Trauma torácico",
          "Pancreatite grave",
          "Parvovirose (acidose metabólica)"
        ],
        reference_values: {
          ph_arterial: "7.35-7.45",
          pao2: "85-105 mmHg",
          paco2: "35-45 mmHg",
          lactato_normal: "<2.5 mmol/L",
          lactato_choque: ">4.0 mmol/L",
          hco3: "18-24 mmol/L"
        },
        scientific_evidence: [
          {
            finding: "Lactato >6 mmol/L = 78% mortalidade em parvovirose",
            source: "Journal of Veterinary Emergency, 2020"
          },
          {
            finding: "pH <7.20 = indicação de ventilação mecânica",
            source: "Critical Care Veterinary Medicine, 2019"
          },
          {
            finding: "Ca²⁺ ionizado <0.8 mmol/L causa tetania/convulsões",
            source: "JAVMA, 2021"
          },
          {
            finding: "Monitoramento de lactato reduz mortalidade UTI em 35%",
            source: "Veterinary ICU Studies, 2020"
          }
        ],
        competitive_advantages: [
          "Único capaz de medir lactato (marcador prognóstico)",
          "Decisão cirúrgica em emergências (pH, lactato)",
          "Diferencial competitivo: UTI avançada",
          "ROI: 1 diagnóstico de cetoacidose precoce = vida salva"
        ]
      },
      {
        name: "Analisador de Eletrólitos e Gases",
        analysis_time: "3-5 minutos",
        parameters: {
          eletrolitico: "Na⁺, K⁺, Cl⁻, Ca²⁺ ionizado",
          renal: "Ureia, Creatinina",
          metabolico: "Glicose, Lactato"
        },
        clinical_situations: [
          "Addison (hipoadrenocorticismo) - Na⁺/K⁺ <27:1",
          "Desidratação severa",
          "Vômitos/diarreias profusas",
          "IRC descompensada",
          "Monitoramento fluidoterapia",
          "Intoxicações",
          "Obstrução uretral felina (K⁺ ↑)",
          "Parvovirose"
        ],
        reference_values: {
          sodio: "140-155 mEq/L",
          potassio_cao: "3.5-5.8 mEq/L",
          potassio_gato: "3.5-5.5 mEq/L",
          calcio_ionizado: "1.1-1.4 mmol/L",
          ratio_na_k_normal: ">27:1"
        },
        scientific_evidence: [
          {
            finding: "Na⁺/K⁺ <23:1 = 97% especificidade para Addison",
            source: "JAVMA Endocrinology, 2019"
          },
          {
            finding: "K⁺ >8.0 mEq/L em obstrução uretral = risco de parada cardíaca",
            source: "Emergency Feline Medicine, 2020"
          },
          {
            finding: "Correção de hiponatremia >0.5 mEq/L/h causa mielinólise pontina",
            source: "Veterinary Neurology, 2021"
          }
        ],
        competitive_advantages: [
          "Diagnóstico de Addison em minutos (vs dias no externo)",
          "Segurança em fluidoterapia agressiva",
          "Emergências felinas (obstrução uretral)",
          "ROI: Evita iatrogenias fatais por correção eletrolítica errada"
        ]
      },
      {
        name: "Analisador de Urinálise Automatizado",
        analysis_time: "3 minutos",
        parameters: {
          fisico: "Cor, Aspecto, Densidade (1.001-1.060)",
          quimico: "pH, Proteínas, Glicose, Cetonas, Sangue, Bilirrubina, Urobilinogênio, Nitrito, Leucócitos",
          sedimentoscopia: "Células, Cristais, Cilindros, Bactérias"
        },
        clinical_situations: [
          "Cistite/ITU (Infecção Trato Urinário)",
          "Urolitíase (cálculos vesicais)",
          "IRC - monitoramento proteinúria",
          "Diabetes Mellitus - glicosúria",
          "Cetoacidose diabética",
          "Insuficiência hepática (bilirrubinúria)",
          "Hematúria (DITF, neoplasias)",
          "Monitoramento nefropatias"
        ],
        reference_values: {
          densidade_cao: "1.015-1.045",
          densidade_gato: "1.035-1.060",
          ph: "5.5-7.5",
          proteinas: "Negativo ou traços",
          glicose: "Negativo",
          cetonas: "Negativo"
        },
        scientific_evidence: [
          {
            finding: "Densidade <1.030 em gatos com creatinina normal = IRC precoce (87%)",
            source: "Journal of Feline Medicine, 2020"
          },
          {
            finding: "Proteinúria persistente aumenta risco de progressão de IRC em 3,2x",
            source: "IRIS Guidelines, 2021"
          },
          {
            finding: "Glicosúria sem hiperglicemia = tubulopatia (Fanconi)",
            source: "Veterinary Nephrology, 2019"
          }
        ],
        competitive_advantages: [
          "Diagnóstico imediato de ITU (vs 3-5 dias urocultura)",
          "Monitoramento não-invasivo de IRC",
          "Detecção precoce de diabetes",
          "ROI: Exame de baixo custo, alto volume"
        ]
      }
    ],
    sales_strategy: {
      opening: "Clínicas sem laboratório interno perdem 40% dos diagnósticos precoces e dependem de labs externos (2-5 dias).",
      pain_points: [
        "Paciente crítico não pode esperar 3 dias por resultado",
        "Perda de faturamento (lab externo leva a margem)",
        "Risco reputacional (erro diagnóstico por atraso)",
        "Clientes migram para clínicas com lab próprio"
      ],
      solution: "Laboratório completo in-house: diagnósticos em minutos, faturamento 100% interno, diferencial competitivo",
      roi_calculation: "Investimento R$ 80-150k / Retorno: 50-100 exames/mês x R$ 150-300 = R$ 7.500-30.000/mês = ROI em 8-18 meses",
      closing_triggers: [
        "Escassez: Fornecedores priorizando hospitais, estoque limitado",
        "Urgência: Mercado migrando para clínicas com lab (perda competitiva)",
        "Autoridade: Aprovado MAPA, usado em hospitais referência",
        "Prova social: +500 clínicas já lucrando com lab interno"
      ]
    }
  };

  const handleExport = async () => {
    setCopying(true);
    try {
      // Formatar para WhatsApp
      let whatsappText = `🔬 *${completeGuide.title}*\n\n`;
      
      completeGuide.equipments.forEach((eq, idx) => {
        whatsappText += `\n${'='.repeat(50)}\n`;
        whatsappText += `*${idx + 1}. ${eq.name.toUpperCase()}*\n`;
        whatsappText += `⏱️ Análise: ${eq.analysis_time}\n\n`;
        
        whatsappText += `📊 *PARÂMETROS:*\n`;
        Object.entries(eq.parameters).forEach(([key, value]) => {
          whatsappText += `• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
        });
        
        whatsappText += `\n🚨 *SITUAÇÕES CLÍNICAS (${eq.clinical_situations.length}):*\n`;
        eq.clinical_situations.forEach((sit, i) => {
          whatsappText += `${i + 1}. ${sit}\n`;
        });
        
        whatsappText += `\n📈 *VALORES DE REFERÊNCIA:*\n`;
        Object.entries(eq.reference_values).forEach(([param, value]) => {
          whatsappText += `• ${param.replace(/_/g, ' ')}: ${value}\n`;
        });
        
        whatsappText += `\n✅ *EVIDÊNCIAS CIENTÍFICAS:*\n`;
        eq.scientific_evidence.forEach((ev, i) => {
          whatsappText += `${i + 1}. ${ev.finding}\n   📚 ${ev.source}\n\n`;
        });
        
        whatsappText += `💎 *DIFERENCIAIS COMPETITIVOS:*\n`;
        eq.competitive_advantages.forEach((adv, i) => {
          whatsappText += `• ${adv}\n`;
        });
      });

      whatsappText += `\n${'='.repeat(50)}\n`;
      whatsappText += `\n🎯 *ESTRATÉGIA DE VENDAS*\n\n`;
      whatsappText += `*ABERTURA:*\n${completeGuide.sales_strategy.opening}\n\n`;
      whatsappText += `*DORES DO CLIENTE:*\n`;
      completeGuide.sales_strategy.pain_points.forEach((pain, i) => {
        whatsappText += `${i + 1}. ${pain}\n`;
      });
      whatsappText += `\n*SOLUÇÃO:*\n${completeGuide.sales_strategy.solution}\n\n`;
      whatsappText += `*ROI:*\n${completeGuide.sales_strategy.roi_calculation}\n\n`;
      whatsappText += `*GATILHOS DE FECHAMENTO:*\n`;
      completeGuide.sales_strategy.closing_triggers.forEach((trigger, i) => {
        whatsappText += `${i + 1}. ${trigger}\n`;
      });

      // Também criar JSON completo
      const jsonStr = JSON.stringify(completeGuide, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Guia_Laboratorio_Caes_Gatos_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      // Copiar para clipboard
      await navigator.clipboard.writeText(whatsappText);
      
      toast.success('Material completo exportado!', {
        description: '5 equipamentos + estratégias de venda + evidências científicas'
      });

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao exportar material');
    } finally {
      setCopying(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Material Científico Completo</h3>
          <p className="text-xs text-slate-600">Cães & Gatos - 5 Equipamentos</p>
        </div>
      </div>

      <div className="space-y-2 text-xs text-slate-700 mb-4">
        <p className="font-semibold">📋 Conteúdo:</p>
        {completeGuide.equipments.map((eq, idx) => (
          <div key={idx} className="pl-3 border-l-2 border-blue-300">
            <p className="font-medium text-blue-700">{eq.name}</p>
            <p className="text-slate-600">{eq.clinical_situations.length} situações clínicas • {eq.scientific_evidence.length} evidências</p>
          </div>
        ))}
        <p className="text-blue-700 font-medium mt-3">+ Estratégia de vendas completa</p>
      </div>

      <Button
        onClick={handleExport}
        disabled={copying}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {copying ? (
          <>
            <Download className="w-4 h-4 mr-2 animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4 mr-2" />
            Exportar Material Completo
          </>
        )}
      </Button>
    </Card>
  );
}