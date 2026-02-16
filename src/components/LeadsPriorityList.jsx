import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { TrendingUp, Phone, Mail, MessageCircle, ArrowRight } from 'lucide-react';

export default function LeadsPriorityList() {
  const { data: leads = [] } = useQuery({
    queryKey: ['leads-scored'],
    queryFn: () => base44.entities.Lead.list('-predictive_score'),
  });

  const prioritizedLeads = useMemo(() => {
    return leads
      .filter(l => l.predictive_score > 0)
      .sort((a, b) => (b.predictive_score || 0) - (a.predictive_score || 0))
      .slice(0, 10);
  }, [leads]);

  const getPriorityBadge = (priority) => {
    const config = {
      critical: { bg: 'bg-red-600', label: '🔥 CRÍTICO' },
      high: { bg: 'bg-orange-600', label: '⚡ ALTA' },
      medium: { bg: 'bg-yellow-600', label: '📍 MÉDIA' },
      low: { bg: 'bg-slate-400', label: '📉 BAIXA' }
    };
    const c = config[priority] || config.low;
    return <Badge className={`${c.bg} text-white`}>{c.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Top 10 Leads Prioritários
        </CardTitle>
      </CardHeader>
      <CardContent>
        {prioritizedLeads.length === 0 ? (
          <p className="text-center text-slate-600 py-4">
            Nenhum lead com score calculado
          </p>
        ) : (
          <div className="space-y-3">
            {prioritizedLeads.map((lead, idx) => (
              <Card key={lead.id} className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-purple-600">#{idx + 1}</span>
                        <h4 className="font-semibold">{lead.full_name}</h4>
                      </div>
                      <p className="text-sm text-slate-600">{lead.company || 'Empresa não informada'}</p>
                      {lead.interest && (
                        <p className="text-xs text-slate-500 mt-1">
                          Interesse: {lead.interest}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">
                        {lead.predictive_score}
                      </div>
                      <p className="text-xs text-slate-500">score</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {getPriorityBadge(lead.priority_level)}
                    {lead.conversion_probability && (
                      <Badge variant="outline">
                        {lead.conversion_probability}% conversão
                      </Badge>
                    )}
                  </div>

                  {lead.buying_signals && lead.buying_signals.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-green-700 mb-1">
                        Sinais de Compra:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {lead.buying_signals.slice(0, 2).map((signal, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-green-50 text-green-700">
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {lead.next_best_action && (
                    <div className="bg-blue-50 p-2 rounded text-xs mb-3">
                      <ArrowRight className="w-3 h-3 inline mr-1 text-blue-600" />
                      <span className="text-blue-900">{lead.next_best_action}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Link to={createPageUrl('LeadProfile') + `?id=${lead.id}`}>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Ver Perfil
                      </Button>
                    </Link>
                    {lead.phone && (
                      <Button size="sm" variant="outline">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    )}
                    {lead.email && (
                      <Button size="sm" variant="outline">
                        <Mail className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}