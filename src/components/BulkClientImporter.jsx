import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Table, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from 'sonner';

export default function BulkClientImporter() {
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [importMethod, setImportMethod] = useState('paste'); // paste, url, file
  const [pastedData, setPastedData] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [result, setResult] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = React.useRef(null);

  const createClientMutation = useMutation({
    mutationFn: (clientData) => base44.entities.Client.create(clientData),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
    }
  });

  const processImport = async (tableData) => {
    setImporting(true);
    setResult(null);

    try {
      const prompt = `Você é um especialista em importação de dados de clientes veterinários.

**DADOS RECEBIDOS:**
${tableData}

**TAREFA:**
Extraia e estruture os dados dos clientes. Procure por:
- Nome do cliente (primeiro nome)
- Nome completo
- ID externo (código)
- Nome da clínica
- Razão social
- CNPJ (formato: XX.XXX.XXX/XXXX-XX)
- Telefone (formato: 5511999999999)
- Email
- Endereço completo
- Cidade
- CEP
- Estado
- Qualquer outro dado relevante

Retorne JSON:
{
  "clients": [
    {
      "external_code": "ID do cliente",
      "first_name": "Primeiro nome",
      "full_name": "Nome completo",
      "clinic_name": "Nome da clínica",
      "razao_social": "Razão social",
      "cnpj": "00.000.000/0000-00",
      "phone": "5511999999999",
      "email": "email@dominio.com",
      "address": "Endereço completo",
      "city": "Cidade",
      "cep": "00000-000",
      "notes": "Outras informações relevantes"
    }
  ],
  "total_found": 10,
  "with_cnpj": 8,
  "with_phone": 9,
  "data_quality": "Alta|Média|Baixa"
}

IMPORTANTE: 
- Se não encontrar um campo, deixe como vazio ou null
- Normalize telefone para formato internacional (55...)
- Valide CNPJ (14 dígitos)
- Extract first_name do nome completo`;

      const extractedData = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            clients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  external_code: { type: "string" },
                  first_name: { type: "string" },
                  full_name: { type: "string" },
                  clinic_name: { type: "string" },
                  razao_social: { type: "string" },
                  cnpj: { type: "string" },
                  phone: { type: "string" },
                  email: { type: "string" },
                  address: { type: "string" },
                  city: { type: "string" },
                  cep: { type: "string" },
                  notes: { type: "string" }
                }
              }
            },
            total_found: { type: "number" },
            with_cnpj: { type: "number" },
            with_phone: { type: "number" },
            data_quality: { type: "string" }
          }
        }
      });

      if (!extractedData.clients || extractedData.clients.length === 0) {
        toast.error('Nenhum cliente encontrado nos dados');
        setImporting(false);
        return;
      }

      // Import clients
      let imported = 0;
      let skipped = 0;
      let errors = [];

      for (const clientData of extractedData.clients) {
        try {
          if (!clientData.first_name) {
            skipped++;
            errors.push(`Cliente sem nome: ${clientData.clinic_name || 'N/A'}`);
            continue;
          }

          await createClientMutation.mutateAsync({
            ...clientData,
            status: 'morno',
            purchase_score: 50,
            lead_source: 'importacao_planilha',
            client_type: 'clinica_media',
            decision_role: 'proprietario'
          });

          imported++;
          await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
        } catch (error) {
          skipped++;
          errors.push(`Erro ao importar ${clientData.first_name}: ${error.message}`);
        }
      }

      setResult({
        total: extractedData.total_found,
        imported,
        skipped,
        errors,
        quality: extractedData.data_quality,
        with_cnpj: extractedData.with_cnpj,
        with_phone: extractedData.with_phone
      });

      toast.success(`✅ Importação concluída! ${imported} clientes importados`);

    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error('Erro ao processar importação: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handlePasteImport = async () => {
    if (!pastedData.trim()) {
      toast.error('Cole os dados da tabela');
      return;
    }
    await processImport(pastedData);
  };

  const handleUrlImport = async () => {
    if (!sheetUrl.trim()) {
      toast.error('Insira a URL da planilha');
      return;
    }

    setImporting(true);
    try {
      // Use LLM with internet access to fetch Google Sheets
      const prompt = `Acesse esta planilha Google Sheets: ${sheetUrl}
      
      Extraia TODOS os dados da primeira aba/sheet.
      Retorne o conteúdo completo em formato texto estruturado.`;

      const sheetData = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });

      await processImport(sheetData);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao acessar planilha: ' + error.message);
      setImporting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract data from file
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            rows: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  clinica: { type: "string" },
                  cnpj: { type: "string" },
                  telefone: { type: "string" },
                  email: { type: "string" },
                  cidade: { type: "string" },
                  endereco: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extractResult.status === 'success' && extractResult.output?.rows) {
        const tableText = JSON.stringify(extractResult.output.rows, null, 2);
        await processImport(tableText);
      } else {
        toast.error('Erro ao extrair dados do arquivo');
        setImporting(false);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar arquivo');
      setImporting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
          <Upload className="w-4 h-4 mr-2" />
          Importação em Massa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importação de Clientes em Massa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!result && !importing && (
            <>
              {/* Method Selection */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={importMethod === 'paste' ? 'default' : 'outline'}
                  onClick={() => setImportMethod('paste')}
                  className="flex-col h-auto py-3"
                >
                  <Table className="w-5 h-5 mb-1" />
                  <span className="text-xs">Colar Dados</span>
                </Button>
                <Button
                  variant={importMethod === 'url' ? 'default' : 'outline'}
                  onClick={() => setImportMethod('url')}
                  className="flex-col h-auto py-3"
                >
                  <FileSpreadsheet className="w-5 h-5 mb-1" />
                  <span className="text-xs">Google Sheets</span>
                </Button>
                <Button
                  variant={importMethod === 'file' ? 'default' : 'outline'}
                  onClick={() => setImportMethod('file')}
                  className="flex-col h-auto py-3"
                >
                  <FileText className="w-5 h-5 mb-1" />
                  <span className="text-xs">Arquivo</span>
                </Button>
              </div>

              {/* Paste Method */}
              {importMethod === 'paste' && (
                <div>
                  <Label>Cole os dados da tabela (Excel, Word, etc.)</Label>
                  <Textarea
                    value={pastedData}
                    onChange={(e) => setPastedData(e.target.value)}
                    placeholder="Cole aqui os dados da sua tabela...&#10;&#10;Exemplo:&#10;ID | Nome | Clínica | CNPJ | Telefone&#10;001 | João Silva | Clínica Vet | 12.345.678/0001-90 | (11) 99999-9999"
                    rows={12}
                    className="font-mono text-xs"
                  />
                  <Button
                    onClick={handlePasteImport}
                    disabled={importing || !pastedData.trim()}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700"
                  >
                    Importar Dados Colados
                  </Button>
                </div>
              )}

              {/* URL Method */}
              {importMethod === 'url' && (
                <div>
                  <Label>URL da Planilha Google Sheets</Label>
                  <Input
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                  />
                  <p className="text-xs text-slate-600 mt-2">
                    ⚠️ A planilha deve estar com acesso público (qualquer pessoa com o link)
                  </p>
                  <Button
                    onClick={handleUrlImport}
                    disabled={importing || !sheetUrl.trim()}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700"
                  >
                    Importar do Google Sheets
                  </Button>
                </div>
              )}

              {/* File Method */}
              {importMethod === 'file' && (
                <div>
                  <Label>Upload de Arquivo (Excel, CSV, PDF, Word)</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                  <p className="text-xs text-slate-600 mt-2">
                    Suporta: Excel (.xlsx, .xls), CSV, PDF, Word (.doc, .docx)
                  </p>
                </div>
              )}
            </>
          )}

          {/* Loading */}
          {importing && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-sm font-semibold text-slate-800">Processando importação...</p>
              <p className="text-xs text-slate-600 mt-1">Extraindo dados e cadastrando clientes</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <h4 className="font-bold text-green-900">Importação Concluída!</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-600">Total Encontrado</p>
                    <p className="text-2xl font-bold text-slate-900">{result.total}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-600">Importados</p>
                    <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-600">Com CNPJ</p>
                    <p className="text-lg font-bold text-blue-600">{result.with_cnpj}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-600">Com Telefone</p>
                    <p className="text-lg font-bold text-purple-600">{result.with_phone}</p>
                  </div>
                </div>

                {result.skipped > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs font-semibold text-yellow-800">
                      ⚠️ {result.skipped} registros ignorados
                    </p>
                  </div>
                )}

                <div className="mt-3">
                  <p className="text-xs text-slate-600">Qualidade dos Dados:</p>
                  <Badge className={
                    result.quality === 'Alta' ? 'bg-green-600' :
                    result.quality === 'Média' ? 'bg-yellow-600' :
                    'bg-red-600'
                  }>
                    {result.quality}
                  </Badge>
                </div>
              </Card>

              {result.errors && result.errors.length > 0 && (
                <Card className="p-3 bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-xs font-bold text-red-700">Erros ({result.errors.length})</p>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.slice(0, 10).map((error, i) => (
                      <p key={i} className="text-xs text-red-600">{error}</p>
                    ))}
                  </div>
                </Card>
              )}

              <Button
                onClick={() => {
                  setResult(null);
                  setPastedData('');
                  setSheetUrl('');
                  setDialogOpen(false);
                }}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}