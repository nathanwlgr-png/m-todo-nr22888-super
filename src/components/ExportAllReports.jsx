import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileDown, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportAllReports() {
  const [exporting, setExporting] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 1000),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['all-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 1000),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 1000),
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['all-visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 1000),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 1000),
  });

  const generateFullReport = async () => {
    setExporting(true);
    try {
      const now = new Date();
      
      // RELATÓRIO COMPLETO
      const fullReport = {
        generated_at: now.toISOString(),
        summary: {
          total_clients: clients.length,
          hot_clients: clients.filter(c => c.status === 'quente').length,
          warm_clients: clients.filter(c => c.status === 'morno').length,
          cold_clients: clients.filter(c => c.status === 'frio').length,
          total_sales: sales.length,
          total_revenue: sales.reduce((sum, s) => sum + (s.sale_value || 0), 0),
          total_tasks: tasks.length,
          pending_tasks: tasks.filter(t => t.status === 'pendente').length,
          total_visits: visits.length,
          total_campaigns: campaigns.length
        },
        
        clients_detail: clients.map(c => ({
          id: c.id,
          nome: c.first_name,
          clinica: c.clinic_name,
          cidade: c.city,
          email: c.email,
          telefone: c.phone,
          status: c.status,
          score: c.purchase_score,
          tipo: c.client_type,
          receita_projetada: c.projected_revenue,
          orcamento_disponivel: c.available_budget,
          equipamento_interesse: c.current_equipment,
          ultima_visita: c.last_visit_date,
          proxima_acao: c.next_action,
          perfil_numerologia: c.numerology_number,
          perfil_comportamental: c.behavioral_profile,
          comunicacao_recomendada: c.recommended_communication,
          health_score: c.health_score,
          engagement_score: c.engagement_score
        })),

        sales_detail: sales.map(s => ({
          id: s.id,
          cliente: s.client_name,
          equipamento: s.equipment_name,
          valor: s.sale_value,
          data: s.sale_date,
          status: s.status,
          forma_pagamento: s.payment_terms
        })),

        tasks_detail: tasks.map(t => ({
          id: t.id,
          cliente: t.client_name,
          titulo: t.title,
          descricao: t.description,
          tipo: t.type,
          prioridade: t.priority,
          status: t.status,
          vencimento: t.due_date,
          auto_criada: t.auto_created
        })),

        visits_detail: visits.map(v => ({
          id: v.id,
          cliente: v.client_name,
          data_agendada: v.scheduled_date,
          tipo: v.visit_type,
          status: v.status,
          local: v.location,
          duracao_minutos: v.duration_minutes
        })),

        campaigns_detail: campaigns.map(c => ({
          id: c.id,
          nome: c.name,
          objetivo: c.objective,
          status: c.status,
          inicio: c.start_date,
          fim: c.end_date,
          orcamento: c.budget,
          equipamento_foco: c.equipment_focus
        }))
      };

      // RELATÓRIO TEXTO WHATSAPP
      const whatsappReport = `📊 *RELATÓRIO COMPLETO VENDAS NR*
📅 ${now.toLocaleString('pt-BR')}

${'='.repeat(50)}
📈 *RESUMO GERAL*

👥 CLIENTES: ${clients.length}
   🔥 Quentes: ${fullReport.summary.hot_clients}
   🌡️ Mornos: ${fullReport.summary.warm_clients}
   ❄️ Frios: ${fullReport.summary.cold_clients}

💰 VENDAS: ${sales.length}
   Receita: R$ ${(fullReport.summary.total_revenue / 1000).toFixed(0)}k

📋 TAREFAS: ${tasks.length}
   Pendentes: ${fullReport.summary.pending_tasks}

🏢 VISITAS: ${visits.length}

📢 CAMPANHAS: ${campaigns.length}

${'='.repeat(50)}
🔥 *TOP 10 CLIENTES QUENTES*

${clients
  .filter(c => c.status === 'quente')
  .sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0))
  .slice(0, 10)
  .map((c, i) => `${i + 1}. ${c.first_name} (${c.clinic_name})
   📍 ${c.city || 'N/A'}
   📊 Score: ${c.purchase_score}%
   💰 Pipeline: R$ ${((c.projected_revenue || 0) / 1000).toFixed(0)}k
   📞 ${c.phone || c.email || 'Sem contato'}
   ⏭️ ${c.next_action || 'Definir ação'}`)
  .join('\n\n')}

${'='.repeat(50)}
💼 *VENDAS RECENTES (10 ÚLTIMAS)*

${sales
  .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
  .slice(0, 10)
  .map((s, i) => `${i + 1}. ${s.client_name}
   🔧 ${s.equipment_name}
   💵 R$ ${((s.sale_value || 0) / 1000).toFixed(0)}k
   📅 ${new Date(s.sale_date).toLocaleDateString('pt-BR')}
   ✅ ${s.status}`)
  .join('\n\n')}

${'='.repeat(50)}
📋 *TAREFAS URGENTES (PENDENTES)*

${tasks
  .filter(t => t.status === 'pendente' && t.priority === 'alta')
  .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
  .slice(0, 10)
  .map((t, i) => `${i + 1}. ${t.client_name}
   📌 ${t.title}
   ⏰ ${new Date(t.due_date).toLocaleDateString('pt-BR')}
   ${t.auto_created ? '🤖 Auto-criada' : '✍️ Manual'}`)
  .join('\n\n')}

${'='.repeat(50)}
🏢 *PRÓXIMAS VISITAS*

${visits
  .filter(v => v.status === 'agendada')
  .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
  .slice(0, 10)
  .map((v, i) => `${i + 1}. ${v.client_name}
   📅 ${new Date(v.scheduled_date).toLocaleString('pt-BR')}
   📍 ${v.location || 'Local não definido'}
   🎯 ${v.visit_type}`)
  .join('\n\n')}

${'='.repeat(50)}
✅ *RELATÓRIOS PRONTOS*

1️⃣ Arquivo JSON completo baixado
2️⃣ WhatsApp formatado copiado
3️⃣ Dados estruturados exportados

📊 Use esses dados para:
• Análise externa em Excel/BI
• Backup completo do sistema
• Importação em outros CRMs
• Compartilhamento com equipe

🚀 Método NR22888 - CRM Automático`;

      // Baixar JSON
      const jsonStr = JSON.stringify(fullReport, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Relatorio_Completo_${now.toISOString().split('T')[0]}.json`;
      link.click();

      // Copiar WhatsApp
      await navigator.clipboard.writeText(whatsappReport);

      toast.success('✅ Relatórios exportados!', {
        description: 'JSON baixado + WhatsApp copiado',
        duration: 5000
      });

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao exportar relatórios');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
          <FileDown className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Exportar Todos Relatórios</h3>
          <p className="text-xs text-slate-600">JSON + WhatsApp formatado</p>
        </div>
      </div>

      <div className="space-y-2 text-xs text-slate-600 mb-4">
        <p>✅ {clients.length} clientes completos</p>
        <p>✅ {sales.length} vendas detalhadas</p>
        <p>✅ {tasks.length} tarefas (pendentes + concluídas)</p>
        <p>✅ {visits.length} visitas agendadas</p>
        <p>✅ {campaigns.length} campanhas ativas</p>
        <p>✅ Top 10 clientes quentes</p>
        <p>✅ Análise completa pronta para copiar</p>
      </div>

      <Button
        onClick={generateFullReport}
        disabled={exporting}
        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700"
      >
        {exporting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <FileDown className="w-5 h-5 mr-2" />
            Exportar Tudo Agora
          </>
        )}
      </Button>
    </Card>
  );
}