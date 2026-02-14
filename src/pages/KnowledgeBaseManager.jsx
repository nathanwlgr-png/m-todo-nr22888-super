import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Plus, Search, Sparkles, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function KnowledgeBaseManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTechnique, setFilterTechnique] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['knowledgeBase'],
    queryFn: () => base44.entities.KnowledgeBase.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.KnowledgeBase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['knowledgeBase']);
      setShowAddDialog(false);
      toast.success('Item adicionado com sucesso!');
    }
  });

  const filteredItems = items.filter(item => {
    const matchSearch = !searchTerm || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchTechnique = filterTechnique === 'all' || item.sales_technique === filterTechnique;
    
    return matchSearch && matchCategory && matchTechnique;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-indigo-600" />
                Base de Conhecimento de Vendas
              </h1>
              <p className="text-slate-600">Livros, técnicas, gatilhos e estratégias</p>
            </div>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Conteúdo
          </Button>
        </div>

        {/* Filtros e Busca */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por título, conteúdo ou tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  <SelectItem value="book">Livros</SelectItem>
                  <SelectItem value="technique">Técnicas</SelectItem>
                  <SelectItem value="trigger">Gatilhos</SelectItem>
                  <SelectItem value="client_profile">Perfis de Cliente</SelectItem>
                  <SelectItem value="objection_handling">Objeções</SelectItem>
                  <SelectItem value="closing">Fechamento</SelectItem>
                  <SelectItem value="script">Scripts</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTechnique} onValueChange={setFilterTechnique}>
                <SelectTrigger>
                  <SelectValue placeholder="Técnica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Técnicas</SelectItem>
                  <SelectItem value="SPIN_Selling">SPIN Selling</SelectItem>
                  <SelectItem value="Cialdini_Persuasao">Cialdini - Persuasão</SelectItem>
                  <SelectItem value="Challenger_Sale">Challenger Sale</SelectItem>
                  <SelectItem value="Never_Split_Difference">Never Split the Difference</SelectItem>
                  <SelectItem value="Gap_Selling">Gap Selling</SelectItem>
                  <SelectItem value="Pitch_Anything">Pitch Anything</SelectItem>
                  <SelectItem value="Sandler_System">Sandler System</SelectItem>
                  <SelectItem value="Ziglar_Closing">Zig Ziglar - Fechamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <Filter className="w-4 h-4" />
              <span>{filteredItems.length} itens encontrados</span>
              {(searchTerm || filterCategory !== 'all' || filterTechnique !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('all');
                    setFilterTechnique('all');
                  }}
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Itens */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                Carregando conhecimento...
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                Nenhum item encontrado. Adicione conteúdo para começar!
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card 
                key={item.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline">{item.category}</Badge>
                        {item.sales_technique && (
                          <Badge className="bg-indigo-100 text-indigo-800">
                            {item.sales_technique}
                          </Badge>
                        )}
                        {item.book_author && (
                          <Badge variant="secondary">{item.book_author}</Badge>
                        )}
                      </div>
                    </div>
                    {item.effectiveness_score && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">
                          {item.effectiveness_score}
                        </div>
                        <div className="text-xs text-slate-500">efetividade</div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 mb-3 line-clamp-2">
                    {item.summary || item.content?.substring(0, 200) + '...'}
                  </p>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog de Detalhes */}
        {selectedItem && (
          <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedItem.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedItem.book_author && (
                  <div>
                    <h3 className="font-semibold text-sm text-slate-600 mb-1">Autor</h3>
                    <p>{selectedItem.book_author}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-sm text-slate-600 mb-1">Conteúdo</h3>
                  <p className="whitespace-pre-wrap text-slate-700">{selectedItem.content}</p>
                </div>
                {selectedItem.approach_tips && (
                  <div>
                    <h3 className="font-semibold text-sm text-slate-600 mb-1">Dicas de Abordagem</h3>
                    <p className="whitespace-pre-wrap text-slate-700">{selectedItem.approach_tips}</p>
                  </div>
                )}
                {selectedItem.when_to_use && (
                  <div>
                    <h3 className="font-semibold text-sm text-slate-600 mb-1">Quando Usar</h3>
                    <p className="whitespace-pre-wrap text-slate-700">{selectedItem.when_to_use}</p>
                  </div>
                )}
                {selectedItem.example_scripts && selectedItem.example_scripts.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-slate-600 mb-2">Scripts Exemplo</h3>
                    {selectedItem.example_scripts.map((script, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg mb-2">
                        <p className="text-sm italic">{script}</p>
                      </div>
                    ))}
                  </div>
                )}
                {selectedItem.related_profiles && selectedItem.related_profiles.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-slate-600 mb-2">Perfis Relacionados</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.related_profiles.map((profile, idx) => (
                        <Badge key={idx} className="bg-blue-100 text-blue-800">
                          {profile}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog de Adicionar */}
        <AddKnowledgeDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </div>
    </div>
  );
}

function AddKnowledgeDialog({ open, onOpenChange, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    category: 'book',
    tags: '',
    sales_technique: '',
    book_author: '',
    approach_tips: '',
    when_to_use: '',
    effectiveness_score: 80
  });

  const handleSubmit = () => {
    const data = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Conteúdo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Título</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: SPIN Selling - Neil Rackham"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Categoria</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="book">Livro</SelectItem>
                  <SelectItem value="technique">Técnica</SelectItem>
                  <SelectItem value="trigger">Gatilho</SelectItem>
                  <SelectItem value="client_profile">Perfil de Cliente</SelectItem>
                  <SelectItem value="objection_handling">Objeções</SelectItem>
                  <SelectItem value="closing">Fechamento</SelectItem>
                  <SelectItem value="script">Script</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Técnica de Vendas</label>
              <Select value={formData.sales_technique} onValueChange={(v) => setFormData({ ...formData, sales_technique: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPIN_Selling">SPIN Selling</SelectItem>
                  <SelectItem value="Cialdini_Persuasao">Cialdini - Persuasão</SelectItem>
                  <SelectItem value="Challenger_Sale">Challenger Sale</SelectItem>
                  <SelectItem value="Never_Split_Difference">Never Split the Difference</SelectItem>
                  <SelectItem value="Gap_Selling">Gap Selling</SelectItem>
                  <SelectItem value="Pitch_Anything">Pitch Anything</SelectItem>
                  <SelectItem value="Other">Outra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Autor (se livro)</label>
            <Input
              value={formData.book_author}
              onChange={(e) => setFormData({ ...formData, book_author: e.target.value })}
              placeholder="Ex: Neil Rackham"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Resumo Rápido</label>
            <Textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Resumo breve em 1-2 frases"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Conteúdo Completo</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Conteúdo detalhado da técnica, estratégia ou resumo do livro"
              rows={6}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Dicas de Abordagem</label>
            <Textarea
              value={formData.approach_tips}
              onChange={(e) => setFormData({ ...formData, approach_tips: e.target.value })}
              placeholder="Como aplicar na prática"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Quando Usar</label>
            <Textarea
              value={formData.when_to_use}
              onChange={(e) => setFormData({ ...formData, when_to_use: e.target.value })}
              placeholder="Em que situações esta técnica é mais efetiva"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Tags (separadas por vírgula)</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Ex: negociação, objeção, fechamento, ROI"
            />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? 'Adicionando...' : 'Adicionar Conteúdo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}