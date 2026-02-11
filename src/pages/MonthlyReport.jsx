import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Loader2, Calendar, TrendingUp, MapPin, Star } from 'lucide-react';
import moment from 'moment';

export default function MonthlyReport() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['monthly-visits', selectedMonth],
    queryFn: () => base44.entities.MonthlyVisitRecord.filter({ month: selectedMonth }, '-visit_date')
  });

  const stats = useMemo(() => {
    const total = visits.length;
    const avgRating = visits.reduce((acc, v) => acc + (v.rating || 0), 0) / (total || 1);
    const excellent = visits.filter(v => v.visit_result === 'excelente').length;
    const cities = [...new Set(visits.map(v => v.city))].filter(Boolean).length;
    
    return { total, avgRating: avgRating.toFixed(1), excellent, cities };
  }, [visits]);

  const generatePDF = async () => {
    setGeneratingPDF(true);
    try {
      const monthName = moment(selectedMonth).format('MMMM [de] YYYY');
      
      let content = `RELATÓRIO MENSAL DE VISITAS - ${monthName.toUpperCase()}\n\n`;
      content += `═══════════════════════════════════════\n`;
      content += `📊 RESUMO DO MÊS\n`;
      content += `═══════════════════════════════════════\n\n`;
      content += `Total de Visitas: ${stats.total}\n`;
      content += `Avaliação Média: ${stats.avgRating} ⭐\n`;
      content += `Visitas Excelentes: ${stats.excellent}\n`;
      content += `Cidades Atendidas: ${stats.cities}\n\n`;
      
      content += `═══════════════════════════════════════\n`;
      content += `📋 DETALHAMENTO DAS VISITAS\n`;
      content += `═══════════════════════════════════════\n\n`;

      visits.forEach((visit, idx) => {
        content += `${idx + 1}. ${visit.client_name} - ${visit.clinic_name || ''}\n`;
        content += `   📅 Data: ${moment(visit.visit_date).format('DD/MM/YYYY')}\n`;
        content += `   📍 Cidade: ${visit.city || 'N/A'}\n`;
        content += `   ⭐ Avaliação: ${visit.rating}/5\n`;
        content += `   🎯 Objetivo: ${visit.visit_objective || 'N/A'}\n`;
        content += `   ✅ Resultado: ${visit.visit_result || 'N/A'}\n`;
        if (visit.equipment_presented) {
          content += `   💼 Equipamento: ${visit.equipment_presented}\n`;
        }
        if (visit.next_steps) {
          content += `   ➡️ Próximos passos: ${visit.next_steps}\n`;
        }
        if (visit.opportunities) {
          content += `   💡 Oportunidades: ${visit.opportunities}\n`;
        }
        content += `\n`;
      });

      const response = await base44.functions.invoke('generatePDFForWhatsApp', {
        content,
        title: `Relatório Mensal - ${monthName}`,
        clientName: 'Múltiplos Clientes'
      });

      if (response.data.success) {
        toast.success('✅ PDF gerado! Link copiado.');
        navigator.clipboard.writeText(response.data.file_url);
        window.open(response.data.file_url, '_blank');
        
        // Marcar como incluídos no relatório
        for (const visit of visits) {
          await base44.entities.MonthlyVisitRecord.update(visit.id, { included_in_report: true });
        }
        queryClient.invalidateQueries(['monthly-visits']);
      }
    } catch (error) {
      toast.error('Erro ao gerar PDF: ' + error.message);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const months = useMemo(() => {
    const result = [];
    for (let i = 0; i < 6; i++) {
      result.push(moment().subtract(i, 'months').format('YYYY-MM'));
    }
    return result;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      <div className="sticky top-0 z-40 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-3 shadow-lg border-b border-orange-500">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button size="sm" variant="ghost" className="text-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-black text-white">Relatório Mensal</h1>
            <p className="text-xs text-orange-400">Visitas realizadas</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Seletor de Mês */}
        <Card className="p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Selecione o Mês
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {months.map(month => (
              <Button
                key={month}
                variant={selectedMonth === month ? "default" : "outline"}
                onClick={() => setSelectedMonth(month)}
                className={selectedMonth === month ? "bg-indigo-600" : ""}
              >
                {moment(month).format('MMM/YY')}
              </Button>
            ))}
          </div>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-semibold text-blue-900">Total Visitas</p>
            </div>
            <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-yellow-600" />
              <p className="text-sm font-semibold text-yellow-900">Avaliação</p>
            </div>
            <p className="text-3xl font-bold text-yellow-900">{stats.avgRating} ⭐</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <p className="text-sm font-semibold text-green-900">Excelentes</p>
            </div>
            <p className="text-3xl font-bold text-green-900">{stats.excellent}</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-semibold text-purple-900">Cidades</p>
            </div>
            <p className="text-3xl font-bold text-purple-900">{stats.cities}</p>
          </Card>
        </div>

        {/* Botão Gerar PDF */}
        {visits.length > 0 && (
          <Button
            onClick={generatePDF}
            disabled={generatingPDF}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {generatingPDF ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Gerar PDF do Relatório
              </>
            )}
          </Button>
        )}

        {/* Lista de Visitas */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">Visitas Registradas</h3>
          {isLoading ? (
            <Card className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
            </Card>
          ) : visits.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              Nenhuma visita registrada neste mês
            </Card>
          ) : (
            visits.map(visit => (
              <Card key={visit.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{visit.client_name}</p>
                    <p className="text-sm text-slate-600">{visit.clinic_name}</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {visit.rating} ⭐
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <p>📅 {moment(visit.visit_date).format('DD/MM/YYYY')}</p>
                  <p>📍 {visit.city}</p>
                  <p>🎯 {visit.visit_objective}</p>
                  <p>✅ {visit.visit_result}</p>
                </div>
                {visit.equipment_presented && (
                  <p className="text-xs text-indigo-600 mt-2">💼 {visit.equipment_presented}</p>
                )}
                {visit.included_in_report && (
                  <Badge variant="outline" className="mt-2">✓ Incluído em relatório</Badge>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}