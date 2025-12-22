import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Edit2, Trash2, Save, FileText, Loader2, Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const AVAILABLE_PLACEHOLDERS = [
  '{{client_name}}',
  '{{client_full_name}}',
  '{{client_email}}',
  '{{client_phone}}',
  '{{client_city}}',
  '{{clinic_name}}',
  '{{equipment_name}}',
  '{{equipment_price}}',
  '{{equipment_specifications}}',
  '{{monthly_bonus}}',
  '{{sale_value}}',
  '{{payment_terms}}',
  '{{current_date}}',
  '{{salesperson_name}}'
];

const templateTypeLabels = {
  proposta_comercial: 'Proposta Comercial',
  contrato_venda: 'Contrato de Venda',
  proposta_manutencao: 'Proposta de Manutenção',
  outro: 'Outro'
};

const categoryLabels = {
  equipamentos: 'Equipamentos',
  insumos: 'Insumos',
  servicos: 'Serviços',
  geral: 'Geral'
};

export default function ProposalTemplates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState({});
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['proposal-templates'],
    queryFn: () => base44.entities.ProposalTemplate.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProposalTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['proposal-templates']);
      setEditDialog(false);
      toast.success('Template criado com sucesso!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProposalTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['proposal-templates']);
      setEditDialog(false);
      toast.success('Template atualizado com sucesso!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProposalTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['proposal-templates']);
      toast.success('Template removido com sucesso!');
    }
  });

  const handleNew = () => {
    setEditData({
      name: '',
      description: '',
      content: '',
      template_type: 'proposta_comercial',
      category: 'geral',
      is_active: true,
      available_placeholders: []
    });
    setEditDialog(true);
  };

  const handleEdit = (template) => {
    setEditData(template);
    setEditDialog(true);
  };

  const handleSave = () => {
    if (editData.id) {
      updateMutation.mutate({ id: editData.id, data: editData });
    } else {
      createMutation.mutate(editData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja remover este template?')) {
      deleteMutation.mutate(id);
    }
  };

  const insertPlaceholder = (placeholder) => {
    const content = editData.content || '';
    setEditData({
      ...editData,
      content: content + ' ' + placeholder
    });
  };

  const handlePreview = (template) => {
    setPreviewContent(template.content);
    setPreviewDialog(true);
  };

  const copyPlaceholder = (placeholder) => {
    navigator.clipboard.writeText(placeholder);
    toast.success(`${placeholder} copiado!`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const activeTemplates = templates.filter(t => t.is_active);
  const inactiveTemplates = templates.filter(t => !t.is_active);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800">Templates de Propostas</h1>
            <p className="text-xs text-slate-500">{activeTemplates.length} ativos</p>
          </div>
          <Button
            size="sm"
            onClick={handleNew}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Novo
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Info Card */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Como usar templates</p>
              <p className="text-xs text-blue-700">
                Crie templates com placeholders que serão preenchidos automaticamente com dados dos clientes e vendas. 
                Use os placeholders disponíveis para personalizar suas propostas.
              </p>
            </div>
          </div>
        </Card>

        {activeTemplates.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">Nenhum template cadastrado</p>
            <Button onClick={handleNew} variant="outline">
              Criar Primeiro Template
            </Button>
          </Card>
        ) : (
          activeTemplates.map((template) => (
            <Card key={template.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline">
                  {templateTypeLabels[template.template_type]}
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  {categoryLabels[template.category]}
                </Badge>
              </div>

              <Button
                onClick={() => handlePreview(template)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <FileText className="w-4 h-4 mr-2" />
                Visualizar Template
              </Button>
            </Card>
          ))
        )}

        {inactiveTemplates.length > 0 && (
          <>
            <div className="pt-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Templates Inativos</h3>
            </div>
            {inactiveTemplates.map((template) => (
              <Card key={template.id} className="p-4 opacity-60">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{template.name}</h3>
                    <Badge variant="outline" className="mt-1">Inativo</Badge>
                  </div>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editData.id ? 'Editar' : 'Novo'} Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nome do Template *</Label>
              <Input
                value={editData.name || ''}
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                placeholder="Ex: Proposta Comercial Padrão"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Input
                value={editData.description || ''}
                onChange={(e) => setEditData({...editData, description: e.target.value})}
                placeholder="Breve descrição do template"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={editData.template_type}
                  onValueChange={(v) => setEditData({...editData, template_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposta_comercial">Proposta Comercial</SelectItem>
                    <SelectItem value="contrato_venda">Contrato de Venda</SelectItem>
                    <SelectItem value="proposta_manutencao">Proposta de Manutenção</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Categoria *</Label>
                <Select
                  value={editData.category}
                  onValueChange={(v) => setEditData({...editData, category: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equipamentos">Equipamentos</SelectItem>
                    <SelectItem value="insumos">Insumos</SelectItem>
                    <SelectItem value="servicos">Serviços</SelectItem>
                    <SelectItem value="geral">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Conteúdo do Template *</Label>
              <Textarea
                value={editData.content || ''}
                onChange={(e) => setEditData({...editData, content: e.target.value})}
                placeholder="Digite o conteúdo e use placeholders como {{client_name}}"
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            {/* Placeholders disponíveis */}
            <div className="p-4 bg-slate-50 rounded-lg border">
              <p className="text-sm font-medium text-slate-700 mb-2">Placeholders Disponíveis:</p>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_PLACEHOLDERS.map((placeholder) => (
                  <button
                    key={placeholder}
                    onClick={() => copyPlaceholder(placeholder)}
                    className="flex items-center justify-between p-2 text-xs bg-white border rounded hover:bg-slate-50 text-left"
                  >
                    <code className="text-indigo-600">{placeholder}</code>
                    <Copy className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">Clique para copiar</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={editData.is_active}
                onChange={(e) => setEditData({...editData, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active" className="cursor-pointer">Template ativo</Label>
            </div>

            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending || !editData.name || !editData.content}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Template
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização do Template</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-slate-50 rounded-lg border font-mono text-sm whitespace-pre-wrap">
              {previewContent}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}