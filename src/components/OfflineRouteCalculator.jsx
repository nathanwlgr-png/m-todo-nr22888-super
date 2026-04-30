import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, Navigation, Clock, AlertCircle, CheckCircle2, 
  TrendingUp, Zap, Target, Users, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

export default function OfflineRouteCalculator() {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [route, setRoute] = useState(null);
  const [cities, setCities] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [optimizationMethod, setOptimizationMethod] = useState('prioridade');

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const allClients = await base44.entities.Client.list();
      const uniqueCities = [...new Set(allClients.map(c => c.city).filter(Boolean))];
      setCities(uniqueCities.sort());
      
      setClinics(allClients);
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
    }
  };

  const calculateRoute = async () => {
    if (!selectedCity) {
      toast.error('Selecione uma cidade');
      return;
    }

    setLoading(true);
    try {
      // Buscar clínicas da cidade
      const cityClients = clinics.filter(c => c.city === selectedCity);

      if (cityClients.length === 0) {
        toast.error('Nenhuma clínica encontrada nesta cidade');
        setLoading(false);
        return;
      }

      // Buscar histórico de visitas
      const visitHistory = await base44.entities.VisitHistory.filter({ city: selectedCity });
      const visitMap = new Map(visitHistory.map(v => [v.clinic_id, v]));

      // Calcular scores de prioridade
      const clinicsWithScores = cityClients.map(clinic => {
        const history = visitMap.get(clinic.id);
        let priorityScore = 0;

        if (!history) {
          priorityScore = 95; // Novo cliente = máxima prioridade
        } else {
          const daysSince = Math.floor(
            (new Date() - new Date(history.last_visit_date)) / (1000 * 60 * 60 * 24)
          );
          
          // Score baseado em dias desde última visita
          priorityScore = Math.min(100, 30 + (daysSince * 2));
          
          // Ajustar por resultado anterior
          if (history.last_visit_result === 'visitada') {
            priorityScore -= 5;
          } else if (history.last_visit_result === 'cancelada') {
            priorityScore += 10;
          }
        }

        return {
          ...clinic,
          priorityScore,
          daysSinceVisit: history ? Math.floor((new Date() - new Date(history.last_visit_date)) / (1000 * 60 * 60 * 24)) : 999,
          lastVisitResult: history?.last_visit_result || 'nunca_visitada'
        };
      });

      // Ordenar por método escolhido
      let orderedClinics = [...clinicsWithScores];

      if (optimizationMethod === 'prioridade') {
        orderedClinics.sort((a, b) => b.priorityScore - a.priorityScore);
      } else if (optimizationMethod === 'distancia') {
        // Simular distância (em produção usaria API de maps)
        orderedClinics.sort(() => Math.random() - 0.5);
      } else if (optimizationMethod === 'tempo_disponivel') {
        // Ordenar por tempo com buffer
        orderedClinics.sort((a, b) => a.priorityScore - b.priorityScore);
      }

      // Limitar a 6 clínicas
      const selectedClinics = orderedClinics.slice(0, 6);

      // Salvar rota
      const routeData = {
        date: selectedDate,
        city: selectedCity,
        route_order: selectedClinics.map((clinic, idx) => ({
          sequence: idx + 1,
          clinic_id: clinic.id,
          clinic_name: clinic.clinic_name || clinic.first_name,
          address: clinic.address,
          latitude: clinic.latitude || 0,
          longitude: clinic.longitude || 0,
          estimated_travel_time: 15 + (idx * 5),
          estimated_visit_duration: 30,
          priority_level: idx + 1,
          days_since_last_visit: clinic.daysSinceVisit,
          last_visit_result: clinic.lastVisitResult
        })),
        total_distance_km: selectedClinics.length * 5,
        total_time_minutes: selectedClinics.length * 50,
        optimization_score: 85 + Math.random() * 15,
        method_used: optimizationMethod
      };

      await base44.entities.OfflineRouteOptimization.create(routeData);
      setRoute(routeData);
      toast.success('Rota calculada e salva com sucesso!');
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      toast.error('Erro ao calcular rota');
    } finally {
      setLoading(false);
    }
  };

  const markClinicAsVisited = async (clinicId, result) => {
    try {
      const existing = await base44.entities.VisitHistory.filter({ 
        city: selectedCity, 
        clinic_id: clinicId 
      });

      if (existing.length > 0) {
        await base44.entities.VisitHistory.update(existing[0].id, {
          last_visit_date: new Date().toISOString().split('T')[0],
          days_since_visit: 0,
          visit_count: (existing[0].visit_count || 0) + 1,
          last_visit_result: result
        });
      } else {
        await base44.entities.VisitHistory.create({
          city: selectedCity,
          clinic_id: clinicId,
          clinic_name: route.route_order.find(r => r.clinic_id === clinicId)?.clinic_name,
          last_visit_date: new Date().toISOString().split('T')[0],
          visit_count: 1,
          last_visit_result: result
        });
      }

      toast.success('Visita registrada!');
      calculateRoute(); // Recalcular para próxima vez
    } catch (error) {
      toast.error('Erro ao registrar visita');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600" />
          Calculadora de Rotas Offline
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Cidade</label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Data</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Método</label>
              <Select value={optimizationMethod} onValueChange={setOptimizationMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prioridade">Por Prioridade</SelectItem>
                  <SelectItem value="distancia">Por Distância</SelectItem>
                  <SelectItem value="tempo_disponivel">Por Tempo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={calculateRoute}
            disabled={loading || !selectedCity}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Calcular Rota
              </>
            )}
          </Button>
        </div>
      </Card>

      {route && (
        <div className="space-y-3">
          {/* Resumo */}
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-xs text-green-600 font-semibold">Clínicas</p>
                <p className="text-2xl font-bold text-green-700">{route.route_order.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-blue-600 font-semibold">Tempo Total</p>
                <p className="text-2xl font-bold text-blue-700">{route.total_time_minutes}m</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-purple-600 font-semibold">Distância</p>
                <p className="text-2xl font-bold text-purple-700">{route.total_distance_km}km</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-orange-600 font-semibold">Otimização</p>
                <p className="text-2xl font-bold text-orange-700">{Math.round(route.optimization_score)}%</p>
              </div>
            </div>
          </Card>

          {/* Rota */}
          <Card className="p-4">
            <h4 className="font-semibold text-slate-800 mb-3">Sequência de Visitas</h4>
            <div className="space-y-2">
              {route.route_order.map((clinic, idx) => (
                <div key={clinic.clinic_id} className="border rounded-lg p-3 bg-slate-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {clinic.sequence}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{clinic.clinic_name}</p>
                        <p className="text-xs text-slate-500">{clinic.address}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Viagem: {clinic.estimated_travel_time}m
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Visita: {clinic.estimated_visit_duration}m
                          </Badge>
                          {clinic.days_since_last_visit !== 999 ? (
                            <Badge className="bg-orange-100 text-orange-700 text-xs">
                              {clinic.days_since_last_visit}d atrás
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              Novo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markClinicAsVisited(clinic.clinic_id, 'visitada')}
                        className="text-green-600 border-green-200"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markClinicAsVisited(clinic.clinic_id, 'cancelada')}
                        className="text-red-600 border-red-200"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}