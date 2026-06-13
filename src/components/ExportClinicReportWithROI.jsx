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
      // Busca clientes diretamente — não depende de função externa inexistente
      const clients = await base44.entities.Client.list('-purchase_score', 50);
      
      if (!clients || clients.length === 0) {
        setError('Nenhum cliente cadastrado para gerar o relatório.');
        return;
      }

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('l', 'mm', 'a4');

      doc.setFontSize(16);
      doc.text('Relatório de Clínicas — Território NR22888', 20, 20);

      doc.setFontSize(10);
      doc.text(`Total de clientes: ${clients.length}  |  Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 30);

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      let yPos = 42;
      doc.text('Nome/Clínica', 20, yPos);
      doc.text('Cidade', 90, yPos);
      doc.text('Status', 140, yPos);
      doc.text('Score', 175, yPos);
      doc.text('Equipamento', 195, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 6;

      clients.forEach(c => {
        if (yPos > 195) { doc.addPage(); yPos = 20; }
        const nome = (c.clinic_name || c.first_name || '—').substring(0, 35);
        const cidade = (c.city || '—').substring(0, 18);
        const status = (c.status || '—').substring(0, 8);
        const score = String(c.purchase_score || 0);
        const equip = (c.equipment_interest || '—').substring(0, 12);
        doc.text(nome, 20, yPos);
        doc.text(cidade, 90, yPos);
        doc.text(status, 140, yPos);
        doc.text(score, 175, yPos);
        doc.text(equip, 195, yPos);
        yPos += 6;
      });

      doc.save('relatorio_clinicas_nr22888.pdf');
    } catch (err) {
      setError('Erro ao gerar relatório. Tente novamente.');
      console.error('Erro ExportClinicReportWithROI:', err);
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