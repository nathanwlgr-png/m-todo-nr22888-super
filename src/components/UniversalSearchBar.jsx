import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function UniversalSearchBar() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
    staleTime: 5 * 60 * 1000
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 200),
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const searchLower = search.toLowerCase();
    
    const clientResults = clients
      .filter(c => 
        c.first_name?.toLowerCase().includes(searchLower) ||
        c.clinic_name?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.phone?.includes(search)
      )
      .slice(0, 8)
      .map(c => ({
        id: c.id,
        type: 'client',
        nome: c.first_name,
        subtitle: c.clinic_name || c.city || c.email,
        score: c.purchase_score || 0,
        status: c.status
      }));

    const leadResults = leads
      .filter(l => 
        l.full_name?.toLowerCase().includes(searchLower) ||
        l.company?.toLowerCase().includes(searchLower) ||
        l.email?.toLowerCase().includes(searchLower)
      )
      .slice(0, 5)
      .map(l => ({
        id: l.id,
        type: 'lead',
        nome: l.full_name,
        subtitle: l.company || l.city || l.email,
        score: l.lead_score || 0,
        status: l.status
      }));

    setResults([...clientResults, ...leadResults]);
    setShowResults(true);
  }, [search, clients, leads]);

  const handleAIAnalysis = async (item) => {
    setAnalyzing(true);
    setShowResults(false);
    try {
      const entity = item.type === 'client' 
        ? await base44.entities.Client.filter({ id: item.id })
        : await base44.entities.Lead.filter({ id: item.id });
      
      const data = entity[0];
      
      const prompt = `Análise rápida de ${item.type === 'client' ? 'cliente' : 'lead'}:
Nome: ${item.nome}
Score: ${item.score}
Status: ${item.status}

Crie uma análise EXPRESS em 2-3 frases com: momento atual, próxima ação recomendada e probabilidade de venda.`;

      const analysis = await base44.integrations.Core.InvokeLLM({ prompt });
      
      toast.success(
        <div className="space-y-1">
          <p className="font-bold">{item.nome}</p>
          <p className="text-xs">{analysis}</p>
        </div>,
        { duration: 8000 }
      );

      navigate(createPageUrl(item.type === 'client' ? `ClientProfile?id=${item.id}` : `LeadProfile?id=${item.id}`));
    } catch (error) {
      toast.error('Erro na análise');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Buscar cliente ou lead (nome, empresa, email)..."
          className="h-12 pl-10 pr-10 text-base border-2 border-purple-200 focus:border-purple-400"
        />
        {search && (
          <button
            onClick={() => {
              setSearch('');
              setShowResults(false);
            }}
            className="absolute right-3 top-3"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute top-14 left-0 right-0 z-50 max-h-[400px] overflow-y-auto shadow-xl border-2 border-purple-200">
          <div className="p-2 space-y-1">
            {results.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                onClick={() => handleAIAnalysis(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{item.nome}</p>
                      <Badge className={item.type === 'client' ? 'bg-green-600' : 'bg-purple-600'}>
                        {item.type === 'client' ? 'Cliente' : 'Lead'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{item.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">{item.score}</p>
                    <p className="text-xs text-slate-500">{item.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showResults && results.length === 0 && search.length >= 2 && (
        <Card className="absolute top-14 left-0 right-0 z-50 p-6 text-center shadow-xl border-2 border-purple-200">
          <p className="text-slate-500">Nenhum resultado para "{search}"</p>
        </Card>
      )}

      {analyzing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <span className="text-slate-700">Analisando com IA...</span>
          </Card>
        </div>
      )}
    </div>
  );
}