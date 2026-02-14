import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileText, Download, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function DailyReports() {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [clinicsVisited, setClinicsVisited] = useState('');
  const [notes, setNotes] = useState('');
  const [format, setFormat] = useState('excel');
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits', reportDate],
    queryFn: () => base44.entities.Visit.filter({
      scheduled_date: { $gte: reportDate, $lte: reportDate + 'T23:59:59' }
    })
  });

  const { data: monthlyVisits = [] } = useQuery({
    queryKey: ['monthlyVisits', reportDate],
    queryFn: () => base44.entities.MonthlyVisitRecord.filter({
      visit_date: reportDate
    })
  });

  const handleGenerate = async () => {
    if (!clinicsVisited.trim()) {
      toast.error('Por favor, liste as clínicas visitadas');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateSalesReport', {
        date: reportDate,
        clinics_text: clinicsVisited,
        notes: notes,
        format: format,
        visits: visits,
        monthly_visits: monthlyVisits
      });

      if (response.data.success) {
        setGeneratedUrl(response.data.file_url);
        toast.success('Relatório gerado com sucesso!');
      } else {
        toast.error(response.data.error || 'Erro ao gerar relatório');
      }
    } catch (error) {
      toast.error('Erro ao gerar relatório: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const quickFillToday = () => {
    const todayVisits = visits.map(v => v.client_name).join('\n');
    const todayMonthly = monthlyVisits.map(m => m.client_name).join('\n');
    const combined = [...new Set([todayVisits, todayMonthly].filter(Boolean))].join('\n');
    setClinicsVisited(combined);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Relatórios de Vendas</h1>
            <p className="text-slate-600">Gere relatórios diários e mensais automaticamente</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Configuração do Relatório */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Configurar Relatório
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Data do Relatório</label>
                  <Input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Formato</label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="word">Word (.docx)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Clínicas Visitadas</label>
                  <Button variant="outline" size="sm" onClick={quickFillToday}>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Preencher do Dia
                  </Button>
                </div>
                <Textarea
                  placeholder="Digite as clínicas visitadas (uma por linha) e a situação de cada uma..."
                  value={clinicsVisited}
                  onChange={(e) => setClinicsVisited(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Exemplo: Clínica ABC - Proposta enviada, aguardando retorno
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Observações Adicionais</label>
                <Textarea
                  placeholder="Adicione observações gerais sobre o dia..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando Relatório...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Gerar Relatório
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Relatório Gerado */}
          {generatedUrl && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  Relatório Pronto!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <a href={generatedUrl} download className="flex-1">
                    <Button className="w-full" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Relatório
                    </Button>
                  </a>
                  <Button
                    onClick={() => {
                      setGeneratedUrl('');
                      setClinicsVisited('');
                      setNotes('');
                    }}
                    variant="ghost"
                  >
                    Novo Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visitas do Dia */}
          {(visits.length > 0 || monthlyVisits.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Visitas Registradas em {reportDate}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {visits.map((visit) => (
                    <div key={visit.id} className="p-3 bg-slate-100 rounded-lg">
                      <div className="font-medium">{visit.client_name}</div>
                      <div className="text-sm text-slate-600">{visit.visit_type}</div>
                    </div>
                  ))}
                  {monthlyVisits.map((visit) => (
                    <div key={visit.id} className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium">{visit.client_name}</div>
                      <div className="text-sm text-slate-600">
                        Avaliação: {visit.rating}/5 - {visit.visit_result}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}