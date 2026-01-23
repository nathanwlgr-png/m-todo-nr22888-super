import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const SALES_KNOWLEDGE = {
  frameworks: {
    'SPIN Selling': {
      author: 'Neil Rackham',
      techniques: ['Situação', 'Problema', 'Implicação', 'Necessidade-Benefício'],
      description: 'Estrutura de perguntas para diagnosticar necessidades reais'
    },
    'Venda Desafiadora': {
      author: 'Matthew Dixon, Brent Adamson',
      techniques: ['Provocar', 'Ensinar', 'Personalizar'],
      description: 'Desafiar crenças do cliente com insights valiosos'
    },
    'Vender é Humano': {
      author: 'Daniel H. Pink',
      techniques: ['Movimento', 'Clareza', 'Congruência', 'Empatia'],
      description: 'Foco em habilidades blandas e inteligência emocional'
    },
    'Receita Percebida': {
      author: 'Robert Cialdini',
      techniques: ['Reciprocidade', 'Compromisso', 'Prova Social', 'Autoridade', 'Escassez', 'Simpatia'],
      description: 'Gatilhos mentais de influência e persuasão'
    },
    'Como Fazer Amigos': {
      author: 'Dale Carnegie',
      techniques: ['Genuíno interesse', 'Escuta ativa', 'Validação', 'Tomada de perspectiva'],
      description: 'Construção de relacionamentos autênticos e duradouros'
    },
    'A Meta': {
      author: 'Eliyahu Goldratt',
      techniques: ['Constraint Theory', 'Gargalo identificado', 'Otimização processual'],
      description: 'Otimização de processos e identificação de restrições'
    }
  },
  
  emotional_intelligence: {
    'Autoconsciência': [
      'Reconhecer suas emoções em tempo real',
      'Entender seus padrões de reação',
      'Identificar seus gatilhos emocionais',
      'Usar emoções como informação'
    ],
    'Autocontrole': [
      'Regular resposta emocional',
      'Manter calma sob pressão',
      'Adaptabilidade em situações',
      'Responder em vez de reagir'
    ],
    'Empatia': [
      'Reconhecer emoções no cliente',
      'Validar sentimentos expressos',
      'Tomar perspectiva do outro',
      'Responder com compaixão'
    ],
    'Habilidades Sociais': [
      'Influência genuína',
      'Comunicação clara',
      'Liderança pelo exemplo',
      'Construção de confiança'
    ]
  },

  neuromarketing_principles: {
    'Gatilhos Visuais': [
      'Contraste - destaca informação importante',
      'Movimento - atrai atenção',
      'Cores quentes - urgência/ação',
      'Quantidade limitada - escassez visual'
    ],
    'Gatilhos Auditivos': [
      'Tom de voz congruente',
      'Pausa estratégica',
      'Repetição de palavras-chave',
      'Ritmo variado'
    ],
    'Gatilhos Viscerais': [
      'Histórias emocionantes',
      'Dados com peso social',
      'Prova de sucesso de pares',
      'Demonstração tangível'
    ]
  },

  objection_handling: {
    'Preço': [
      'Separar preço de valor',
      'Mostrar ROI/economia',
      'Comparar com custo de não fazer',
      'Oferecer flexibilidade de pagamento'
    ],
    'Tempo': [
      'Deixar pré-qualificado',
      'Urgência ética baseada em scarcity',
      'Agendamento específico',
      'Criar senso de FOMO'
    ],
    'Autoridade': [
      'Estudos científicos',
      'Casos de sucesso similares',
      'Certificações/credenciais',
      'Depoimentos verificáveis'
    ],
    'Confiança': [
      'Transparência completa',
      'Garantias concretas',
      'Prova social quantificada',
      'Risco transferido para você'
    ]
  },

  closing_techniques: {
    'Assumptive Close': 'Agir como se a decisão já foi tomada - naturalmente',
    'Alternative Close': 'Oferecer escolhas entre opções (ambas = sim)',
    'Urgency Close': 'Criar prazo/escassez ética',
    'Trial Close': 'Pergunta de teste antes do fechamento real',
    'Ben Franklin Close': 'Fazer lista de prós vs contras'
  },

  communication: {
    'Asserção': [
      'Eu afirmação clara',
      'Sem culpabilização',
      'Específico e observável',
      'Solução focada'
    ],
    'Listening': [
      'Escuta ativa 70% do tempo',
      'Resumir o que ouviu',
      'Fazer perguntas de clarificação',
      'Validar sentimentos'
    ]
  }
};

