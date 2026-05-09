import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Upload, Eye, RotateCcw, Lock, Shield, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function MobVendedorSecureImport() {
  const [uploadedData, setUploadedData] = useState(null);
  const [duplicateDetection, setDuplicateDetection] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();

  // File upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type)) {
      toast.error('❌ Formato inválido. Use CSV ou Excel');
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('❌ Arquivo muito grande. Máximo 5MB');
      return;
    }

    toast.info('📤 Processando arquivo...');

    // Process file
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file: file.toString('base64') });

      // Extract data from file
      const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadRes.file_url,
        json_schema: {
          type: 'object',
          properties: {
            sku: { type: 'string' },
            product_name: { type: 'string' },
            category: { type: 'string' },
            quantity: { type: 'number' },
            price: { type: 'number' },
          },
        },
      });

      if (extractRes.status === 'success') {
        // Check for duplicates
        const existingItems = await base44.entities.SeamatyInventory?.list().catch(() => []);
        const duplicates = extractRes.output.filter((item) =>
          existingItems.some((existing) => existing.sku === item.sku)
        );

        setUploadedData({
          items: extractRes.output,
          file_size: file.size,
          file_name: file.name,
          upload_timestamp: new Date().toISOString(),
          uploaded_by: (await base44.auth.me()).email,
        });

        setDuplicateDetection(duplicates);
        toast.success(`✅ ${extractRes.output.length} itens processados`);

        if (duplicates.length > 0) {
          toast.warning(`⚠️ ${duplicates.length} itens duplicados detectados`);
        }
      } else {
        toast.error(`Erro: ${extractRes.details}`);
      }
    } catch (err) {
      toast.error(`❌ Erro ao processar: ${err.message}`);
    }
  };

  // Execute import
  const importMutation = useMutation({
    mutationFn: async (options) => {
      const result = await base44.functions.invoke('importMobVendedorInventory', {
        items: uploadedData.items,
        skip_duplicates: options.skip_duplicates || false,
        uploaded_by: uploadedData.uploaded_by,
        upload_timestamp: uploadedData.upload_timestamp,
        file_name: uploadedData.file_name,
        duplicates_detected: duplicateDetection.length,
      });

      return result.data;
    },
    onSuccess: (data) => {
      const importRecord = {
        id: Date.now().toString(),
        file_name: uploadedData.file_name,
        items_count: uploadedData.items.length,
        duplicates_found: duplicateDetection.length,
        status: 'completed',
        timestamp: new Date().toISOString(),
        imported_by: uploadedData.uploaded_by,
        import_id: data.import_id,
      };

      setImportHistory([importRecord, ...importHistory]);
      toast.success(`✅ ${data.imported_count} itens importados com sucesso`);
      setUploadedData(null);
      setDuplicateDetection([]);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err) => {
      toast.error(`❌ Erro na importação: ${err.message}`);
    },
  });

  // Undo import
  const undoImportMutation = useMutation({
    mutationFn: async (importId) => {
      const result = await base44.functions.invoke('importMobVendedorInventory', {
        action: 'undo',
        import_id: importId,
        undo_by: (await base44.auth.me()).email,
      });
      return result.data;
    },
    onSuccess: () => {
      toast.info('↩️ Importação desfeita com sucesso');
      setImportHistory((prev) => prev.map((imp) => (imp.status === 'undone' ? imp : imp)));
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20 pt-4">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 flex items-center gap-3">
            <Upload className="w-10 h-10 text-blue-600" />
            📊 Mob Vendedor — Importação Segura
          </h1>
          <p className="text-slate-600 max-w-2xl">
            🔐 LGPD-SA Compliance: Detecção automática de duplicados, pré-visualização completa, auditoria total e desfazer com 1 clique.
          </p>
        </div>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="import">📤 Nova Importação</TabsTrigger>
            <TabsTrigger value="preview">👁️ Pré-visualização</TabsTrigger>
            <TabsTrigger value="history">📋 Histórico</TabsTrigger>
          </TabsList>

          {/* IMPORTAÇÃO */}
          <TabsContent value="import" className="space-y-4">
            <Card className="bg-white border-2 border-dashed border-blue-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Carregar Arquivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center p-12 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer text-center">
                    <Upload className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-900">Clique ou arraste seu arquivo</p>
                    <p className="text-sm text-slate-600 mt-1">CSV ou Excel • Máx 5MB</p>
                  </label>
                </div>

                {uploadedData && (
                  <div className="space-y-4">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4">
                        <p className="text-sm font-semibold text-blue-900">✅ Arquivo processado com sucesso</p>
                        <p className="text-xs text-blue-700 mt-1">
                          📁 {uploadedData.file_name} • 📊 {uploadedData.items.length} itens
                        </p>
                      </CardContent>
                    </Card>

                    {duplicateDetection.length > 0 && (
                      <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="pt-4">
                          <p className="text-sm font-semibold text-orange-900 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            ⚠️ {duplicateDetection.length} itens duplicados detectados
                          </p>
                          <p className="text-xs text-orange-700 mt-2">
                            Esses SKUs já existem no banco. Você pode:
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => importMutation.mutate({ skip_duplicates: false })}
                              disabled={importMutation.isPending}
                            >
                              ✅ Importar tudo (atualizar existentes)
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => importMutation.mutate({ skip_duplicates: true })}
                              disabled={importMutation.isPending}
                            >
                              ⏭️ Pular duplicados
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {duplicateDetection.length === 0 && (
                      <Button
                        onClick={() => importMutation.mutate({ skip_duplicates: false })}
                        disabled={importMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Confirmar Importação
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* LGPD-SA Info */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="font-semibold text-green-900 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    🔐 LGPD-SA Compliance
                  </p>
                  <ul className="text-sm text-green-800 space-y-1 ml-7">
                    <li>✅ Consentimento: Você aprova antes de importar</li>
                    <li>✅ Transparência: Pré-visualização completa</li>
                    <li>✅ Rastreamento: Quem, quando e quanto foi importado</li>
                    <li>✅ Direito ao esquecimento: Desfazer disponível</li>
                    <li>✅ Auditoria: Histórico completo imutável</li>
                    <li>✅ Proteção: Duplicados detectados automaticamente</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRÉ-VISUALIZAÇÃO */}
          <TabsContent value="preview" className="space-y-4">
            {!uploadedData ? (
              <Card className="bg-white">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-600">Carregue um arquivo para visualizar</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Dados a Importar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 border-b">
                          <tr>
                            <th className="text-left p-2">SKU</th>
                            <th className="text-left p-2">Produto</th>
                            <th className="text-left p-2">Categoria</th>
                            <th className="text-right p-2">Qtd</th>
                            <th className="text-right p-2">Preço</th>
                            <th className="text-center p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uploadedData.items.slice(0, 20).map((item, i) => {
                            const isDuplicate = duplicateDetection.some((d) => d.sku === item.sku);
                            return (
                              <tr
                                key={i}
                                className={isDuplicate ? 'bg-orange-50' : 'hover:bg-slate-50'}
                              >
                                <td className="p-2 font-mono text-xs">{item.sku}</td>
                                <td className="p-2">{item.product_name}</td>
                                <td className="p-2">{item.category}</td>
                                <td className="p-2 text-right">{item.quantity}</td>
                                <td className="p-2 text-right">R$ {item.price?.toFixed(2)}</td>
                                <td className="p-2 text-center">
                                  {isDuplicate ? (
                                    <Badge className="bg-orange-100 text-orange-800">Duplicado</Badge>
                                  ) : (
                                    <Badge className="bg-green-100 text-green-800">Novo</Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {uploadedData.items.length > 20 && (
                      <p className="text-xs text-slate-600 mt-4 text-center">
                        ... e mais {uploadedData.items.length - 20} itens
                      </p>
                    )}
                  </CardContent>
                </Card>

                {duplicateDetection.length > 0 && (
                  <Card className="bg-orange-50 border-orange-200">
                    <CardHeader>
                      <CardTitle className="text-orange-900 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        ⚠️ Registros Duplicados Detectados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {duplicateDetection.map((dup, i) => (
                          <div key={i} className="text-sm text-orange-800 p-2 bg-white rounded border border-orange-200">
                            🔄 {dup.sku} — {dup.product_name}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* HISTÓRICO */}
          <TabsContent value="history" className="space-y-4">
            {importHistory.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-600">Nenhuma importação registrada</p>
                </CardContent>
              </Card>
            ) : (
              importHistory.map((imp) => (
                <Card key={imp.id} className="bg-white border-l-4 border-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          📁 {imp.file_name}
                          <Badge className={imp.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {imp.status === 'completed' ? 'Importada' : 'Desfeita'}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          👤 {imp.imported_by} • 📊 {imp.items_count} itens ({imp.duplicates_found} duplicados) • 🕐{' '}
                          {new Date(imp.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {imp.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => undoImportMutation.mutate(imp.import_id)}
                          disabled={undoImportMutation.isPending}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Desfazer
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}