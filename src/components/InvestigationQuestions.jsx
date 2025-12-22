import React from 'react';

const questionsByType = {
  clinica_pequena: [
    "Quantos exames você envia para terceirização por mês?",
    "Quanto tempo os tutores esperam pelos resultados?",
    "Você perde clientes pela demora nos resultados?",
    "Qual o custo mensal com laboratório terceirizado?"
  ],
  clinica_media: [
    "Qual a sua capacidade atual de exames por dia?",
    "Quanto você gasta com envio para laboratórios?",
    "Os tutores pedem agilidade nos resultados?",
    "Você tem espaço para equipamento próprio?"
  ],
  hospital_veterinario: [
    "Quantos exames de sangue são feitos diariamente?",
    "Qual o tempo médio de espera por resultados externos?",
    "Você tem casos de emergência que precisam de resultado rápido?",
    "Qual o custo operacional com laboratórios terceirizados?"
  ],
  laboratorio_terceirizado: [
    "Qual a capacidade atual de processamento?",
    "Você recebe demandas de clínicas que precisam agilidade?",
    "Seus equipamentos estão atualizados?",
    "Há planos de expansão de serviços?"
  ],
  clinica_especializada: [
    "Quais especialidades vocês atendem?",
    "Vocês realizam procedimentos que precisam de exames rápidos?",
    "Qual o perfil dos casos que atendem?",
    "A agilidade diagnóstica é crítica para suas especialidades?"
  ]
};

const questionsByNumber = {
  1: "O que te faria ser o PRIMEIRO da região a ter este equipamento?",
  2: "Como sua EQUIPE se beneficiaria com resultados mais rápidos?",
  3: "Como você COMPARTILHARIA o sucesso deste investimento?",
  4: "Quais GARANTIAS e certificações são importantes para você?",
  5: "Que NOVAS POSSIBILIDADES esse equipamento traria?",
  6: "Como isso melhoraria o CUIDADO com seus pacientes?",
  7: "Que DADOS TÉCNICOS você precisa ver para ter certeza?",
  8: "Qual o RETORNO FINANCEIRO que você espera?",
  9: "Como isso contribuiria para seu PROPÓSITO maior?"
};

export default function InvestigationQuestions({ clientType, numerologyNumber }) {
  const typeQuestions = questionsByType[clientType] || questionsByType.clinica_pequena;
  const numerologyQuestion = questionsByNumber[numerologyNumber] || questionsByNumber[1];

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-purple-600 font-medium mb-2 uppercase">Por tipo de cliente</p>
        <ul className="space-y-2">
          {typeQuestions.map((q, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-purple-500 mt-0.5 font-bold">{i + 1}.</span>
              {q}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="pt-3 border-t border-purple-100">
        <p className="text-xs text-indigo-600 font-medium mb-2 uppercase">Pergunta numerológica</p>
        <p className="text-sm text-slate-700 bg-indigo-50 p-3 rounded-lg">
          💡 {numerologyQuestion}
        </p>
      </div>
    </div>
  );
}