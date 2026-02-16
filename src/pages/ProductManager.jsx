import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Edit2, Trash2, Save, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const queryClient = useQueryClient();

  // Carregar produtos
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingId(null);
      toast.success('Produto atualizado!');
    },
    onError: (err) => toast.error('Erro ao atualizar: ' + err.message)
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto deletado!');
    },
    onError: (err) => toast.error('Erro ao deletar')
  });

  // Importar de Fabia
  const importMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('importFromFabia', {});
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${data.imported} produtos importados!`);
    },
    onError: () => toast.error('Erro ao importar de Fabia')
  });

  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditData(product);
  };

  const handleSave = () => {
    updateMutation.mutate({ id: editingId, data: editData });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Gerenciador de Produtos</h1>
        <p className="text-slate-600">Edite produtos importados de Fabia</p>
      </div>

      {/* Ações */}
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="🔍 Buscar por nome, SKU ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Button
          onClick={() => importMutation.mutate()}
          disabled={importMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Download className="w-4 h-4 mr-2" />
          {importMutation.isPending ? 'Importando...' : 'Importar Fabia'}
        </Button>
      </div>

      {/* Info */}
      {products.length > 0 && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800">
            📦 Total: <strong>{products.length} produtos</strong> • Ativos: <strong>{products.filter(p => p.is_active).length}</strong>
          </p>
        </Card>
      )}

      {/* Lista de Produtos */}
      <div className="grid gap-3">
        {isLoading ? (
          <p className="text-center text-slate-500">Carregando...</p>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-slate-500">Nenhum produto encontrado</p>
            <Button
              onClick={() => importMutation.mutate()}
              variant="outline"
              className="mt-4"
            >
              Importar de Fabia
            </Button>
          </Card>
        ) : (
          filteredProducts.map(product => (
            <Card key={product.id} className={`p-4 ${editingId === product.id ? 'bg-blue-50 border-blue-300' : ''}`}>
              {editingId === product.id ? (
                // Modo Edição
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Nome</label>
                      <Input
                        value={editData.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">SKU</label>
                      <Input
                        value={editData.sku || ''}
                        onChange={(e) => handleChange('sku', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Categoria</label>
                      <Input
                        value={editData.category || ''}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Preço (R$)</label>
                      <Input
                        type="number"
                        value={editData.price || 0}
                        onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Estoque</label>
                      <Input
                        type="number"
                        value={editData.stock || 0}
                        onChange={(e) => handleChange('stock', parseInt(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Fornecedor</label>
                      <Input
                        value={editData.supplier || ''}
                        onChange={(e) => handleChange('supplier', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Descrição</label>
                    <textarea
                      value={editData.description || ''}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="w-full mt-1 p-2 border rounded text-sm"
                      rows="2"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              ) : (
                // Modo Visualização
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-slate-800">{product.name}</h3>
                      {product.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-2">
                      <p><strong>SKU:</strong> {product.sku || '-'}</p>
                      <p><strong>Categoria:</strong> {product.category || '-'}</p>
                      <p><strong>Preço:</strong> R$ {product.price?.toFixed(2) || '0.00'}</p>
                      <p><strong>Estoque:</strong> {product.stock || 0} un</p>
                      <p><strong>Fornecedor:</strong> {product.supplier || '-'}</p>
                      <p><strong>ID Fabia:</strong> {product.fabia_id}</p>
                    </div>
                    {product.description && (
                      <p className="text-xs text-slate-500">{product.description}</p>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(product)}
                      size="sm"
                      variant="outline"
                      className="border-blue-300 hover:bg-blue-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja deletar este produto?')) {
                          deleteMutation.mutate(product.id);
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="border-red-300 hover:bg-red-50"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}