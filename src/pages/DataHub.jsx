import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Upload, FileText, Download, Database, Users, 
  Loader2, Table, FileSpreadsheet, ArrowLeft, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DataHub() {
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [tableData, setTableData] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 1000)
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['all-documents'],
    queryFn: () => base44.entities.ClientDocument.list('-created_date', 500)
  });

  // Importar tabela com IA
  const importTable = async () => {
    if (!tableData.trim()) {
      toast.error('Cole os dados da tabela');
      return;
    }

    setImporting(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta tabela e converta para dados de clientes:

${tableData}

REGRAS:
1. Identifique as colunas (nome, clínica, cidade, telefone, email, etc)
2. Normalize telefones para formato: 5511999999999
3. Valide emails
4. Se tiver CNPJ, inclua
5. Crie first_name (primeiro nome)
6. Status padrão: "morno"
7. Lead source: "importacao_planilha"

Retorne array de objetos prontos para inserir.`,
        response_json_schema: {
          type: "object",
          properties: {
            clients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  first_name: { type: "string" },
                  full_name: { type: "string" },
                  clinic_name: { type: "string" },
                  city: { type: "string" },
                  phone: { type: "string" },
                  email: { type: "string" },
                  cnpj: { type: "string" },
                  address: { type: "string" },
                  status: { type: "string" },
                  lead_source: { type: "string" }
                }
              }
            }
          }
        }
      });

      const clientsToImport = result.clients || [];
      
      if (clientsToImport.length === 0) {
        toast.error('Nenhum cliente válido encontrado');
        return;
      }

      let created = 0;
      let skipped = 0;

      for (const clientData of clientsToImport) {
        try {
          // Verificar duplicados
          const exists = clients.some(c => 
            c.email === clientData.email || 
            c.phone === clientData.phone ||
            (c.clinic_name && clientData.clinic_name && 
             c.clinic_name.toLowerCase() === clientData.clinic_name.toLowerCase())
          );

          if (exists) {
            skipped++;
            continue;
          }

          await base44.entities.Client.create({
            ...clientData,
            purchase_score: 50
          });
          created++;
        } catch (error) {
          skipped++;
        }
      }

      queryClient.invalidateQueries(['clients']);
      toast.success(`✅ ${created} clientes importados! ${skipped} ignorados (duplicados)`);
      setTableData('');
    } catch (error) {
      toast.error('Erro ao importar: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  // Upload de documento universal
  const uploadDocument = async () => {
    if (!documentFile || !documentTitle) {
      toast.error('Selecione um arquivo e dê um título');
      return;
    }

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ 
        file: documentFile 
      });

      await base44.entities.ClientDocument.create({
        client_id: 'system',
        client_name: 'Sistema',
        title: documentTitle,
        type: 'outros',
        file_url,
        notes: 'Documento geral do sistema'
      });

      queryClient.invalidateQueries(['all-documents']);
      toast.success('Documento enviado!');
      setDocumentFile(null);
      setDocumentTitle('');
    } catch (error) {
      toast.error('Erro ao fazer upload');
    }
  };

  // Exportar tudo
  const exportAll = async () => {
    setExporting(true);
    try {
      const exportData = {
        clientes: clients.map(c => ({
          nome: c.first_name,
          clinica: c.clinic_name,
          cidade: c.city,
          telefone: c.phone,
          email: c.email,
          status: c.status,
          score: c.purchase_score,
          cadastrado_em: c.created_date
        })),
        documentos: documents.map(d => ({
          titulo: d.title,
          tipo: d.type,
          cliente: d.client_name,
          url: d.file_url,
          criado_em: d.created_date
        })),
        estatisticas: {
          total_clientes: clients.length,
          total_documentos: documents.length,
          clientes_quentes: clients.filter(c => c.status === 'quente').length,
          clientes_mornos: clients.filter(c => c.status === 'morno').length,
          clientes_frios: clients.filter(c => c.status === 'frio').length
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_completo_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success('Exportação completa realizada!');
    } catch (error) {
      toast.error('Erro ao exportar');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 px-4 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button size="sm" variant="ghost" className="text-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">🗄️ Central de Dados</h1>
            <p className="text-xs text-blue-300">Importar, gerenciar e exportar</p>
          </div>
          <Button
            onClick={exportAll}
            disabled={exporting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="import" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="import">
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 mr-2" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="stats">
              <Database className="w-4 h-4 mr-2" />
              Estatísticas
            </TabsTrigger>
          </TabsList>

          {/* ABA IMPORTAÇÃO */}
          <TabsContent value="import" className="space-y-4">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
              <div className="flex items-center gap-2 mb-3">
                <Table className="w-5 h-5 text-green-700" />
                <h3 className="font-bold text-green-900">Importar Tabela de Clientes</h3>
              </div>
              <p className="text-sm text-green-700 mb-3">
                Cole dados de Excel, Google Sheets, ou texto formatado. A IA vai identificar as colunas automaticamente.
              </p>
              <Textarea
                value={tableData}
                onChange={(e) => setTableData(e.target.value)}
                placeholder="Cole aqui os dados da tabela...&#10;&#10;Exemplo:&#10;Nome | Clínica | Cidade | Telefone&#10;João Silva | Clínica PetCare | São Paulo | 11999999999&#10;Maria Santos | Hospital Vet | Rio de Janeiro | 21988888888"
                rows={10}
                className="mb-3 font-mono text-sm"
              />
              <Button
                onClick={importTable}
                disabled={!tableData.trim() || importing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Importar com IA
                  </>
                )}
              </Button>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
              <div className="flex items-center gap-2 mb-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-blue-900">Importar Arquivo</h3>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Upload de Excel, CSV, ou Google Sheets
              </p>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  
                  try {
                    const { file_url } = await base44.integrations.Core.UploadFile({ file });
                    
                    const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
                      file_url,
                      json_schema: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            first_name: { type: "string" },
                            clinic_name: { type: "string" },
                            city: { type: "string" },
                            phone: { type: "string" },
                            email: { type: "string" }
                          }
                        }
                      }
                    });

                    if (extracted.status === 'success') {
                      let created = 0;
                      for (const clientData of extracted.output) {
                        try {
                          await base44.entities.Client.create({
                            ...clientData,
                            status: 'morno',
                            purchase_score: 50,
                            lead_source: 'importacao_planilha'
                          });
                          created++;
                        } catch {}
                      }
                      queryClient.invalidateQueries(['clients']);
                      toast.success(`${created} clientes importados!`);
                    }
                  } catch (error) {
                    toast.error('Erro ao processar arquivo');
                  }
                }}
              />
            </Card>
          </TabsContent>

          {/* ABA DOCUMENTOS */}
          <TabsContent value="documents" className="space-y-4">
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-purple-900">Upload de Documento</h3>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="Título do documento"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                />
                <Input
                  type="file"
                  onChange={(e) => setDocumentFile(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
                />
                <Button
                  onClick={uploadDocument}
                  disabled={!documentFile || !documentTitle}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Fazer Upload
                </Button>
              </div>
            </Card>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                <span>📄 Documentos ({documents.length})</span>
                <Link to={createPageUrl('ClientDocumentCenter')}>
                  <Button size="sm" variant="outline">
                    Ver Todos
                  </Button>
                </Link>
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {documents.slice(0, 10).map(doc => (
                  <Card key={doc.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{doc.title}</p>
                        <p className="text-xs text-slate-600">{doc.client_name}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ABA ESTATÍSTICAS */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <p className="text-3xl font-bold text-blue-900">{clients.length}</p>
                <p className="text-sm text-blue-700">Total Clientes</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                <FileText className="w-8 h-8 text-purple-600 mb-2" />
                <p className="text-3xl font-bold text-purple-900">{documents.length}</p>
                <p className="text-sm text-purple-700">Documentos</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50">
                <div className="text-2xl mb-2">🔥</div>
                <p className="text-3xl font-bold text-red-900">
                  {clients.filter(c => c.status === 'quente').length}
                </p>
                <p className="text-sm text-red-700">Clientes Quentes</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50">
                <div className="text-2xl mb-2">🌡️</div>
                <p className="text-3xl font-bold text-yellow-900">
                  {clients.filter(c => c.status === 'morno').length}
                </p>
                <p className="text-sm text-yellow-700">Clientes Mornos</p>
              </Card>
            </div>

            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300">
              <h3 className="font-bold text-emerald-900 mb-3">📦 Exportação Completa</h3>
              <p className="text-sm text-emerald-700 mb-3">
                Baixe todos os dados (clientes, documentos, estatísticas) em formato JSON
              </p>
              <Button
                onClick={exportAll}
                disabled={exporting}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Tudo
                  </>
                )}
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}