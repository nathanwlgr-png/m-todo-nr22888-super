import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, Plus, Send, Calendar, Users, Mail, 
  TrendingUp, AlertTriangle, Sparkles, Play, Trash2, Edit, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsAutomation() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [formData, setFormData] = useState({
    report_name: '',
    report_type: 'semanal',
    recipients: '',
    metrics_included: [],
    schedule_time: '08:00',
    schedule_day: 'monday',
    include_charts: true,
    format: 'html'
  });

  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: () => base44.entities.ScheduledReport?.list().catch(() => [])
  });

  const { data: automations = [] } = useQuery({
    queryKey: ['report-automations'],
    queryFn: async () => {
      const allAutomations = await base44.asServiceRole.functions.invoke('listAutomations', {});
      return allAutomations.data.filter(a => a.name.includes('Relatório'));
    }
  });

  const createReportMutation = useMutation({
    mutationFn: async (data) => {
      const recipients = data.recipients.split(',').map(e => e.trim()).filter(Boolean);
      
      const report = await base44.entities.ScheduledReport.create({
        ...data,
        recipients,
        is_active: true
      });

      // Criar automação agendada
      const schedule = {
        scheduled: {
          repeat_interval: data.report_type === 'diario' ? 1 : data.report_type === 'semanal' ? 1 : 30,
          repeat_unit: data.report_type === 'diario' ? 'days' : data.report_type === 'semanal' ? 'weeks' : 'months',
          start_time: data.schedule_time,
          ...(data.report_type === 'semanal' && {
            repeat_on_days: [getDayNumber(data.schedule_day)]
          })
        }
      };

      const automation = await base44.asServiceRole.functions.invoke('createAutomation', {
        automation_type: 'scheduled',
        name: `Relatório: ${data.report_name}`,
        function_name: 'generateConsolidatedReport',
        function_args: { report_id: report.id },
        ...schedule
      });

      await base44.entities.ScheduledReport.update(report.id, {
        automation_id: automation.data.id
      });

      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduled-reports']);
      queryClient.invalidateQueries(['report-automations']);
      toast.success('Relatório agendado criado!');
      setDialogOpen(false);
      resetForm();
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId) => {
      const report = reports.find(r => r.id === reportId);
      if (report?.automation_id) {
        await base44.asServiceRole.functions.invoke('manageAutomation', {
          automation_id: report.automation_id,
          action: 'delete'
        });
      }
      await base44.entities.ScheduledReport.delete(reportId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduled-reports']);
      toast.success('Relatório removido!');
    }
  });

  const toggleReportMutation = useMutation({
    mutationFn: async (reportId) => {
      const report = reports.find(r => r.id === reportId);
      if (report?.automation_id) {
        await base44.asServiceRole.functions.invoke('manageAutomation', {
          automation_id: report.automation_id,
          action: 'toggle'
        });
      }
      await base44.entities.ScheduledReport.update(reportId, {
        is_active: !report.is_active
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduled-reports']);
      toast.success('Status atualizado!');
    }
  });

  const sendNowMutation = useMutation({
    mutationFn: async (reportId) => {
      await base44.functions.invoke('generateConsolidatedReport', { report_id: reportId });
    },
    onSuccess: () => {
      toast.success('Relatório enviado!');
    }
  });

  const availableMetrics = [
    { id: 'novos_leads', label: 'Novos Leads', icon: Users },
    { id: 'clientes_ativos', label: 'Clientes Ativos', icon: CheckCircle2 },
    { id: 'vendas_realizadas', label: 'Vendas Realizadas', icon: TrendingUp },
    { id: 'performance_equipe', label: 'Performance da Equipe', icon: Users },
    { id: 'alertas_churn', label: 'Alertas de Churn', icon: AlertTriangle },
    { id: 'oportunidades_ia', label: 'Oportunidades IA', icon: Sparkles },
    { id: 'conversao_leads', label: 'Conversão de Leads', icon: TrendingUp },
    { id: 'sentimento_clientes', label: 'Sentimento dos Clientes', icon: Sparkles },
    { id: 'pipeline_status', label: 'Status do Pipeline', icon: FileText }
  ];

  const resetForm = () => {
    setFormData({
      report_name: '',
      report_type: 'semanal',
      recipients: '',
      metrics_included: [],
      schedule_time: '08:00',
      schedule_day: 'monday',
      include_charts: true,
      format: 'html'
    });
    setEditingReport(null);
  };

  const getDayNumber = (day) => {
    const days = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    return days[day] || 1;
  };

  const getDayLabel = (day) => {
    const labels = { 
      monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta', 
      thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo'
    };
    return labels[day] || day;
  };

  const handleMetricToggle = (metricId) => {
    setFormData(prev => ({
      ...prev,
      metrics_included: prev.metrics_included.includes(metricId)
        ? prev.metrics_included.filter(m => m !== metricId)
        : [...prev.metrics_included, metricId]
    }));
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Automáticos</h1>
          <p className="text-slate-600 mt-1">Configure relatórios consolidados agendados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configurar Relatório Automático</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Nome do Relatório</label>
                <Input
                  value={formData.report_name}
                  onChange={(e) => setFormData({...formData, report_name: e.target.value})}
                  placeholder="Ex: Relatório Semanal de Vendas"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Frequência</label>
                  <Select value={formData.report_type} onValueChange={(v) => setFormData({...formData, report_type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diário</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Horário de Envio</label>
                  <Input
                    type="time"
                    value={formData.schedule_time}
                    onChange={(e) => setFormData({...formData, schedule_time: e.target.value})}
                  />
                </div>
              </div>

              {formData.report_type === 'semanal' && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Dia da Semana</label>
                  <Select value={formData.schedule_day} onValueChange={(v) => setFormData({...formData, schedule_day: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Segunda-feira</SelectItem>
                      <SelectItem value="tuesday">Terça-feira</SelectItem>
                      <SelectItem value="wednesday">Quarta-feira</SelectItem>
                      <SelectItem value="thursday">Quinta-feira</SelectItem>
                      <SelectItem value="friday">Sexta-feira</SelectItem>
                      <SelectItem value="saturday">Sábado</SelectItem>
                      <SelectItem value="sunday">Domingo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold mb-2 block">Destinatários (emails separados por vírgula)</label>
                <Input
                  value={formData.recipients}
                  onChange={(e) => setFormData({...formData, recipients: e.target.value})}
                  placeholder="email1@exemplo.com, email2@exemplo.com"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-3 block">Métricas Incluídas</label>
                <div className="grid grid-cols-2 gap-3">
                  {availableMetrics.map(metric => {
                    const Icon = metric.icon;
                    return (
                      <div key={metric.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-slate-50">
                        <Checkbox
                          checked={formData.metrics_included.includes(metric.id)}
                          onCheckedChange={() => handleMetricToggle(metric.id)}
                        />
                        <Icon className="w-4 h-4 text-slate-600" />
                        <label className="text-sm cursor-pointer">{metric.label}</label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={() => createReportMutation.mutate(formData)}
                disabled={!formData.report_name || !formData.recipients || formData.metrics_included.length === 0 || createReportMutation.isPending}
                className="w-full"
              >
                {createReportMutation.isPending ? 'Criando...' : 'Criar Relatório Agendado'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <p className="text-slate-600">Nenhum relatório agendado ainda</p>
            <p className="text-sm text-slate-500 mt-1">Clique em "Novo Relatório" para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map(report => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {report.report_name}
                      {report.is_active ? (
                        <Badge className="bg-green-500">Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-slate-600 mt-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {report.report_type === 'diario' && 'Diário'}
                      {report.report_type === 'semanal' && `Semanal (${getDayLabel(report.schedule_day)})`}
                      {report.report_type === 'mensal' && 'Mensal'}
                      {' às '}{report.schedule_time}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendNowMutation.mutate(report.id)}
                      disabled={sendNowMutation.isPending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleReportMutation.mutate(report.id)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteReportMutation.mutate(report.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-semibold">Destinatários:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(report.recipients || []).map((email, idx) => (
                        <Badge key={idx} variant="outline" className="gap-1">
                          <Mail className="w-3 h-3" />
                          {email}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-semibold">Métricas:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(report.metrics_included || []).map(metric => {
                        const metricInfo = availableMetrics.find(m => m.id === metric);
                        if (!metricInfo) return null;
                        const Icon = metricInfo.icon;
                        return (
                          <Badge key={metric} variant="outline" className="gap-1">
                            <Icon className="w-3 h-3" />
                            {metricInfo.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {report.last_sent_date && (
                    <div className="text-xs text-slate-500 pt-2 border-t">
                      Último envio: {new Date(report.last_sent_date).toLocaleString('pt-BR')}
                      {report.last_sent_status === 'success' && (
                        <Badge className="ml-2 bg-green-500">Sucesso</Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}