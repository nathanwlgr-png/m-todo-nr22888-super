import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Flame, Target, ArrowRight } from 'lucide-react';

export default function LeadPriorityRanking({ leads = [] }) {
  const navigate = useNavigate();

  const prioritizedLeads = useMemo(() => {
    return leads
      .map(lead => {
        let score = lead.lead_score || 0;
        let priority = 'baixa';
        let reasons = [];

        // Orçamento alto
        if (lead.budget_range === '100k_200k' || lead.budget_range === '200k+') {
          score += 20;
          reasons.push('Orçamento alto');
        }

        // Urgência
        if (lead.urgency === 'imediata') {
          score += 25;
          reasons.push('Urgência imediata');
          priority = 'alta';
        } else if (lead.urgency === '1_3_meses') {
          score += 15;
          reasons.push('Urgência média');
        }

        // Tamanho da empresa
        if (lead.company_size === '51-200' || lead.company_size === '200+') {
          score += 15;
          reasons.push('Empresa grande');
        }

        // Status qualificado
        if (lead.status === 'qualificado') {
          score += 20;
          reasons.push('Já qualificado');
        }

        // Fonte premium
        if (['indicacao', 'evento', 'parceiro'].includes(lead.source)) {
          score += 10;
          reasons.push('Fonte premium');
        }

        // Último contato recente
        if (lead.last_contact_date) {
          const daysSince = Math.floor((new Date() - new Date(lead.last_contact_date)) / (1000 * 60 * 60 * 24));
          if (daysSince <= 3) {
            score += 10;
            reasons.push('Contato recente');
          }
        }

        // Definir prioridade
        if (score >= 70) priority = 'alta';
        else if (score >= 40) priority = 'media';

        return {
          ...lead,
          computed_score: Math.min(score, 100),
          priority,
          reasons
        };
      })
      .sort((a, b) => b.computed_score - a.computed_score)
      .slice(0, 10);
  }, [leads]);

  const priorityConfig = {
    alta: { color: 'bg-red-500', icon: Flame, text: 'Alta' },
    media: { color: 'bg-yellow-500', icon: Target, text: 'Média' },
    baixa: { color: 'bg-blue-500', icon: TrendingUp, text: 'Baixa' }
  };

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-600" />
          Top 10 Leads Prioritários
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          {prioritizedLeads.map((lead, index) => {
            const config = priorityConfig[lead.priority];
            const Icon = config.icon;

            return (
              <div
                key={lead.id}
                className={`p-3 rounded-lg border-2 ${
                  index === 0 ? 'border-red-300 bg-red-50' :
                  index === 1 ? 'border-orange-300 bg-orange-50' :
                  index === 2 ? 'border-yellow-300 bg-yellow-50' :
                  'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {index + 1}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-800">{lead.full_name}</p>
                      <Badge className={`${config.color} text-white text-xs`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {config.text}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                      <span>{lead.company || 'Sem empresa'}</span>
                      <span>•</span>
                      <span className="font-semibold text-purple-600">
                        Score: {lead.computed_score}
                      </span>
                    </div>

                    {lead.reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {lead.reasons.slice(0, 3).map((reason, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(createPageUrl(`LeadProfile?id=${lead.id}`))}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {prioritizedLeads.length === 0 && (
          <p className="text-center text-slate-500 py-8">
            Nenhum lead para priorizar
          </p>
        )}
      </CardContent>
    </Card>
  );
}