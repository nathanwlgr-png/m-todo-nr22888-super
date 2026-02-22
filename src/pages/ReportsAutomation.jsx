import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  FileText, Plus, Send, Calendar, Mail, Play, Trash2, Eye, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import ReportBuilder, { KPIS, CHART_OPTIONS } from '@/components/reports/ReportBuilder';
import ReportPreview from '@/components/reports/ReportPreview';

const PERIOD_LABELS = {
  ultimo_mes: 'Último mês', ultimo_trimestre: 'Último trimestre',
  ultimo_semestre: 'Último semestre', ultimo_ano: 'Último ano',
  mes_atual: 'Mês atual', trimestre_atual: 'Trimestre atual', ano_atual: 'Ano atual', custom: 'Período personalizado'
};

const DAY_LABELS = { monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta', thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo' };

const DEFAULT_FORM = {
  report_name: '',
  report_type: 'mensal',
  period: 'ultimo_mes',
  period_start: '',
  period_end: '',
  recipients: '',
  metrics_included: [],
  chart_types: {},
  schedule_time: '08:00',
  schedule_day: 'monday',
  schedule_day_of_month: 1,
  include_charts: true,
  format: 'html'
};

export default function ReportsAutomation() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [expandedReport, setExpandedReport] = useState(null);
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: () => base44.entities.ScheduledReport?.list('-created_date').catch(() => [])
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const recipients = data.recipients.split(',').map(e => e.trim()).filter(Boolean);
      return base44.entities.ScheduledReport.create({ ...data, recipients, is_active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduled-reports']);
      toast.success('Relatório agendado criado!');
      setDialogOpen(false);
      setFormData(DEFAULT_FORM);
    },
    onError: (e) => toast.error('Erro: ' + e.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledReport.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['scheduled-reports']); toast.success('Removido!'); }
  });

  const toggleMutation = useMutation({
    mutationFn: async (report) => base44.entities.ScheduledReport.update(report.id, { is_active: !report.is_active }),
    onSuccess: () => queryClient.invalidateQueries(['scheduled-reports'])
  });

  const sendNowMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('generateConsolidatedReport', { report_id: id }),
    onSuccess: () => toast.success('Relatório enviado!'),
    onError: (e) => toast.error('Erro ao enviar: ' + e.message)
  });

  if (isLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios Automáticos</h1>
          <p className="text-slate-500 text-sm mt-1">Configure, personalize KPIs e agende envios por e-mail</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Configurar Relatório Personalizado
              </DialogTitle>
            </DialogHeader>
            <ReportBuilder
              formData={formData}
              setFormData={setFormData}
              onSubmit={() => createMutation.mutate(formData)}
              isSubmitting={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-indigo-700">{reports.length}</p>
            <p className="text-xs text-indigo-600">Relatórios criados</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-green-700">{reports.filter(r => r.is_active).length}</p>
            <p className="text-xs text-green-600">Ativos</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-purple-700">{reports.filter(r => r.last_sent_status === 'success').length}</p>
            <p className="text-xs text-purple-600">Enviados com sucesso</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports list */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">Nenhum relatório agendado</p>
            <p className="text-sm text-slate-400 mt-1">Clique em "Novo Relatório" para criar o primeiro</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map(report => {
            const isExpanded = expandedReport === report.id;
            const kpisInfo = (report.metrics_included || []).map(id => KPIS.find(k => k.id === id)).filter(Boolean);
            return (
              <Card key={report.id} className={`transition-all ${report.is_active ? 'border-indigo-200' : 'opacity-70'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{report.report_name}</CardTitle>
                        <Badge className={report.is_active ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}>
                          {report.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {report.last_sent_status === 'success' && <Badge className="bg-indigo-100 text-indigo-700">✓ Enviado</Badge>}
                      </div>

                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {report.report_type} · {PERIOD_LABELS[report.period] || '-'}
                          {report.schedule_time && ` às ${report.schedule_time}`}
                          {report.report_type === 'semanal' && report.schedule_day && ` (${DAY_LABELS[report.schedule_day]})`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {(report.recipients || []).join(', ')}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {kpisInfo.slice(0, 5).map(k => {
                          const Icon = k.icon;
                          return (
                            <Badge key={k.id} variant="outline" className="text-[10px] gap-1 py-0">
                              <Icon className="w-2.5 h-2.5" />{k.label}
                            </Badge>
                          );
                        })}
                        {kpisInfo.length > 5 && <Badge variant="outline" className="text-[10px]">+{kpisInfo.length - 5}</Badge>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => sendNowMutation.mutate(report.id)}
                        disabled={sendNowMutation.isPending} title="Enviar agora" className="h-8 w-8 p-0">
                        {sendNowMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleMutation.mutate(report)}
                        title={report.is_active ? 'Pausar' : 'Ativar'} className="h-8 w-8 p-0">
                        <Play className={`w-3.5 h-3.5 ${report.is_active ? 'text-green-600' : 'text-slate-400'}`} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                        title="Ver preview" className="h-8 w-8 p-0">
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(report.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                        className="h-8 w-8 p-0">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t pt-4">
                    <ReportPreview report={report} KPIS={KPIS} CHART_OPTIONS={CHART_OPTIONS} />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}