import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const SEAMATY_EQUIPMENT = [
  {
    equipment_name: 'VBC30',
    category: 'Analisador Hematológico Veterinário - 3 partes',
    summary: 'Analisador de 3 partes que fornece análise dos Leucócitos em 3 subgrupos. 60 testes/hora, 21 parâmetros, 3 histogramas. Atende 13 espécies, apenas 20 µL de sangue.',
    technical_specs: {
      partes: 3,
      volumetria: '60 testes/hora',
      parametros: 21,
      amostra: '20 µL sangue total',
      especies: 13,
      tela: '10.4" touchscreen',
      memoria: '50.000 resultados'
    },
    benefits: [
      'Compacto e econômico',
      'Apenas 2 reagentes',
      'Baixo custo operacional',
      'Tela touchscreen intuitiva',
      'Limpeza automática'
    ],
    target_profile: ['clinica_pequena', 'clinica_media'],
    catchphrases: [
      '🔬 Precisão profissional com economia real',
      '⚡ 60 testes por hora - agilize sua rotina!',
      '💰 Apenas 2 reagentes - reduza custos em até 40%',
      '📱 Tela touchscreen - facilidade total',
      '🎯 21 parâmetros completos para diagnóstico certeiro'
    ],
    whatsapp_templates: [
      'Olá {nome}! Vi que a {clinica} busca eficiência em hematologia. O VBC30 entrega 60 testes/hora com apenas 2 reagentes - economia de até 40% em custos! Resultados precisos em 21 parâmetros. Que tal uma demonstração?',
      '{nome}, o VBC30 é perfeito para {clinica}! Apenas 20µL de sangue, 3 histogramas completos, e memória para 50mil resultados. Ideal para sua rotina. Posso te mostrar como funciona?'
    ],
    email_templates: [
      'Assunto: VBC30 - Revolucione seu laboratório com economia\n\nOlá {nome},\n\nO VBC30 da Seamaty é a solução ideal para {clinica}. Com análise de 3 partes, você tem 21 parâmetros hematológicos precisos usando apenas 2 reagentes e 20µL de sangue.\n\n✅ 60 testes/hora\n✅ Economia de até 40% em reagentes\n✅ Tela touchscreen 10.4"\n✅ 50.000 resultados armazenados\n\nVamos agendar uma demonstração?\n\nAbraços!'
    ],
    differentiators: [
      'Menor custo operacional com 2 reagentes',
      'Alta capacidade de memória',
      'Manutenção simplificada',
      'Ideal para clínicas pequenas e médias'
    ]
  },
  {
    equipment_name: 'VBC50A',
    category: 'Analisador Hematológico Veterinário Automático - 5 partes',
    summary: 'Analisador de 5 partes com análise detalhada dos leucócitos em 5 subgrupos. 25 parâmetros + 4 pesquisa, 2 diagramas de dispersão. Apenas 20 µL de sangue e 3 reagentes.',
    technical_specs: {
      partes: 5,
      parametros: 25,
      parametros_pesquisa: 4,
      diagramas: 2,
      amostra: '20 µL sangue total',
      reagentes: 3,
      especies: 13,
      tela: '10.4" touchscreen'
    },
    benefits: [
      'Análise detalhada em 5 subgrupos de leucócitos',
      'Compacto e versátil',
      'Limpeza automática',
      'Funções automáticas de falhas',
      'Otimizado para laboratório'
    ],
    target_profile: ['clinica_media', 'hospital_veterinario'],
    catchphrases: [
      '🏆 Análise de 5 partes - máxima precisão diagnóstica',
      '🔬 25 parâmetros completos + 4 de pesquisa',
      '⚡ Detecção automática de falhas - zero preocupação',
      '💎 Qualidade premium com operação simples',
      '🎯 Diagnóstico diferencial completo'
    ],
    whatsapp_templates: [
      '{nome}, o VBC50A é o upgrade que {clinica} precisa! Análise de 5 partes, 25 parâmetros, diagramas de dispersão. Leva seu laboratório a outro nível. Demonstração amanhã?'
    ],
    email_templates: [
      'Assunto: VBC50A - Análise Premium de 5 Partes\n\nOlá {nome},\n\nPara um hospital como {clinica}, o VBC50A oferece o máximo em diagnóstico hematológico:\n\n🔬 5 subgrupos de leucócitos\n📊 25 parâmetros + 4 de pesquisa\n🎯 2 diagramas de dispersão\n⚡ Limpeza automática\n\nEleve o padrão do seu laboratório!'
    ],
    differentiators: [
      'Análise diferencial em 5 partes',
      'Diagramas de dispersão',
      'Parâmetros de pesquisa avançados',
      'Ideal para hospitais veterinários'
    ]
  },
  {
    equipment_name: 'VG1',
    category: 'Analisador Portátil de Gases e Eletrólitos',
    summary: 'Analisador portátil com resultados em 4 minutos. Apenas 0,1ml de sangue. Até 17 parâmetros em plataforma portátil. Bateria integrada, impressora embutida.',
    technical_specs: {
      tempo_resultado: '4 minutos',
      amostra: '0.1 ml sangue total',
      parametros_max: 17,
      portabilidade: 'Bateria integrada',
      impressora: 'Embutida'
    },
    benefits: [
      'Resultados em apenas 4 minutos',
      'Extremamente portátil',
      'Bateria integrada',
      'Diagnósticos em qualquer lugar',
      'Impressora embutida'
    ],
    target_profile: ['clinica_media', 'hospital_veterinario', 'clinica_especializada'],
    price_range: 'Consultar',
    catchphrases: [
      '⚡ Resultados em 4 minutos - emergências sem espera!',
      '🎒 Portátil com bateria - leve para qualquer lugar',
      '💉 Apenas 0,1ml - mínima invasão',
      '📄 Impressora embutida - resultado na hora',
      '🚑 Perfeito para emergências e UTI'
    ],
    whatsapp_templates: [
      '{nome}, imagina ter gasometria completa em 4 minutos ao lado do paciente? O VG1 é portátil, com bateria, impressora embutida. Só 0,1ml de sangue. Perfeito para {clinica}!'
    ],
    differentiators: [
      'Único portátil com impressora embutida',
      'Bateria para uso em campo',
      'Ideal para emergências',
      'Mínima quantidade de amostra'
    ]
  },
  {
    equipment_name: 'VG2',
    category: 'Analisador 2 em 1 - Gases, Eletrólitos e Imunoensaio',
    summary: 'Combina imunofluorescência e análise de gases/eletrólitos. Resultados em 4-10 minutos. 11 parâmetros de imunoensaio + 17 de hemogasometria.',
    technical_specs: {
      funcoes: '2 em 1',
      tempo_resultado: '4-10 minutos',
      parametros_imuno: 11,
      parametros_hemo: 17,
      tecnologia: 'Nanocristais + eletrodos'
    },
    benefits: [
      'Dois equipamentos em um',
      'Testes simultâneos',
      'Tecnologia de nanocristais',
      'Resultados em 4-10 minutos',
      'Otimiza fluxo de trabalho'
    ],
    target_profile: ['hospital_veterinario', 'clinica_especializada'],
    catchphrases: [
      '🎯 2 em 1 - Economize espaço e tempo!',
      '⚡ Gases + Imuno na mesma plataforma',
      '🔬 Nanocristais - máxima precisão',
      '💼 Simplifique seu laboratório',
      '🚀 Diagnóstico completo em minutos'
    ],
    whatsapp_templates: [
      '{nome}, o VG2 é REVOLUCIONÁRIO! Combina gasometria + imunoensaio em um só aparelho. Para {clinica}, isso significa: menos espaço, menos treinamento, mais eficiência. Vamos conversar?'
    ],
    differentiators: [
      'Único 2 em 1 do mercado',
      'Tecnologia de nanocristais',
      'Otimização de espaço',
      'ROI acelerado'
    ]
  },
  {
    equipment_name: 'Vi1',
    category: 'Analisador Veterinário de Imunofluorescência',
    summary: 'Fluoroimunoensaio com nanocristais. Análises hormonais, função renal, cardíacas e inflamação. Cartões descartáveis, 0,1ml de amostra.',
    technical_specs: {
      tecnologia: 'Fluoroimunoensaio com nanocristais',
      amostra: '0.1 ml',
      cartoes: 'Descartáveis',
      aplicacoes: ['Hormonal', 'Renal', 'Cardíaco', 'Inflamação']
    },
    benefits: [
      'Alta sensibilidade e especificidade',
      'Cartões descartáveis - sem contaminação',
      'Apenas 0,1ml de amostra',
      'Reagentes resistentes',
      'Fácil transporte'
    ],
    target_profile: ['clinica_especializada', 'hospital_veterinario'],
    catchphrases: [
      '🔬 Nanocristais - tecnologia de ponta!',
      '✨ Zero contaminação cruzada',
      '💉 Apenas 0,1ml de amostra',
      '🎯 Hormônios, função renal e cardíaca',
      '📦 Reagentes estáveis - sem desperdício'
    ],
    differentiators: [
      'Tecnologia de nanocristais',
      'Cartões descartáveis',
      'Ampla gama de aplicações',
      'Excelente para especialidades'
    ]
  },
  {
    equipment_name: 'SMT-120VP',
    category: 'Analisador Bioquímico Multifuncional',
    summary: 'Testa até 24 parâmetros simultaneamente com 0,1ml. 15 perfis incluindo coagulograma. Centrífuga integrada, leitura QR Code. Resultados em 12 minutos.',
    technical_specs: {
      parametros_simultaneos: 24,
      amostra: '0.1 ml',
      perfis: 15,
      tempo: '12 minutos',
      centrifuga: 'Integrada',
      leitura: 'QR Code'
    },
    benefits: [
      'Até 24 parâmetros simultâneos',
      '15 perfis disponíveis',
      'Centrífuga integrada',
      'Leitura por QR Code',
      'Sem diluentes externos'
    ],
    target_profile: ['hospital_veterinario', 'clinica_media', 'clinica_especializada'],
    catchphrases: [
      '🎯 24 parâmetros de uma vez!',
      '⏱️ Resultados em 12 minutos',
      '🔄 Centrífuga integrada - tudo em um',
      '📱 QR Code - zero erro de digitação',
      '🦎 Perfeito até para exóticos!'
    ],
    whatsapp_templates: [
      '{nome}, o SMT-120VP é COMPLETO! Bioquímica, coagulação, eletrólitos em um só equipamento. 24 parâmetros simultâneos, centrífuga integrada. {clinica} merece essa evolução!'
    ],
    differentiators: [
      'Centrífuga integrada',
      'Leitura por QR Code',
      '15 perfis pré-programados',
      'Ideal para animais exóticos'
    ]
  },
  {
    equipment_name: 'QT3',
    category: 'Analisador Químico Veterinário Totalmente Automático',
    summary: 'Tecnologia microfluídica. Compatível com rotores circulares e setorizados. Menu completo: bioquímica, eletrólitos, pCO2, coagulação e inflamação.',
    technical_specs: {
      tecnologia: 'Microfluídica',
      rotores: ['Circulares', 'Setorizados'],
      menu: ['Bioquímica', 'Eletrólitos', 'pCO2', 'Coagulação', 'Inflamação'],
      calibracao: 'Curva de calibração'
    },
    benefits: [
      'Totalmente automático',
      'Compacto e fácil de usar',
      'Rotores circulares e setorizados',
      'Menu de testes completo',
      'Curva de calibração'
    ],
    target_profile: ['hospital_veterinario', 'clinica_media'],
    catchphrases: [
      '🎯 Rotores circulares OU setorizados - flexibilidade total!',
      '🔬 Microfluídica - tecnologia de ponta',
      '⚡ Menu completo: bioquímica + eletrólitos + coagulação',
      '🏆 Calibração automática - máxima precisão',
      '💼 Ideal para hospitais exigentes'
    ],
    differentiators: [
      'Compatível com 2 tipos de rotores',
      'Tecnologia microfluídica',
      'Menu mais completo do mercado',
      'Automação total'
    ]
  }
];

