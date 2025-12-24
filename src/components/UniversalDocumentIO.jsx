import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * IMPORTAÇÃO/EXPORTAÇÃO UNIVERSAL
 * Excel, Word, Google Sheets, PDFs
 */
export default function UniversalDocumentIO() {
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Analisar documento
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise este documento e extraia dados estruturados:

${file_url}

Retorne JSON com todos os dados encontrados.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            tipo_documento: { type: "string" },
            dados_extraidos: { type: "object" },
            resumo: { type: "string" }
          }
        }
      });

      toast.success('Documento importado e analisado!');
      console.log('Análise:', analysis);

      // Adicionar à área de transferência
      if (window.addToClipboard) {
        window.addToClipboard(JSON.stringify(analysis, null, 2), 'document');
      }

    } catch (error) {
      console.error(error);
      toast.error('Erro ao importar');
    } finally {
      setImporting(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const clients = await base44.entities.Client.list();
      const leads = await base44.entities.Lead.list();
      
      const csvContent = [
        ['Nome', 'Cidade', 'Telefone', 'Email', 'Status', 'Score', 'Tipo'],
        ...clients.map(c => [
          c.first_name,
          c.city || '',
          c.phone || '',
          c.email || '',
          c.status,
          c.purchase_score || 0,
          'Cliente'
        ]),
        ...leads.map(l => [
          l.company || l.full_name,
          l.city || '',
          l.phone || '',
          l.email || '',
          l.status,
          l.lead_score || 0,
          'Lead'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `crm-export-${Date.now()}.csv`;
      link.click();

      toast.success('Exportado para CSV!');
    } catch (error) {
      toast.error('Erro ao exportar');
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-slate-800">Import/Export Universal</h3>
      </div>

      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv,.doc,.docx,.pdf"
          onChange={handleImport}
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          variant="outline"
          className="w-full"
        >
          {importing ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Importando...</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" />Importar Documento</>
          )}
        </Button>

        <Button
          onClick={exportToExcel}
          variant="outline"
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar para Excel/CSV
        </Button>
      </div>

      <p className="text-xs text-slate-500 mt-3">
        Suporta: Excel, Word, PDF, Google Sheets
      </p>
    </Card>
  );
}