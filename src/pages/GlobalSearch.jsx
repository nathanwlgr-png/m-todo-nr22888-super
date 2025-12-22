import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, User, Calendar, Wrench, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100)
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 100)
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list()
  });

  const filteredClients = clients.filter(c => 
    searchTerm && (
      c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm) ||
      c.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredVisits = visits.filter(v =>
    searchTerm && (
      v.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.location?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredEquipment = equipment.filter(e =>
    searchTerm && (
      e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const hasResults = filteredClients.length > 0 || filteredVisits.length > 0 || filteredEquipment.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800">Busca Global</h1>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Nome, email, telefone, cidade, clínica, visitas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-12 pr-10 text-base rounded-xl border-2"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
            >
              <span className="text-slate-400 text-xl">×</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {!searchTerm ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">Digite para buscar</p>
          </div>
        ) : !hasResults ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Nenhum resultado encontrado</p>
          </div>
        ) : (
          <>
            {filteredClients.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Clientes ({filteredClients.length})
                </h3>
                <div className="space-y-2">
                  {filteredClients.map(client => (
                    <Card
                      key={client.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{client.first_name}</p>
                          {client.clinic_name && (
                            <p className="text-sm text-slate-500">{client.clinic_name}</p>
                          )}
                          {client.city && (
                            <p className="text-xs text-slate-400">{client.city}</p>
                          )}
                        </div>
                        <Badge className={
                          client.status === 'quente' ? 'bg-red-500' :
                          client.status === 'morno' ? 'bg-yellow-500' : 'bg-blue-400'
                        }>
                          {client.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {filteredVisits.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Visitas ({filteredVisits.length})
                </h3>
                <div className="space-y-2">
                  {filteredVisits.map(visit => (
                    <Card
                      key={visit.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(createPageUrl('Calendar'))}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{visit.client_name}</p>
                          <p className="text-sm text-slate-500">
                            {format(new Date(visit.scheduled_date), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                          {visit.location && (
                            <p className="text-xs text-slate-400">{visit.location}</p>
                          )}
                        </div>
                        <Badge variant="outline">{visit.status}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {filteredEquipment.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Equipamentos ({filteredEquipment.length})
                </h3>
                <div className="space-y-2">
                  {filteredEquipment.map(equip => (
                    <Card
                      key={equip.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(createPageUrl('Equipment'))}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{equip.name}</p>
                          <p className="text-sm text-slate-500">{equip.category}</p>
                        </div>
                        <p className="font-bold text-indigo-600">
                          R$ {equip.price?.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}