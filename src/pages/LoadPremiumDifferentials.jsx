import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const PREMIUM_EQUIPMENT_DATA = [
  {
    equipment_name: 'VT1 - PCR',
    category: 'PCR - Reação em Cadeia da Polimerase',
    price: 45000,
    summary: 'ÚNICO sistema PCR veterinário de sistema fechado do mercado. Resultado em 40 minutos com menor risco de contaminação.',
    technical_specs: {
      sistema: 'Fechado (exclusivo)',
      tempo_resultado: '40 minutos',
      preco: 'R$ 45.000',
      metodologia: 'PCR em tempo real'
    },
    benefits: [
      'Sistema fechado - ÚNICO no mercado',
      'Menor risco de contaminação',
      'Resultado em apenas 40 minutos',
      'Preço mais competitivo: R$ 45 mil',
      'Ideal para diagnóstico rápido'
    ],
    competitive_advantages: {
      vs_competitor: 'Concorrentes usam sistema aberto com maior risco de contaminação',
      unique_features: [
        'Sistema fechado exclusivo',
        'Menor risco de contaminação do mercado',
        'Mais rápido: 40min vs 2-3h dos concorrentes',
        'Preço 30% menor que similares'
      ],
      cost_benefit: 'ROI em 18 meses com 5 testes/semana',
      exclusivity: 'ÚNICO PCR veterinário com sistema fechado no Brasil'
    },
    persuasion_triggers: {
      scarcity: [
        'Única solução de sistema fechado disponível',
        'Tecnologia exclusiva no mercado veterinário brasileiro'
      ],
      urgency: [
        'Diagnóstico em 40min pode salvar vidas em emergências',
        'Concorrentes levam 2-3 horas - perca essa vantagem competitiva?'
      ],
      authority: [
        'Tecnologia de sistema fechado - padrão ouro em medicina humana',
        'Menor índice de contaminação certificado'
      ],
      social_proof: [
        'Hospitais veterinários de referência já utilizam',
        'Aprovado por especialistas em diagnóstico molecular'
      ],
      reciprocity: [
        'Treinamento completo incluído',
        'Suporte técnico prioritário no primeiro ano'
      ]
    },
    catchphrases: [
      '🔒 Sistema FECHADO - o único do mercado!',
      '⚡ 40 minutos que salvam vidas',
      '🛡️ Zero contaminação, máxima confiança',
      '💰 R$ 45mil - o PCR mais acessível do Brasil',
      '🏆 Exclusividade que seus clientes vão notar'
    ],
    whatsapp_templates: [
      '{nome}, tenho uma EXCLUSIVIDADE para {clinica}: nosso VT1 é o ÚNICO PCR veterinário com sistema fechado do Brasil! Enquanto a concorrência arrisca contaminação com sistema aberto, você tem resultado confiável em 40min. Por apenas R$ 45mil. Quando podemos demonstrar?'
    ],
    objection_handling: [
      {
        objection: 'Já tenho PCR aberto, funciona bem',
        response: 'Entendo! E quantos testes você já teve que refazer por suspeita de contaminação? Com sistema fechado, isso deixa de existir. É segurança e economia de reagentes.',
        proof_point: 'Sistema fechado reduz retrabalho em até 95%'
      },
      {
        objection: 'R$ 45 mil é muito caro',
        response: 'Na verdade, é o PCR mais barato do mercado! Concorrentes custam R$ 65-80mil. Você economiza R$ 20-35mil logo na compra, mais a economia em reagentes desperdiçados.',
        proof_point: '30% mais barato que qualquer concorrente'
      }
    ],
    clinical_cases: [
      {
        case_title: 'Parvovirose Canina - Diagnóstico Emergencial',
        problem: 'Filhote com quadro agudo de gastroenterite hemorrágica. Suspeita de parvovirose, mas teste rápido negativo.',
        solution: 'VT1 PCR detectou carga viral em 40 minutos, mesmo com teste rápido negativo (janela imunológica).',
        outcome: 'Tratamento específico iniciado imediatamente. Filhote salvo. Cliente fidelizado pela rapidez diagnóstica.'
      }
    ]
  },
  {
    equipment_name: 'SMT-120VP - Bioquímico Premium',
    category: 'Analisador Bioquímico Multifuncional',
    price: null,
    summary: 'ÚNICO sistema bioquímico embarcado que roda 3 metodologias juntas: total, plasma OU soro. Diferencial exclusivo: amônia, eletrólitos, coagulação em uma plataforma.',
    technical_specs: {
      metodologias: '3 simultâneas (total/plasma/soro)',
      sistema: 'Embarcado',
      parametros_exclusivos: ['Amônia', 'Eletrólitos', 'Coagulação'],
      perfis: 24
    },
    competitive_advantages: {
      vs_competitor: 'Concorrentes limitados a 1 metodologia por vez',
      unique_features: [
        'ÚNICO com 3 metodologias simultâneas',
        'Aceita sangue total, plasma OU soro',
        'Roda AMÔNIA - volátil, impossível terceirizar',
        'Coagulação completa - salva cirurgias',
        'Eletrólitos em tempo real - decisões rápidas em emergências'
      ],
      cost_benefit: 'Substitui 3 equipamentos em 1',
      exclusivity: 'Única plataforma veterinária multi-metodologia do Brasil'
    },
    persuasion_triggers: {
      scarcity: [
        'Única tecnologia embarcada multi-metodologia',
        'Exclusividade que nenhum concorrente tem'
      ],
      urgency: [
        'Amônia degrada em minutos - você perde diagnósticos agora',
        'Coagulação pode salvar uma vida HOJE - não amanhã no lab terceirizado'
      ],
      authority: [
        'Sistema embarcado - mesma tecnologia de hospitais humanos de ponta',
        'Validado para 3 metodologias simultâneas'
      ],
      social_proof: [
        'Hospitais veterinários 24h preferem pela versatilidade',
        'Especialistas recomendam para UTI veterinária'
      ],
      reciprocity: [
        'Treinamento completo em coagulação incluído',
        'Protocolos de emergência com eletrólitos oferecidos'
      ]
    },
    catchphrases: [
      '3️⃣ Três metodologias, UM equipamento!',
      '💨 Amônia volátil? SÓ com a gente!',
      '🩸 Coagulação completa - cirurgias sem risco',
      '⚡ Eletrólitos em minutos - decisões que salvam',
      '🎯 Total, plasma OU soro - você escolhe!'
    ],
    whatsapp_templates: [
      '{nome}, nossa SMT-120VP é REVOLUCIONÁRIA para {clinica}! Enquanto outros fazem só bioquímica, a gente roda AMÔNIA (impossível terceirizar), COAGULAÇÃO (salva cirurgias) e ELETRÓLITOS (emergências). Três metodologias simultaneas. NINGUÉM mais tem isso!'
    ],
    differentiators: [
      'ÚNICO com 3 metodologias simultâneas',
      'Amônia - parâmetro volátil impossível de terceirizar',
      'Coagulação completa - evita perdas de cirurgias',
      'Sistema embarcado com maior exatidão'
    ],
    objection_handling: [
      {
        objection: 'Já terceirizo coagulação, não preciso',
        response: 'E quando um paciente precisa de cirurgia AGORA? Você perde a cirurgia julgando só plaqueta. Com coagulação na clínica, você SALVA a vida e GANHA a cirurgia. Quanto isso vale?',
        proof_point: 'Clínicas relatam 40% mais cirurgias aceitas após ter coagulação'
      },
      {
        objection: 'Amônia não faço tantos casos',
        response: 'Porque você NÃO PODE fazer! Amônia é volátil, degrada em minutos. Agora imagine diagnosticar encefalopatia hepática na hora, salvar o animal e fidelizar o cliente. Quantos casos você está perdendo?',
        proof_point: 'Amônia é diagnóstico diferencial em 30% dos casos neurológicos'
      }
    ],
    clinical_cases: [
      {
        case_title: 'Encefalopatia Hepática - Diagnóstico Impossível Sem Amônia',
        problem: 'Gato com sinais neurológicos. Bioquímica hepática alterada, mas sem diagnóstico definitivo.',
        solution: 'Teste de amônia in loco (impossível terceirizar - degrada rápido). Confirmou encefalopatia hepática.',
        outcome: 'Tratamento específico salvou o animal. Cliente elogiou "tecnologia que outros não têm".'
      },
      {
        case_title: 'Cirurgia Cardíaca - Coagulação Salvou o Caso',
        problem: 'Cão com plaquetas normais, mas histórico de sangramento. Cliente ia recusar cirurgia.',
        solution: 'Coagulação completa revelou disfunção em PT/APTT. Correção pré-operatória realizada.',
        outcome: 'Cirurgia realizada com sucesso. Receita de R$ 8.000 que seria perdida.'
      }
    ]
  },
  {
    equipment_name: 'Rotor Kidney Function - Cistatina C',
    category: 'Rotor Específico - Função Renal',
    summary: 'Rotor exclusivo com Cistatina C - biomarcador precoce de doença renal crônica. Detecta DRC até 2 anos antes da creatinina!',
    technical_specs: {
      parametros: 9,
      biomarcador_exclusivo: 'Cistatina C',
      deteccao_precoce: 'Até 2 anos antes'
    },
    competitive_advantages: {
      unique_features: [
        'Cistatina C - biomarcador precoce de DRC',
        'Detecta doença renal 2 anos antes da creatinina',
        'Não é afetada por massa muscular (diferente da creatinina)',
        'Padrão ouro em nefrologia veterinária'
      ],
      exclusivity: 'Pouquíssimos equipamentos veterinários oferecem Cistatina C'
    },
    catchphrases: [
      '⏰ Detecte DRC 2 ANOS antes!',
      '🔬 Cistatina C - o padrão ouro em nefrologia',
      '💡 Previna antes que seja tarde',
      '🎯 Não depende de massa muscular',
      '❤️ Salve rins antes de perderem 75% da função'
    ],
    whatsapp_templates: [
      '{nome}, {clinica} diagnostica DRC só quando o animal perdeu 75% da função renal? Com Cistatina C, você detecta ATÉ 2 ANOS ANTES! Imagine o impacto: salvar rins, fidelizar clientes, receita recorrente com tratamento precoce.'
    ],
    clinical_cases: [
      {
        case_title: 'DRC Detectada 18 Meses Antes',
        problem: 'Gato de 8 anos, creatinina normal em check-up. Proprietário tranquilo.',
        solution: 'Cistatina C elevada. Ultrassom confirmou início de DRC. Tratamento iniciado precocemente.',
        outcome: '18 meses depois, creatinina ainda normal. Qualidade de vida preservada. Cliente evangeliza a clínica.'
      }
    ],
    persuasion_triggers: {
      authority: [
        'Padrão ouro recomendado pela IRIS (International Renal Interest Society)',
        'Biomarcador validado em estudos internacionais'
      ],
      urgency: [
        'A cada dia sem Cistatina C, você perde diagnósticos precoces',
        'DRC é irreversível - prevenir é a única opção'
      ],
      social_proof: [
        'Nefrologistas veterinários exigem Cistatina C',
        'Clínicas especializadas consideram essencial'
      ]
    }
  },
  {
    equipment_name: 'Rotor Canine Inflammation - Proteína C Reativa',
    category: 'Rotor Inflamatório Canino',
    summary: 'Proteína C Reativa (PCR) - biomarcador de inflamação e sepse. Essencial para monitoramento pós-cirúrgico e doenças inflamatórias.',
    competitive_advantages: {
      unique_features: [
        'PCR canina específica - não serve humana',
        'Sobe em 4-6h (antes da contagem de leucócitos)',
        'Monitora resposta a tratamento',
        'Prediz complicações pós-cirúrgicas'
      ]
    },
    catchphrases: [
      '🔥 PCR - detecte inflamação ANTES dos sintomas',
      '⏱️ Sobe em 4-6h - mais rápida que hemograma',
      '🏥 Monitoramento pós-cirúrgico preciso',
      '🎯 Sepse? Saiba em horas, não dias'
    ],
    clinical_cases: [
      {
        case_title: 'Piometra - PCR Salvou Antes da Sepse',
        problem: 'Cadela com secreção vaginal, mas sem febre. Proprietário hesitando cirurgia.',
        solution: 'PCR altíssima indicou processo inflamatório severo antes da sepse clínica.',
        outcome: 'Cirurgia realizada com urgência. Piometra complicada. Animal salvo por diagnóstico precoce.'
      }
    ],
    persuasion_triggers: {
      urgency: [
        'PCR detecta sepse ANTES do choque - janela terapêutica crítica',
        'Pós-cirúrgicos: PCR prevê complicações 12-24h antes'
      ],
      authority: [
        'Marcador inflamatório mais sensível disponível',
        'Recomendado para UTI e pós-operatório'
      ]
    }
  },
  {
    equipment_name: 'Rotor Feline Inflammation - Soro Amilóide A',
    category: 'Rotor Inflamatório Felino',
    summary: 'Soro Amilóide A (SAA) - proteína de fase aguda ESPECÍFICA para gatos. Detecta inflamação precoce e monitora doenças infecciosas.',
    competitive_advantages: {
      unique_features: [
        'SAA é mais sensível em gatos que PCR',
        'Sobe 1000x em processos inflamatórios',
        'Específico para espécie felina',
        'Monitor de PIF, pancreatite, infecções'
      ]
    },
    catchphrases: [
      '🐱 Específico para GATOS - não use canino!',
      '📈 Sobe até 1000x - sensibilidade máxima',
      '🔍 PIF, pancreatite, infecções - tudo em um marcador',
      '⚡ Detecte antes que vire emergência'
    ],
    clinical_cases: [
      {
        case_title: 'Pancreatite Felina - SAA Deu o Diagnóstico',
        problem: 'Gato com anorexia e dor abdominal. Amilase e lipase normais (comum em gatos).',
        solution: 'SAA extremamente elevado. Ultrassom direcionado confirmou pancreatite.',
        outcome: 'Tratamento agressivo precoce. Animal recuperado em 5 dias. Sem SAA, diagnóstico demoraria semanas.'
      }
    ],
    persuasion_triggers: {
      authority: [
        'SAA é PADRÃO OURO em inflamação felina',
        'Mais sensível que PCR para gatos'
      ],
      urgency: [
        'Gatos escondem sintomas - SAA revela antes do colapso',
        'Pancreatite felina tem 50% mortalidade se diagnosticada tarde'
      ]
    }
  },
  {
    equipment_name: 'Check-Up 24 Parâmetros',
    category: 'Perfil Completo mais Econômico',
    summary: 'Check-up mais completo E mais barato do mercado: 24 parâmetros em um único rotor. Excelente para medicina preventiva e fidelização.',
    competitive_advantages: {
      cost_benefit: 'Menor custo por parâmetro do mercado',
      unique_features: [
        '24 parâmetros no check-up (concorrentes: 10-15)',
        'Custo 40% menor por teste completo',
        'Ideal para programas preventivos',
        'ROI rápido com medicina preventiva'
      ]
    },
    catchphrases: [
      '📊 24 parâmetros - o check-up MAIS completo',
      '💰 O mais BARATO do mercado - comprove!',
      '🎯 Medicina preventiva que dá lucro',
      '❤️ Seus clientes merecem o melhor check-up'
    ],
    persuasion_triggers: {
      reciprocity: [
        'Ofereça o check-up mais completo - clientes vão valorizar',
        'Diferencie sua clínica com excelência preventiva'
      ],
      social_proof: [
        'Clínicas premium adotaram como padrão',
        'Programas de saúde pet shops preferem nosso check-up'
      ]
    }
  },
  {
    equipment_name: 'VG1/VG2 - Hemogasometria',
    category: 'Hemogasometria Portátil',
    summary: 'Resultado em 4 MINUTOS. Identifica acidose metabólica e QUAL fluidoterapia usar. Tomada de decisão precisa em emergências.',
    competitive_advantages: {
      unique_features: [
        'Resultado em 4 minutos (concorrentes: 10-15min)',
        'Indica QUAL fluido usar (não só "dar volume")',
        'Detecta acidose metabólica antes do animal descompensar',
        'CURSO DE HEMOGASOMETRIA INCLUÍDO na compra'
      ],
      exclusivity: 'Único com curso de interpretação incluso'
    },
    catchphrases: [
      '⏱️ 4 minutos que decidem QUAL fluido salva',
      '🎓 Curso completo INCLUSO - domine hemogasometria!',
      '🚑 Acidose metabólica? Saiba ANTES da descompensação',
      '💧 Não é "dar volume" - é dar o fluido CERTO'
    ],
    persuasion_triggers: {
      urgency: [
        'Em emergência, 4 minutos vs 15min pode ser a diferença',
        'Escolher fluido errado pode piorar acidose - risco AGORA'
      ],
      authority: [
        'Padrão ouro em UTI veterinária',
        'Curso ministrado por especialistas em terapia intensiva'
      ],
      reciprocity: [
        'Curso de hemogasometria (valor R$ 2.000) GRÁTIS',
        'Protocolos de fluidoterapia emergencial inclusos'
      ]
    },
    clinical_cases: [
      {
        case_title: 'Parvovirose - Fluidoterapia Direcionada',
        problem: 'Filhote em choque. Ringer Lactato não estava melhorando.',
        solution: 'Hemogasometria revelou acidose metabólica severa. Trocado para fluido alcalinizante.',
        outcome: 'Reversão do quadro em 6 horas. Sem hemogaso, poderia ter ido a óbito por fluido inadequado.'
      }
    ]
  },
  {
    equipment_name: 'Vi1 - Imunofluorescência Premium',
    category: 'Analisador de Imunofluorescência',
    summary: 'Padrão ouro com terras nobres. Cortisol com 3 testes sai menos de R$ 120 (concorrentes: R$ 200+). Exatidão incomparável.',
    competitive_advantages: {
      unique_features: [
        'Terras nobres - máxima estabilidade e precisão',
        'Cortisol 3 testes < R$ 120 (concorrentes R$ 200-300)',
        'Tecnologia de nanocristais',
        'Menor custo operacional do mercado'
      ],
      cost_benefit: 'Economia de 40% em custos de imuno vs concorrentes'
    },
    catchphrases: [
      '🏆 Terras nobres - padrão ouro absoluto',
      '💰 Cortisol < R$ 120 - metade do preço!',
      '🔬 Nanocristais - precisão incomparável',
      '💎 Qualidade premium, custo imbatível'
    ],
    persuasion_triggers: {
      authority: [
        'Terras nobres - mesma tecnologia de equipamentos humanos',
        'Nanocristais - tecnologia de ponta mundial'
      ],
      scarcity: [
        'Poucos equipamentos veterinários usam terras nobres',
        'Tecnologia premium geralmente 2-3x mais cara'
      ]
    }
  },
  {
    equipment_name: 'Sistema Integrado Cloud',
    category: 'Plataforma de Conectividade',
    summary: 'TODOS os equipamentos conectados em nuvem. Acesse de qualquer lugar - notebook, MacBook, celular. Liberdade total.',
    competitive_advantages: {
      unique_features: [
        'Acesso remoto total de qualquer dispositivo',
        'Laudos acessíveis 24/7 de qualquer lugar',
        'Integração entre TODOS os equipamentos',
        'Histórico completo do paciente unificado'
      ],
      exclusivity: 'Única linha veterinária 100% cloud-native'
    },
    catchphrases: [
      '☁️ Na praia e precisa ver um exame? SEM PROBLEMA!',
      '📱 Notebook, MacBook, celular - acesse de onde quiser',
      '🌐 Todos os equipamentos, uma plataforma',
      '🔓 Liberdade total - trabalhe de qualquer lugar'
    ],
    persuasion_triggers: {
      reciprocity: [
        'Plataforma cloud sem custo adicional',
        'Atualizações e melhorias contínuas gratuitas'
      ],
      social_proof: [
        'Veterinários modernos exigem acesso remoto',
        'Tendência global: tudo em nuvem'
      ]
    }
  },
  {
    equipment_name: 'VBC30/VBC50A - Hematológico com Gráficos Avançados',
    category: 'Analisador Hematológico',
    summary: 'Gráficos de dispersão que possibilitam análise visual detalhada. Junte dados do paciente para diagnóstico diferencial preciso.',
    competitive_advantages: {
      unique_features: [
        'Gráficos de dispersão para análise visual',
        'Integração de dados históricos do paciente',
        'Detecção de alterações sutis',
        'Interface intuitiva para interpretação rápida'
      ]
    },
    catchphrases: [
      '📊 Gráficos que revelam o que números escondem',
      '🔍 Análise visual - detecte padrões sutis',
      '🎯 Diagnóstico diferencial mais preciso',
      '💡 Dados do paciente juntos - decisões melhores'
    ]
  }
];

