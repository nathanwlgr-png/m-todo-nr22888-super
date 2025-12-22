import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Loader2, FileText, Trash2 } from 'lucide-react';

export default function ConsumablePriceList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const { data: consumables = [], isLoading } = useQuery({
    queryKey: ['consumables'],
    queryFn: () => base44.entities.Consumable.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Consumable.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['consumables'])
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const extractedData = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            consumables: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  unit_price: { type: "number" },
                  unit_type: { type: "string" },
                  supplier: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extractedData.status === 'success' && extractedData.output?.consumables) {
        for (const cons of extractedData.output.consumables) {
          await base44.entities.Consumable.create({
            name: cons.name,
            category: cons.category || 'consumivel_geral',
            unit_price: cons.unit_price || 0,
            unit_type: cons.unit_type || 'unidade',
            supplier: cons.supplier || '',
            is_active: true
          });
        }
        queryClient.invalidateQueries(['consumables']);
        alert(`${extractedData.output.consumables.length} insumos importados!`);
      } else {
        alert('Não foi possível extrair dados');
      }
    } catch (error) {
      alert('Erro ao processar arquivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-slate-900 to-purple-900 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white flex-1">Lista de Preços - Insumos</h1>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          className="hidden"
          onChange={handleFileUpload}
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-14 bg-white/10 backdrop-blur hover:bg-white/20 border-2 border-white/30"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processando arquivo...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Importar PDF/Word/Excel
            </>
          )}
        </Button>
      </div>

      <div className="px-4 -mt-8 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : consumables.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum insumo cadastrado</p>
          </Card>
        ) : (
          consumables.map(cons => (
            <Card key={cons.id} className="p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{cons.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{cons.category}</p>
                  <p className="text-xl font-bold text-purple-600 mt-2">
                    R$ {cons.unit_price?.toLocaleString('pt-BR')} / {cons.unit_type}
                  </p>
                  {cons.supplier && (
                    <p className="text-xs text-slate-600 mt-1">Fornecedor: {cons.supplier}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(cons.id)}
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}