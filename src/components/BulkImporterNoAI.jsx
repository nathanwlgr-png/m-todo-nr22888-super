import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';

export default function BulkImporterNoAI() {
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setResults(null);

    try {
      // Upload arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const fileType = file.name.toLowerCase();
      let data = [];

      if (fileType.endsWith('.pdf')) {
        // Processar PDF sem IA - extração simples de texto
        const response = await fetch(file_url);
        const blob = await response.blob();
        const text = await blob.text();
        
        // Tentar extrair linhas com padrão de dados
        const lines = text.split('\n').filter(l => l.trim());
        data = lines.map((line, idx) => {
          // Tenta encontrar padrão: Nome | Cidade | Telefone
          const parts = line.split(/[|,\t]/).map(p => p.trim());
          if (parts.length >= 2) {
            return {
              first_name: parts[0],
              clinic_name: parts[0],
              city: parts[1] || '',
              phone: parts[2] || '',
              status: 'morno',
              lead_source: 'importacao_planilha'
            };
          }
          return null;
        }).filter(Boolean);

      } else if (fileType.endsWith('.xlsx') || fileType.endsWith('.xls') || fileType.endsWith('.csv')) {
        // Para Excel/CSV, usar extração direta
        const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nome: { type: "string" },
                clinica: { type: "string" },
                cidade: { type: "string" },
                telefone: { type: "string" },
                email: { type: "string" }
              }
            }
          }
        });

        if (extractResult.status === 'success') {
          data = extractResult.output.map(row => ({
            first_name: row.nome || row.clinica?.split(' ')[0] || 'Cliente',
            clinic_name: row.clinica || row.nome,
            city: row.cidade || '',
            phone: row.telefone || '',
            email: row.email || '',
            status: 'morno',
            lead_source: 'importacao_planilha'
          }));
        }
      }

      if (data.length === 0) {
        toast.error('Nenhum dado válido encontrado no arquivo');
        setProcessing(false);
        return;
      }

      // Importar em lote
      let imported = 0;
      let skipped = 0;

      for (const clientData of data) {
        try {
          await base44.entities.Client.create(clientData);
          imported++;
        } catch (error) {
          skipped++;
        }
      }

      setResults({ imported, skipped, total: data.length });
      toast.success(`✅ ${imported} clientes importados!`);
      queryClient.invalidateQueries(['clients']);

    } catch (error) {
      toast.error('Erro ao processar: ' + error.message);
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="p-4 border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="flex items-center gap-3 mb-3">
        <Upload className="w-6 h-6 text-indigo-600" />
        <div>
          <h3 className="font-bold text-indigo-900">Importação SEM IA</h3>
          <p className="text-xs text-indigo-700">PDF, Excel, CSV - Processamento direto</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-white rounded border-2 border-dashed border-indigo-300">
          <p className="text-xs text-slate-600 mb-2">
            📋 Formatos aceitos: PDF, XLSX, XLS, CSV
          </p>
          <p className="text-xs text-slate-600 mb-3">
            Colunas esperadas: Nome, Clínica, Cidade, Telefone, Email
          </p>
          
          <label>
            <input
              type="file"
              accept=".pdf,.xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={processing}
              className="hidden"
            />
            <Button
              as="span"
              disabled={processing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Selecionar Arquivo
                </>
              )}
            </Button>
          </label>
        </div>

        {results && (
          <Card className="p-3 bg-green-50 border border-green-300">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="font-bold text-green-900">Importação Concluída</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{results.imported}</p>
                <p className="text-xs text-slate-600">Importados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{results.skipped}</p>
                <p className="text-xs text-slate-600">Ignorados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{results.total}</p>
                <p className="text-xs text-slate-600">Total</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
}