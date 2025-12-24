import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Loader2 } from 'lucide-react';

export default function PossibleSalesSearch() {
  const [search, setSearch] = useState('');

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['possible-sales'],
    queryFn: () => base44.entities.Lead.list('-created_date', 200),
  });

  const filteredLeads = useMemo(() => {
    return leads
      .filter(l => {
        if (!search) return true;
        const term = search.toLowerCase();
        return (
          l.full_name?.toLowerCase().includes(term) ||
          l.company?.toLowerCase().includes(term) ||
          l.city?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => (a.company || a.full_name).localeCompare(b.company || b.full_name, 'pt-BR'));
  }, [leads, search]);

  const stats = useMemo(() => {
    const hot = leads.filter(l => l.lead_score >= 70).length;
    const warm = leads.filter(l => l.lead_score >= 40 && l.lead_score < 70).length;
    const cold = leads.filter(l => l.lead_score < 40).length;
    return { hot, warm, cold, total: leads.length };
  }, [leads]);

  if (isLoading) {
    return (
      <Card className="p-4">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-orange-600" />
        <h3 className="font-bold text-slate-800">Possíveis Vendas</h3>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 bg-red-50 rounded text-center">
          <p className="text-lg font-bold text-red-600">{stats.hot}</p>
          <p className="text-xs text-slate-600">🔥 Quentes</p>
        </div>
        <div className="p-2 bg-yellow-50 rounded text-center">
          <p className="text-lg font-bold text-yellow-600">{stats.warm}</p>
          <p className="text-xs text-slate-600">🌡️ Mornos</p>
        </div>
        <div className="p-2 bg-blue-50 rounded text-center">
          <p className="text-lg font-bold text-blue-600">{stats.cold}</p>
          <p className="text-xs text-slate-600">❄️ Frios</p>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar possíveis vendas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredLeads.slice(0, 20).map((lead) => (
          <Link key={lead.id} to={createPageUrl(`LeadProfile?id=${lead.id}`)}>
            <div className="p-3 bg-white rounded-lg border hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{lead.company || lead.full_name}</p>
                  <p className="text-xs text-slate-600">{lead.city}</p>
                </div>
                <Badge className={
                  lead.lead_score >= 70 ? 'bg-red-100 text-red-700' :
                  lead.lead_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }>
                  {lead.lead_score}%
                </Badge>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link to={createPageUrl('PossibleSales')}>
        <p className="text-center text-sm text-orange-600 font-semibold mt-3 hover:underline">
          Ver todas ({stats.total})
        </p>
      </Link>
    </Card>
  );
}