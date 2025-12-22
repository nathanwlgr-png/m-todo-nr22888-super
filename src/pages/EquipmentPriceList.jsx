import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Loader2, FileText, Trash2 } from 'lucide-react';
import { Label } from "@/components/ui/label";

export default function EquipmentPriceList() {
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
                  monthly_bonus: { type: "string" }
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
            is_active: true
          });
        }
        queryClient.invalidateQueries(['equipment']);
        alert(`${extractedData.output.equipments.length} equipamentos importados com sucesso!`);
      } else {
        alert('Não foi possível extrair dados do arquivo');
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
      <div className="bg-gradient-to-br from-slate-900 to-indigo-900 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white flex-1">Lista de Preços - Equipamentos</h1>
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
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : equipment.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum equipamento cadastrado</p>
          </Card>
        ) : (
          equipment.map(eq => (
            <Card key={eq.id} className="p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{eq.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{eq.category}</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-2">
                    R$ {eq.price?.toLocaleString('pt-BR')}
                  </p>
                  {eq.monthly_bonus && (
                    <p className="text-xs text-green-600 mt-1">
                      🎁 {eq.monthly_bonus}
                    </p>
                  )}
                  {eq.specifications && (
                    <p className="text-xs text-slate-600 mt-2">{eq.specifications}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(eq.id)}
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