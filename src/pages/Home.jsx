import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  UserPlus, 
  Users, 
  History, 
  Sparkles,
  TrendingUp,
  ThermometerSun
} from 'lucide-react';
import ClientCard from '@/components/ClientCard';

export default function Home() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 5),
  });

  const hotClients = clients.filter(c => c.status === 'quente').length;
  const totalClients = clients.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-6 pt-12 pb-20 rounded-b-[2.5rem]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Assistente de Vendas</h1>
            <p className="text-slate-400 text-sm">Equipamentos Veterinários</p>
          </div>
        </div>
        
        <p className="text-slate-300 text-lg font-light">
          Qual cliente você vai atender agora?
        </p>
      </div>

      {/* Quick Stats */}
      <div className="px-6 -mt-10">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{totalClients}</p>
                <p className="text-xs text-slate-500">Total Clientes</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <ThermometerSun className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{hotClients}</p>
                <p className="text-xs text-slate-500">Clientes Quentes</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Actions */}
      <div className="px-6 mt-8 space-y-4">
        <Link to={createPageUrl('NewClient')}>
          <Button className="w-full h-16 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl text-lg font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
            <UserPlus className="w-5 h-5 mr-3" />
            Novo Cliente
          </Button>
        </Link>

        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('Clients')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50">
              <Users className="w-4 h-4 mr-2" />
              Clientes Ativos
            </Button>
          </Link>
          
          <Link to={createPageUrl('Clients?filter=history')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Clients */}
      {clients.length > 0 && (
        <div className="px-6 mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Últimos Clientes</h2>
            <Link to={createPageUrl('Clients')} className="text-sm text-indigo-600 font-medium">
              Ver todos
            </Link>
          </div>
          
          <div className="space-y-3">
            {clients.slice(0, 3).map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </div>
      )}
      
      <div className="h-24" />
    </div>
  );
}