export default function SalesKnowledgeBase({ client }) {
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  const applyKnowledgeToClient = async () => {
    setLoading(true);
    try {
      const knowledgePrompt = `BIBLIOTECA DE VENDAS - Aplicar Conhecimento ao Cliente

CLIENTE: ${client.first_name}
Tipo: ${client.client_type}
Status: ${client.status}
Score: ${client.purchase_score}%

FRAMEWORK PRINCIPAL: SPIN Selling + Venda Desafiadora
INTELIGÊNCIA EMOCIONAL: ${client.behavioral_profile}
ESTILO DE COMUNICAÇÃO: ${client.client_tone || 'Não definido'}

Baseado em:
- SPIN: Faça 4 perguntas diagnósticas
- Venda Desafiadora: Qual insight você ofereceria?
- Receita Percebida (Cialdini): Qual gatilho é mais efetivo?
- Inteligência Emocional: Como adaptar tom/empatia?
- Objection Handling: Qual objeção prevista?
- Closing: Qual técnica usar?

Retorne um plano de ação aplicado ao cliente específico:`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: knowledgePrompt,
        response_json_schema: {
          type: "object",
          properties: {
            spin_questions: {
              type: "array",
              items: { type: "string" }
            },
            challenging_insight: { type: "string" },
            cialdini_trigger: { type: "string" },
            emotional_approach: { type: "string" },
            anticipated_objections: {
              type: "array",
              items: { type: "string" }
            },
            recommended_close: { type: "string" },
            communication_style: { type: "string" }
          }
        }
      });

      // Salvar insights no cliente
      await base44.entities.Client.update(client.id, {
        notes: `[APLICAÇÃO DE CONHECIMENTO DE VENDAS]\n
🔄 SPIN QUESTIONS:\n${result.spin_questions.map((q, i) => `${i+1}. ${q}`).join('\n')}\n
💡 INSIGHT: ${result.challenging_insight}\n
🎯 GATILHO CIALDINI: ${result.cialdini_trigger}\n
❤️ EMPATIA: ${result.emotional_approach}\n
⚠️ OBJEÇÕES: ${result.anticipated_objections.join(', ')}\n
🎬 FECHAMENTO: ${result.recommended_close}\n
🗣️ COMUNICAÇÃO: ${result.communication_style}`
      });

      setApplied(true);
      toast.success('Conhecimento de vendas aplicado!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao aplicar conhecimento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Main Card */}
      <Card className="p-4 bg-gradient-to-r from-indigo-600 to-blue-600 border-none text-white shadow-lg">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">📚 Bíblia da Venda Integrada</h3>
            <p className="text-xs text-white/80">6+ Frameworks + Inteligência Emocional</p>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-3 mb-3 backdrop-blur">
          <p className="text-xs text-white mb-2 font-semibold">Livros & Frameworks Base:</p>
          <div className="grid grid-cols-2 gap-1">
            {Object.keys(SALES_KNOWLEDGE.frameworks).map((book, i) => (
              <Badge key={i} className="bg-white/20 text-white text-xs justify-start">
                {book.split(' ')[0]}
              </Badge>
            ))}
          </div>
        </div>

        <Button
          onClick={applyKnowledgeToClient}
          disabled={loading || applied}
          className="w-full h-10 bg-white text-blue-700 hover:bg-white/90 font-bold"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : applied ? (
            <>✓ Aplicado</>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1" />
              Aplicar ao Cliente
            </>
          )}
        </Button>
      </Card>

      {/* Knowledge Cards */}
      <div className="grid grid-cols-1 gap-2">
        <Card className="p-3 bg-purple-50 border-purple-200">
          <p className="text-xs font-bold text-purple-900 mb-2">🎯 FRAMEWORKS (SPIN + Desafiadora)</p>
          {Object.entries(SALES_KNOWLEDGE.frameworks).slice(0, 3).map(([name, data]) => (
            <div key={name} className="text-xs mb-1 pb-1 border-b border-purple-200">
              <p className="font-semibold text-purple-800">{name}</p>
              <p className="text-purple-700">{data.techniques.slice(0, 2).join(', ')}</p>
            </div>
          ))}
        </Card>

        <Card className="p-3 bg-pink-50 border-pink-200">
          <p className="text-xs font-bold text-pink-900 mb-2">❤️ INTELIGÊNCIA EMOCIONAL</p>
          {Object.keys(SALES_KNOWLEDGE.emotional_intelligence).slice(0, 2).map((skill) => (
            <div key={skill} className="text-xs mb-1">
              <p className="font-semibold text-pink-800">{skill}</p>
              <p className="text-pink-700">{SALES_KNOWLEDGE.emotional_intelligence[skill][0]}</p>
            </div>
          ))}
        </Card>

        <Card className="p-3 bg-green-50 border-green-200">
          <p className="text-xs font-bold text-green-900 mb-2">🧠 GATILHOS CIALDINI (Receita Percebida)</p>
          <div className="text-xs text-green-700 space-y-1">
            <p>✓ Escassez: Crie urgência ética</p>
            <p>✓ Prova Social: Use cases similares</p>
            <p>✓ Autoridade: Mostre credenciais</p>
          </div>
        </Card>

        <Card className="p-3 bg-orange-50 border-orange-200">
          <p className="text-xs font-bold text-orange-900 mb-2">🎬 TÉCNICAS DE FECHAMENTO</p>
          <div className="text-xs text-orange-700 space-y-1">
            <p>• Assumptive: Agir como se já decidiu</p>
            <p>• Alternative: Escolhas entre opções</p>
            <p>• Trial Close: Testar antes de fechar</p>
          </div>
        </Card>
      </div>
    </div>
  );
}