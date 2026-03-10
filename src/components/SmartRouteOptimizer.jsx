import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Route, TrendingUp, MapPin, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

const SmartRouteOptimizer = () => {
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['high-priority-clients'],
    queryFn: async () => {
      const allClients = await base44.entities.Client.list();
      return allClients
        .filter(c => c.status === 'quente' || c.purchase_score > 70)
        .slice(0, 10);
    }
  });

  const optimizeRoute = async () => {
    setOptimizing(true);
    try {
      const response = await base44.functions.invoke('generateOptimizedRoute', {
        clients: clients.map(c => ({
          id: c.id,
          name: c.full_name || c.first_name,
          city: c.city,
          address: c.address,
          priority_score: c.purchase_score || c.health_score || 50,
          conversion_probability: c.ai_sales_intelligence?.conversion_probability || 50
        }))
      });

      if (response.data?.route) {
        setOptimizedRoute(response.data.route);
        toast.success('Rota otimizada com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao otimizar rota: ' + error.message);
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="w-5 h-5 text-blue-600" />
          Otimizador Inteligente de Rotas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Prioriza visitas baseado em probabilidade de fechamento, não apenas distância
        </p>

        <Button onClick={optimizeRoute} disabled={optimizing || clients.length === 0} className="w-full">
          {optimizing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Otimizando...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Otimizar Rota com IA
            </>
          )}
        </Button>

        {optimizedRoute && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-sm">Rota Sugerida ({optimizedRoute.length} visitas)</h4>
            {optimizedRoute.map((stop, index) => (
              <div key={stop.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{stop.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {stop.city}
                  </p>
                </div>
                <Badge variant={stop.priority_score > 70 ? 'default' : 'secondary'}>
                  {stop.priority_score}%
                </Badge>
              </div>
            ))}
          </div>
        )}

        {clients.length === 0 && (
          <p className="text-xs text-amber-600">Nenhum cliente prioritário encontrado</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartRouteOptimizer;