import React from 'react';
import { Card } from "@/components/ui/card";
import { Sparkles, Brain, Target, TrendingUp } from 'lucide-react';

const profiles = {
  1: {
    title: 'Líder Natural',
    description: 'Pessoa decidida, independente e pioneira. Valoriza inovação e autonomia.',
    decision: 'Decide rápido quando vê benefício claro. Mostre liderança de mercado.',
    tips: 'Seja direto, mostre que é novidade, destaque exclusividade.'
  },
  2: {
    title: 'Diplomata',
    description: 'Pessoa cooperativa, sensível e detalhista. Valoriza harmonia e parceria.',
    decision: 'Precisa de tempo e confiança. Construa relacionamento antes de vender.',
    tips: 'Seja paciente, ouça mais, ofereça suporte pós-venda.'
  },
  3: {
    title: 'Comunicador',
    description: 'Pessoa criativa, otimista e expressiva. Valoriza novidade e reconhecimento.',
    decision: 'Decide por entusiasmo. Use histórias de sucesso e cases.',
    tips: 'Seja animado, conte histórias, mostre resultados visuais.'
  },
  4: {
    title: 'Construtor',
    description: 'Pessoa prática, organizada e metódica. Valoriza estabilidade e processos.',
    decision: 'Decide com dados e garantias. Apresente números e certificações.',
    tips: 'Seja técnico, mostre garantia, apresente cronograma claro.'
  },
  5: {
    title: 'Aventureiro',
    description: 'Pessoa versátil, curiosa e adaptável. Valoriza liberdade e variedade.',
    decision: 'Decide por impulso quando vê oportunidade. Crie senso de oportunidade.',
    tips: 'Mostre versatilidade do produto, ofereça opções, seja flexível.'
  },
  6: {
    title: 'Cuidador',
    description: 'Pessoa responsável, protetora e familiar. Valoriza qualidade e cuidado.',
    decision: 'Decide pensando na equipe/família. Mostre impacto positivo no ambiente.',
    tips: 'Fale sobre qualidade de vida, segurança, bem-estar da equipe.'
  },
  7: {
    title: 'Analista',
    description: 'Pessoa reflexiva, investigativa e especialista. Valoriza conhecimento profundo.',
    decision: 'Decide após análise completa. Forneça documentação técnica detalhada.',
    tips: 'Seja técnico, não pressione, deixe tempo para pesquisar.'
  },
  8: {
    title: 'Empreendedor',
    description: 'Pessoa ambiciosa, prática e focada em resultados. Valoriza ROI e eficiência.',
    decision: 'Decide por retorno financeiro. Mostre ROI e economia.',
    tips: 'Fale em números, mostre lucro, apresente cases de sucesso.'
  },
  9: {
    title: 'Visionário',
    description: 'Pessoa idealista, humanitária e inspiradora. Valoriza propósito e impacto.',
    decision: 'Decide por propósito maior. Mostre impacto social/profissional.',
    tips: 'Fale sobre contribuição, mostre visão de futuro, seja inspirador.'
  }
};

export default function NumerologyCard({ number, showFull = true }) {
  const profile = profiles[number] || profiles[1];
  
  return (
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-none">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">{number}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Número da Alma</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800">{profile.title}</h3>
          </div>
        </div>
        
        <p className="text-slate-600 text-sm leading-relaxed">{profile.description}</p>
      </Card>
      
      {showFull && (
        <>
          <Card className="p-4 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-700 text-sm">Estilo de Decisão</span>
            </div>
            <p className="text-slate-600 text-sm">{profile.decision}</p>
          </Card>
          
          <Card className="p-4 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-slate-700 text-sm">Dicas de Abordagem</span>
            </div>
            <p className="text-slate-600 text-sm">{profile.tips}</p>
          </Card>
        </>
      )}
    </div>
  );
}