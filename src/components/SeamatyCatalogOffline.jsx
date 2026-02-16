import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Package, Thermometer, Clock, Beaker, AlertCircle } from 'lucide-react';

export default function SeamatyCatalogOffline() {
  const [equipments, setEquipments] = useState([]);
  const [rotors, setRotors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const [eqs, rots] = await Promise.all([
        base44.entities.SeamatyEquipment.list(),
        base44.entities.BiochemistryRotor.list()
      ]);
      setEquipments(eqs || []);
      setRotors(rots || []);
    } catch (error) {
      console.error('Erro ao carregar catálogo:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRotors = rotors.filter(r => {
    const matchesSearch = r.rotor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.parameters?.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesEquipment = selectedEquipment === 'all' || 
                             r.compatible_equipment?.includes(selectedEquipment);
    return matchesSearch && matchesEquipment;
  });

  const colorMap = {
    vermelho: 'bg-red-100 border-red-300 text-red-800',
    azul: 'bg-blue-100 border-blue-300 text-blue-800',
    amarelo: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    laranja: 'bg-orange-100 border-orange-300 text-orange-800',
    marrom: 'bg-amber-100 border-amber-300 text-amber-800',
    roxo: 'bg-purple-100 border-purple-300 text-purple-800',
    verde: 'bg-green-100 border-green-300 text-green-800',
    ciano: 'bg-cyan-100 border-cyan-300 text-cyan-800'
  };

  if (loading) return <p className="text-slate-500 text-center">Carregando catálogo...</p>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          Catálogo Seamaty - Modo Offline
        </h3>
        <p className="text-sm text-slate-600 mt-1">{equipments.length} equipamentos • {rotors.length} rotores bioquímicos</p>
      </Card>

      <Tabs defaultValue="rotors" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rotors">Rotores Bioquímicos</TabsTrigger>
          <TabsTrigger value="equipments">Equipamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="rotors" className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="🔍 Buscar rotor ou parâmetro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">Todos Equipamentos</option>
              <option value="SMT-120VP">SMT-120VP</option>
              <option value="QT3">QT3</option>
              <option value="3Dx">3Dx</option>
            </select>
          </div>

          {/* Lista de Rotores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRotors.map(rotor => (
              <Card key={rotor.id} className={`p-4 border-2 ${colorMap[rotor.color_code] || 'bg-white'}`}>
                <div className="flex items-start gap-4">
                  {rotor.image_url && (
                    <img src={rotor.image_url} alt={rotor.rotor_name} className="w-24 h-24 object-cover rounded-lg" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{rotor.rotor_name}</h4>
                    <p className="text-xs text-slate-600 mb-2">Ref: {rotor.reference_code}</p>
                    <Badge className="mb-2">{rotor.parameters_count} parâmetros</Badge>
                    
                    <div className="text-xs text-slate-700 space-y-1 mt-2">
                      <p><strong>Parâmetros:</strong> {rotor.parameters?.join(', ')}</p>
                      <p className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3" />
                        {rotor.storage_temperature}
                      </p>
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Aclimatação: {rotor.acclimation_time}
                      </p>
                    </div>

                    {rotor.clinical_application && (
                      <div className="mt-2 p-2 bg-white/60 rounded text-xs">
                        <strong>Uso clínico:</strong> {rotor.clinical_application}
                      </div>
                    )}

                    {rotor.indications?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-slate-700">Indicações:</p>
                        <ul className="text-xs text-slate-600 list-disc list-inside">
                          {rotor.indications.slice(0, 3).map((ind, idx) => (
                            <li key={idx}>{ind}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-2 flex gap-1 flex-wrap">
                      {rotor.compatible_equipment?.map(eq => (
                        <Badge key={eq} variant="outline" className="text-xs">{eq}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="equipments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {equipments.map(eq => (
              <Card key={eq.id} className="p-4 bg-gradient-to-br from-white to-slate-50">
                {eq.image_url && (
                  <img src={eq.image_url} alt={eq.equipment_name} className="w-full h-40 object-contain rounded-lg mb-3" />
                )}
                <h4 className="font-bold text-lg text-slate-800">{eq.equipment_name}</h4>
                <Badge className="mb-3">{eq.equipment_type}</Badge>

                <div className="space-y-2 text-xs text-slate-700">
                  <p><Beaker className="w-3 h-3 inline mr-1" /><strong>Amostra:</strong> {eq.sample_volume}</p>
                  <p><Clock className="w-3 h-3 inline mr-1" /><strong>Tempo:</strong> {eq.processing_time}</p>
                  
                  {eq.specifications && (
                    <div className="p-2 bg-blue-50 rounded mt-2">
                      <p className="font-semibold mb-1">Especificações:</p>
                      <p>• {eq.specifications.voltage}</p>
                      <p>• Temp: {eq.specifications.temperature_range}</p>
                      <p>• Umidade: {eq.specifications.humidity_range}</p>
                      <p>• NoBreak: {eq.specifications.nobreak_min}</p>
                    </div>
                  )}

                  <div className="p-2 bg-green-50 rounded mt-2">
                    <p className="font-semibold mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Tecnologia:
                    </p>
                    <p className="text-xs">{eq.technology}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}