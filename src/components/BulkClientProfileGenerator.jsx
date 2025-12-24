import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Sparkles, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";

export default function BulkClientProfileGenerator() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [generatedProfiles, setGeneratedProfiles] = useState([]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Client.list();
        return data.filter(c => c && c.id && c.first_name && !c.is_deleted);
      } catch (error) {
        return [];
      }
    }
  });

  const generateAllProfiles = async () => {
    if (clients.length === 0) {
      toast.error('Nenhum cliente encontrado');
      return;
    }

    setGenerating(true);
    setProgress({ current: 0, total: clients.length });
    const profiles = [];

    try {
      toast.info(`🚀 Gerando perfis completos para ${clients.length} clientes...`, { duration: 10000 });

      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        setProgress({ current: i + 1, total: clients.length });

        try {
          const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Você é um analista de vendas especialista em numerologia aplicada. Gere um PERFIL COMPLETO E DETALHADO para este cliente:

DADOS DO CLIENTE:
- Nome Completo: ${client.full_name || client.first_name}
- Primeiro Nome: ${client.first_name}
- Data de Nascimento: ${client.birthdate || 'Não informado'}
- Empresa/Clínica: ${client.clinic_name || client.razao_social || 'Não informado'}
- CNPJ: ${client.cnpj || 'Não informado'}
- Cidade: ${client.city || 'Não informado'}
- Email: ${client.email || 'Não informado'}
- Telefone: ${client.phone || 'Não informado'}
- Tipo de Cliente: ${client.client_type || 'Não informado'}
- Volume Mensal: ${client.current_volume || 'Não informado'}
- Status Atual: ${client.status || 'Não informado'}
- Score de Compra: ${client.purchase_score || 0}%
- Equipamento Atual: ${client.current_equipment || 'Não informado'}

INSTRUÇÕES PARA O PERFIL COMPLETO:

1. ANÁLISE NUMEROLÓGICA COMPLETA:
   - Calcule o número numerológico do nome completo
   - Se tiver data de nascimento, calcule o número do caminho de vida
   - Identifique números mestres (11, 22, 33)
   - Análise de vogais e consoantes

2. PERFIL COMPORTAMENTAL DETALHADO:
   - Características principais da personalidade
   - Estilo de comunicação preferido
   - Motivadores de compra
   - Objeções prováveis
   - Gatilhos mentais mais efetivos

3. ESTRATÉGIA DE VENDAS PERSONALIZADA:
   - Melhor abordagem inicial
   - Canal de comunicação ideal
   - Melhor horário para contato
   - Tom de voz recomendado
   - Técnicas de fechamento

4. ANÁLISE DE MERCADO E CONTEXTO:
   - Análise do tipo de cliente e volume
   - Potencial de compra baseado em CNPJ/cidade
   - Equipamentos recomendados
   - ROI estimado

5. DICAS PRÁTICAS E ACIONÁVEIS:
   - 3-5 ações imediatas recomendadas
   - Melhor argumento de vendas
   - Como lidar com objeções específicas
   - Palavras-chave para usar na conversa

FORMATE O PERFIL EM MARKDOWN ESTRUTURADO, BEM ORGANIZADO E VISUAL.

SEJA EXTREMAMENTE DETALHADO, PRÁTICO E ACIONÁVEL.`,
            add_context_from_internet: false,
            response_json_schema: {
              type: "object",
              properties: {
                numero_numerologico: { type: "number" },
                numero_caminho_vida: { type: "number" },
                perfil_comportamental: {
                  type: "object",
                  properties: {
                    personalidade: { type: "string" },
                    estilo_comunicacao: { type: "string" },
                    motivadores_compra: { type: "array", items: { type: "string" } },
                    objecoes_provaveis: { type: "array", items: { type: "string" } },
                    gatilhos_mentais: { type: "array", items: { type: "string" } }
                  }
                },
                estrategia_vendas: {
                  type: "object",
                  properties: {
                    abordagem_inicial: { type: "string" },
                    canal_ideal: { type: "string" },
                    melhor_horario: { type: "string" },
                    tom_voz: { type: "string" },
                    tecnica_fechamento: { type: "string" }
                  }
                },
                analise_mercado: {
                  type: "object",
                  properties: {
                    potencial_compra: { type: "string" },
                    equipamentos_recomendados: { type: "array", items: { type: "string" } },
                    roi_estimado: { type: "string" }
                  }
                },
                acoes_imediatas: { type: "array", items: { type: "string" } },
                melhor_argumento: { type: "string" },
                palavras_chave: { type: "array", items: { type: "string" } },
                perfil_markdown: { type: "string" }
              }
            }
          });

          profiles.push({
            clientId: client.id,
            clientName: client.full_name || client.first_name,
            profile: response
          });

          // Salvar perfil individual no repositório
          await base44.entities.GeneratedDocument.create({
            title: `Perfil Completo - ${client.full_name || client.first_name}`,
            type: 'relatorio',
            content: response.perfil_markdown || JSON.stringify(response, null, 2),
            summary: `Perfil numerológico e estratégia de vendas - ${client.clinic_name || client.razao_social || 'Cliente'}`,
            tags: ['perfil', client.first_name, client.city, 'numerologia', 'vendas', 'gerado_massa']
          });

          // Atualizar dados do cliente no CRM
          await base44.entities.Client.update(client.id, {
            numerology_number: response.numero_numerologico,
            life_path_number: response.numero_caminho_vida,
            behavioral_profile: response.perfil_comportamental?.personalidade,
            decision_style: response.perfil_comportamental?.estilo_comunicacao,
            client_tone: response.estrategia_vendas?.tom_voz,
            recommended_communication: response.estrategia_vendas?.canal_ideal,
            purchase_motivators: response.perfil_comportamental?.motivadores_compra || [],
            real_objections: response.perfil_comportamental?.objecoes_provaveis || [],
            triggers_used: response.perfil_comportamental?.gatilhos_mentais || [],
            next_action: response.acoes_imediatas?.[0] || '',
            numerology_tip: response.melhor_argumento
          });

          toast.success(`✅ ${i + 1}/${clients.length} - ${client.first_name}`);

        } catch (error) {
          console.error(`Erro ao gerar perfil de ${client.first_name}:`, error);
          toast.error(`Erro: ${client.first_name}`);
        }

        // Pequeno delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setGeneratedProfiles(profiles);

      // Salvar relatório consolidado
      const consolidatedReport = `
╔═══════════════════════════════════════════════════════════════════════╗
║              PERFIS COMPLETOS - TODOS OS CLIENTES                     ║
║                  Análise Numerológica em Massa                        ║
╚═══════════════════════════════════════════════════════════════════════╝

Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
Total de Perfis Gerados: ${profiles.length}

═══════════════════════════════════════════════════════════════════════

${profiles.map((p, idx) => `
${idx + 1}. ${p.clientName.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Número Numerológico: ${p.profile.numero_numerologico || 'N/A'}
Caminho de Vida: ${p.profile.numero_caminho_vida || 'N/A'}

PERFIL COMPORTAMENTAL:
${p.profile.perfil_comportamental?.personalidade || 'N/A'}

ESTRATÉGIA DE VENDAS:
• Abordagem: ${p.profile.estrategia_vendas?.abordagem_inicial || 'N/A'}
• Canal: ${p.profile.estrategia_vendas?.canal_ideal || 'N/A'}
• Tom: ${p.profile.estrategia_vendas?.tom_voz || 'N/A'}

AÇÕES IMEDIATAS:
${p.profile.acoes_imediatas?.map((a, i) => `${i + 1}. ${a}`).join('\n') || 'N/A'}

MELHOR ARGUMENTO:
${p.profile.melhor_argumento || 'N/A'}

PALAVRAS-CHAVE:
${p.profile.palavras_chave?.join(', ') || 'N/A'}

`).join('\n\n')}

═══════════════════════════════════════════════════════════════════════
                          RESUMO GERAL
═══════════════════════════════════════════════════════════════════════

Total de Perfis: ${profiles.length}
Data de Geração: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
Sistema: Método NR22 - Geração em Massa

✅ TODOS OS PERFIS FORAM SALVOS INDIVIDUALMENTE E SINCRONIZADOS COM O CRM

═══════════════════════════════════════════════════════════════════════
`;

      await base44.entities.GeneratedDocument.create({
        title: `Perfis Completos - TODOS ${clients.length} Clientes - ${new Date().toLocaleDateString('pt-BR')}`,
        type: 'relatorio',
        content: consolidatedReport,
        summary: `${profiles.length} perfis completos gerados e sincronizados com CRM`,
        tags: ['perfis_massa', 'todos_clientes', 'numerologia', 'crm_sync', new Date().toLocaleDateString('pt-BR')]
      });

      toast.success(`🎉 ${profiles.length} PERFIS COMPLETOS GERADOS E SALVOS!`, { duration: 10000 });

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar perfis');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Geração em Massa de Perfis</h3>
          <p className="text-xs text-slate-600">Perfis completos + sincronização CRM</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Info */}
        <div className="p-3 bg-white rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-purple-800">📊 Clientes no Sistema:</p>
            <Badge className="bg-purple-600">{clients.length}</Badge>
          </div>
          <p className="text-xs text-slate-600">
            Perfis completos com numerologia, estratégia de vendas e sincronização automática com CRM
          </p>
        </div>

        {/* Botão de gerar */}
        <Button
          onClick={generateAllProfiles}
          disabled={generating || clients.length === 0}
          className="w-full bg-purple-600 hover:bg-purple-700 h-14"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gerando {progress.current}/{progress.total}...
            </>
          ) : (
            <>
              <Users className="w-5 h-5 mr-2" />
              🚀 Gerar TODOS os Perfis Completos
            </>
          )}
        </Button>

        {/* Progress */}
        {generating && (
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-800">Progresso:</span>
              <span className="text-xs text-purple-700">
                {progress.current}/{progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-600 transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Resultados */}
        {generatedProfiles.length > 0 && (
          <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-semibold text-green-800">
                ✅ {generatedProfiles.length} Perfis Completos Gerados!
              </p>
            </div>
            <ul className="text-xs text-green-700 space-y-1">
              <li>✓ Análise numerológica completa</li>
              <li>✓ Perfil comportamental detalhado</li>
              <li>✓ Estratégia de vendas personalizada</li>
              <li>✓ Sincronizado com CRM automaticamente</li>
              <li>✓ Salvos em "Documentos Gerados"</li>
            </ul>
            <p className="text-xs text-green-800 font-semibold mt-2">
              💾 Relatório consolidado disponível em Documentos Gerados
            </p>
          </div>
        )}

        {/* Avisos */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-800">
            ⚠️ <strong>Importante:</strong> Este processo pode levar vários minutos dependendo da quantidade de clientes. Cada perfil é gerado individualmente com análise completa por IA.
          </p>
        </div>
      </div>
    </Card>
  );
}