export default function LoadEquipmentCatalog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const createMaterialMutation = useMutation({
    mutationFn: (data) => base44.entities.EquipmentMaterial.create(data),
  });

  const loadCatalog = async () => {
    setLoading(true);
    try {
      let created = 0;
      for (const equipment of SEAMATY_EQUIPMENT) {
        await createMaterialMutation.mutateAsync(equipment);
        created++;
        toast.info(`${created}/${SEAMATY_EQUIPMENT.length} equipamentos carregados`);
      }

      queryClient.invalidateQueries(['equipment-materials']);
      setCompleted(true);
      toast.success('Catálogo Seamaty carregado com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar catálogo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-orange-900 to-orange-700 px-4 pt-4 pb-12">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">Carregar Catálogo</h1>
            <p className="text-sm text-orange-200">Seamaty 2025</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        <Card className="p-6 space-y-4">
          <div className="text-center">
            {!completed ? (
              <>
                <Upload className="w-16 h-16 mx-auto mb-4 text-orange-600" />
                <h2 className="font-bold text-xl mb-2">Catálogo Seamaty 2025</h2>
                <p className="text-sm text-slate-600 mb-4">
                  Carregue informações completas de {SEAMATY_EQUIPMENT.length} equipamentos com:
                </p>
                <ul className="text-left text-sm text-slate-700 mb-6 space-y-1">
                  <li>✅ Especificações técnicas detalhadas</li>
                  <li>✅ Frases de efeito para vendas</li>
                  <li>✅ Templates de WhatsApp personalizados</li>
                  <li>✅ Templates de Email prontos</li>
                  <li>✅ Diferenciais competitivos</li>
                  <li>✅ Perfil de cliente ideal</li>
                </ul>
                <Button
                  onClick={loadCatalog}
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 h-14 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Carregar Catálogo Completo
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <h2 className="font-bold text-xl mb-2 text-green-900">Catálogo Carregado!</h2>
                <p className="text-sm text-slate-600 mb-6">
                  {SEAMATY_EQUIPMENT.length} equipamentos prontos para campanhas
                </p>
                <Button
                  onClick={() => navigate(createPageUrl('Campaigns'))}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Ir para Campanhas
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Preview dos Equipamentos */}
        <div className="space-y-3">
          {SEAMATY_EQUIPMENT.map((eq, i) => (
            <Card key={i} className="p-4">
              <h3 className="font-bold text-slate-800 mb-1">{eq.equipment_name}</h3>
              <p className="text-xs text-slate-600 mb-2">{eq.category}</p>
              <p className="text-sm text-slate-700">{eq.summary}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}