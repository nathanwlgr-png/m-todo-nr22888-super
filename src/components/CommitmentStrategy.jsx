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