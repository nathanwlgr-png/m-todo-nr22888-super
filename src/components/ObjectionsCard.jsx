import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const objectionsByType = {
  clinica_pequena: [
    {
      objection: "Muito caro para o meu volume",
      response: "O ROI vem pela fidelização de clientes. Com resultados em 10 min, você mantém o cliente na clínica e aumenta ticket médio. Calcule: terceirização custa R$X por exame, equipamento se paga em Y meses."
    },
    {
      objection: "Não tenho volume suficiente",
      response: "Você não tem volume PORQUE terceiriza. Clientes vão onde têm resultado rápido. Com equipamento próprio, você cria demanda e aumenta consultas de retorno."
    },
    {
      objection: "E se o equipamento quebrar?",
      response: "Garantia de X anos + assistência técnica em 24h. Custo de manutenção preventiva é menor que perder clientes por atraso em resultados."
    }
  ],
  clinica_media: [
    {
      objection: "Já tenho parceria com laboratório",
      response: "Quanto você perde em clientes que não retornam? Com equipamento próprio: resultado em 10min, cliente espera, você fideliza E aumenta margem por exame."
    },
    {
      objection: "Minha equipe não tem capacitação",
      response: "Treinamento completo incluso + suporte técnico permanente. Equipamento é automatizado, técnico opera após 2 dias de treinamento."
    },
    {
      objection: "Preciso consultar sócios",
      response: "Perfeito. Prepare esta apresentação: economia anual de R$X vs terceirização, aumento de Y% na retenção de clientes, payback em Z meses. Posso ajudar a montar?"
    }
  ],
  hospital_veterinario: [
    {
      objection: "Já temos equipamento",
      response: "Excelente! Qual a idade? Nosso modelo mais recente tem [vantagens específicas]: maior velocidade, mais parâmetros, menor custo por teste. Vale calcular upgrade."
    },
    {
      objection: "Precisa passar por comitê de compras",
      response: "Perfeito. Vou preparar dossiê técnico completo: comparativo de custos, ROI projetado, especificações técnicas, cases de hospitais similares. Quando é a próxima reunião?"
    },
    {
      objection: "Orçamento comprometido este ano",
      response: "Entendo. Temos leasing com entrada mínima e parcelas que cabem no fluxo operacional. Equipamento se paga com economia em terceirização. Posso simular?"
    }
  ],
  laboratorio_terceirizado: [
    {
      objection: "Já tenho toda estrutura montada",
      response: "Perfeito para expansão! Novo equipamento aumenta capacidade, reduz tempo de processamento e permite aceitar mais clientes. ROI via crescimento."
    },
    {
      objection: "Preciso de tecnologia mais avançada",
      response: "Nosso equipamento tem [especificações top]: automação completa, interface com LIS, rastreabilidade total. Certificações ANVISA e ISO. Quer ver demo técnica?"
    },
    {
      objection: "Fornecedor atual atende bem",
      response: "Ótimo ter bom fornecedor. Vale comparar: nosso suporte técnico <24h, treinamento contínuo, upgrade de software incluso. Segunda opinião sempre agrega."
    }
  ],
  clinica_especializada: [
    {
      objection: "Meu público é muito específico",
      response: "Justamente! Equipamento próprio reforça sua especialização. Cliente vê estrutura completa e te reconhece como referência. Diferencial competitivo claro."
    },
    {
      objection: "Preciso avaliar outras marcas",
      response: "Claro, comparação é saudável. Nossa vantagem: [diferenciais específicos]. Posso fazer demo comparativa? Você decide com dados reais."
    },
    {
      objection: "Investimento não é prioridade agora",
      response: "Entendo. Quando seria o momento ideal? Posso deixar proposta válida por X dias. Muitos especialistas relatam que equipamento próprio aumentou reconhecimento no mercado."
    }
  ]
};

const objectionsByRole = {
  proprietario: "Pensa em: ROI, payback, risco financeiro, impacto no faturamento",
  veterinario_responsavel: "Pensa em: qualidade técnica, confiabilidade, impacto no diagnóstico",
  gestor_laboratorio: "Pensa em: eficiência operacional, produtividade, métricas de performance",
  coordenador_tecnico: "Pensa em: especificações técnicas, precisão, manutenção",
  socio: "Pensa em: retorno do investimento, vantagem competitiva, crescimento"
};

export default function ObjectionsCard({ clientType, decisionRole }) {
  const objections = objectionsByType[clientType] || [];
  const roleContext = objectionsByRole[decisionRole];

  return (
    <div className="space-y-4">
      {/* Role Context */}
      {roleContext && (
        <Card className="p-3 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-purple-900 mb-1">Contexto do Decisor</p>
              <p className="text-sm text-purple-700">{roleContext}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Objections */}
      {objections.map((item, i) => (
        <Card key={i} className="p-4 bg-white border-l-4 border-l-red-400">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <Badge className="bg-red-100 text-red-700 mb-2">Objeção Comum</Badge>
              <p className="font-semibold text-slate-800">{item.objection}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 pl-7">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <Badge className="bg-green-100 text-green-700 mb-2">Como Responder</Badge>
              <p className="text-sm text-slate-700 leading-relaxed">{item.response}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}