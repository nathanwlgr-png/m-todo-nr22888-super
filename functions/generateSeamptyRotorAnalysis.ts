import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Análise dos rotores e suas enzimas/parâmetros
    const rotors = [
      {
        name: '16 Health Check Parameters',
        color: 'Verde',
        code: 'AYD3382',
        parameters: [
          { abbr: 'ALB', name: 'Albumina', function: 'Proteína do plasma, função nutricional e transporte' },
          { abbr: 'ALT', name: 'Alanina Aminotransferase', function: 'Enzima citossólica de hepatócitos, marcador de lesão hepática' },
          { abbr: 'AMY', name: 'Alfa-Amilase', function: 'Enzima que degrada carboidratos, marcador pancreático' },
          { abbr: 'AST', name: 'Aspartato Aminotransferase', function: 'Enzima mitocondrial, lesão hepatocelular ou muscular' },
          { abbr: 'GLU', name: 'Glicose', function: 'Metabolismo energético e glicêmico' },
          { abbr: 'CK', name: 'Creatina Quinase', function: 'Enzima muscular e cerebral, indicadora de dano muscular' },
          { abbr: 'Ca', name: 'Cálcio Total', function: 'Homeostase mineral, coagulação e contração muscular' },
          { abbr: 'CREA', name: 'Creatinina', function: 'Produto do metabolismo muscular, marcador renal' },
          { abbr: 'BUN', name: 'Nitrogênio Ureico no Sangue', function: 'Metabolismo proteico, função renal' },
          { abbr: 'TB', name: 'Bilirrubina Total', function: 'Metabolismo de hemoglobina, função hepática' },
          { abbr: 'TG', name: 'Triglicerídeos', function: 'Lipídeos sangüíneos, metabolismo lipídico' },
          { abbr: 'TP', name: 'Proteína Total', function: 'Avaliação nutricional e imunológica' },
          { abbr: 'PHOS', name: 'Fosfato', function: 'Metabolismo mineral e ósseo' },
          { abbr: 'A/G', name: 'Razão Albumina/Globulina', function: 'Índice proteico, saúde geral' },
          { abbr: 'B/C', name: 'Razão Uréia/Creatinina no sangue', function: 'Avaliação de desidratação' },
          { abbr: 'GLOB', name: 'Globulina', function: 'Proteína imunológica, resposta imune' }
        ]
      },
      {
        name: '13 Electrolyte Plus Parameters',
        color: 'Rosa',
        code: 'AY0316',
        parameters: [
          { abbr: 'BUN', name: 'Nitrogênio Ureico no Sangue', function: 'Função renal e metabolismo proteico' },
          { abbr: 'Ca', name: 'Cálcio', function: 'Homeostase mineral, excitabilidade neuromuscular' },
          { abbr: 'Ph', name: 'Potencial Hidrogeniônico', function: 'Equilíbrio ácido-base corporal' },
          { abbr: 'Cl', name: 'Cloro Total', function: 'Balanço eletrolítico e hídrico' },
          { abbr: 'K', name: 'Potássio', function: 'Transmissão neuromuscular e função cardíaca' },
          { abbr: 'Na', name: 'Sódio', function: 'Regulação osmótica e equilíbrio hídrico' },
          { abbr: 'Mg', name: 'Magnésio', function: 'Cofator enzimático, transmissão neuromuscular' },
          { abbr: 'tCO2', name: 'Teor de Dióxido de Carbono', function: 'Equilíbrio ácido-base e respiratório' },
          { abbr: 'PHOS', name: 'Fosfato', function: 'Metabolismo mineral e energético' },
          { abbr: 'GLU', name: 'Glicose', function: 'Metabolismo energético' },
          { abbr: 'CREA', name: 'Creatinina', function: 'Marcador de função renal' },
          { abbr: 'B/C', name: 'Razão Uréia/Creatinina no sangue', function: 'Avaliação de função renal' }
        ]
      },
      {
        name: '11 Liver Function Parameters (Fígado)',
        color: 'Rosa',
        code: 'AY0316',
        parameters: [
          { abbr: 'ALB', name: 'Albumina', function: 'Síntese hepática, transporte de nutrientes' },
          { abbr: 'ALT', name: 'Alanina Aminotransferase', function: 'Marcador específico de lesão hepatocelular' },
          { abbr: 'AST', name: 'Aspartato Aminotransferase', function: 'Lesão hepatocelular e muscular' },
          { abbr: 'ALP/FA', name: 'Fosfatase Alcalina', function: 'Enzima de membrana, colestase e osteoblastos' },
          { abbr: 'GGT', name: 'Gama Glutamil Transpeptidase', function: 'Colestase intrahepática e extrahepática' },
          { abbr: 'TBA', name: 'Ácidos Biliares Totais', function: 'Síntese hepática e função hepatocelular' },
          { abbr: 'TB', name: 'Bilirrubina Total', function: 'Metabolismo hepático de hemoglobina' },
          { abbr: 'TC', name: 'Colesterol Total', function: 'Síntese hepática, metabolismo lipídico' },
          { abbr: 'TP', name: 'Proteína total', function: 'Avaliação nutricional hepática' },
          { abbr: 'A/G', name: 'Razão Albumina/Globulina', function: 'Índice de síntese proteica' },
          { abbr: 'GLOB', name: 'Globulina', function: 'Proteína imunológica hepática' }
        ]
      },
      {
        name: '10 Pre-Operation Test Parameters',
        color: 'Azul',
        code: 'AY03182',
        parameters: [
          { abbr: 'ALP/FA', name: 'Fosfatase Alcalina', function: 'Avaliação de lesão hepática pré-cirúrgica' },
          { abbr: 'ALT', name: 'Alanina Aminotransferase', function: 'Lesão hepática em pacientes cirúrgicos' },
          { abbr: 'AST', name: 'Aspartato Aminotransferase', function: 'Avaliação cardio-muscular pré-cirúrgica' },
          { abbr: 'CK', name: 'Creatina Quinase', function: 'Integridade muscular pré-operatória' },
          { abbr: 'CREA', name: 'Creatinina', function: 'Avaliação renal pré-cirúrgica' },
          { abbr: 'GLU', name: 'Glicose', function: 'Estabilidade metabólica pré-operatória' },
          { abbr: 'LDH', name: 'Lactato Desidrogenase', function: 'Avaliação de hipóxia tecidual' },
          { abbr: 'TP', name: 'Proteína total', function: 'Reserva nutricional para cirurgia' },
          { abbr: 'BUN', name: 'Nitrogênio Ureico no Sangue', function: 'Função renal pré-cirúrgica' },
          { abbr: 'B/C', name: 'Razão Uréia/Creatinina no sangue', function: 'Avaliação de desidratação' }
        ]
      },
      {
        name: '9 Kidney Function Parameters (Rim)',
        color: 'Roxo',
        code: 'AY0314',
        parameters: [
          { abbr: 'c-Cys C', name: 'Proteína C-Reativa', function: 'Marcador de inflamação renal' },
          { abbr: 'ALB', name: 'Albumina', function: 'Síntese hepática e estado nutricional' },
          { abbr: 'CREA', name: 'Creatinina', function: 'Marcador específico de função renal' },
          { abbr: 'Ca', name: 'Cálcio', function: 'Metabolismo mineral renal' },
          { abbr: 'GLU', name: 'Glicose', function: 'Proteção glomerular' },
          { abbr: 'PHOS', name: 'Fosfato', function: 'Metabolismo mineral renal' },
          { abbr: 'UA', name: 'Ácido Úrico', function: 'Excreção renal de ácido úrico' },
          { abbr: 'BUN', name: 'Nitrogênio Ureico no Sangue', function: 'Filtração glomerular' },
          { abbr: 'Tce2', name: 'Teor de Dióxido de Carbono', function: 'Equilíbrio ácido-base' },
          { abbr: 'B/C', name: 'Razão Uréia/Creatinina no sangue', function: 'Avaliação de função renal' }
        ]
      },
      {
        name: '12 Feline Inflammation',
        color: 'Branco',
        code: 'AY03182',
        parameters: [
          { abbr: 'F-SAA', name: 'Soro Amilóide A Felino', function: 'Marcador inflamatório específico para gatos' },
          { abbr: 'BUN', name: 'Nitrogênio Ureico no Sangue', function: 'Inflamação renal' },
          { abbr: 'CREA', name: 'Creatinina', function: 'Função renal em inflamação' },
          { abbr: 'ALB', name: 'Albumina', function: 'Desnutrição por inflamação crônica' },
          { abbr: 'LPS', name: 'Lipase', function: 'Marcador de pancreatite felina' },
          { abbr: 'TBA', name: 'Ácidos Biliares Totais', function: 'Inflamação hepatobiliar' },
          { abbr: 'ALP/FA', name: 'Fosfatase Alcalina', function: 'Colestase inflamatória' },
          { abbr: 'GGT', name: 'Gama Glutamil Transpeptidase', function: 'Colestase em inflamação' },
          { abbr: 'TP', name: 'Proteína total', function: 'Resposta inflamatória sistêmica' },
          { abbr: 'A/G', name: 'Razão Albumina/Globulina', function: 'Resposta imune inflamatória' },
          { abbr: 'B/C', name: 'Razão Uréia/Creatinina no sangue', function: 'Hidratação em inflamação' },
          { abbr: 'GLOB', name: 'Globulina', function: 'Resposta imune inflamatória' }
        ]
      }
    ];

    // Gerar análise completa com IA
    let analysisContent = '';
    
    for (const rotor of rotors) {
      const prompt = `Analise clinicamente o rotor ${rotor.name} com os seguintes parâmetros: ${rotor.parameters.map(p => p.abbr).join(', ')}. 
      Para cada grupo de parâmetros, forneça:
      1. Função fisiológica em medicina veterinária
      2. 6 casos clínicos reais de uso na clínica veterinária
      3. Interpretação clínica
      Seja detalhado e específico para clínicas veterinárias.`;

      try {
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              physiological_function: { type: "string" },
              clinical_cases: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    case_number: { type: "number" },
                    animal_type: { type: "string" },
                    condition: { type: "string" },
                    findings: { type: "string" },
                    clinical_outcome: { type: "string" }
                  }
                }
              },
              clinical_interpretation: { type: "string" }
            }
          }
        });

        analysisContent += JSON.stringify({ rotor, analysis }, null, 2) + '\n\n';
      } catch (e) {
        console.error(`Erro na análise de ${rotor.name}:`, e);
      }
    }

    // Buscar referências científicas atualizadas
    const references = await base44.integrations.Core.InvokeLLM({
      prompt: `Liste as 15 referências bibliográficas mais recentes (2020-2026) sobre análise bioquímica em medicina veterinária, enzimas séricas, função renal hepática e inflamação em animais de companhia. Forneça no formato: Autor et al. (Ano). Título. Revista. Volume(Edição):páginas.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          references: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({
      success: true,
      analysis: analysisContent,
      references: references.references || [],
      rotors: rotors
    });
  } catch (error) {
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});