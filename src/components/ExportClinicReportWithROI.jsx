import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

export default function ExportClinicReportWithROI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExportPDF = async () => {
    setLoading(true);
    setError(null);

    try {
      const report = await base44.functions.invoke('generateConsolidatedClinicReportWithROI', {});
      
      // Create PDF content
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('l', 'mm', 'a4');

      // Title
      doc.setFontSize(18);
      doc.text('Relatório Consolidado de Clínicas - Território Nathan', 20, 20);

      // Summary section
      doc.setFontSize(12);
      doc.text('Resumo Executivo', 20, 35);
      
      doc.setFontSize(10);
      const summaryData = [
        [`Total de Clínicas Mapeadas: ${report.data.summary.totalClinicsMaped}`],
        [`Valor Anual Estimado: R$ ${report.data.summary.totalEstimatedAnnualValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        [`ROI Médio: ${report.data.summary.averageROIMonths} meses`],
        [`Clínicas com Alto Potencial (>R$50k): ${report.data.summary.highPotentialClinics}`],
      ];

      let yPos = 45;
      summaryData.forEach(line => {
        doc.text(line[0], 20, yPos);
        yPos += 8;
      });

      // Table header
      yPos += 5;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Clínica', 20, yPos);
      doc.text('Cidade', 70, yPos);
      doc.text('Valor Anual', 110, yPos);
      doc.text('ROI (meses)', 150, yPos);
      doc.text('Status', 190, yPos);

      // Table data
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      yPos += 8;

      report.data.clinics.slice(0, 20).forEach(clinic => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        const clinicName = clinic.clinicName.substring(0, 30);
        const value = `R$ ${(clinic.estimatedAnnualValue / 1000).toFixed(0)}k`;
        
        doc.text(clinicName, 20, yPos);
        doc.text(clinic.city.substring(0, 15), 70, yPos);
        doc.text(value, 110, yPos);
        doc.text(clinic.roiMonths.toString(), 150, yPos);
        doc.text(clinic.status || 'N/A', 190, yPos);

        yPos += 7;
      });

      // Footer
      doc.setFontSize(8);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 280);

      doc.save('relatorio_clinicas_roi.pdf');
    } catch (err) {
      setError(err.message);
      console.error('Erro ao exportar relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      <Button
        onClick={handleExportPDF}
        disabled={loading}
        variant="outline"
        className="gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Exportar Relatório ROI
          </>
        )}
      </Button>
    </div>
  );
}