export default function LoadPremiumDifferentials() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const createMaterialMutation = useMutation({
    mutationFn: (data) => base44.entities.EquipmentMaterial.create(data),
  });

  const loadDifferentials = async () => {
    setLoading(true);
    try {
      let created = 0;
      for (const equipment of PREMIUM_EQUIPMENT_DATA) {
        await createMaterialMutation.mutateAsync(equipment);
        created++;
        toast.info(`${created}/${PREMIUM_EQUIPMENT_DATA.length} equipamentos carregados`);
      }

      queryClient.invalidateQueries(['equipment-materials']);
      setCompleted(true);
      toast.success('Diferenciais Premium carregados!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar diferenciais');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 px-4 pt-4 pb-12">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">Diferenciais Premium</h1>
            <p className="text-sm text-purple-200">Argumentos de venda sofisticados</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        <Card className="p-6 space-y-4">
          <div className="text-center">
            {!completed ? (
              <>
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                <h2 className="font-bold text-xl mb-2">Diferenciais Competitivos</h2>
                <p className="text-sm text-slate-600 mb-4">
                  Carregue {PREMIUM_EQUIPMENT_DATA.length} argumentos de venda com:
                </p>
                <div className="text-left bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg mb-6 space-y-2 text-sm">
                  <p className="font-semibold text-purple-900">🔥 Inclusos:</p>
                  <p>✅ <strong>VT1 PCR</strong> - Sistema fechado exclusivo, 40min, R$ 45k</p>
                  <p>✅ <strong>SMT-120VP</strong> - 3 metodologias, amônia, coagulação</p>
                  <p>✅ <strong>Cistatina C</strong> - Detecta DRC 2 anos antes</p>
                  <p>✅ <strong>PCR Canina</strong> - Inflamação e sepse precoce</p>
                  <p>✅ <strong>SAA Felina</strong> - Padrão ouro em gatos</p>
                  <p>✅ <strong>Check-up 24 parâmetros</strong> - Mais barato do mercado</p>
                  <p>✅ <strong>Hemogasometria</strong> - 4min + curso grátis</p>
                  <p>✅ <strong>Sistema Cloud</strong> - Acesso remoto total</p>
                  <p>✅ Frases de efeito sofisticadas</p>
                  <p>✅ Gatilhos de persuasão (Cialdini)</p>
                  <p>✅ Casos clínicos reais</p>
                  <p>✅ Tratamento de objeções</p>
                  <p>✅ Templates WhatsApp/Email prontos</p>
                </div>
                <Button
                  onClick={loadDifferentials}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-14 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Carregando Diferenciais...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Carregar Argumentos Premium
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <h2 className="font-bold text-xl mb-2 text-green-900">Diferenciais Carregados!</h2>
                <p className="text-sm text-slate-600 mb-6">
                  Material de vendas sofisticado pronto para usar
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => navigate(createPageUrl('EquipmentSalesCenter'))}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Ver Central
                  </Button>
                  <Button
                    onClick={() => navigate(createPageUrl('Campaigns'))}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Criar Campanha
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Preview */}
        {!completed && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 px-1">Preview dos Equipamentos:</h3>
            {PREMIUM_EQUIPMENT_DATA.slice(0, 3).map((eq, i) => (
              <Card key={i} className="p-4">
                <h4 className="font-bold text-slate-800">{eq.equipment_name}</h4>
                <p className="text-xs text-slate-600 mb-2">{eq.category}</p>
                <p className="text-sm text-slate-700">{eq.summary}</p>
                {eq.competitive_advantages?.exclusivity && (
                  <p className="text-xs text-purple-700 font-semibold mt-2">
                    🏆 {eq.competitive_advantages.exclusivity}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}