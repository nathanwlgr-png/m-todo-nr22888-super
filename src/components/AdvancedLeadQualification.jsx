import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Target, 
  TrendingUp, 
  Award,
  Sparkles,
  Filter,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedLeadQualification() {
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedLead, setExpandedLead] = useState(null);
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500)
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
    }
  });

  // Calcular score de qualificação
  const calculateQualificationScore = (lead) => {
    let score = 0;
    
    // Critérios de pontuação
    if (lead.company_size === '51-200' || lead.company_size === '200+') score += 25;
    else if (lead.company_size === '11-50') score += 15;
    else score += 5;

    if (lead.budget_range === '200k+') score += 30;
    else if (lead.budget_range === '100k_200k') score += 20;
    else if (lead.budget_range === '50k_100k') score += 10;
    else score += 5;

    if (lead.urgency === 'imediata') score += 25;
    else if (lead.urgency === '1_3_meses') score += 15;
    else if (lead.urgency === '3_6_meses') score += 8;
    else score += 3;

    // Fonte do lead
    if (lead.source === 'indicacao') score += 15;
    else if (lead.source === 'evento') score += 10;
    else score += 5;

    // Completude dos dados
    const completeness = [
      lead.email, 
      lead.phone, 
      lead.company, 
      lead.interest
    ].filter(Boolean).length;
    score += completeness * 2;

    return Math.min(score, 100);
  };

  // Determinar classificação
  const getQualification = (score) => {
    if (score >= 80) return { label: 'Hot Lead', color: 'bg-red-100 text-red-700', priority: 'Alta' };
    if (score >= 60) return { label: 'Warm Lead', color: 'bg-orange-100 text-orange-700', priority: 'Média' };
    if (score >= 40) return { label: 'Cold Lead', color: 'bg-blue-100 text-blue-700', priority: 'Baixa' };
    return { label: 'Unqualified', color: 'bg-slate-100 text-slate-700', priority: 'Muito Baixa' };
  };

  // Leads qualificados com score
  const qualifiedLeads = useMemo(() => {
    return leads
      .map(lead => ({
        ...lead,
        score: lead.lead_score || calculateQualificationScore(lead),
        qualification: getQualification(lead.lead_score || calculateQualificationScore(lead))
      }))
      .filter(lead => 
        lead.score >= minScore &&
        (searchTerm === '' || 
         lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         lead.company?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => b.score - a.score);
  }, [leads, minScore, searchTerm]);

  // Análise automática com IA
  const analyzeLeadWithAI = async (lead) => {
    setAnalyzing(true);
    try {
      const prompt = `Analise este lead de vendas e forneça uma avaliação detalhada:

DADOS DO LEAD:
- Nome: ${lead.full_name}
- Empresa: ${lead.company || 'Não informada'}
- Cargo: ${lead.interest || 'Não informado'}
- Tamanho: ${lead.company_size || 'Não informado'}
- Orçamento: ${lead.budget_range || 'Não informado'}
- Urgência: ${lead.urgency || 'Não informada'}
- Fonte: ${lead.source}
- Score Atual: ${lead.score}/100

Forneça em JSON:
{
  "qualification": "Hot/Warm/Cold/Unqualified",
  "recommended_score": 0-100,
  "strengths": ["força 1", "força 2"],
  "concerns": ["preocupação 1", "preocupação 2"],
  "next_steps": ["ação 1", "ação 2"],
  "estimated_close_probability": 0-100
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            qualification: { type: "string" },
            recommended_score: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            concerns: { type: "array", items: { type: "string" } },
            next_steps: { type: "array", items: { type: "string" } },
            estimated_close_probability: { type: "number" }
          }
        }
      });

      await updateLeadMutation.mutateAsync({
        id: lead.id,
        data: {
          lead_score: response.recommended_score,
          ai_score_factors: JSON.stringify({
            strengths: response.strengths,
            concerns: response.concerns,
            next_steps: response.next_steps,
            close_probability: response.estimated_close_probability
          }),
          ai_scored_at: new Date().toISOString()
        }
      });

      toast.success('Lead analisado com IA');
    } catch (error) {
      toast.error('Erro ao analisar lead');
    } finally {
      setAnalyzing(false);
    }
  };

  // Qualificar todos automaticamente
  const qualifyAllLeads = async () => {
    toast.info('Qualificando leads...');
    for (const lead of leads.filter(l => !l.lead_score)) {
      const score = calculateQualificationScore(lead);
      await updateLeadMutation.mutateAsync({
        id: lead.id,
        data: { lead_score: score }
      });
    }
    toast.success('Todos os leads qualificados!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const stats = {
    hot: qualifiedLeads.filter(l => l.score >= 80).length,
    warm: qualifiedLeads.filter(l => l.score >= 60 && l.score < 80).length,
    cold: qualifiedLeads.filter(l => l.score >= 40 && l.score < 60).length,
    unqualified: qualifiedLeads.filter(l => l.score < 40).length
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Qualificação Avançada de Leads</h2>
              <p className="text-purple-100">Sistema de pontuação inteligente com IA</p>
            </div>
          </div>
          <Button
            onClick={qualifyAllLeads}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Qualificar Todos
          </Button>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-red-600" />
            <span className="text-xs text-slate-600 font-medium">Hot Leads</span>
          </div>
          <p className="text-3xl font-bold text-red-700">{stats.hot}</p>
          <p className="text-xs text-slate-600 mt-1">Score ≥ 80</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="text-xs text-slate-600 font-medium">Warm Leads</span>
          </div>
          <p className="text-3xl font-bold text-orange-700">{stats.warm}</p>
          <p className="text-xs text-slate-600 mt-1">Score 60-79</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-slate-600 font-medium">Cold Leads</span>
          </div>
          <p className="text-3xl font-bold text-blue-700">{stats.cold}</p>
          <p className="text-xs text-slate-600 mt-1">Score 40-59</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-slate-600" />
            <span className="text-xs text-slate-600 font-medium">Unqualified</span>
          </div>
          <p className="text-3xl font-bold text-slate-700">{stats.unqualified}</p>
          <p className="text-xs text-slate-600 mt-1">Score &lt; 40</p>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-slate-600 mb-2 block">Buscar Lead</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Nome ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm text-slate-600 mb-2 block">Score Mínimo: {minScore}</Label>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Lista de Leads */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {qualifiedLeads.map(lead => (
            <Card key={lead.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{lead.full_name}</h3>
                  <p className="text-sm text-slate-600">{lead.company || 'Empresa não informada'}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span className="text-2xl font-bold text-indigo-700">{lead.score}</span>
                  </div>
                  <Badge className={lead.qualification.color}>
                    {lead.qualification.label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                <div>📍 {lead.city || 'Cidade não informada'}</div>
                <div>📊 Tamanho: {lead.company_size || 'N/A'}</div>
                <div>💰 Orçamento: {lead.budget_range || 'N/A'}</div>
                <div>⏱️ Urgência: {lead.urgency || 'N/A'}</div>
              </div>

              {/* Barra de Score */}
              <div className="mb-3">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      lead.score >= 80 ? 'bg-red-500' :
                      lead.score >= 60 ? 'bg-orange-500' :
                      lead.score >= 40 ? 'bg-blue-500' :
                      'bg-slate-400'
                    }`}
                    style={{ width: `${lead.score}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => analyzeLeadWithAI(lead)}
                  disabled={analyzing}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {analyzing ? 'Analisando...' : 'Análise IA'}
                </Button>
                <Button size="sm" variant="outline">
                  Ver Detalhes
                </Button>
              </div>

              {lead.ai_score_factors && (
                <div className="mt-3 p-3 bg-indigo-50 rounded-lg text-xs">
                  <p className="font-semibold text-indigo-800 mb-1">Análise IA:</p>
                  <div className="text-slate-700">
                    {JSON.parse(lead.ai_score_factors).next_steps?.[0] || 'Análise disponível'}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}