import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function VisitReportPDF({ client, visitHistory = [] }) {
  const [generating, setGenerating] = React.useState(false);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Visitas - Venda NR', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Cliente Info
      doc.setFontSize(14);
      doc.text(`Cliente: ${client.first_name}`, 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (client.clinic_name) {
        doc.text(`Clínica: ${client.clinic_name}`, 20, yPos);
        yPos += 6;
      }
      if (client.city) {
        doc.text(`Cidade: ${client.city}`, 20, yPos);
        yPos += 6;
      }
      doc.text(`Status: ${client.status}`, 20, yPos);
      yPos += 6;
      doc.text(`Score de Compra: ${client.purchase_score || 0}%`, 20, yPos);
      yPos += 10;

      // Perfil Numerológico
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Perfil Numerológico:', 20, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Número: ${client.numerology_number || 'N/A'}`, 20, yPos);
      yPos += 5;
      doc.text(`Perfil: ${client.behavioral_profile || 'N/A'}`, 20, yPos);
      yPos += 5;
      doc.text(`Estilo de Decisão: ${client.decision_style || 'N/A'}`, 20, yPos);
      yPos += 10;

      // Histórico de Visitas
      if (visitHistory.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Histórico de Visitas:', 20, yPos);
        yPos += 8;

        visitHistory.forEach((visit, idx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(`Visita ${idx + 1} - ${format(new Date(visit.date), 'dd/MM/yyyy')}`, 20, yPos);
          yPos += 6;

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');

          if (visit.triggers_used?.length > 0) {
            doc.text(`Gatilhos Usados: ${visit.triggers_used.join(', ')}`, 25, yPos);
            yPos += 5;
          }

          if (visit.techniques_used?.length > 0) {
            doc.text(`Técnicas Usadas: ${visit.techniques_used.join(', ')}`, 25, yPos);
            yPos += 5;
          }

          if (visit.objections_presented?.length > 0) {
            doc.text('Objeções Apresentadas:', 25, yPos);
            yPos += 5;
            visit.objections_presented.forEach(obj => {
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
              }
              const lines = doc.splitTextToSize(`• ${obj}`, pageWidth - 50);
              doc.text(lines, 30, yPos);
              yPos += lines.length * 4;
            });
          }

          if (visit.notes) {
            doc.text('Notas:', 25, yPos);
            yPos += 5;
            const noteLines = doc.splitTextToSize(visit.notes, pageWidth - 50);
            doc.text(noteLines, 30, yPos);
            yPos += noteLines.length * 4;
          }

          if (visit.next_action) {
            doc.text(`Próxima Ação: ${visit.next_action}`, 25, yPos);
            yPos += 5;
          }

          yPos += 8;
        });
      }

      // Motivadores e Objeções Gerais
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      if (client.purchase_motivators?.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Motivadores de Compra:', 20, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        client.purchase_motivators.forEach(m => {
          doc.text(`• ${m}`, 25, yPos);
          yPos += 5;
        });
        yPos += 5;
      }

      if (client.real_objections?.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Objeções Identificadas:', 20, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        client.real_objections.forEach(o => {
          doc.text(`• ${o}`, 25, yPos);
          yPos += 5;
        });
      }

      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Página ${i} de ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save
      doc.save(`Relatorio_${client.first_name}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Relatório PDF gerado!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={generating}
      variant="outline"
      className="w-full h-12 border-2 border-indigo-200 hover:bg-indigo-50"
    >
      {generating ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <FileText className="w-4 h-4 mr-2" />
      )}
      Gerar Relatório PDF
    </Button>
  );
}