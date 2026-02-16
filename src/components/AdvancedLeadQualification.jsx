import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, Zap, Mail, Globe, FileText, MessageSquare,
  ChevronDown, ChevronUp, TrendingUp, Search, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function AdvancedLeadQualification() {
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [expandedLead, setExpandedLead] = useState(null);
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-ai_score', 100)
  });

  const analyzeLeadMutation = useMutation({
    mutationFn: async (leadId) => {
      const response = await base44.functions.invoke('enhancedLeadScoring', { lead_id: leadId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      toast.success('Lead analisado!');
    }
  });

  const syncEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('syncEmailEngagement', {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['leads']);
      toast.success(data.message || 'Emails sincronizados!');
    }
  });

  const syncWebMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('syncWebAnalytics', {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['leads']);
      toast.success(data.message || 'Analytics sincronizado!');
    }
  });

  const filteredLeads = leads.filter(lead => 
    (lead.ai_score || 0) >= minScore &&
    (searchTerm === '' || 
     lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     lead.company?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getImpactColor = (impact) => {
    if (impact === 'positive') return 'text-green-600 bg-green-50';
    if (impact === 'negative') return 'text-red-600 bg-red-50';
    return 'text-slate-600 bg-slate-50';
  };

  const getCategoryBadge = (score) => {
    if (score >= 80) return 'bg-red-500 text-white';
    if (score >= 60) return 'bg-orange-500 text-white';
    if (score >= 40) return 'bg-blue-500 text-white';
    return 'bg-slate-500 text-white';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            Qualificação Avançada com IA
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => syncEmailMutation.mutate()}
              disabled={syncEmailMutation.isPending}
            >
              <Mail className="w-3 h-3 mr-1" />
              Email
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => syncWebMutation.mutate()}
              disabled={syncWebMutation.isPending}
            >
              <Globe className="w-3 h-3 mr-1" />
              Web
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Input
            type="number"
            placeholder="Score min"
            value={minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value) || 0)}
            className="w-24"
          />
        </div>

        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="bg-slate-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{lead.full_name}</h4>
                      <p className="text-xs text-slate-600">{lead.company}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">{lead.ai_score || 0}</div>
                      <Badge className={getCategoryBadge(lead.ai_score || 0)}>
                        {lead.ai_score >= 80 ? 'Hot' : lead.ai_score >= 60 ? 'Warm' : 'Cold'}
                      </Badge>
                    </div>
                  </div>

                  {lead.ai_score_breakdown && (
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-24 text-slate-600">Engajamento</span>
                        <Progress value={lead.ai_score_breakdown.engagement_score} className="h-1.5" />
                        <span className="w-8 text-right font-semibold">{lead.ai_score_breakdown.engagement_score}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-24 text-slate-600">Fit ICP</span>
                        <Progress value={lead.ai_score_breakdown.fit_score} className="h-1.5" />
                        <span className="w-8 text-right font-semibold">{lead.ai_score_breakdown.fit_score}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-24 text-slate-600">Intenção</span>
                        <Progress value={lead.ai_score_breakdown.intent_score} className="h-1.5" />
                        <span className="w-8 text-right font-semibold">{lead.ai_score_breakdown.intent_score}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1 mb-3 flex-wrap">
                    {lead.email_engagement?.open_rate > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Mail className="w-3 h-3 mr-1" />
                        {lead.email_engagement.open_rate}%
                      </Badge>
                    )}
                    {lead.web_analytics?.page_views > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Globe className="w-3 h-3 mr-1" />
                        {lead.web_analytics.page_views}
                      </Badge>
                    )}
                    {lead.crm_behavior?.documents_viewed > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        {lead.crm_behavior.documents_viewed}
                      </Badge>
                    )}
                  </div>

                  {lead.score_reasons && lead.score_reasons.length > 0 && (
                    <div className="mb-3">
                      <button
                        onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                        className="flex items-center gap-2 text-xs font-semibold text-indigo-600 w-full hover:text-indigo-700"
                      >
                        <Brain className="w-3 h-3" />
                        Razões do Score ({lead.score_reasons.length})
                        {expandedLead === lead.id ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                      </button>
                      
                      {expandedLead === lead.id && (
                        <div className="mt-2 space-y-1">
                          {lead.score_reasons.map((reason, idx) => (
                            <div key={idx} className={`flex items-start gap-2 p-2 rounded text-xs ${getImpactColor(reason.impact)}`}>
                              <div className="font-bold">
                                {reason.impact === 'positive' ? '+' : reason.impact === 'negative' ? '-' : '•'}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold">{reason.factor}</p>
                                <p className="text-slate-600">{reason.description}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">{reason.weight}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => analyzeLeadMutation.mutate(lead.id)}
                      disabled={analyzeLeadMutation.isPending}
                      className="bg-indigo-600"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Analisar
                    </Button>
                    <Link to={createPageUrl(`LeadProfile?id=${lead.id}`)}>
                      <Button size="sm" variant="outline">Ver Perfil</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}