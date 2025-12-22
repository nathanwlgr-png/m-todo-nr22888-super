import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Search, 
  MapPin,
  Building2,
  User,
  Phone,
  Mail,
  Loader2
} from 'lucide-react';

export default function RegionalSearch() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date')
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list()
  });

  const results = clients.filter(c => {
    const term = search.toLowerCase();
    return (
      c.first_name?.toLowerCase().includes(term) ||
      c.full_name?.toLowerCase().includes(term) ||
      c.clinic_name?.toLowerCase().includes(term) ||
      c.city?.toLowerCase().includes(term) ||
      c.razao_social?.toLowerCase().includes(term) ||
      c.cnpj?.includes(term) ||
      c.phone?.includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 to-indigo-900 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Pesquisa Regional</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CNPJ, cidade, clínica..."
            className="pl-12 h-14 text-base rounded-xl border-2 bg-white"
          />
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : results.length === 0 ? (
          <Card className="p-8 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              {search ? 'Nenhum resultado encontrado' : 'Digite para pesquisar'}
            </p>
          </Card>
        ) : (
          results.map(client => {
            const hasPurchase = sales.some(s => 
              s.client_id === client.id && (s.status === 'fechada' || s.status === 'entregue')
            );
            
            return (
              <Card 
                key={client.id}
                onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
                className={`p-4 cursor-pointer hover:shadow-lg transition-all ${hasPurchase ? 'bg-green-50 border-green-200' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{client.first_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">ID: {client.id}</p>
                  </div>
                  <Badge className={
                    client.status === 'quente' ? 'bg-red-500' :
                    client.status === 'morno' ? 'bg-yellow-500' : 'bg-blue-400'
                  }>
                    {client.status}
                  </Badge>
                </div>

                {client.razao_social && (
                  <div className="flex items-start gap-2 mb-1">
                    <Building2 className="w-3 h-3 text-slate-400 mt-0.5" />
                    <p className="text-sm text-slate-700">{client.razao_social}</p>
                  </div>
                )}

                {client.clinic_name && (
                  <div className="flex items-start gap-2 mb-1">
                    <Building2 className="w-3 h-3 text-slate-400 mt-0.5" />
                    <p className="text-sm text-slate-600">{client.clinic_name}</p>
                  </div>
                )}

                {client.cnpj && (
                  <div className="flex items-start gap-2 mb-1">
                    <Building2 className="w-3 h-3 text-slate-400 mt-0.5" />
                    <p className="text-xs text-slate-500">CNPJ: {client.cnpj}</p>
                  </div>
                )}

                {client.city && (
                  <div className="flex items-start gap-2 mb-1">
                    <MapPin className="w-3 h-3 text-slate-400 mt-0.5" />
                    <p className="text-sm text-slate-600">{client.city}</p>
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-start gap-2 mb-1">
                    <Phone className="w-3 h-3 text-green-500 mt-0.5" />
                    <p className="text-xs text-slate-600">{client.phone}</p>
                  </div>
                )}

                {hasPurchase && (
                  <Badge className="bg-green-600 text-white text-xs mt-2">
                    ✓ Cliente Ativo
                  </Badge>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}