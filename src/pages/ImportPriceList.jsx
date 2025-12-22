import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ImportPriceList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract data from Excel
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            equipments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  price: { type: "number" },
                  monthly_bonus: { type: "string" },
                  specifications: { type: "string" }
                }
              }
            },
            consumables: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  unit_price: { type: "number" },
                  unit_type: { type: "string" },
                  supplier: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extracted.status === 'error') {
        throw new Error(extracted.details);
      }

      // Import equipments
      let equipmentCount = 0;
      let consumableCount = 0;

      if (extracted.output.equipments?.length > 0) {
        for (const eq of extracted.output.equipments) {
          await base44.entities.Equipment.create({
            name: eq.name,
            category: eq.category || 'outro',
            price: eq.price,
            monthly_bonus: eq.monthly_bonus || '',
            specifications: eq.specifications || '',
            is_active: true
          });
          equipmentCount++;
        }
      }

      // Import consumables
      if (extracted.output.consumables?.length > 0) {
        for (const cons of extracted.output.consumables) {
          await base44.entities.Consumable.create({
            name: cons.name,
            category: cons.category || 'consumivel_geral',
            unit_price: cons.unit_price,
            unit_type: cons.unit_type || 'unidade',
            supplier: cons.supplier || '',
            description: cons.description || '',
            is_active: true
          });
          consumableCount++;
        }
      }

      queryClient.invalidateQueries(['equipments']);
      queryClient.invalidateQueries(['consumables']);

      setResult({
        success: true,
        equipmentCount,
        consumableCount
      });
    } catch (error) {
      setResult({
        success: false,
        error: error.message || 'Erro ao importar arquivo'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `EQUIPAMENTOS
Nome,Categoria,Preço,Bonificação Mensal,Especificações
Analisador BC-3000,analisador_hematologico,45000,20% em reagentes,Alta precisão para clínicas

INSUMOS
Nome,Categoria,Preço Unitário,Tipo Unidade,Fornecedor,Descrição
Reagente Hemograma,reagente,150,caixa,Fornecedor XYZ,Caixa com 100 testes
Kit Bioquímica,kit_analise,800,kit,Fornecedor ABC,Kit completo com 50 testes`;

    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_precos.txt';
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Importar Preços</h1>
            <p className="text-xs text-slate-500">Excel, CSV ou TXT</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Instructions */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Formato do Arquivo</h3>
          <p className="text-sm text-slate-700 mb-3">
            Seu arquivo deve conter duas seções: EQUIPAMENTOS e INSUMOS
          </p>
          <div className="space-y-2 text-xs text-slate-600">
            <p><strong>EQUIPAMENTOS:</strong> Nome, Categoria, Preço, Bonificação Mensal, Especificações</p>
            <p><strong>INSUMOS:</strong> Nome, Categoria, Preço Unitário, Tipo Unidade, Fornecedor, Descrição</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="mt-3 w-full border-blue-300 text-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Template de Exemplo
          </Button>
        </Card>

        {/* Upload Area */}
        <Card className="p-8 border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
          
          <div className="text-center">
            {uploading ? (
              <>
                <Loader2 className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
                <p className="text-lg font-medium text-slate-800">Processando arquivo...</p>
                <p className="text-sm text-slate-500 mt-1">Extraindo e importando dados</p>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-800 mb-2">
                  Clique ou arraste para fazer upload
                </p>
                <p className="text-sm text-slate-500">
                  Excel (.xlsx, .xls), CSV ou TXT
                </p>
              </>
            )}
          </div>
        </Card>

        {/* Result */}
        {result && (
          <Card className={`p-4 ${result.success ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900 mb-2">Importação Concluída!</h4>
                    <div className="space-y-1 text-sm text-green-800">
                      <p>✓ {result.equipmentCount} equipamentos importados</p>
                      <p>✓ {result.consumableCount} insumos importados</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => navigate(createPageUrl('EquipmentPriceList'))}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Ver Equipamentos
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(createPageUrl('ConsumablePriceList'))}
                        className="border-green-300 text-green-700"
                      >
                        Ver Insumos
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-1">Erro na Importação</h4>
                    <p className="text-sm text-red-700">{result.error}</p>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Categories Info */}
        <Card className="p-4">
          <h4 className="font-semibold text-slate-800 mb-3">Categorias Aceitas</h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Equipamentos:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">analisador_hematologico</Badge>
                <Badge variant="outline">analisador_bioquimico</Badge>
                <Badge variant="outline">contador_celulas</Badge>
                <Badge variant="outline">outro</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Insumos:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">reagente</Badge>
                <Badge variant="outline">kit_analise</Badge>
                <Badge variant="outline">calibrador</Badge>
                <Badge variant="outline">controle_qualidade</Badge>
                <Badge variant="outline">consumivel_geral</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}