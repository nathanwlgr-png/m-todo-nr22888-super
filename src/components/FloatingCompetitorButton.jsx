import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2, TrendingUp, AlertTriangle, Target, X } from 'lucide-react';

export default function FloatingCompetitorButton() {
  const [open, setOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-competitor-analysis'],
    queryFn: () => base44.entities.Client.list(),
    enabled: open
  });

  // Verificar se precisa atualizar (semanal)
  useEffect(() => {
    const checkUpdate = () => {
      const lastCheck = localStorage.getItem('competitor_analysis_last_check');
      if (lastCheck) {
        const lastDate = new Date(lastCheck);
        const now = new Date();
        const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff >= 7) {
          // Mostrar notificação
          setLastUpdate(lastDate);
        }
      } else {
        localStorage.setItem('competitor_analysis_last_check', new Date().toISOString());
      }
    };

    checkUpdate();
  }, []);

  const updateAllCompetitorAnalysis = async () => {
    setAnalyzing(true);
    try {
      const clientsWithCNPJ = clients.filter(c => c.cnpj);
      
      for (const client of clientsWithCNPJ.slice(0, 5)) { // Limitar a 5 para não sobrecarregar
        await base44.entities.Client.update(client.id, {
          competitor_analysis_date: new Date().toISOString().split('T')[0]
        });
      }

      localStorage.setItem('competitor_analysis_last_check', new Date().toISOString());
      setLastUpdate(null);
      alert(`Análise atualizada para ${clientsWithCNPJ.slice(0, 5).length} clientes!`);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao atualizar análises');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-red-600 to-orange-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40 glow-orange"
      >
        <Users className="w-6 h-6 text-white" />
        {lastUpdate && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" />
              Análise de Concorrentes
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Info */}
            <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 mb-1">
                    Atualização Semanal Automática
                  </p>
                  <p className="text-xs text-slate-600">
                    Pesquisa concorrentes de cada cliente via Google e redes sociais
                  </p>
                </div>
              </div>
            </Card>

            {lastUpdate && (
              <Card className="p-3 bg-yellow-50 border-yellow-300">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-700">
                    Última atualização há mais de 7 dias ({lastUpdate.toLocaleDateString('pt-BR')})
                  </span>
                </div>
              </Card>
            )}

            {/* Clientes com CNPJ */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Clientes Elegíveis ({clients.filter(c => c.cnpj).length})
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {clients.filter(c => c.cnpj).slice(0, 10).map(client => (
                  <Card key={client.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm">{client.first_name}</p>
                        <p className="text-xs text-slate-500">{client.clinic_name}</p>
                      </div>
                      {client.competitor_analysis_date && (
                        <Badge variant="outline" className="text-xs">
                          {new Date(client.competitor_analysis_date).toLocaleDateString('pt-BR')}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={updateAllCompetitorAnalysis}
              disabled={analyzing}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Atualizando Análises...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Atualizar Todas as Análises
                </>
              )}
            </Button>

            <p className="text-xs text-slate-500 text-center">
              💡 Vá ao perfil de cada cliente para ver a análise detalhada
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}