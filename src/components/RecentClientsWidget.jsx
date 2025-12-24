import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, ChevronDown, ChevronUp } from 'lucide-react';

export default function RecentClientsWidget() {
  const [expanded, setExpanded] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['recent-clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 5),
    refetchInterval: 30000, // Atualiza a cada 30s
  });

  return (
    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Últimos Cadastrados</h3>
          <Badge className="bg-indigo-600 text-white">{clients.length}</Badge>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {clients.map((client) => (
            <Link key={client.id} to={createPageUrl(`ClientProfile?id=${client.id}`)}>
              <div className="p-2 bg-white rounded-lg border hover:shadow-md transition-all">
                <p className="font-semibold text-slate-800 text-sm">{client.first_name}</p>
                <p className="text-xs text-slate-600">{client.city} • {new Date(client.created_date).toLocaleDateString('pt-BR')}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}