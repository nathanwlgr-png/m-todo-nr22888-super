import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BookOpen, Brain, Zap, Users } from 'lucide-react';
import { toast } from 'sonner';
import { executeWithRateLimit } from '@/utils/rateLimitManager';

const SALES_BIBLE = {
  frameworks: {
    'SPIN Selling': {
      author: 'Neil Rackham',
      key: 'Diagnosticar necessidades reais com perguntas estruturadas',
      techniques: ['Situação', 'Problema', 'Implicação', 'Necessidade-Benefício'],
      use_case: 'Quando: Descobrir pain points | Como: S→P→I→N'
    },
    'Venda Desafiadora': {
      author: 'Dixon & Adamson',
      key: 'Ser provocativo e educar o cliente com insights valiosos',
      techniques: ['Provocar crenças', 'Ensinar novo perspectiva', 'Personalizar solução'],
      use_case: 'Quando: Cliente pensa que não precisa | Como: Desafiar + insights'
    },
    'Vender é Humano': {
      author: 'Daniel Pink',
      key: 'Movimentação, Clareza, Congruência, Empatia',
      techniques: ['Movimento inicial', 'Clareza da solução', 'Congruência verbal-não verbal', 'Empatia'],
      use_case: 'Quando: Relacionamento fraco | Como: Humanizar a venda'
    },
    'Receita Percebida': {
      author: 'Robert Cialdini',
      key: '6 gatilhos mentais de influência ética',
      techniques: ['Reciprocidade', 'Compromisso', 'Prova Social', 'Autoridade', 'Escassez', 'Simpatia'],
      use_case: 'Quando: Precisa influenciar | Como: Usar gatilho ético apropriado'
    },
    'Como Fazer Amigos': {
      author: 'Dale Carnegie',
      key: 'Construir relacionamentos autênticos duradouros',
      techniques: ['Interesse genuíno', 'Escuta ativa', 'Validação', 'Permuta de perspectiva'],
      use_case: 'Quando: Primeira reunião | Como: Focar no cliente, não em si'
    },
    'A Meta': {
      author: 'Eliyahu Goldratt',
      key: 'Identificar o gargalo e otimizar processos',
      techniques: ['Constraint theory', 'Identify bottleneck', 'Process optimization'],
      use_case: 'Quando: Cliente tem processual ineficiente | Como: Mostrar gargalo'
    },
    'Venda ou Seja Vendido': {
      author: 'Grant Cardone',
      key: 'Mentalidade de fechamento e persistência profissional',
      techniques: ['Nunca aceitar primeiro não', 'Objeção é obrigação', 'Energia positiva'],
      use_case: 'Quando: Cliente hesitante | Como: Persistência + entusiasmo ético'
    }
  },

  emotional_intelligence: {
    'Autoconsciência': {
      desc: 'Reconhecer suas emoções em tempo real',
      tactics: [
        '✓ Pause antes de responder',
        '✓ Identifique seus gatilhos',
        '✓ Use emoção como informação',
        '✓ Pratique auto-observação'
      ]
    },
    'Autocontrole': {
      desc: 'Regular resposta emocional sob pressão',
      tactics: [
        '✓ Respiração 4-7-8 em momentos de stress',
        '✓ Mude foco de reação para resposta',
        '✓ Prepare scripts para objeções',
        '✓ Teste emoção antes de visita'
      ]
    },
    'Empatia': {
      desc: 'Reconhecer e validar emoções do cliente',
      tactics: [
        '✓ "Entendo que...[sentimento]"',
        '✓ Reformule problema em suas palavras',
        '✓ Valide antes de oferecer solução',
        '✓ Mostre compreensão genuína'
      ]
    },
    'Relacionamento': {
      desc: 'Construir confiança e influência',
      tactics: [
        '✓ Espelhe linguagem/tom do cliente',
        '✓ Faça perguntas sobre vida dele',
        '✓ Compartilhe vulnerabilidade apropriada',
        '✓ Cumpra promessas pequenas'
      ]
    }
  },

  neuromarketing: {
    'Visual': {
      triggers: ['Contraste', 'Movimento', 'Cores quentes', 'Quantidade limitada'],
      how: 'Destaque números, use gráficos, mostre scarcity visual'
    },
    'Auditivo': {
      triggers: ['Tom congruente', 'Pausa estratégica', 'Repetição', 'Ritmo variado'],
      how: 'Mude tom, faça pausa antes de pedir, repita palavra-chave 3x'
    },
    'Cinestésico': {
      triggers: ['Histórias emocionantes', 'Dados sociais', 'Prova de pares', 'Demo tangível'],
      how: 'Conte história com emoção, mostre case similar, deixe tocar/usar produto'
    }
  },

  objection_handling: {
    'Preço alto': {
      triggers: ['Separar preço de valor', 'Mostrar ROI', 'Custo de não fazer'],
      script: '"Entendo que preço é consideração. Vamos ver ROI anual? Se economiza R$50k/ano, para em 2 anos, certo?"'
    },
    'Não tenho tempo': {
      triggers: ['Agenda específica', 'Urgência ética', 'FOMO', 'Pré-qualificação'],
      script: '"Concordo. Temos slot sexta 14:30 ou segunda 10:00? Preciso reservar porque demanda está alta."'
    },
    'Preciso pensar': {
      triggers: ['Objeção real vs falsa', 'Trial close', 'Descobrir verdadeira razão'],
      script: '"Excelente. Qual seria o pior cenário se não conseguisse isto? Ajuda a ver se real necessidade."'
    },
    'Concorrente é mais barato': {
      triggers: ['Prova social', 'Cases similares', 'Qualidade vs preço', 'Autoridade'],
      script: '"Entendo. Eles têm volume alto. Nós customizamos - veja esse case similar que economizou mais."'
    }
  },

  closing_moves: {
    'Assumptive Close': 'Agir como se decisão já tomada: "Qual melhor segunda-feira, 14 ou 21?"',
    'Alternative Close': 'Oferecer 2 opções (ambas=sim): "Pagamento mensal ou anual?"',
    'Urgency Close': 'Deadline ético: "Promoção válida até sexta. Precisa confirmar hoje."',
    'Trial Close': 'Testar antes de fechar: "Vamos simular? Se resultado for X, você topa?"',
    'Assumptive Delivery': 'Enviar proposta como "aqui está seu acordo"'
  },

  communication: {
    'Assertiva': [
      'Use "Eu vejo que..." em vez de "Você deveria..."',
      'Afirme sem culpabilizar',
      'Seja específico: não "seu equipamento é ruim", mas "equipamento atual não faz hemogasio"',
      'Ofereça solução, não crítica'
    ],
    'Escuta Ativa': [
      'Cliente fala 70%, você 30%',
      'Resumir: "Se entendi bem, você precisa de..."',
      'Perguntar: "Pode detalhar mais isso?"',
      'Validar: "Faz total sentido, era assim que..."'
    ],
    'Espelhamento': [
      'Copie tom de voz (rápido/lento)',
      'Copie linguagem visual (muito foco em números = dados)',
      'Copie ritmo de respiração',
      'Copie energy level'
    ]
  }
};

export default function PreVisitSalesMasterLibrary({ client }) {
  const [generating, setGenerating] = useState(false);
  const [applied, setApplied] = useState(false);

  const applyLibraryToVisit = async () => {
    setGenerating(true);
    try {
      const prompt = `MASTERCLASS PRÉ-VISITA - Integrar Bíblia de Vendas

CLIENTE: ${client.first_name}
Tipo: ${client.client_type}
Status: ${client.status}
Score: ${client.purchase_score}%
Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
Tone: ${client.client_tone || 'não definido'}

Baseado em:
✓ SPIN Selling (Rackham)
✓ Venda Desafiadora (Dixon)
✓ Vender é Humano (Pink)
✓ Receita Percebida (Cialdini)
✓ Dale Carnegie
✓ Grant Cardone
✓ Inteligência Emocional (Goleman)
✓ Neuromarketing

GERE UM PLANO PERSONALIZADO:
1. Qual framework principal aplicar? (SPIN/Desafiadora/etc)
2. Qual gatilho Cialdini é mais efetivo?
3. Qual emoção explorar (empatia/urgência/autoridade)?
4. Qual objeção provável e técnica de resposta?
5. Qual técnica de fechamento usar?
6. Como fazer espelhamento com este cliente?`;

      const result = await executeWithRateLimit(async () => {
        return await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              main_framework: { type: "string" },
              framework_tactics: { type: "array", items: { type: "string" } },
              cialdini_trigger: { type: "string" },
              emotional_approach: { type: "string" },
              anticipated_objection: { type: "string" },
              objection_response: { type: "string" },
              closing_technique: { type: "string" },
              mirroring_strategy: { type: "string" },
              visit_script_opening: { type: "string" },
              key_phrases: { type: "array", items: { type: "string" } }
            }
          }
        });
      }, 'high');

      // Salvar no cliente
      await base44.entities.Client.update(client.id, {
        notes: `[PRÉ-VISITA MASTERCLASS]\n
📘 FRAMEWORK: ${result.main_framework}\n
🎯 CIALDINI: ${result.cialdini_trigger}\n
❤️ EMOÇÃO: ${result.emotional_approach}\n
⚠️ OBJEÇÃO: ${result.anticipated_objection}\n
💬 RESPOSTA: ${result.objection_response}\n
🎬 FECHAMENTO: ${result.closing_technique}\n
🪞 ESPELHAMENTO: ${result.mirroring_strategy}\n
🗣️ ABERTURA: ${result.visit_script_opening}\n
KEY PHRASES: ${result.key_phrases.join(' | ')}`
      });

      setApplied(true);
      toast.success('Bíblia de Vendas aplicada à visita!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar plano');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-slate-900 to-indigo-900 border-none text-white shadow-xl">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-1">📚 Bíblia da Venda Integrada</h3>
          <p className="text-xs text-white/70">7 Frameworks + IE + Neuromarketing</p>
        </div>
      </div>

      <Tabs defaultValue="frameworks" className="mb-3">
        <TabsList className="grid w-full grid-cols-4 h-8 bg-white/10">
          <TabsTrigger value="frameworks" className="text-xs">Frameworks</TabsTrigger>
          <TabsTrigger value="ie" className="text-xs">IE</TabsTrigger>
          <TabsTrigger value="neuro" className="text-xs">Neuro</TabsTrigger>
          <TabsTrigger value="closing" className="text-xs">Fechamento</TabsTrigger>
        </TabsList>

        <TabsContent value="frameworks" className="mt-2">
          <div className="space-y-2 max-h-40 overflow-y-auto text-xs">
            {Object.entries(SALES_BIBLE.frameworks).map(([name, data]) => (
              <div key={name} className="bg-white/10 rounded p-2">
                <p className="font-bold text-yellow-300">{name}</p>
                <p className="text-white/70 text-xs">{data.key}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ie" className="mt-2">
          <div className="space-y-2 max-h-40 overflow-y-auto text-xs">
            {Object.entries(SALES_BIBLE.emotional_intelligence).map(([skill, data]) => (
              <div key={skill} className="bg-white/10 rounded p-2">
                <p className="font-bold text-pink-300">{skill}</p>
                <p className="text-white/70">{data.tactics[0]}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="neuro" className="mt-2">
          <div className="space-y-2 max-h-40 overflow-y-auto text-xs">
            {Object.entries(SALES_BIBLE.neuromarketing).map(([sense, data]) => (
              <div key={sense} className="bg-white/10 rounded p-2">
                <p className="font-bold text-green-300">{sense}</p>
                <p className="text-white/70">{data.triggers[0]}, {data.triggers[1]}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="closing" className="mt-2">
          <div className="space-y-1 max-h-40 overflow-y-auto text-xs">
            {Object.entries(SALES_BIBLE.closing_moves).map(([tech, desc]) => (
              <div key={tech} className="bg-white/10 rounded p-2">
                <p className="font-bold text-orange-300">{tech}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Button
        onClick={applyLibraryToVisit}
        disabled={generating || applied}
        className="w-full h-10 bg-white text-slate-900 hover:bg-white/90 font-bold"
      >
        {generating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : applied ? (
          '✓ Aplicado à Visita'
        ) : (
          <>
            <Zap className="w-4 h-4 mr-1" />
            Gerar Plano Personalizado
          </>
        )}
      </Button>
    </Card>
  );
}