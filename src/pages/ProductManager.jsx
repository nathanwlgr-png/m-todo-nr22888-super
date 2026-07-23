import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import CatalogManagerPanel from '@/components/catalog/CatalogManagerPanel';

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
    mutationFn: ({ id, data, source }) => base44.functions.invoke('adminProductChange', { entity: 'Product', id, data, source, confirmed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingId(null);
      toast.success('Produto atualizado!');
    },
    onError: (err) => toast.error('Erro ao atualizar: ' + err.message)
  });

  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditData(product);
  };

  const handleSave = () => {
    const source = window.prompt('Informe a fonte oficial desta alteração:');
    if (!source?.trim()) return;
    if (!window.confirm('Confirma a alteração? O estado anterior será registrado para auditoria.')) return;
    updateMutation.mutate({ id: editingId, data: editData, source: source.trim() });
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
        <p className="text-slate-600">Gerencie o catálogo SEAMATY e os produtos importados com auditoria administrativa</p>
      </div>

      <CatalogManagerPanel />

      <div className="border-t pt-6">
        <h2 className="text-xl font-bold text-slate-800">Produtos importados</h2>
      </div>

      {/* Busca segura — importações exigem revisão administrativa separada */}
      <Input
        placeholder="🔍 Buscar por nome, SKU ou categoria..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-xs"
      />

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
            <p className="text-slate-500">Nenhum produto encontrado. Importações devem passar por revisão administrativa.</p>
          </Card>
        ) : (
          filteredProducts.map(product => (
            <Card key={product.id} className={`p-4 ${editingId === product.id ? 'bg-blue-50 border-blue-300' : ''}`}>
              {editingId === product.id ? (
                // Modo Edição
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                      className="min-h-11 min-w-11 border-blue-300 hover:bg-blue-50"
                    >
                      <Edit2 className="w-4 h-4" />
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