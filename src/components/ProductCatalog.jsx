import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Package, Filter, DollarSign, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductCatalog() {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const { data: equipment = [] } = useQuery({
        queryKey: ['equipment'],
        queryFn: () => base44.entities.Equipment.list(),
    });

    const { data: consumables = [] } = useQuery({
        queryKey: ['consumables'],
        queryFn: () => base44.entities.Consumable.list(),
    });

    const allProducts = [
        ...equipment.map(e => ({ ...e, type: 'equipment' })),
        ...consumables.map(c => ({ ...c, type: 'consumable' }))
    ];

    const filteredProducts = allProducts.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || 
            (categoryFilter === 'equipment' && product.type === 'equipment') ||
            (categoryFilter === 'consumable' && product.type === 'consumable') ||
            product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const shareProduct = (product) => {
        const text = `*${product.name}*\n\nPreço: R$ ${product.price?.toLocaleString('pt-BR') || product.unit_price?.toLocaleString('pt-BR')}\n${product.specifications || product.description || ''}`;
        
        if (navigator.share) {
            navigator.share({ text });
        } else {
            navigator.clipboard.writeText(text);
            toast.success('Copiado para área de transferência!');
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Package className="h-6 w-6" />
                        Catálogo de Produtos
                    </CardTitle>
                    <CardDescription className="text-emerald-100">
                        Equipamentos e insumos veterinários disponíveis
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar produtos..."
                                className="pl-9"
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger>
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filtrar categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Categorias</SelectItem>
                                <SelectItem value="equipment">Equipamentos</SelectItem>
                                <SelectItem value="consumable">Insumos</SelectItem>
                                <SelectItem value="analisador_hematologico">Analisador Hematológico</SelectItem>
                                <SelectItem value="analisador_bioquimico">Analisador Bioquímico</SelectItem>
                                <SelectItem value="reagente">Reagentes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="text-sm text-gray-600">
                        {filteredProducts.length} produtos encontrados
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                    <Card key={product.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-base flex items-start justify-between gap-2">
                                <span>{product.name}</span>
                                <Badge className={
                                    product.type === 'equipment' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-green-100 text-green-800'
                                }>
                                    {product.type === 'equipment' ? 'Equipamento' : 'Insumo'}
                                </Badge>
                            </CardTitle>
                            {product.category && (
                                <CardDescription className="text-xs">
                                    {product.category.replace(/_/g, ' ')}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-lg font-bold text-green-700">
                                <DollarSign className="h-5 w-5" />
                                R$ {(product.price || product.unit_price)?.toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </div>

                            {product.specifications && (
                                <p className="text-sm text-gray-600 line-clamp-3">
                                    {product.specifications}
                                </p>
                            )}

                            {product.description && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {product.description}
                                </p>
                            )}

                            {product.monthly_bonus && (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                    Bônus: {product.monthly_bonus}
                                </Badge>
                            )}

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => shareProduct(product)}
                                className="w-full"
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartilhar
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}