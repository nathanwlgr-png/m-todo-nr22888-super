import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NatashaDietPlan() {
  const [generating, setGenerating] = useState(false);
  const [planReady, setPlanReady] = useState(false);
  const [fullPlan, setFullPlan] = useState('');

  useEffect(() => {
    generatePlan();
  }, []);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um nutricionista e personal trainer especializado em numerologia aplicada à saúde.

DADOS DA CLIENTE:
Nome: Natasha Gabriela Aparecida Rosa
Data de Nascimento: 18/06/1993
Peso Atual: 59 kg
Percentual de Gordura Atual: 35%
META: Manter 59kg, reduzir BF de 35% para 20%
Refeições: 4 por dia
Suplementação: Whey 1x/dia
Anabolizante: Oxandrolona (ciclo supervisionado)
Orçamento: Alimentos de baixo custo
Objetivo: Pernas grossas + abdômen definido

ANÁLISE NUMEROLÓGICA:
Data: 18/06/1993
Caminho de Vida: 1+8+0+6+1+9+9+3 = 37 = 3+7 = 10 = 1+0 = 1
Número 1: Líder, determinada, foco em objetivos. Responde bem a desafios e metas claras.

INSTRUÇÕES:
Crie um plano COMPLETO e DETALHADO incluindo:

═══════════════════════════════════════════════════════════════════════
1. PERFIL NUMEROLÓGICO E COMPORTAMENTAL
═══════════════════════════════════════════════════════════════════════
- Análise do número 1 aplicado à dieta e treino
- Motivações e gatilhos mentais
- Melhor horário para treinar baseado em numerologia

═══════════════════════════════════════════════════════════════════════
2. CÁLCULO CALÓRICO E MACROS
═══════════════════════════════════════════════════════════════════════
- TMB (Taxa Metabólica Basal)
- TDEE (Gasto Energético Total)
- Déficit calórico para recomposição corporal
- Distribuição de macros (proteína/carbo/gordura)
- Calorias por refeição

═══════════════════════════════════════════════════════════════════════
3. PLANO ALIMENTAR DETALHADO - 4 REFEIÇÕES
═══════════════════════════════════════════════════════════════════════

REFEIÇÃO 1 - CAFÉ DA MANHÃ (7h):
• Alimentos com quantidades em gramas
• Calorias totais
• Macros (P/C/G)

REFEIÇÃO 2 - ALMOÇO (12h):
• Alimentos com quantidades em gramas
• Calorias totais
• Macros (P/C/G)

REFEIÇÃO 3 - LANCHE PRÉ-TREINO (16h):
• Whey protein + complementos
• Alimentos com quantidades em gramas
• Calorias totais
• Macros (P/C/G)

REFEIÇÃO 4 - JANTAR (20h):
• Alimentos com quantidades em gramas
• Calorias totais
• Macros (P/C/G)

LISTA DE COMPRAS (SEMANAL):
• Todos os alimentos com quantidades
• Preço estimado total

═══════════════════════════════════════════════════════════════════════
4. PROTOCOLO DE SUPLEMENTAÇÃO E OXANDROLONA
═══════════════════════════════════════════════════════════════════════
- Dosagem de Whey (quando tomar)
- Protocolo de Oxandrolona (dosagem, ciclo, TPC)
- Suplementos adicionais recomendados
- Hidratação

═══════════════════════════════════════════════════════════════════════
5. PLANO DE TREINO - 4X SEMANA (TABELA)
═══════════════════════════════════════════════════════════════════════

SEGUNDA - INFERIOR A (Pernas/Glúteos)
| Exercício              | Séries | Reps | Carga    | Descanso |
|------------------------|--------|------|----------|----------|
| Agachamento livre      | 4      | 8-10 | Pesada   | 2min     |
| Leg press 45°          | 4      | 12-15| Pesada   | 90s      |
| Stiff                  | 4      | 10-12| Moderada | 90s      |
| Cadeira extensora      | 3      | 15-20| Moderada | 60s      |
| Cadeira flexora        | 3      | 12-15| Moderada | 60s      |
| Panturrilha sentado    | 4      | 20-25| Moderada | 60s      |
| Abdominal supra        | 3      | 20   | Peso     | 45s      |

TERÇA - SUPERIOR + CORE
| Exercício              | Séries | Reps | Carga    | Descanso |
|------------------------|--------|------|----------|----------|
| Supino reto            | 4      | 10-12| Moderada | 90s      |
| Desenvolvimento        | 3      | 10-12| Moderada | 90s      |
| Remada curvada         | 4      | 10-12| Moderada | 90s      |
| Puxada frontal         | 3      | 12-15| Moderada | 60s      |
| Rosca direta           | 3      | 12-15| Leve     | 60s      |
| Tríceps pulley         | 3      | 12-15| Leve     | 60s      |
| Prancha isométrica     | 3      | 45s  | Corporal | 60s      |
| Abdominal bicicleta    | 3      | 20   | Corporal | 45s      |

QUINTA - INFERIOR B (Ênfase Glúteos)
| Exercício              | Séries | Reps | Carga    | Descanso |
|------------------------|--------|------|----------|----------|
| Agachamento sumô       | 4      | 10-12| Pesada   | 2min     |
| Hip thrust             | 4      | 12-15| Pesada   | 90s      |
| Avanço alternado       | 3      | 12/perna| Moderada| 90s   |
| Abdução na máquina     | 4      | 15-20| Moderada | 60s      |
| Adução na máquina      | 4      | 15-20| Moderada | 60s      |
| Elevação pélvica       | 4      | 15-20| Moderada | 60s      |
| Prancha lateral        | 3      | 30s/lado| Corporal| 45s   |

SÁBADO - FULL BODY + ABS
| Exercício              | Séries | Reps | Carga    | Descanso |
|------------------------|--------|------|----------|----------|
| Agachamento búlgaro    | 3      | 12/perna| Moderada| 90s   |
| Levantamento terra     | 4      | 8-10 | Pesada   | 2min     |
| Supino inclinado       | 3      | 10-12| Moderada | 90s      |
| Remada cavalinho       | 3      | 12-15| Moderada | 60s      |
| Abdução deitado lateral| 3      | 20/lado| Tornozeleira| 45s |
| Abdominal remador      | 4      | 15   | Peso     | 60s      |
| Elevação de pernas     | 3      | 15   | Corporal | 60s      |
| Mountain climbers      | 3      | 30s  | Corporal | 45s      |

═══════════════════════════════════════════════════════════════════════
6. PLANO DE TREINO - 5X SEMANA (TABELA)
═══════════════════════════════════════════════════════════════════════

SEGUNDA - INFERIOR A (Quadríceps/Glúteos)
| Exercício              | Séries | Reps | Carga    | Descanso |
|------------------------|--------|------|----------|----------|
| Agachamento livre      | 5      | 8-10 | Pesada   | 2min     |
| Leg press 45°          | 4      | 12-15| Pesada   | 90s      |
| Hack machine           | 3      | 12-15| Pesada   | 90s      |
| Cadeira extensora      | 4      | 15-20| Moderada | 60s      |
| Hip thrust             | 4      | 12-15| Pesada   | 90s      |
| Panturrilha em pé      | 4      | 20-25| Moderada | 60s      |

TERÇA - SUPERIOR A (Peito/Ombro/Tríceps)
| Exercício              | Séries | Reps | Carga    | Descanso |
|------------------------|--------|------|----------|----------|
| Supino reto            | 4      | 10-12| Moderada | 90s      |
| Supino inclinado       | 4      | 10-12| Moderada | 90s      |
| Crucifixo inclinado    | 3      | 12-15| Leve     | 60s      |
| Desenvolvimento        | 4      | 10-12| Moderada | 90s      |
| Elevação lateral       | 3      | 12-15| Leve     | 60s      |
| Tríceps testa          | 3      | 12-15| Moderada | 60s      |
| Tríceps pulley         | 3      | 15-20| Leve     | 60s      |

QUARTA - INFERIOR B (Posterior/Glúteos)
| Exercício              | Séries | Reps | Carga    | Descanso |
|------------------------|--------|------|----------|----------|
| Stiff                  | 4      | 10-12| Pesada   | 2min     |
| Levantamento terra     | 4      | 8-10 | Pesada   | 2min     |
| Cadeira flexora        | 4      | 12-15| Moderada | 90s      |
| Mesa flexora           | 3      | 12-15| Moderada | 90s      |
| Agachamento sumô       | 4      | 12-15| Pesada   | 90s      |
| Abdução na máquina     | 4      | 20-25| Moderada | 60s      |
| Adução na máquina      | 4      | 20-25| Moderada | 60s      |

QUINTA - SUPERIOR B (Costas/Bíceps) + CORE
| Exercício              | Séries | Reps | Carga    | Descanso |
|------------------------|--------|------|----------|----------|
| Barra fixa assistida   | 4      | 8-10 | Corporal | 2min     |
| Remada curvada         | 4      | 10-12| Pesada   | 90s      |
| Puxada frontal         | 4      | 12-15| Moderada | 90s      |
| Remada cavalinho       | 3      | 12-15| Moderada | 60s      |
| Rosca direta           | 3      | 12-15| Moderada | 60s      |
| Rosca martelo          | 3      | 12-15| Moderada | 60s      |
| Prancha isométrica     | 4      | 60s  | Corporal | 60s      |
| Abdominal supra        | 4      | 20   | Peso     | 45s      |

SÁBADO - GLÚTEOS + ABS INTENSIVO
| Exercício              | Séries | Reps | Carga    | Descanso |
|------------------------|--------|------|----------|----------|
| Hip thrust barra       | 5      | 12-15| Pesada   | 90s      |
| Agachamento búlgaro    | 4      | 12/perna| Moderada| 90s   |
| Avanço com halteres    | 4      | 12/perna| Moderada| 90s   |
| Elevação pélvica       | 4      | 20-25| Moderada | 60s      |
| Coice na polia         | 3      | 15/perna| Leve   | 60s      |
| Abdominal remador      | 4      | 20   | Peso     | 60s      |
| Elevação de pernas     | 4      | 15   | Caneleira| 60s      |
| Prancha lateral        | 3      | 45s/lado| Corporal| 45s   |
| Mountain climbers      | 3      | 45s  | Corporal | 45s      |

═══════════════════════════════════════════════════════════════════════
7. CRONOGRAMA DE PROGRESSÃO (12 SEMANAS)
═══════════════════════════════════════════════════════════════════════
Semanas 1-4: Adaptação (cargas moderadas)
Semanas 5-8: Progressão (aumentar cargas 5-10%)
Semanas 9-12: Intensificação (drop sets, rest-pause)

═══════════════════════════════════════════════════════════════════════
8. DICAS NUTRICIONAIS ESPECÍFICAS
═══════════════════════════════════════════════════════════════════════
- Timing de nutrientes
- Hidratação (mínimo 3L/dia)
- Sono (7-8h/noite)
- Cardio opcional (HIIT 2x/semana)

═══════════════════════════════════════════════════════════════════════
9. MEDIÇÕES E ACOMPANHAMENTO
═══════════════════════════════════════════════════════════════════════
A cada 2 semanas: peso, BF%, medidas (coxas, quadril, cintura, abdômen)

Use formatação limpa, tabelas bem estruturadas e seja EXTREMAMENTE DETALHADO.`,
      });

      const fullDocument = `
╔═══════════════════════════════════════════════════════════════════════╗
║          PLANO DE RECOMPOSIÇÃO CORPORAL PERSONALIZADO                 ║
║                  Natasha Gabriela Aparecida Rosa                      ║
║                     Com Análise Numerológica                          ║
╚═══════════════════════════════════════════════════════════════════════╝

Cliente: Natasha Gabriela Aparecida Rosa
Data de Nascimento: 18/06/1993
Peso Atual: 59 kg
BF% Atual: 35%
META: Manter 59kg, reduzir BF para 20%
Duração: 12 semanas
Data: ${new Date().toLocaleDateString('pt-BR')}


${response}


═══════════════════════════════════════════════════════════════════════
                      OBSERVAÇÕES IMPORTANTES
═══════════════════════════════════════════════════════════════════════

⚠️ OXANDROLONA: Este é um anabolizante esteroide. O uso DEVE ser:
   • Supervisionado por médico endocrinologista
   • Com exames de sangue pré, durante e pós-ciclo
   • TPC (Terapia Pós-Ciclo) obrigatória
   • Dosagem típica feminina: 5-10mg/dia por 6-8 semanas máximo
   • Efeitos colaterais: virilização, alterações hepáticas, colesterol

✓ COMPROMISSO: Seguir o plano com disciplina
✓ PACIÊNCIA: Resultados visíveis em 4-6 semanas
✓ CONSISTÊNCIA: Treino + dieta + descanso = sucesso

═══════════════════════════════════════════════════════════════════════
                            FIM DO PLANO
═══════════════════════════════════════════════════════════════════════

Elaborado por: Sistema IA Método NR22
Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
`;

      setFullPlan(fullDocument);
      
      // Salvar no repositório
      try {
        await base44.entities.GeneratedDocument.create({
          title: 'Plano Completo de Dieta e Treino - Natasha Rosa',
          type: 'relatorio',
          content: fullDocument,
          summary: 'Dieta personalizada + 2 planos de treino (4x e 5x semana) com numerologia, oxandrolona e foco em pernas/abdômen',
          tags: ['natasha', 'dieta', 'treino', 'numerologia', 'recomposição', 'oxandrolona']
        });
      } catch (error) {
        console.error('Erro ao salvar:', error);
      }
      
      setPlanReady(true);
      toast.success('Plano completo gerado e salvo!');
    } catch (error) {
      console.error('Erro:', error);
      if (error.message?.includes('Rate limit')) {
        toast.error('Limite de IA. Aguarde 1 minuto.');
      } else {
        toast.error('Erro ao gerar plano');
      }
    } finally {
      setGenerating(false);
    }
  };

  const downloadPlan = () => {
    const blob = new Blob([fullPlan], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Plano_Natasha_Rosa_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download iniciado!');
  };

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(fullPlan);
      toast.success('Plano copiado!');
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const shareWhatsApp = () => {
    const summary = `🏋️‍♀️ *Plano Completo de Dieta e Treino - Natasha Rosa*

📅 Gerado em: ${new Date().toLocaleDateString('pt-BR')}

✅ Inclui:
• Dieta personalizada (4 refeições/dia)
• Cálculo calórico e macros
• Lista de compras
• Protocolo whey + oxandrolona
• Plano treino 4x semana (tabela completa)
• Plano treino 5x semana (tabela completa)
• Análise numerológica
• Cronograma 12 semanas
• Foco: pernas grossas + abdômen definido
• Meta: 35% → 20% BF

📊 Peso: 59kg (manter)
🎯 Objetivo: Recomposição corporal

${fullPlan.substring(0, 500)}...

(Documento completo disponível)`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(summary)}`;
    window.open(url, '_blank');
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-pink-600 flex items-center justify-center shadow-lg">
          <span className="text-2xl">🏋️‍♀️</span>
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Plano Natasha Rosa</h3>
          <p className="text-xs text-slate-600">Dieta + Treino Personalizado</p>
        </div>
      </div>

      {generating ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
          <p className="ml-3 text-sm text-slate-700">Gerando plano completo...</p>
        </div>
      ) : planReady ? (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 rounded-lg border border-green-300">
            <p className="text-xs font-semibold text-green-800 mb-2">✅ Plano completo pronto!</p>
            <p className="text-xs text-slate-700">
              • Dieta 4 refeições + macros<br/>
              • Treino 4x semana (tabela)<br/>
              • Treino 5x semana (tabela)<br/>
              • Análise numerológica<br/>
              • Protocolo oxandrolona
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={copyPlan}
              variant="outline"
              className="border-pink-300"
              size="sm"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copiar
            </Button>
            <Button
              onClick={downloadPlan}
              className="bg-pink-600 hover:bg-pink-700"
              size="sm"
            >
              <Download className="w-3 h-3 mr-1" />
              Baixar
            </Button>
            <Button
              onClick={shareWhatsApp}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Share2 className="w-3 h-3 mr-1" />
              WhatsApp
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={generatePlan}
          className="w-full bg-pink-600 hover:bg-pink-700"
        >
          Gerar Plano Completo
        </Button>
      )}
    </Card>
  );
}