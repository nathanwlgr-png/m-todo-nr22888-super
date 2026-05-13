import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Navigation, Loader2, Clock, TrendingUp, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MapWithClinics from '@/components/MapWithClinics';
import RoutePlanner from '@/components/RoutePlanner';
import ClinicsList from '@/components/ClinicsList';
import { toast } from 'sonner';

export default function RouteOptimization() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState(50);
  const [selectedClinics, setSelectedClinics] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  // Buscar clínicas próximas
  const { data: nearbyClinics = [], isLoading: loadingClinics } = useQuery({
    queryKey: ['nearby-clinics', city, radius],
    queryFn: async () => {
      if (!city) return [];
      try {
        const result = await base44.functions.invoke('getNearbyVeterinaryClinics', {
          city,
          radius
        });
        return result.data?.clinics || [];
      } catch (error) {
        toast.error('Erro ao buscar clínicas: ' + error.message);
        return [];
      }
    },
    enabled: !!city
  });

  // Buscar visitas agendadas para hoje
  const { data: todayVisits = [] } = useQuery({
    queryKey: ['today-visits'],
    queryFn: async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const visits = await base44.entities.Visit.list('-scheduled_date', 100);
        return visits.filter(v => v.scheduled_date?.split('T')[0] === today);
      } catch (error) {
        return [];
      }
    }
  });

  // Otimizar rota
  const optimizeRouteMutation = useMutation({
    mutationFn: async (clinics) => {
      setLoading(true);
      try {
        const result = await base44.functions.invoke('optimizeRoute', {
          clinics: clinics.map(c => ({
            id: c.id,
            name: c.name,
            latitude: c.latitude,
            longitude: c.longitude,
            address: c.address,
            type: 'clinic'
          }))
        });
        return result.data;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (data) => {
      setOptimizedRoute(data);
      toast.success('Rota otimizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao otimizar rota: ' + error.message);
    }
  });

  // Salvar visitas planejadas
  const saveVisitsMutation = useMutation({
    mutationFn: async () => {
      if (!optimizedRoute?.optimizedPath) {
        throw new Error('Nenhuma rota otimizada disponível');
      }

      const visitPromises = optimizedRoute.optimizedPath.map((clinic, index) => {
        const scheduledTime = new Date();
        scheduledTime.setHours(9 + Math.floor(index * 1.5), 0, 0);

        return base44.entities.Visit.create({
          client_id: clinic.id,
          client_name: clinic.name,
          scheduled_date: scheduledTime.toISOString(),
          visit_type: 'demonstracao',
          location: clinic.address,
          duration_minutes: 60,
          status: 'agendada'
        });
      });

      await Promise.all(visitPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-visits'] });
      toast.success('Visitas salvas com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar visitas: ' + error.message);
    }
  });

  const handleOptimize = () => {
    if (selectedClinics.length === 0) {
      toast.error('Selecione pelo menos uma clínica');
      return;
    }
    optimizeRouteMutation.mutate(selectedClinics);
  };

  const clinicsToOptimize = selectedClinics.length > 0 ? selectedClinics : nearbyClinics;
  const totalDistance = optimizedRoute?.totalDistance || 0;
  const estimatedTime = optimizedRoute?.estimatedTime || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/Home')}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Otimizador de Rotas</h1>
            <p className="text-sm text-slate-600">Planeje as visitas diárias automaticamente</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Cidade</label>
                <Input
                  placeholder="Digite a cidade..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Raio (km)</label>
                <Input
                  type="number"
                  min="1"
                  max="200"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="h-10"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleOptimize}
                  disabled={loading || clinicsToOptimize.length === 0}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Otimizando...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 mr-2" />
                      Otimizar Rota
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {optimizedRoute && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Clínicas</p>
                    <p className="text-2xl font-bold">{optimizedRoute.optimizedPath.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Distância Total</p>
                    <p className="text-2xl font-bold">{totalDistance.toFixed(1)} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Tempo Estimado</p>
                    <p className="text-2xl font-bold">{Math.round(estimatedTime / 60)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="mapa" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mapa">
              <MapPin className="w-4 h-4 mr-2" />
              Mapa
            </TabsTrigger>
            <TabsTrigger value="lista">
              <span>Clínicas</span>
            </TabsTrigger>
            <TabsTrigger value="planejador">
              <Clock className="w-4 h-4 mr-2" />
              Planejador
            </TabsTrigger>
          </TabsList>

          {/* Mapa */}
          <TabsContent value="mapa" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {city ? (
                  <MapWithClinics
                    clinics={clinicsToOptimize}
                    optimizedRoute={optimizedRoute}
                    selectedClinics={selectedClinics}
                    onSelectClinic={(clinic) => {
                      setSelectedClinics(prev =>
                        prev.find(c => c.id === clinic.id)
                          ? prev.filter(c => c.id !== clinic.id)
                          : [...prev, clinic]
                      );
                    }}
                  />
                ) : (
                  <div className="h-96 flex items-center justify-center text-slate-500">
                    <p>Digite uma cidade para visualizar as clínicas próximas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lista de Clínicas */}
          <TabsContent value="lista" className="mt-4">
            <ClinicsList
              clinics={clinicsToOptimize}
              selectedClinics={selectedClinics}
              onSelectClinic={(clinic) => {
                setSelectedClinics(prev =>
                  prev.find(c => c.id === clinic.id)
                    ? prev.filter(c => c.id !== clinic.id)
                    : [...prev, clinic]
                );
              }}
              optimizedRoute={optimizedRoute}
            />
          </TabsContent>

          {/* Planejador */}
          <TabsContent value="planejador" className="mt-4">
            {optimizedRoute ? (
              <RoutePlanner
                route={optimizedRoute}
                onSave={() => saveVisitsMutation.mutate()}
                isSaving={saveVisitsMutation.isPending}
              />
            ) : (
              <Card>
                <CardContent className="pt-12 text-center text-slate-500">
                  <p>Otimize uma rota para visualizar o planejador</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}