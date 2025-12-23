import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Loader2, FileText, Send } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Auditoria Completa do Sistema
 * Verifica dados faltantes, funcionalidades incompletas e gera relatório
 */
export default function SystemAuditReport() {
  const [auditing, setAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState(null);

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

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 500),
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment-materials'],
    queryFn: () => base44.entities.EquipmentMaterial.list('-created_date', 500),
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['all-visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 1000),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['all-documents'],
    queryFn: () => base44.entities.ClientDocument.list('-created_date', 1000),
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const runAudit = async () => {
    setAuditing(true);
    try {
      const report = {
        generated_at: new Date().toISOString(),
        summary: {
          total_entities: 7,
          total_records: clients.length + sales.length + tasks.length + campaigns.length + equipment.length + visits.length + documents.length
        },
        entities_audit: {},
        missing_data: [],
        incomplete_features: [],
        recommendations: []
      };

      // AUDIT 1: Clientes
      const clientsAudit = {
        total: clients.length,
        missing_fields: [],
        incomplete_records: 0
      };

      clients.forEach(c => {
        const missing = [];
        if (!c.email) missing.push('email');
        if (!c.phone) missing.push('phone');
        if (!c.city) missing.push('city');
        if (!c.cnpj) missing.push('cnpj');
        if (!c.numerology_number) missing.push('numerology_number');
        if (!c.behavioral_profile) missing.push('behavioral_profile');
        if (!c.lab_needs || c.lab_needs.length === 0) missing.push('lab_needs');
        if (!c.communication_preferences) missing.push('communication_preferences');
        if (!c.engagement_score) missing.push('engagement_score');
        if (!c.health_score) missing.push('health_score');
        
        if (missing.length > 0) {
          clientsAudit.incomplete_records++;
          clientsAudit.missing_fields.push({
            client: c.first_name,
            missing
          });
        }
      });

      report.entities_audit.clients = clientsAudit;

      if (clientsAudit.incomplete_records > 0) {
        report.missing_data.push({
          entity: 'Clientes',
          issue: `${clientsAudit.incomplete_records} clientes com dados incompletos`,
          severity: 'alta',
          impact: 'IAs de análise comportamental e engagement não funcionarão corretamente'
        });
      }

      // AUDIT 2: Vendas
      const salesAudit = {
        total: sales.length,
        missing_equipment: sales.filter(s => !s.equipment_name).length,
        missing_value: sales.filter(s => !s.sale_value || s.sale_value === 0).length,
        no_client_link: sales.filter(s => !s.client_id).length
      };

      report.entities_audit.sales = salesAudit;

      if (salesAudit.missing_equipment > 0) {
        report.missing_data.push({
          entity: 'Vendas',
          issue: `${salesAudit.missing_equipment} vendas sem equipamento definido`,
          severity: 'media',
          impact: 'Relatórios de performance por produto incompletos'
        });
      }

      if (salesAudit.missing_value > 0) {
        report.missing_data.push({
          entity: 'Vendas',
          issue: `${salesAudit.missing_value} vendas sem valor`,
          severity: 'alta',
          impact: 'Dashboards financeiros e previsões incorretas'
        });
      }

      // AUDIT 3: Tarefas
      const tasksAudit = {
        total: tasks.length,
        no_client: tasks.filter(t => !t.client_id).length,
        no_due_date: tasks.filter(t => !t.due_date).length,
        auto_created: tasks.filter(t => t.auto_created).length,
        manual_created: tasks.filter(t => !t.auto_created).length
      };

      report.entities_audit.tasks = tasksAudit;

      if (tasksAudit.no_client > 0) {
        report.missing_data.push({
          entity: 'Tarefas',
          issue: `${tasksAudit.no_client} tarefas sem cliente associado`,
          severity: 'baixa',
          impact: 'Dificulta organização e follow-up'
        });
      }

      // AUDIT 4: Campanhas
      const campaignsAudit = {
        total: campaigns.length,
        no_target: campaigns.filter(c => !c.target_audience || Object.keys(c.target_audience).length === 0).length,
        no_budget: campaigns.filter(c => !c.budget || c.budget === 0).length,
        active: campaigns.filter(c => c.status === 'ativa').length,
        draft: campaigns.filter(c => c.status === 'rascunho').length
      };

      report.entities_audit.campaigns = campaignsAudit;

      if (campaignsAudit.no_target > 0) {
        report.missing_data.push({
          entity: 'Campanhas',
          issue: `${campaignsAudit.no_target} campanhas sem público-alvo definido`,
          severity: 'alta',
          impact: 'IA não consegue segmentar e personalizar conteúdo'
        });
      }

      // AUDIT 5: Equipamentos
      const equipmentAudit = {
        total: equipment.length,
        no_price: equipment.filter(e => !e.price).length,
        no_specs: equipment.filter(e => !e.technical_specs).length,
        no_benefits: equipment.filter(e => !e.benefits || e.benefits.length === 0).length,
        no_persuasion: equipment.filter(e => !e.persuasion_triggers).length
      };

      report.entities_audit.equipment = equipmentAudit;

      if (equipmentAudit.no_price > 0) {
        report.missing_data.push({
          entity: 'Equipamentos',
          issue: `${equipmentAudit.no_price} equipamentos sem preço`,
          severity: 'alta',
          impact: 'Gerador de propostas não funciona'
        });
      }

      if (equipmentAudit.no_persuasion > 0) {
        report.missing_data.push({
          entity: 'Equipamentos',
          issue: `${equipmentAudit.no_persuasion} equipamentos sem gatilhos de persuasão`,
          severity: 'media',
          impact: 'Material de vendas menos efetivo'
        });
      }

      // AUDIT 6: Visitas
      const visitsAudit = {
        total: visits.length,
        no_result: visits.filter(v => v.status === 'realizada' && !v.result_notes).length,
        not_synced: visits.filter(v => !v.google_calendar_synced).length
      };

      report.entities_audit.visits = visitsAudit;

      if (visitsAudit.no_result > 0) {
        report.missing_data.push({
          entity: 'Visitas',
          issue: `${visitsAudit.no_result} visitas realizadas sem notas de resultado`,
          severity: 'media',
          impact: 'IAs de análise de performance não aprendem com histórico'
        });
      }

      // AUDIT 7: Documentos
      const docsAudit = {
        total: documents.length,
        unsigned: documents.filter(d => !d.is_signed).length,
        no_client: documents.filter(d => !d.client_id).length
      };

      report.entities_audit.documents = docsAudit;

      // FUNCIONALIDADES INCOMPLETAS
      if (clients.filter(c => !c.ai_sales_intelligence).length > clients.length * 0.5) {
        report.incomplete_features.push({
          feature: 'Sales Intelligence IA',
          issue: 'Mais de 50% dos clientes sem análise de IA',
          action: 'Executar análise em massa'
        });
      }

      if (clients.filter(c => !c.health_score).length > 0) {
        report.incomplete_features.push({
          feature: 'Health Score',
          issue: `${clients.filter(c => !c.health_score).length} clientes sem health score`,
          action: 'Calcular health score para todos'
        });
      }

      if (equipment.filter(e => !e.video_url).length > 0) {
        report.incomplete_features.push({
          feature: 'Vídeos Demonstrativos',
          issue: `${equipment.filter(e => !e.video_url).length} equipamentos sem vídeo`,
          action: 'Linkar vídeos do Google Drive'
        });
      }

      // RECOMENDAÇÕES
      report.recommendations.push('Completar perfis numerológicos para clientes prioritários (quentes)');
      report.recommendations.push('Adicionar lab_needs detalhadas para melhor seleção de equipamentos');
      report.recommendations.push('Configurar communication_preferences para automação de follow-up');
      report.recommendations.push('Vincular vídeos do Google Drive aos equipamentos');
      report.recommendations.push('Executar análise de IA em massa para clientes sem intelligence');
      report.recommendations.push('Adicionar gatilhos de persuasão a equipamentos sem material completo');

      setAuditReport(report);
      toast.success('Auditoria concluída!', {
        description: `${report.missing_data.length} problemas identificados`
      });

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao executar auditoria');
    } finally {
      setAuditing(false);
    }
  };

  const sendToWhatsApp = async () => {
    if (!auditReport || !user?.phone) {
      toast.error('Configure seu WhatsApp em Configurações');
      return;
    }

    const message = `🔍 *AUDITORIA COMPLETA - VENDA NR*\n\n` +
      `📅 ${new Date(auditReport.generated_at).toLocaleString('pt-BR')}\n\n` +
      `${'='.repeat(40)}\n\n` +
      `📊 *RESUMO GERAL*\n` +
      `• Total de registros: ${auditReport.summary.total_records}\n` +
      `• Problemas identificados: ${auditReport.missing_data.length}\n` +
      `• Funcionalidades incompletas: ${auditReport.incomplete_features.length}\n\n` +
      `${'='.repeat(40)}\n\n` +
      `🔴 *PROBLEMAS CRÍTICOS*\n\n` +
      auditReport.missing_data.filter(p => p.severity === 'alta').map(p => 
        `⚠️ ${p.entity}: ${p.issue}\n   → ${p.impact}\n`
      ).join('\n') +
      `\n${'='.repeat(40)}\n\n` +
      `🟡 *PROBLEMAS MÉDIOS*\n\n` +
      auditReport.missing_data.filter(p => p.severity === 'media').map(p => 
        `• ${p.entity}: ${p.issue}\n`
      ).join('\n') +
      `\n${'='.repeat(40)}\n\n` +
      `📋 *ENTIDADES AUDITADAS*\n\n` +
      `👥 Clientes: ${auditReport.entities_audit.clients.total}\n` +
      `   • ${auditReport.entities_audit.clients.incomplete_records} com dados incompletos\n\n` +
      `💰 Vendas: ${auditReport.entities_audit.sales.total}\n` +
      `   • ${auditReport.entities_audit.sales.missing_value} sem valor\n\n` +
      `✅ Tarefas: ${auditReport.entities_audit.tasks.total}\n` +
      `   • ${auditReport.entities_audit.tasks.auto_created} automáticas\n` +
      `   • ${auditReport.entities_audit.tasks.manual_created} manuais\n\n` +
      `📢 Campanhas: ${auditReport.entities_audit.campaigns.total}\n` +
      `   • ${auditReport.entities_audit.campaigns.active} ativas\n` +
      `   • ${auditReport.entities_audit.campaigns.draft} rascunhos\n\n` +
      `🔧 Equipamentos: ${auditReport.entities_audit.equipment.total}\n` +
      `   • ${auditReport.entities_audit.equipment.no_price} sem preço\n` +
      `   • ${auditReport.entities_audit.equipment.no_persuasion} sem gatilhos\n\n` +
      `📅 Visitas: ${auditReport.entities_audit.visits.total}\n` +
      `   • ${auditReport.entities_audit.visits.no_result} sem resultado\n\n` +
      `📄 Documentos: ${auditReport.entities_audit.documents.total}\n` +
      `   • ${auditReport.entities_audit.documents.unsigned} não assinados\n\n` +
      `${'='.repeat(40)}\n\n` +
      `⚙️ *FUNCIONALIDADES INCOMPLETAS*\n\n` +
      auditReport.incomplete_features.map(f => 
        `• ${f.feature}\n   ${f.issue}\n   ✓ ${f.action}\n`
      ).join('\n') +
      `\n${'='.repeat(40)}\n\n` +
      `💡 *RECOMENDAÇÕES PRIORITÁRIAS*\n\n` +
      auditReport.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n\n') +
      `\n\n${'='.repeat(40)}\n\n` +
      `✅ Auditoria completa finalizada\n` +
      `📁 Drive salvo: https://drive.google.com/drive/folders/12qd_dpY5HN-m4AyZTFSwLil_KywlTB2_`;

    await navigator.clipboard.writeText(message);
    window.open(`https://wa.me/${user.phone}?text=${encodeURIComponent(message)}`, '_blank');
    toast.success('Relatório copiado! Enviando para WhatsApp...');
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">Auditoria do Sistema</h2>
          <p className="text-sm text-slate-600">Diagnóstico completo de dados e funcionalidades</p>
        </div>
      </div>

      <Button
        onClick={runAudit}
        disabled={auditing}
        className="w-full h-12 bg-red-600 hover:bg-red-700 mb-4"
      >
        {auditing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Auditando...
          </>
        ) : (
          <>
            <FileText className="w-5 h-5 mr-2" />
            Executar Auditoria Completa
          </>
        )}
      </Button>

      {auditReport && (
        <div className="space-y-3">
          <div className="p-4 bg-white rounded-lg border-2 border-red-200">
            <p className="text-sm font-semibold text-slate-800 mb-2">Resultado da Auditoria</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="font-semibold">{auditReport.missing_data.length} Problemas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-600" />
                <span>{auditReport.incomplete_features.length} Funcionalidades Incompletas</span>
              </div>
              <div className="text-slate-600">
                Total de {auditReport.summary.total_records} registros auditados
              </div>
            </div>
          </div>

          <Button
            onClick={sendToWhatsApp}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar Relatório (WhatsApp)
          </Button>
        </div>
      )}
    </Card>
  );
}