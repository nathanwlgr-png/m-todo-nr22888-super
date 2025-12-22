import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { calculateLeadScore } from '@/components/LeadScoringEngine';
import { toast } from 'sonner';

export default function ImportLeads() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const extractedData = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            leads: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  full_name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  company: { type: 'string' },
                  city: { type: 'string' },
                  interest: { type: 'string' },
                  notes: { type: 'string' }
                }
              }
            }
          }
        }
      });

      if (extractedData.status === 'error') {
        throw new Error(extractedData.details || 'Erro ao processar arquivo');
      }

      const leadsToImport = extractedData.output.leads || extractedData.output;
      
      if (!Array.isArray(leadsToImport) || leadsToImport.length === 0) {
        throw new Error('Nenhum lead encontrado no arquivo');
      }

      const leadsWithScores = leadsToImport.map(lead => ({
        ...lead,
        source: 'importacao_manual',
        status: 'novo',
        lead_score: calculateLeadScore({ ...lead, source: 'importacao_manual' })
      }));

      await base44.entities.Lead.bulkCreate(leadsWithScores);

      queryClient.invalidateQueries(['leads']);
      setImportResult({
        success: true,
        count: leadsWithScores.length
      });
      toast.success(`${leadsWithScores.length} leads importados!`);
    } catch (error) {
      setImportResult({
        success: false,
        error: error.message
      });
      toast.error('Erro na importação');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Importar Leads</h1>
            <p className="text-sm text-purple-100">Upload em lote via CSV ou Excel</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Instructions */}
        <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 mb-2">Formato do Arquivo</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Aceita arquivos CSV, XLSX ou TXT</li>
                <li>• Colunas: nome, email, telefone, empresa, cidade, interesse</li>
                <li>• Score será calculado automaticamente</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Upload Area */}
        <Card className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Upload className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Upload de Arquivo</h3>
            <p className="text-sm text-slate-500 mb-4">
              Selecione um arquivo CSV ou Excel com os dados dos leads
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={handleFileUpload}
              disabled={importing}
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Selecionar Arquivo
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Import Result */}
        {importResult && (
          <Card className={`p-4 ${importResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-3">
              {importResult.success ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800 mb-1">Importação Concluída!</p>
                    <p className="text-sm text-green-700">
                      {importResult.count} leads importados com sucesso
                    </p>
                    <Button
                      onClick={() => navigate(createPageUrl('Leads'))}
                      size="sm"
                      className="mt-3 bg-green-600 hover:bg-green-700"
                    >
                      Ver Leads
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800 mb-1">Erro na Importação</p>
                    <p className="text-sm text-red-700">{importResult.error}</p>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Example Template */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Exemplo de CSV</h3>
          <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto">
{`nome,email,telefone,empresa,cidade,interesse
João Silva,joao@email.com,5511999999999,Clínica ABC,São Paulo,Analisador
Maria Santos,maria@email.com,5511888888888,Hospital XYZ,Rio de Janeiro,Equipamento`}
          </pre>
        </Card>
      </div>
    </div>
  );
}