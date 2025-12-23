import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, WifiOff, ThermometerSun, MapPin } from 'lucide-react';

export default function OfflineClientViewer() {
  const [offlineData, setOfflineData] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    loadOfflineData();
  }, []);

  const loadOfflineData = () => {
    try {
      const stored = localStorage.getItem('venda_nr_offline_data');
      if (stored) {
        const data = JSON.parse(stored);
        setOfflineData(data);
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const filteredClients = offlineData?.clients?.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.clinic?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (!offlineData) {
    return (
      <div className="p-6 text-center">
        <WifiOff className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 mb-4">Nenhum dado offline disponível</p>
        <p className="text-sm text-slate-500">
          Conecte à internet e baixe os dados primeiro
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Offline */}
      <div className="bg-yellow-100 border border-yellow-300 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-yellow-700" />
          <p className="text-sm font-semibold text-yellow-900">Modo Offline Ativo</p>
        </div>
        <p className="text-xs text-yellow-800 mt-1">
          Última sincronização: {new Date(offlineData.last_sync).toLocaleString('pt-BR')}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar cliente, clínica ou cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-white rounded-lg shadow-sm text-center">
          <p className="text-2xl font-bold text-slate-800">{offlineData.clients?.length}</p>
          <p className="text-xs text-slate-600">Clientes</p>
        </div>
        <div className="p-3 bg-white rounded-lg shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">{offlineData.visits_upcoming?.length}</p>
          <p className="text-xs text-slate-600">Visitas</p>
        </div>
        <div className="p-3 bg-white rounded-lg shadow-sm text-center">
          <p className="text-2xl font-bold text-orange-600">{offlineData.tasks_pending?.length}</p>
          <p className="text-xs text-slate-600">Tarefas</p>
        </div>
      </div>

      {/* Client List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredClients.map(client => (
          <Card
            key={client.id}
            onClick={() => setSelectedClient(client)}
            className="p-4 cursor-pointer hover:bg-slate-50"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{client.name}</p>
                <p className="text-sm text-slate-600">{client.clinic}</p>
                <div className="flex items-center gap-2 mt-2">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-500">{client.city}</span>
                  {client.phone && (
                    <a 
                      href={`https://wa.me/${client.phone}`} 
                      target="_blank"
                      className="text-xs text-green-600 ml-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={
                  client.status === 'quente' ? 'bg-red-500' :
                  client.status === 'morno' ? 'bg-yellow-500' :
                  'bg-blue-400'
                }>
                  {client.status}
                </Badge>
                <span className="text-xs text-slate-500">{client.score}%</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Client Details Modal */}
      {selectedClient && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedClient(null)}
        >
          <Card 
            className="w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 space-y-3">
              <h3 className="text-lg font-bold text-slate-900">{selectedClient.name}</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Clínica:</strong> {selectedClient.clinic}</p>
                <p><strong>Cidade:</strong> {selectedClient.city}</p>
                <p><strong>Perfil:</strong> {selectedClient.profile || 'N/A'}</p>
                <p><strong>Tom:</strong> {selectedClient.tone || 'N/A'}</p>
                <p><strong>Score:</strong> {selectedClient.score}%</p>
                {selectedClient.needs?.length > 0 && (
                  <div>
                    <strong>Necessidades:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedClient.needs.map((need, i) => (
                        <Badge key={i} variant="outline">{need}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedClient.notes && (
                  <div>
                    <strong>Notas:</strong>
                    <p className="text-slate-600 mt-1">{selectedClient.notes}</p>
                  </div>
                )}
              </div>
              <Button onClick={() => setSelectedClient(null)} className="w-full">
                Fechar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}