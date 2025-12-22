import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Brain, Users, Target } from 'lucide-react';

const frameworksByNumber = {
  1: {
    arteDaGuerra: "Ataque rápido e decisivo. 'A velocidade é a essência da guerra.' Demonstre superioridade tecnológica imediatamente.",
    spin: "Foque em NEED-PAYOFF: 'Como ser pioneiro impactaria seu negócio?' Menos perguntas de situação, mais de necessidade.",
    persuasao: "AUTORIDADE: Mostre certificações, liderança de mercado. Use escassez: 'Apenas 3 unidades neste trimestre'.",
    intEmocional: "Alta autoconfiança. Seja assertivo, não submisso. Respeite a independência dele."
  },
  2: {
    arteDaGuerra: "Aliança estratégica. 'Conheça seu aliado.' Construa confiança antes de atacar. Paciência.",
    spin: "SITUATION e PROBLEM suaves: 'Como sua equipe se sente com o processo atual?' Envolva todos.",
    persuasao: "RECIPROCIDADE e SIMPATIA: Dê algo primeiro (consultoria grátis). Construa amizade genuína.",
    intEmocional: "Alta empatia necessária. Leia emoções sutis. Valide sentimentos da equipe."
  },
  3: {
    arteDaGuerra: "Guerra psicológica positiva. Use storytelling como arma. 'Vença sem lutar' - inspire.",
    spin: "IMPLICATION dramática: 'E se você perder clientes para concorrentes mais ágeis?' Use emoção.",
    persuasao: "CONSENSO SOCIAL: 'Todo mundo está comentando'. Cases de sucesso emocionantes. Reconhecimento público.",
    intEmocional: "Seja entusiasmado e positivo. Celebre pequenas vitórias. Mostre otimismo contagiante."
  },
  4: {
    arteDaGuerra: "Planejamento meticuloso. 'Vence quem calcula mais'. Apresente estratégia detalhada passo a passo.",
    spin: "SITUATION profunda: Mapeie TODO o processo atual. PROBLEM com dados concretos e números.",
    persuasao: "CONSISTÊNCIA: Documentação perfeita. Processo claro. Garantias sólidas. Zero surpresas.",
    intEmocional: "Autorregulação máxima. Não pressione. Seja extremamente organizado e previsível."
  },
  5: {
    arteDaGuerra: "Flexibilidade tática. 'Seja como a água'. Adapte-se rapidamente. Múltiplas abordagens.",
    spin: "NEED-PAYOFF criativo: 'Imagine ter 3 equipamentos diferentes em 1!' Versatilidade como foco.",
    persuasao: "ESCASSEZ: 'Oportunidade única'. NOVIDADE: Mostre features exclusivas. Senso de urgência.",
    intEmocional: "Alta adaptabilidade. Mude de estratégia conforme reação. Seja dinâmico."
  },
  6: {
    arteDaGuerra: "Proteção e defesa. 'O general invencível protege primeiro'. Mostre como protege os pacientes dele.",
    spin: "PROBLEM emocional: 'Como você se sente quando não pode dar o melhor aos animais?' Responsabilidade.",
    persuasao: "COMPROMISSO: 'Você se importa com qualidade, certo?' Depois venda. AUTORIDADE em cuidado.",
    intEmocional: "Empatia profunda. Mostre que você SE IMPORTA de verdade. Seja protetor também."
  },
  7: {
    arteDaGuerra: "Inteligência estratégica. 'Conheça o inimigo e a si mesmo'. Forneça análise COMPLETA do mercado.",
    spin: "SITUATION e PROBLEM técnicos profundos. IMPLICATION científica. Dados, estudos, evidências.",
    persuasao: "AUTORIDADE TÉCNICA máxima. Especialistas, certificações, comparativos. Zero apelo emocional.",
    intEmocional: "Autoconhecimento. Admita limitações se houver. Seja profundamente honesto e técnico."
  },
  8: {
    arteDaGuerra: "Domínio do campo de batalha. 'Conquiste posições estratégicas'. Mostre como ele DOMINA o mercado.",
    spin: "NEED-PAYOFF financeiro agressivo: 'Quanto você ganharia com 30% mais margem?' ROI é tudo.",
    persuasao: "AUTORIDADE de resultado. Cases de crescimento. ESCASSEZ de oportunidade de mercado.",
    intEmocional: "Alta motivação. Foque em conquista e poder. Seja ambicioso e pragmático."
  },
  9: {
    arteDaGuerra: "Propósito nobre. 'O general compassivo é seguido voluntariamente'. Inspire uma causa maior.",
    spin: "IMPLICATION humanitária: 'E se você pudesse salvar mais vidas?' NEED-PAYOFF sobre impacto social.",
    persuasao: "PROPÓSITO como persuasão máxima. Mostre transformação social. Legado e significado.",
    intEmocional: "Empatia universal. Conecte emocionalmente com missão veterinária. Seja inspirador."
  },
  11: {
    arteDaGuerra: "Estratégia visionária. 'Antecipe 10 movimentos'. Mostre futuro disruptivo da medicina veterinária.",
    spin: "IMPLICATION visionária: 'E se você não acompanhar a revolução?' NEED-PAYOFF transformador.",
    persuasao: "VISÃO como persuasão. Mostre que ele será REFERÊNCIA. Inspire transformação profunda.",
    intEmocional: "Alta intuição. Conecte energeticamente. Seja profundo e transformador."
  },
  22: {
    arteDaGuerra: "Construção de império. 'Vença a guerra, não apenas batalhas'. Pense em domínio regional de longo prazo.",
    spin: "NEED-PAYOFF de legado: 'Como seria construir a maior referência da região?' Escala e impacto.",
    persuasao: "AUTORIDADE institucional. Cases de transformação duradoura. Construção de império.",
    intEmocional: "Motivação de realização máxima. Foque em construir algo GRANDE e duradouro."
  }
};

export default function StrategicFrameworks({ numerologyNumber }) {
  const framework = frameworksByNumber[numerologyNumber] || frameworksByNumber[1];

  return (
    <div className="space-y-3">
      <Card className="p-4 bg-red-50 border-red-200">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-red-600" />
          <h4 className="font-semibold text-slate-800 text-sm">A Arte da Guerra</h4>
        </div>
        <p className="text-xs text-slate-700">{framework.arteDaGuerra}</p>
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-blue-600" />
          <h4 className="font-semibold text-slate-800 text-sm">SPIN Selling</h4>
        </div>
        <p className="text-xs text-slate-700">{framework.spin}</p>
        <div className="mt-2 flex gap-1 flex-wrap">
          <Badge variant="outline" className="text-[10px]">Situation</Badge>
          <Badge variant="outline" className="text-[10px]">Problem</Badge>
          <Badge variant="outline" className="text-[10px]">Implication</Badge>
          <Badge variant="outline" className="text-[10px]">Need-Payoff</Badge>
        </div>
      </Card>

      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-purple-600" />
          <h4 className="font-semibold text-slate-800 text-sm">Persuasão (Cialdini)</h4>
        </div>
        <p className="text-xs text-slate-700">{framework.persuasao}</p>
      </Card>

      <Card className="p-4 bg-emerald-50 border-emerald-200">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-emerald-600" />
          <h4 className="font-semibold text-slate-800 text-sm">Inteligência Emocional</h4>
        </div>
        <p className="text-xs text-slate-700">{framework.intEmocional}</p>
      </Card>
    </div>
  );
}

export { frameworksByNumber };