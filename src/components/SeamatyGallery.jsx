import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit2, Trash2, AlertCircle, CheckCircle, FileText, ExternalLink, Send, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const isPdf = (url = '') => /\.pdf($|\?)/i.test(url);
const isImage = (url = '') => /\.(png|jpe?g|webp|gif)($|\?)/i.test(url);

export default function SeamatyGallery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editingImage, setEditingImage] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const queryClient = useQueryClient();

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['seamaty-gallery'],
    queryFn: () => base44.entities.SeamatyImage?.list('-upload_date', 100).catch(() => []),
    staleTime: 60000,
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id) => base44.entities.SeamatyImage?.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seamaty-gallery'] });
      toast.success('✅ Imagem removida');
    },
  });

  const filteredImages = images.filter(img => {
    const matchesSearch = !searchTerm || 
      img.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !filterCategory || img.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['logo', 'produto', 'equipamento', 'case_sucesso', 'tecnico', 'marketing'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">🖼️ Galeria Seamaty</h2>
        <Button
          onClick={() => {
            setEditingImage(null);
            setShowForm(!showForm);
          }}
          className="gap-2 bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="w-4 h-4" />
          Adicionar Imagem
        </Button>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Buscar por título ou tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-slate-300"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white"
        >
          <option value="">Todas as categorias</option>
          {categories.map(cat => (
            <option key={cat} value={cat} className="capitalize">
              {cat.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* GRID DE IMAGENS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredImages.map(image => (
          <Card
            key={image.id}
            className={`overflow-hidden border-2 transition-all ${
              image.approved_for_marketing_ai
                ? 'border-green-300 bg-green-50'
                : 'border-yellow-300 bg-yellow-50'
            }`}
          >
            <a
              href={image.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-video bg-slate-100 overflow-hidden"
            >
              {isImage(image.image_url) ? (
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 hover:bg-slate-200 transition-colors">
                  {isPdf(image.image_url) ? <FileText className="w-10 h-10 text-red-500" /> : <ImageIcon className="w-10 h-10" />}
                  <span className="text-xs font-medium">{isPdf(image.image_url) ? 'PDF' : 'Documento'}</span>
                </div>
              )}
            </a>

            <CardContent className="p-4 space-y-3">
              <div>
                <p className="font-bold text-slate-900">{image.title}</p>
                <p className="text-xs text-slate-600 mt-1">{image.category}</p>
              </div>

              {image.product_related && (
                <Badge variant="secondary">{image.product_related}</Badge>
              )}

              {/* REGRAS DE USO */}
              <div className="space-y-2 text-xs">
                {image.required_credit && (
                  <div className="flex gap-2 p-2 bg-blue-100 rounded border border-blue-300">
                    <AlertCircle className="w-4 h-4 text-blue-700 flex-shrink-0" />
                    <p className="text-blue-900 font-semibold">Crédito obrigatório</p>
                  </div>
                )}

                {image.usage_restrictions?.length > 0 && (
                  <div className="p-2 bg-orange-100 rounded border border-orange-300">
                    <p className="font-semibold text-orange-900 mb-1">Restrições:</p>
                    <div className="space-y-1">
                      {image.usage_restrictions.map((r, i) => (
                        <p key={i} className="text-orange-800">• {r}</p>
                      ))}
                    </div>
                  </div>
                )}

                {!image.can_modify && (
                  <div className="flex gap-2 p-2 bg-red-100 rounded border border-red-300">
                    <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
                    <p className="text-red-900">❌ Não modificável</p>
                  </div>
                )}

                {image.approved_for_marketing_ai && (
                  <div className="flex gap-2 p-2 bg-green-100 rounded border border-green-300">
                    <CheckCircle className="w-4 h-4 text-green-700 flex-shrink-0" />
                    <p className="text-green-900">✓ Marketing AI aprovada</p>
                  </div>
                )}
              </div>

              {/* AÇÕES PRINCIPAIS - venda em campo */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  className="flex-1 gap-1 bg-slate-800 hover:bg-slate-900"
                  onClick={() => window.open(image.image_url, '_blank')}
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    const texto = `*${image.title}*\n\n${image.image_url}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
                  }}
                >
                  <Send className="w-3 h-3" />
                  WhatsApp
                </Button>
              </div>

              {/* AÇÕES SECUNDÁRIAS */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1"
                  onClick={() => {
                    setEditingImage(image);
                    setShowForm(true);
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-red-600 hover:text-red-700 gap-1"
                  onClick={() => deleteImageMutation.mutate(image.id)}
                >
                  <Trash2 className="w-3 h-3" />
                  Remover
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-600">Nenhuma imagem encontrada</p>
        </div>
      )}

    </div>
  );
}