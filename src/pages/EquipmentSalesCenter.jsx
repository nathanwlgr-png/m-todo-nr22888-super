import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Sparkles, Upload, Loader2 } from 'lucide-react';
import EquipmentSalesKit from '@/components/EquipmentSalesKit';

export default function EquipmentSalesCenter() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  const { data: equipmentMaterials = [], isLoading } = useQuery({
    queryKey: ['equipment-materials'],
    queryFn: () => base44.entities.EquipmentMaterial.list('-created_date', 100),
  });

  const filteredEquipments = equipmentMaterials.filter(eq =>
    !search || eq.equipment_name.toLowerCase().includes(search.toLowerCase()) ||
    eq.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-orange-900 to-orange-700 px-4 pt-4 pb-12">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Central de Equipamentos</h1>
            <p className="text-sm text-orange-200">Material de vendas completo</p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl('LoadEquipmentCatalog'))}
            variant="outline"
            className="border-white text-white hover:bg-white/10"
            size="sm"
          >
            <Upload className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar equipamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          </div>
        ) : filteredEquipments.length === 0 ? (
          <Card className="p-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-600 mb-4">Nenhum equipamento cadastrado</p>
            <Button onClick={() => navigate(createPageUrl('LoadEquipmentCatalog'))}>
              <Upload className="w-4 h-4 mr-2" />
              Carregar Catálogo
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredEquipments.map((equipment) => (
              <Card
                key={equipment.id}
                className="p-4 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setSelectedEquipment(equipment)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 mb-1">{equipment.equipment_name}</h3>
                    <p className="text-xs text-slate-600 mb-2">{equipment.category}</p>
                    {equipment.price && (
                      <Badge className="bg-green-100 text-green-700">
                        R$ {equipment.price.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                  {equipment.image_urls?.[0] && (
                    <img src={equipment.image_urls[0]} className="w-16 h-16 rounded-lg object-cover" />
                  )}
                </div>
                {equipment.summary && (
                  <p className="text-sm text-slate-700 mt-3 line-clamp-2">{equipment.summary}</p>
                )}
                {equipment.differentiators && equipment.differentiators.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {equipment.differentiators.slice(0, 2).map((diff, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        ✨ {diff.substring(0, 30)}...
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Equipment Sales Kit Modal */}
        {selectedEquipment && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <EquipmentSalesKit
                equipment={selectedEquipment}
                client={null}
              />
              <Button
                onClick={() => setSelectedEquipment(null)}
                variant="outline"
                className="w-full mt-2 bg-white"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}