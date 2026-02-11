import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Download, FileText, Loader2 } from 'lucide-react';

export default function BulkExporterNoAI() {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState('csv');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 1000)
  });

  const exportData = async () => {
    if (clients.length === 0) {
      toast.error('Nenhum cliente para exportar');
      return;
    }

    setExporting(true);
    try {
      if (format === 'csv') {
        // Gerar CSV
        const headers = ['Nome', 'Clínica', 'Cidade', 'Telefone', 'Email', 'Status', 'Score'];
        const rows = clients.map(c => [
          c.first_name || '',
          c.clinic_name || '',
          c.city || '',
          c.phone || '',
          c.email || '',
          c.status || '',
          c.purchase_score || ''
        ]);

        const csv = [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success('✅ CSV exportado!');

      } else if (format === 'json') {
        // Gerar JSON
        const json = JSON.stringify(clients, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clientes_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success('✅ JSON exportado!');

      } else if (format === 'txt') {
        // Gerar TXT
        const txt = clients.map(c => 
          `${c.first_name || 'N/A'} | ${c.clinic_name || 'N/A'} | ${c.city || 'N/A'} | ${c.phone || 'N/A'} | ${c.status || 'N/A'}`
        ).join('\n');

        const blob = new Blob([txt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clientes_${new Date().toISOString().split('T')[0]}.txt`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success('✅ TXT exportado!');
      }

    } catch (error) {
      toast.error('Erro ao exportar: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="p-4 border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="flex items-center gap-3 mb-3">
        <Download className="w-6 h-6 text-green-600" />
        <div>
          <h3 className="font-bold text-green-900">Exportação SEM IA</h3>
          <p className="text-xs text-green-700">CSV, JSON, TXT - Download direto</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-slate-600 mb-2">Formato:</p>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV (Excel)</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="txt">TXT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 bg-white rounded border border-green-300">
          <p className="text-sm font-semibold text-slate-800 mb-1">
            📊 {clients.length} clientes
          </p>
          <p className="text-xs text-slate-600">
            Prontos para exportar
          </p>
        </div>

        <Button
          onClick={exportData}
          disabled={exporting || clients.length === 0}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exportar {format.toUpperCase()}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}