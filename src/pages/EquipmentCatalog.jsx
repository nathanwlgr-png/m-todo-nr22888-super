import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Loader2, FileText, Trash2, Package } from 'lucide-react';
import GoogleDriveBrowser from '@/components/catalog/GoogleDriveBrowser';
import CatalogPhotoUpload from '@/components/catalog/CatalogPhotoUpload';

export default function EquipmentCatalog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Equipment.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['equipment'])
  });

  const requestDelete = (eq) => {
    if (window.confirm(`Confirma excluir "${eq.name}" (R$ ${eq.price?.toLocaleString('pt-BR') || '0'})? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate(eq.id);
    }
  };

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
            equipments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  price: { type: "number" },
                  specifications: { type: "string" },
                  monthly_bonus: { type: "string" },
                  bonus_details: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extractedData.status === 'success' && extractedData.output?.equipments) {
        for (const eq of extractedData.output.equipments) {
          await base44.entities.Equipment.create({
            name: eq.name,
            category: eq.category || 'outro',
            price: eq.price || 0,
            specifications: eq.specifications || '',
            monthly_bonus: eq.monthly_bonus || '',
            bonus_details: eq.bonus_details || '',
            is_active: true
          });
        }
        queryClient.invalidateQueries(['equipment']);
        alert(`${extractedData.output.equipments.length} equipamentos adicionados ao catálogo!`);
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
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white flex-1">Catálogo de Equipamentos</h1>
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
              Processando catálogo...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Importar Catálogo PDF/Word/Excel
            </>
          )}
        </Button>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        <GoogleDriveBrowser />
        <CatalogPhotoUpload />
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : equipment.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum equipamento no catálogo</p>
          </Card>
        ) : (
          equipment.map(eq => (
            <Card key={eq.id} className="p-5 bg-white hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg">{eq.name}</h3>
                  <Badge variant="outline" className="mt-1">{eq.category}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => requestDelete(eq)}
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <p className="text-xs text-indigo-600 font-medium">PREÇO</p>
                  <p className="text-2xl font-bold text-indigo-700">
                    R$ {eq.price?.toLocaleString('pt-BR')}
                  </p>
                </div>

                {eq.monthly_bonus && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 font-medium">BONIFICAÇÃO MENSAL</p>
                    <p className="text-sm text-green-700">{eq.monthly_bonus}</p>
                  </div>
                )}

                {eq.specifications && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium mb-1">ESPECIFICAÇÕES</p>
                    <p className="text-sm text-slate-700">{eq.specifications}</p>
                  </div>
                )}

                {eq.bonus_details && (
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-amber-600 font-medium mb-1">DETALHES DA BONIFICAÇÃO</p>
                    <p className="text-sm text-amber-700">{eq.bonus_details}</p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}