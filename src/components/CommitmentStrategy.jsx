import React from 'react';

const strategyByType = {
  clinica_pequena: {
    strategy: "Demonstração Prática com ROI",
    steps: [
      "Mostre economia vs. terceirização em 12 meses",
      "Destaque: 25 meses de garantia + manutenção vitalícia",
      "Apresente bonificação em insumos do mês",
      "Destaque fidelização de clientes pela agilidade",
      "Proposta de financiamento acessível"
    ]
  },
  clinica_media: {
    strategy: "Análise de Capacidade e Crescimento",
    steps: [
      "Calcule aumento de margem por exame próprio",
      "Apresente casos de crescimento após equipamento",
      "Destaque: 25 meses de garantia + manutenção vitalícia",
      "Mostre bonificação em insumos (sem desconto no equipamento)",
      "Demonstre redução de custos operacionais"
    ]
  },
  hospital_veterinario: {
    strategy: "Eficiência Operacional e Volume",
    steps: [
      "Apresente ganho em emergências e UTI",
      "Calcule payback baseado no volume atual",
      "Garantia de 25 meses + manutenção vitalícia = zero preocupação",
      "Bonificação em insumos para começar operando",
      "Demonstre integração com sistemas existentes"
    ]
  },
  laboratorio_terceirizado: {
    strategy: "Expansão de Capacidade",
    steps: [
      "Mostre aumento de throughput",
      "Demonstre redução de custo por exame",
      "25 meses de garantia + manutenção vitalícia = segurança operacional",
      "Bonificação em reagentes para teste inicial",
      "Apresente novos parâmetros disponíveis"
    ]
  },
  clinica_especializada: {
    strategy: "Precisão e Especialização",
    steps: [
      "Destaque precisão para casos complexos",
      "Mostre parâmetros específicos disponíveis",
      "Garantia estendida de 25 meses + manutenção vitalícia",
      "Bonificação em insumos especializados",
      "Demonstre agilidade em diagnósticos críticos"
    ]
  }
};

const commitmentByNumber = {
  1: {
    title: "Fechamento Direto (Líder)",
    tip: "Seja assertivo: 'Você quer ser pioneiro? Vamos fechar hoje e você recebe em X dias.'",
    strategy: "Demonstre liderança e inovação. Use frases de autoridade e decisão rápida."
  },
  2: {
    title: "Fechamento Colaborativo (Diplomata)",
    tip: "Pergunte: 'O que sua equipe precisa para se sentir confortável? Vamos construir isso juntos.'",
    strategy: "Construa confiança gradual. Envolva a equipe, ouça objeções, seja paciente."
  },
  3: {
    title: "Fechamento Entusiasta (Comunicador)",
    tip: "Conte histórias: 'Imagine os tutores comentando a rapidez! Vamos começar essa transformação?'",
    strategy: "Use storytelling e cases de sucesso. Seja entusiasmado e mostre reconhecimento."
  },
  4: {
    title: "Fechamento Estruturado (Construtor)",
    tip: "Apresente cronograma: 'Aqui está o passo a passo: assinatura, instalação, treinamento. Está claro?'",
    strategy: "Detalhe processos, prazos e garantias. Mostre ROI calculado e certificações."
  },
  5: {
    title: "Fechamento Flexível (Aventureiro)",
    tip: "Ofereça opções: 'Temos 3 planos. Qual se adapta melhor ao seu momento?'",
    strategy: "Crie senso de oportunidade única. Mostre versatilidade e liberdade de escolha."
  },
  6: {
    title: "Fechamento Cuidadoso (Protetor)",
    tip: "Foque no benefício: 'Seus pacientes merecem o melhor cuidado. Vamos garantir isso?'",
    strategy: "Enfatize qualidade, bem-estar dos animais e tranquilidade da equipe."
  },
  7: {
    title: "Fechamento Analítico (Analista)",
    tip: "Baseie em dados: 'Os números mostram X. Faz sentido para você avançar?'",
    strategy: "Forneça documentação técnica completa. Não pressione, deixe tempo para análise."
  },
  8: {
    title: "Fechamento Pragmático (Empreendedor)",
    tip: "Fale de resultado: 'ROI em Y meses. Aumento de Z% na margem. Vamos fazer acontecer?'",
    strategy: "Mostre retorno financeiro claro. Foque em crescimento e expansão de mercado."
  },
  9: {
    title: "Fechamento Inspirador (Visionário)",
    tip: "Conecte ao propósito: 'Isso eleva seu padrão de atendimento. Vamos transformar vidas juntos?'",
    strategy: "Mostre impacto social e profissional. Conecte com causa maior e legado."
  },
  11: {
    title: "Fechamento Visionário (Iluminado Mestre)",
    tip: "Inspire transformação: 'Esse equipamento não é só tecnologia, é uma mudança de paradigma no diagnóstico. Vamos liderar essa revolução?'",
    strategy: "Apresente visão disruptiva. Mostre como ele será referência e inspiração para outros. Foque em transformação profunda."
  },
  22: {
    title: "Fechamento Estratégico (Construtor Mestre)",
    tip: "Pense grande: 'Isso é o início de um legado. Em 5 anos sua clínica será referência regional. Vamos construir esse futuro?'",
    strategy: "Mostre visão de longo prazo e escala. Fale de legado institucional e impacto duradouro. Cases de transformação."
  }
};

export default function CommitmentStrategy({ clientType, numerologyNumber }) {
  const typeStrategy = strategyByType[clientType] || strategyByType.clinica_pequena;
  const numberCommitment = commitmentByNumber[numerologyNumber] || commitmentByNumber[1];

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
        <p className="text-xs text-emerald-700 font-bold mb-1">✓ DIFERENCIAIS</p>
        <ul className="text-xs text-emerald-800 space-y-1">
          <li>• 25 meses de garantia (não 12!)</li>
          <li>• Manutenção vitalícia inclusa</li>
          <li>• Bonificação em insumos (não damos desconto no equipamento)</li>
        </ul>
      </div>

      <div>
        <p className="text-xs text-indigo-600 font-medium mb-2 uppercase">Estratégia por Tipo</p>
        <p className="font-semibold text-slate-800 mb-2">{typeStrategy.strategy}</p>
        <ul className="space-y-2">
          {typeStrategy.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-indigo-500 mt-0.5 font-bold">→</span>
              {step}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="pt-3 border-t border-indigo-100 bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg">
        <p className="text-xs text-violet-600 font-medium mb-1 uppercase flex items-center gap-1">
          ✨ {numberCommitment.title}
        </p>
        <p className="text-sm text-slate-700 font-semibold mb-2">
          {numberCommitment.tip}
        </p>
        <p className="text-xs text-slate-600 italic">
          {numberCommitment.strategy}
        </p>
      </div>
    </div>
  );
}