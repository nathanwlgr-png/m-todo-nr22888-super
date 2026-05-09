import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, AlertTriangle, CheckCircle, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function MobVendedorImporter() {
  const [file, setFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const importMutation = useMutation({
    mutationFn: async (uploadedFile) => {
      if (!uploadedFile) throw new Error('Selecione um arquivo');

      // Upload para Base44
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const uploadRes = await base44.integrations.Core.UploadFile({
        file: uploadedFile
      });

      toast.info('📊 Processando arquivo...');

      // Chamar backend para importar
      const result = await base44.functions.invoke('importMobVendedorInventory', {
        file_url: uploadRes.file_url,
        file_name: uploadedFile.name
      });

      return result.data;
    },
    onSuccess: (data) => {
      setImportResult(data);
      toast.success(`✅ ${data.imported_count} produtos importados!`);
      setFile(null);
    },
    onError: (err) => {
      toast.error('Erro: ' + err.message);
      setImportResult(null);
    }
  });

  return (
    <div className="space-y-6">
      
      {/* UPLOAD ÁREA */}
      <Card className="border-2 border-dashed border-amber-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Inventário Mob Vendedor
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-900">
              <strong>Formatos aceitos:</strong> CSV, Excel (.xlsx, .xls)
            </p>
            <p className="text-xs text-amber-800 mt-2">
              Colunas esperadas: SKU, Produto, Categoria, Modelo, Preço, Quantidade, Localização
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-slate-400" />
                <p className="font-semibold text-slate-900">
                  {file ? file.name : 'Clique para selecionar arquivo'}
                </p>
                <p className="text-xs text-slate-600">
                  ou arraste e solte
                </p>
              </div>
            </label>
          </div>

          <Button
            onClick={() => importMutation.mutate(file)}
            disabled={!file || importMutation.isPending}
            className="w-full bg-amber-600 hover:bg-amber-700 gap-2"
            size="lg"
          >
            {importMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            {importMutation.isPending ? 'Importando...' : 'Importar Agora'}
          </Button>
        </CardContent>
      </Card>

      {/* RESULTADO */}
      {importResult && (
        <Card className={`border-2 ${
          importResult.imported_count > 0
            ? 'border-green-300 bg-green-50'
            : 'border-red-300 bg-red-50'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.imported_count > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              Resultado da Importação
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            
            {/* STATS */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded border">
                <p className="text-xs text-slate-600 font-semibold">Importados</p>
                <p className="text-2xl font-bold text-green-600">{importResult.imported_count}</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <p className="text-xs text-slate-600 font-semibold">Validados</p>
                <p className="text-2xl font-bold text-blue-600">{importResult.validated_count}</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <p className="text-xs text-slate-600 font-semibold">Erros</p>
                <p className="text-2xl font-bold text-red-600">{importResult.error_count}</p>
              </div>
            </div>

            {/* ERROS */}
            {importResult.errors?.length > 0 && (
              <div className="p-4 bg-red-100 rounded border border-red-300 space-y-2">
                <p className="font-semibold text-red-900">⚠️ Erros encontrados:</p>
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <p key={i} className="text-sm text-red-800">
                    • {err}
                  </p>
                ))}
                {importResult.errors.length > 5 && (
                  <p className="text-xs text-red-700 italic">
                    + {importResult.errors.length - 5} mais erros
                  </p>
                )}
              </div>
            )}

            {/* PRODUTOS IMPORTADOS */}
            {importResult.imported_products?.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold text-slate-900">Produtos importados:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {importResult.imported_products.slice(0, 10).map((prod, i) => (
                    <div key={i} className="p-2 bg-white rounded border text-sm">
                      <p className="font-semibold">{prod.product_name}</p>
                      <p className="text-xs text-slate-600">{prod.sku} • {prod.category}</p>
                    </div>
                  ))}
                  {importResult.imported_products.length > 10 && (
                    <p className="text-xs text-slate-600 italic">
                      + {importResult.imported_products.length - 10} mais produtos
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* RESUMO */}
            <div className="p-3 bg-white rounded border border-slate-200">
              <p className="text-xs text-slate-600 font-semibold mb-2">Próximas etapas:</p>
              <ul className="space-y-1 text-sm text-slate-700">
                <li>✓ Validar produtos em falha (correções necessárias)</li>
                <li>✓ Revisar preços e quantidades</li>
                <li>✓ Produtos já estarão disponíveis no Marketing AI Studio</li>
              </ul>
            </div>

          </CardContent>
        </Card>
      )}

    </div>
  );
}