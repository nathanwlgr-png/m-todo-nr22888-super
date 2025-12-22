import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Edit2, 
  Trash2, 
  Plus, 
  Loader2,
  DollarSign,
  Calendar,
  Download
} from 'lucide-react';

export default function EquipmentCatalog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    category: 'analisador_hematologico',
    price: '',
    monthly_bonus: '',
    specifications: '',
    is_active: true
  });

  const { data: equipments = [], isLoading } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => base44.entities.Equipment.list('-created_date', 200)
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['equipment-catalogs'],
    queryFn: () => base44.entities.ClientDocument.filter({ type: 'catalogo' })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Equipment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipments']);
      setDialogOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipments']);
      setDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Equipment.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['equipments'])
  });

  const resetForm = () => {
    setEditData({
      name: '',
      category: 'analisador_hematologico',
      price: '',
      monthly_bonus: '',
      specifications: '',
      is_active: true
    });
  };

  const handleEdit = (equipment) => {
    setEditData({
      ...equipment,
      price: equipment.price?.toString() || ''
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const data = {
      ...editData,
      price: parseFloat(editData.price) || 0
    };

    if (editData.id) {
      updateMutation.mutate({ id: editData.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFileUpload = async (e, catalogDate) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.ClientDocument.create({
        client_id: 'catalog',
        client_name: 'Catálogo Geral',
        title: `Catálogo - ${catalogDate || new Date().toLocaleDateString('pt-BR')}`,
        type: 'catalogo',
        file_url,
        notes: `Catálogo de equipamentos atualizado em ${catalogDate || new Date().toLocaleDateString('pt-BR')}`
      });

      queryClient.invalidateQueries(['equipment-catalogs']);
      alert('Catálogo enviado com sucesso!');
    } catch (error) {
      alert('Erro ao fazer upload do catálogo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800">Catálogo de Equipamentos</h1>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="equipments">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="equipments">
              Equipamentos ({equipments.length})
            </TabsTrigger>
            <TabsTrigger value="catalogs">
              Catálogos PDF ({documents.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Equipamentos Manuais */}
          <TabsContent value="equipments" className="space-y-3">
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Equipamento Manual
            </Button>

            {equipments.map((eq) => (
              <Card key={eq.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{eq.name}</h3>
                    <p className="text-xs text-slate-500 capitalize">{eq.category?.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(eq)}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remover ${eq.name}?`)) {
                          deleteMutation.mutate(eq.id);
                        }
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-xl font-bold text-green-600">
                    R$ {eq.price?.toLocaleString('pt-BR') || '0'}
                  </span>
                </div>

                {eq.monthly_bonus && (
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 mb-2">
                    <p className="text-xs text-amber-800">
                      <strong>Bonificação:</strong> {eq.monthly_bonus}
                    </p>
                  </div>
                )}

                {eq.specifications && (
                  <p className="text-sm text-slate-600">{eq.specifications}</p>
                )}
              </Card>
            ))}

            {equipments.length === 0 && (
              <Card className="p-8 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum equipamento cadastrado</p>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Catálogos PDF/Excel */}
          <TabsContent value="catalogs" className="space-y-3">
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-indigo-200">
              <p className="text-sm text-slate-700 mb-3">
                <strong>Upload de Catálogo:</strong> Envie arquivos PDF ou Excel com a lista de equipamentos e preços.
              </p>
              <div className="space-y-2">
                <Label className="text-xs">Data do Catálogo</Label>
                <Input
                  type="text"
                  id="catalog-date"
                  placeholder="Ex: Janeiro/2025"
                  className="mb-2"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const dateInput = document.getElementById('catalog-date');
                    handleFileUpload(e, dateInput?.value);
                  }}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Catálogo PDF/Excel
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {documents.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{doc.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {new Date(doc.created_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-slate-600 mt-1">{doc.notes}</p>
                    )}
                  </div>
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <Download className="w-4 h-4 text-indigo-600" />
                    </a>
                  )}
                </div>
              </Card>
            ))}

            {documents.length === 0 && (
              <Card className="p-8 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum catálogo enviado</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Adicionar/Editar Equipamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editData.id ? 'Editar' : 'Novo'} Equipamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nome do Equipamento *</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="Ex: Analisador BC-5000"
              />
            </div>

            <div>
              <Label>Categoria *</Label>
              <Select
                value={editData.category}
                onValueChange={(v) => setEditData({ ...editData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analisador_hematologico">Analisador Hematológico</SelectItem>
                  <SelectItem value="analisador_bioquimico">Analisador Bioquímico</SelectItem>
                  <SelectItem value="contador_celulas">Contador de Células</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Preço (R$) *</Label>
              <Input
                type="number"
                value={editData.price}
                onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                placeholder="45000"
              />
            </div>

            <div>
              <Label>Bonificação Mensal</Label>
              <Input
                value={editData.monthly_bonus || ''}
                onChange={(e) => setEditData({ ...editData, monthly_bonus: e.target.value })}
                placeholder="Ex: 20% em reagentes"
              />
            </div>

            <div>
              <Label>Especificações</Label>
              <Textarea
                value={editData.specifications || ''}
                onChange={(e) => setEditData({ ...editData, specifications: e.target.value })}
                placeholder="Características técnicas..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={!editData.name || !editData.price || createMutation.isPending || updateMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Salvar Equipamento'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}