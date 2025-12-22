import React from 'react';

const strategyByType = {
  clinica_pequena: {
    strategy: "Demonstração Prática com ROI",
    steps: [
      "Mostre economia vs. terceirização em 12 meses",
      "Ofereça teste gratuito por 7 dias",
      "Destaque a fidelização de clientes pela agilidade",
      "Proposta de financiamento acessível"
    ]
  },
  clinica_media: {
    strategy: "Análise de Capacidade e Crescimento",
    steps: [
      "Calcule aumento de margem por exame próprio",
      "Apresente casos de crescimento após equipamento",
      "Mostre redução de custos operacionais",
      "Ofereça garantia estendida e treinamento"
    ]
  },
  hospital_veterinario: {
    strategy: "Eficiência Operacional e Volume",
    steps: [
      "Apresente ganho em emergências e UTI",
      "Calcule payback baseado no volume atual",
      "Demonstre integração com sistemas existentes",
      "Ofereça suporte técnico 24/7"
    ]
  },
  laboratorio_terceirizado: {
    strategy: "Expansão de Capacidade",
    steps: [
      "Mostre aumento de throughput",
      "Demonstre redução de custo por exame",
      "Apresente novos parâmetros disponíveis",
      "Ofereça upgrade de equipamentos antigos"
    ]
  },
  clinica_especializada: {
    strategy: "Precisão e Especialização",
    steps: [
      "Destaque precisão para casos complexos",
      "Mostre parâmetros específicos disponíveis",
      "Demonstre agilidade em diagnósticos críticos",
      "Ofereça consultoria técnica especializada"
    ]
  }
};

const commitmentByNumber = {
  1: {
    title: "Fechamento Direto",
    tip: "Seja assertivo: 'Você quer ser pioneiro? Vamos fechar hoje e você recebe em X dias.'"
  },
  2: {
    title: "Fechamento Colaborativo",
    tip: "Pergunte: 'O que sua equipe precisa para se sentir confortável? Vamos construir isso juntos.'"
  },
  3: {
    title: "Fechamento Entusiasta",
    tip: "Conte histórias: 'Imagine os tutores comentando a rapidez! Vamos começar essa transformação?'"
  },
  4: {
    title: "Fechamento Estruturado",
    tip: "Apresente cronograma: 'Aqui está o passo a passo: assinatura, instalação, treinamento. Está claro?'"
  },
  5: {
    title: "Fechamento Flexível",
    tip: "Ofereça opções: 'Temos 3 planos. Qual se adapta melhor ao seu momento?'"
  },
  6: {
    title: "Fechamento Cuidadoso",
    tip: "Foque no benefício: 'Seus pacientes merecem o melhor cuidado. Vamos garantir isso?'"
  },
  7: {
    title: "Fechamento Analítico",
    tip: "Baseie em dados: 'Os números mostram X. Faz sentido para você avançar?'"
  },
  8: {
    title: "Fechamento Pragmático",
    tip: "Fale de resultado: 'ROI em Y meses. Aumento de Z% na margem. Vamos fazer acontecer?'"
  },
  9: {
    title: "Fechamento Inspirador",
    tip: "Conecte ao propósito: 'Isso eleva seu padrão de atendimento. Vamos transformar vidas juntos?'"
  }
};

export default function CommitmentStrategy({ clientType, numerologyNumber }) {
  const typeStrategy = strategyByType[clientType] || strategyByType.clinica_pequena;
  const numberCommitment = commitmentByNumber[numerologyNumber] || commitmentByNumber[1];

  return (
    <div className="space-y-4">
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
        <p className="text-xs text-violet-600 font-medium mb-1 uppercase">
          {numberCommitment.title}
        </p>
        <p className="text-sm text-slate-700 font-medium">
          {numberCommitment.tip}
        </p>
      </div>
    </div>
  );
}