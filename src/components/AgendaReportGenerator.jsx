import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AgendaReportGenerator() {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sections, setSections] = useState({
    visits: true,
    clients: true,
    tasks: true,
    sales: true,
    route: true,
    stats: true
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list()
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list()
  });

  const generateReport = async () => {
    setGenerating(true);
    try {
      const now = new Date();
      const reportTitle = `Relatório Completo da Agenda - ${format(now, 'dd/MM/yyyy HH:mm', { locale: ptBR })}`;

      let report = `
═══════════════════════════════════════
${reportTitle.toUpperCase()}
═══════════════════════════════════════

`;

      // Estatísticas Gerais
      if (sections.stats) {
        const scheduledVisits = visits.filter(v => v.status === 'agendada').length;
        const completedVisits = visits.filter(v => v.status === 'realizada').length;
        const pendingTasks = tasks.filter(t => t.status === 'pendente').length;
        const closedSales = sales.filter(s => s.status === 'fechada').length;
        const totalRevenue = sales
          .filter(s => s.status === 'fechada')
          .reduce((sum, s) => sum + (s.sale_value || 0), 0);

        report += `
📊 ESTATÍSTICAS GERAIS
────────────────────────────────────
• Visitas Agendadas: ${scheduledVisits}
• Visitas Realizadas: ${completedVisits}
• Tarefas Pendentes: ${pendingTasks}
• Vendas Fechadas: ${closedSales}
• Receita Total: R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

`;
      }

      // Visitas Agendadas
      if (sections.visits) {
        const scheduled = visits.filter(v => v.status === 'agendada').sort((a, b) => 
          new Date(a.scheduled_date) - new Date(b.scheduled_date)
        );

        report += `
📅 VISITAS AGENDADAS (${scheduled.length})
────────────────────────────────────
${scheduled.map(v => `
📍 ${v.client_name}
   Data/Hora: ${format(new Date(v.scheduled_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
   Tipo: ${v.visit_type}
   Local: ${v.location || 'Não especificado'}
   Duração: ${v.duration_minutes || 60} minutos
   ${v.notes ? `Notas: ${v.notes}` : ''}
`).join('\n')}

`;
      }

      // Clientes Ativos
      if (sections.clients) {
        const activeClients = clients.filter(c => c.status === 'quente' || c.status === 'morno');
        
        report += `
👥 CLIENTES ATIVOS (${activeClients.length})
────────────────────────────────────
${activeClients.map(c => `
• ${c.first_name} (ID: ${c.id})
  - Razão Social: ${c.razao_social || 'N/A'}
  - CNPJ: ${c.cnpj || 'N/A'}
  - Cidade: ${c.city || 'N/A'}
  - Status: ${c.status} | Score: ${c.purchase_score}%
  - Última Visita: ${c.last_visit_date || 'Nunca'}
  - Orçamento: ${c.available_budget ? `R$ ${Number(c.available_budget).toLocaleString('pt-BR')}` : 'N/A'}
`).join('\n')}

`;
      }

      // Tarefas Pendentes
      if (sections.tasks) {
        const pending = tasks.filter(t => t.status === 'pendente').sort((a, b) => 
          new Date(a.due_date) - new Date(b.due_date)
        );

        report += `
✅ TAREFAS PENDENTES (${pending.length})
────────────────────────────────────
${pending.map(t => `
• ${t.title}
  Cliente: ${t.client_name}
  Vencimento: ${t.due_date}
  Prioridade: ${t.priority}
  ${t.description ? `Descrição: ${t.description}` : ''}
`).join('\n')}

`;
      }

      // Vendas
      if (sections.sales) {
        const recentSales = sales.slice(0, 20);
        
        report += `
💰 VENDAS (${sales.length})
────────────────────────────────────
${recentSales.map(s => `
• ${s.client_name} - ${s.equipment_name}
  Valor: R$ ${s.sale_value?.toLocaleString('pt-BR')}
  Data: ${s.sale_date}
  Status: ${s.status}
`).join('\n')}

`;
      }

      // Rota Otimizada
      if (sections.route) {
        const citiesGrouped = clients.reduce((acc, c) => {
          const city = c.city || 'Sem cidade';
          if (!acc[city]) acc[city] = [];
          acc[city].push(c);
          return acc;
        }, {});

        report += `
🗺️ ROTEIRO POR CIDADE
────────────────────────────────────
${Object.entries(citiesGrouped).map(([city, cityClients]) => `
📍 ${city} (${cityClients.length} clientes)
${cityClients.sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0)).map(c => `
   • ${c.first_name} - Score: ${c.purchase_score}% - ${c.status}
`).join('')}
`).join('\n')}

`;
      }

      report += `
────────────────────────────────────
📅 Gerado em ${format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
`;

      // Download do relatório
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-agenda-${format(now, 'yyyy-MM-dd-HHmm')}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      alert('Relatório gerado e baixado com sucesso!');
      setOpen(false);
    } catch (error) {
      alert('Erro ao gerar relatório');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="w-full h-12 border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
      >
        <FileText className="w-4 h-4 mr-2" />
        Gerar Relatório Completo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Relatório da Agenda</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">Selecione as seções para incluir:</p>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={sections.stats}
                  onCheckedChange={(checked) => setSections({ ...sections, stats: checked })}
                />
                <Label className="text-sm">Estatísticas Gerais</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={sections.visits}
                  onCheckedChange={(checked) => setSections({ ...sections, visits: checked })}
                />
                <Label className="text-sm">Visitas Agendadas</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={sections.clients}
                  onCheckedChange={(checked) => setSections({ ...sections, clients: checked })}
                />
                <Label className="text-sm">Clientes Ativos</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={sections.tasks}
                  onCheckedChange={(checked) => setSections({ ...sections, tasks: checked })}
                />
                <Label className="text-sm">Tarefas Pendentes</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={sections.sales}
                  onCheckedChange={(checked) => setSections({ ...sections, sales: checked })}
                />
                <Label className="text-sm">Vendas</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={sections.route}
                  onCheckedChange={(checked) => setSections({ ...sections, route: checked })}
                />
                <Label className="text-sm">Roteiro por Cidade</Label>
              </div>
            </div>

            <Button
              onClick={generateReport}
              disabled={generating}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Gerar e Baixar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}