import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export default function ClientSalesReport({ client, sales = [], visits = [], tasks = [], interactions = [] }) {
  const [period, setPeriod] = useState('90');

  const filteredData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(period));

    const filtSales = sales.filter(s => new Date(s.sale_date || s.created_date) >= cutoff);
    const filtVisits = visits.filter(v => new Date(v.scheduled_date || v.created_date) >= cutoff);
    const filtTasks = tasks.filter(t => new Date(t.created_date) >= cutoff);
    const filtInteractions = interactions.filter(i => new Date(i.created_date) >= cutoff);

    const closedSales = filtSales.filter(s => s.status === 'fechada');
    const totalRevenue = closedSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const avgTicket = closedSales.length > 0 ? totalRevenue / closedSales.length : 0;
    const convRate = filtVisits.length > 0 ? ((closedSales.length / filtVisits.length) * 100).toFixed(1) : 0;

    return { filtSales, filtVisits, filtTasks, filtInteractions, closedSales, totalRevenue, avgTicket, convRate };
  }, [sales, visits, tasks, interactions, period]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const d = filteredData;
    let y = 15;

    const line = (text, size = 10, bold = false, color = [30, 30, 30]) => {
      doc.setFontSize(size);
      doc.setFont(undefined, bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, 175);
      lines.forEach(l => {
        if (y > 280) { doc.addPage(); y = 15; }
        doc.text(l, 15, y);
        y += size * 0.55;
      });
      y += 2;
    };

    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('RELATÓRIO DE VENDAS — MÉTODO NR22', 15, 12);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Cliente: ${client?.first_name || ''} ${client?.clinic_name ? '| ' + client.clinic_name : ''}`, 15, 20);
    doc.text(`Período: últimos ${period} dias | Gerado: ${new Date().toLocaleDateString('pt-BR')}`, 15, 27);
    y = 40;
    doc.setTextColor(30, 30, 30);

    line('RESUMO EXECUTIVO', 13, true);
    line(`• Receita Total: R$ ${d.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 10);
    line(`• Vendas Fechadas: ${d.closedSales.length} (de ${d.filtSales.length} propostas)`, 10);
    line(`• Ticket Médio: R$ ${d.avgTicket.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 10);
    line(`• Taxa de Conversão: ${d.convRate}%`, 10);
    line(`• Visitas Realizadas: ${d.filtVisits.filter(v => v.status === 'realizada').length}`, 10);
    line(`• Interações: ${d.filtInteractions.length}`, 10);
    line(`• Tarefas Concluídas: ${d.filtTasks.filter(t => t.status === 'concluida').length}`, 10);
    y += 4;

    if (d.closedSales.length > 0) {
      line('VENDAS FECHADAS', 13, true);
      d.closedSales.forEach((s, i) => {
        line(`${i + 1}. ${s.equipment_name} — R$ ${(s.sale_value || 0).toLocaleString('pt-BR')} — ${new Date(s.sale_date).toLocaleDateString('pt-BR')}`, 10);
        if (s.payment_terms) line(`   Condições: ${s.payment_terms}`, 9);
      });
      y += 4;
    }

    if (d.filtVisits.length > 0) {
      line('VISITAS', 13, true);
      d.filtVisits.forEach((v, i) => {
        line(`${i + 1}. ${v.visit_type || 'Visita'} — ${new Date(v.scheduled_date).toLocaleDateString('pt-BR')} — ${v.status}`, 10);
        if (v.result_notes) line(`   ${v.result_notes.substring(0, 80)}`, 9);
      });
      y += 4;
    }

    line('DADOS DO CLIENTE', 13, true);
    line(`Status: ${client?.status || '-'} | Pipeline: ${client?.pipeline_stage || '-'} | Score: ${client?.purchase_score || 0}%`, 10);
    line(`Equip. Interesse: ${client?.equipment_interest || '-'} | Orçamento: R$ ${client?.available_budget || '-'}`, 10);
    line(`Numerologia: ${client?.numerology_number || '-'} | Perfil: ${client?.behavioral_profile || '-'}`, 10);

    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Gerado pelo Método NR22 — CMAT Brasil | Seamaty', 15, y);

    const fileName = `NR22_Relatorio_${client?.first_name || 'Cliente'}_${period}d_${Date.now()}.pdf`;
    doc.save(fileName);
    toast.success(`PDF gerado: ${fileName}`);

    // Disparar evento para FloatingExportButton
    window.dispatchEvent(new CustomEvent('documentReady', {
      detail: { title: fileName, url: null, type: 'pdf' }
    }));
  };

  const d = filteredData;

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-green-600" />
          Relatório de Vendas por Período
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 items-center">
          <Calendar className="w-4 h-4 text-slate-400" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-8 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2 bg-white rounded border border-green-200 text-center">
            <p className="text-slate-500">Receita</p>
            <p className="font-bold text-green-700">R$ {(d.totalRevenue / 1000).toFixed(1)}k</p>
          </div>
          <div className="p-2 bg-white rounded border border-blue-200 text-center">
            <p className="text-slate-500">Vendas</p>
            <p className="font-bold text-blue-700">{d.closedSales.length}</p>
          </div>
          <div className="p-2 bg-white rounded border border-purple-200 text-center">
            <p className="text-slate-500">Conversão</p>
            <p className="font-bold text-purple-700">{d.convRate}%</p>
          </div>
        </div>

        <Button onClick={generatePDF} className="w-full bg-green-600 hover:bg-green-700 h-9 text-xs gap-2">
          <Download className="w-4 h-4" />
          Gerar PDF — Enviar WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
}