import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Crown, Copy } from 'lucide-react';
import { toast } from "sonner";

const openingPhrases = [
  "Dr(a), como está o volume de exames de sangue aqui na clínica atualmente?",
  "Quanto tempo leva em média para vocês receberem os resultados dos exames terceirizados?",
  "Já perdeu algum cliente por demora nos resultados de exames?",
  "Como funciona o processo de exames laboratoriais aqui hoje?",
  "Qual o maior desafio com os exames de sangue atualmente?"
];

const authorityPhrases = [
  "Somos líderes em equipamentos laboratoriais veterinários com mais de X anos no mercado.",
  "Mais de 500 clínicas veterinárias já utilizam nossa tecnologia.",
  "Nossos equipamentos têm certificação ANVISA e aprovação de conselhos veterinários.",
  "Trabalhamos com as principais referências em medicina veterinária do Brasil.",
  "Nossa assistência técnica tem tempo de resposta inferior a 24h em todo território nacional."
];

export default function PersuasionPhrases({ profile }) {
  const copyPhrase = (phrase) => {
    navigator.clipboard.writeText(phrase);
    toast.success('Frase copiada!');
  };

  return (
    <div className="space-y-4">
      {/* Opening Phrases */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-800">Frases de Abertura</h3>
        </div>
        <div className="space-y-2">
          {openingPhrases.map((phrase, i) => (
            <button
              key={i}
              onClick={() => copyPhrase(phrase)}
              className="w-full text-left p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all text-sm text-slate-700"
            >
              <div className="flex items-start justify-between gap-2">
                <span>{phrase}</span>
                <Copy className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Authority Phrases */}
      <Card className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-slate-800">Frases de Autoridade</h3>
        </div>
        <div className="space-y-2">
          {authorityPhrases.map((phrase, i) => (
            <button
              key={i}
              onClick={() => copyPhrase(phrase)}
              className="w-full text-left p-3 bg-white rounded-lg border border-amber-100 hover:border-amber-300 hover:shadow-sm transition-all text-sm text-slate-700"
            >
              <div className="flex items-start justify-between gap-2">
                <span>{phrase}</span>
                <Copy className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Profile-Specific Tip */}
      {profile && (
        <Card className="p-3 bg-purple-50 border-purple-200">
          <Badge className="bg-purple-100 text-purple-700 mb-2">
            Dica para Perfil {profile}
          </Badge>
          <p className="text-sm text-slate-700">
            {getProfileTip(profile)}
          </p>
        </Card>
      )}
    </div>
  );
}

function getProfileTip(number) {
  const tips = {
    1: "Use frases diretas e foque em ser pioneiro/líder da região.",
    2: "Enfatize parceria, suporte e relacionamento de longo prazo.",
    3: "Conte histórias de sucesso e mostre cases visuais.",
    4: "Apresente dados técnicos, certificações e garantias.",
    5: "Destaque versatilidade e oportunidade do momento.",
    6: "Foque em qualidade de vida da equipe e cuidado.",
    7: "Forneça especificações técnicas detalhadas sem pressão.",
    8: "Calcule ROI, economia e retorno financeiro claro.",
    9: "Mostre impacto na profissão e legado veterinário."
  };
  return tips[number] || "Adapte sua abordagem ao perfil do cliente.";
}