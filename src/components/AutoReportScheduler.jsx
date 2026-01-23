import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Clock, Sparkles, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoReportScheduler() {
    const [reportType, setReportType] = useState('daily');
    const [isGenerating, setIsGenerating] = useState(false);

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: () => base44.entities.Client.list(),
    });

    const { data: sales = [] } = useQuery({
        queryKey: ['sales'],
        queryFn: () => base44.entities.Sale.list(),
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['all-tasks'],
        queryFn: () => base44.entities.Task.list(),
    });

    const generateReport = async () => {
        setIsGenerating(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const clientsHot = clients.filter(c => c.status === 'quente');
            const salesClosed = sales.filter(s => s.status === 'fechada');
            const tasksPending = tasks.filter(t => t.status === 'pendente');
            const tasksOverdue = tasks.filter(t => 
                t.status === 'pendente' && 
                new Date(t.due_date) < new Date()
            );

            let reportPrompt = '';
            
            if (reportType === 'daily') {
                reportPrompt = `Gere um relatório executivo DIÁRIO de vendas:

DATA: ${new Date().toLocaleDateString('pt-BR')}

MÉTRICAS ATUAIS:
- Total de clientes: ${clients.length}
- Clientes quentes: ${clientsHot.length}
- Vendas fechadas (total): ${salesClosed.length}
- Receita total: R$ ${salesClosed.reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString('pt-BR')}
- Tarefas pendentes: ${tasksPending.length}
- Tarefas atrasadas: ${tasksOverdue.length}

TOP 5 CLIENTES QUENTES:
${clientsHot.slice(0, 5).map(c => `- ${c.first_name} (Score: ${c.purchase_score}%)`).join('\n')}

FORMATO DO RELATÓRIO:
1. Resumo Executivo (2-3 frases)
2. Destaques do Dia
3. Alertas Críticos
4. Top 3 Ações Prioritárias
5. Previsão de Fechamentos (próximos 7 dias)`;
            } else if (reportType === 'weekly') {
                reportPrompt = `Gere um relatório SEMANAL completo:

SEMANA: ${new Date().toLocaleDateString('pt-BR')}

DADOS:
${JSON.stringify({
    total_clients: clients.length,
    hot_clients: clientsHot.length,
    sales_count: salesClosed.length,
    total_revenue: salesClosed.reduce((sum, s) => sum + (s.sale_value || 0), 0)
}, null, 2)}

FORMATO:
1. Resumo da Semana
2. Performance de Vendas
3. Análise de Pipeline
4. Tendências Observadas
5. Recomendações para Próxima Semana`;
            } else {
                reportPrompt = `Gere um relatório MENSAL estratégico completo para análise gerencial e tomada de decisão.`;
            }

            const report = await base44.integrations.Core.InvokeLLM({
                prompt: reportPrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        report_title: { type: "string" },
                        executive_summary: { type: "string" },
                        highlights: {
                            type: "array",
                            items: { type: "string" }
                        },
                        critical_alerts: {
                            type: "array",
                            items: { type: "string" }
                        },
                        priority_actions: {
                            type: "array",
                            items: { type: "string" }
                        },
                        forecast_next_period: { type: "string" },
                        full_report_text: { type: "string" }
                    }
                }
            });

            // Salvar relatório
            await base44.entities.GeneratedDocument.create({
                title: report.report_title,
                type: 'relatorio',
                content: report.full_report_text,
                category: 'automated_report',
                generated_date: today,
                report_type: reportType
            });

            // Copiar para área de transferência
            const fullReport = `📊 ${report.report_title}\n\n${report.executive_summary}\n\n🎯 Destaques:\n${report.highlights?.map(h => `• ${h}`).join('\n')}\n\n⚠️ Alertas:\n${report.critical_alerts?.map(a => `• ${a}`).join('\n')}\n\n✅ Ações Prioritárias:\n${report.priority_actions?.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n📈 Previsão:\n${report.forecast_next_period}`;

            await navigator.clipboard.writeText(fullReport);
            toast.success('Relatório gerado e copiado!');
        } catch (error) {
            console.error('Report generation error:', error);
            toast.error('Erro ao gerar relatório');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Relatórios Automatizados
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Tipo de Relatório
                    </label>
                    <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">📅 Diário</SelectItem>
                            <SelectItem value="weekly">📊 Semanal</SelectItem>
                            <SelectItem value="monthly">📈 Mensal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    onClick={generateReport}
                    disabled={isGenerating}
                    className="w-full"
                >
                    {isGenerating ? (
                        <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Gerando...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Gerar Relatório {reportType === 'daily' ? 'Diário' : reportType === 'weekly' ? 'Semanal' : 'Mensal'}
                        </>
                    )}
                </Button>

                <div className="text-xs text-gray-600 text-center">
                    Relatório será copiado automaticamente
                </div>
            </CardContent>
        </Card>
    );
}