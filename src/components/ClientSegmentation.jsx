import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Download, Loader2, PieChart } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientSegmentation() {
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Client.list();
        return data.filter(c => c && c.id && c.first_name && !c.is_deleted);
      } catch (error) {
        if (error.message?.includes('not found')) {
          console.warn('Cliente deletado referenciado, ignorando');
          return [];
        }
        throw error;
      }
    },
    retry: 1
  });

  const generateSegmentedReport = async () => {
    setGenerating(true);
    try {
      // Segmentações
      const byType = clients.reduce((acc, c) => {
        const type = c.client_type || 'sem_tipo';
        acc[type] = acc[type] || [];
        acc[type].push(c);
        return acc;
      }, {});

      const byVolume = clients.reduce((acc, c) => {
        const vol = c.current_volume || 'nao_informado';
        acc[vol] = acc[vol] || [];
        acc[vol].push(c);
        return acc;
      }, {});

      const byStatus = clients.reduce((acc, c) => {
        const status = c.status || 'sem_status';
        acc[status] = acc[status] || [];
        acc[status].push(c);
        return acc;
      }, {});

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta base de clientes e gere insights de segmentação:

TOTAL: ${clients.length} clientes

SEGMENTAÇÃO POR TIPO:
${Object.entries(byType).map(([type, cls]) => 
  `- ${type}: ${cls.length} clientes (${((cls.length/clients.length)*100).toFixed(1)}%)`
).join('\n')}

SEGMENTAÇÃO POR VOLUME:
${Object.entries(byVolume).map(([vol, cls]) => 
  `- ${vol}: ${cls.length} clientes`
).join('\n')}

SEGMENTAÇÃO POR STATUS:
${Object.entries(byStatus).map(([status, cls]) => 
  `- ${status}: ${cls.length} clientes`
).join('\n')}

GERE:
1. Perfil detalhado de cada segmento
2. Estratégias de marketing personalizadas por segmento
3. Oportunidades de cross-sell/upsell por tipo
4. Recomendações de ação para cada grupo
5. Potencial de receita por segmento`,
        response_json_schema: {
          type: "object",
          properties: {
            segmentos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  tamanho: { type: "number" },
                  perfil: { type: "string" },
                  estrategia_marketing: { type: "string" },
                  oportunidades: { type: "array", items: { type: "string" } },
                  acoes_recomendadas: { type: "array", items: { type: "string" } },
                  potencial_receita: { type: "number" }
                }
              }
            },
            insights_gerais: { type: "array", items: { type: "string" } },
            prioridades: { type: "array", items: { type: "string" } }
          }
        }
      });

      const fullReport = `
╔═══════════════════════════════════════════════════════════════════════╗
║           RELATÓRIO DE SEGMENTAÇÃO DE CLIENTES                        ║
║                    Análise por IA                                     ║
╚═══════════════════════════════════════════════════════════════════════╝

Data: ${new Date().toLocaleDateString('pt-BR')}
Total de Clientes: ${clients.length}

═══════════════════════════════════════════════════════════════════════
                    SEGMENTOS IDENTIFICADOS
═══════════════════════════════════════════════════════════════════════

${response.segmentos?.map((seg, i) => `
${i + 1}. ${seg.nome.toUpperCase()} (${seg.tamanho} clientes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERFIL:
${seg.perfil}

ESTRATÉGIA DE MARKETING:
${seg.estrategia_marketing}

OPORTUNIDADES:
${seg.oportunidades?.map(o => `• ${o}`).join('\n')}

AÇÕES RECOMENDADAS:
${seg.acoes_recomendadas?.map(a => `✓ ${a}`).join('\n')}

POTENCIAL DE RECEITA: R$ ${seg.potencial_receita?.toLocaleString('pt-BR')}

`).join('\n')}

═══════════════════════════════════════════════════════════════════════
                    INSIGHTS GERAIS
═══════════════════════════════════════════════════════════════════════

${response.insights_gerais?.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

═══════════════════════════════════════════════════════════════════════
                    PRIORIDADES ESTRATÉGICAS
═══════════════════════════════════════════════════════════════════════

${response.prioridades?.map((p, i) => `${i + 1}. ${p}`).join('\n')}

═══════════════════════════════════════════════════════════════════════
`;

      setReport({ data: response, text: fullReport });

      // Salvar no repositório
      await base44.entities.GeneratedDocument.create({
        title: `Relatório de Segmentação - ${new Date().toLocaleDateString('pt-BR')}`,
        type: 'relatorio',
        content: fullReport,
        summary: `Análise de ${clients.length} clientes por tipo, volume e status`,
        tags: ['segmentação', 'marketing', 'análise', 'clientes']
      });

      toast.success('Relatório gerado e salvo!');

    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = () => {
    const blob = new Blob([report.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Segmentacao_Clientes_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download iniciado!');
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <PieChart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Segmentação de Clientes</h3>
          <p className="text-xs text-slate-600">Relatórios por tipo, volume e comportamento</p>
        </div>
      </div>

      <Button
        onClick={generateSegmentedReport}
        disabled={generating}
        className="w-full bg-blue-600 hover:bg-blue-700 mb-3"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analisando {clients.length} clientes...
          </>
        ) : (
          <>
            <Users className="w-4 h-4 mr-2" />
            Gerar Relatório de Segmentação
          </>
        )}
      </Button>

      {report && (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
            <p className="text-xs font-semibold text-green-800 mb-2">✅ Relatório Gerado!</p>
            <p className="text-xs text-green-700">
              {report.data.segmentos?.length} segmentos identificados
            </p>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {report.data.segmentos?.map((seg, i) => (
              <div key={i} className="p-3 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">{seg.nome}</p>
                  <Badge className="bg-blue-600">{seg.tamanho} clientes</Badge>
                </div>
                <p className="text-xs text-slate-600 mb-2">{seg.perfil}</p>
                <p className="text-xs font-semibold text-green-700">
                  Potencial: R$ {seg.potencial_receita?.toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>

          <Button
            onClick={downloadReport}
            variant="outline"
            className="w-full border-blue-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Relatório Completo
          </Button>
        </div>
      )}
    </Card>
  );
}