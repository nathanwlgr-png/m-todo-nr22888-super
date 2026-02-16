import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit2, Trash2, Eye, Copy, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ProposalTemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    content_template: '',
    tags: [],
    sections: []
  });

  const queryClient = useQueryClient();

  const { data: templateList = [] } = useQuery({
    queryKey: ['proposal_templates'],
    queryFn: () => base44.entities.ProposalTemplate?.list().catch(() => [])
  });

  useEffect(() => {
    setTemplates(templateList || []);
  }, [templateList]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingId) {
        await base44.entities.ProposalTemplate.update(editingId, data);
      } else {
        await base44.entities.ProposalTemplate.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal_templates'] });
      resetForm();
      toast.success(editingId ? 'Template atualizado!' : 'Template criado!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProposalTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal_templates'] });
      toast.success('Template deletado!');
    }
  });

  const resetForm = () => {
    setFormData({ name: '', content_template: '', tags: [], sections: [] });
    setEditingId(null);
    setShowNew(false);
  };

  const handleEdit = (template) => {
    setEditingId(template.id);
    setFormData(template);
    setShowNew(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.content_template) {
      toast.error('Preencha nome e conteúdo');
      return;
    }
    await saveMutation.mutateAsync(formData);
  };

  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciador de Templates</h1>
            <p className="text-gray-600 mt-1">Crie e gerencie templates de propostas com conteúdo dinâmico</p>
          </div>
          <Button onClick={() => setShowNew(!showNew)} className="bg-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        </div>

        {showNew && (
          <Card className="mb-6 border-2 border-blue-300 bg-blue-50">
            <CardHeader className="bg-blue-600 text-white">
              <CardTitle>{editingId ? 'Editar Template' : 'Novo Template'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Input
                placeholder="Nome do template"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Placeholders Disponíveis
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 p-3 bg-white rounded border">
                  {[
                    'cliente', 'email', 'telefone', 'endereco', 'cidade',
                    'preco', 'produto', 'categoria', 'descricao', 'quantidade',
                    'data', 'prazo_entrega', 'condicoes_pagamento', 'desconto'
                  ].map(ph => (
                    <button
                      key={ph}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        content_template: prev.content_template + `{{${ph}}} `
                      }))}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                    >
                      {`{{${ph}}}`}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                placeholder="Conteúdo do template com placeholders {{cliente}}, {{preco}}, etc..."
                value={formData.content_template}
                onChange={(e) => setFormData(prev => ({ ...prev, content_template: e.target.value }))}
                rows={12}
                className="font-mono text-sm"
              />

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Tags</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="tag-input"
                    placeholder="Digite e pressione Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addTag(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-1">×</button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-green-600">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button onClick={resetForm} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates List */}
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="border-l-4 border-l-blue-600">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.content_template}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(template)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(template.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
                
                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {templates.length === 0 && !showNew && (
          <Card className="text-center py-12">
            <p className="text-gray-600 mb-4">Nenhum template criado ainda</p>
            <Button onClick={() => setShowNew(true)} className="bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}