import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown, Clock, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const ProactiveSalesAlerts = () => {
  const { data: alerts = [] } = useQuery({
    queryKey: ['proactive-alerts'],
    queryFn: async () => {
      const clients = await base44.entities.Client.list();
      const leads = await base44.entities.Lead.list();
      
      const alertsList = [];

      // Clientes em risco
      clients
        .filter(c => c.ai_sales_intelligence?.churn_risk > 60)
        .slice(0, 3)
        .forEach(c => {
          alertsList.push({
            id: c.id,
            type: 'client',
            severity: 'high',
            title: `Cliente em risco: ${c.full_name || c.first_name}`,
            description: `Risco de churn: ${c.ai_sales_intelligence.churn_risk}%`,
            action: c.ai_next_best_action || 'Entrar em contato urgente'
          });
        });

      // Leads quentes sem follow-up
      const today = new Date();
      const threeDaysAgo = new Date(today.setDate(today.getDate() - 3));
      
      leads
        .filter(l => l.predictive_score > 70 && (!l.last_contact_date || new Date(l.last_contact_date) < threeDaysAgo))
        .slice(0, 3)
        .forEach(l => {
          alertsList.push({
            id: l.id,
            type: 'lead',
            severity: 'medium',
            title: `Lead quente sem follow-up: ${l.full_name}`,
            description: `Score: ${l.predictive_score}% - Sem contato há 3+ dias`,
            action: 'Fazer follow-up imediato'
          });
        });

      // Clientes com renovação próxima
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      clients
        .filter(c => c.contract_renewal_date && new Date(c.contract_renewal_date) <= nextMonth)
        .slice(0, 2)
        .forEach(c => {
          alertsList.push({
            id: c.id,
            type: 'client',
            severity: 'medium',
            title: `Renovação próxima: ${c.full_name || c.first_name}`,
            description: `Renovação em: ${new Date(c.contract_renewal_date).toLocaleDateString('pt-BR')}`,
            action: 'Preparar proposta de renovação'
          });
        });

      return alertsList;
    },
    refetchInterval: 60000 // Atualiza a cada 1 minuto
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      default: return <TrendingDown className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Alertas Inteligentes
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">{alerts.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">✓ Tudo sob controle! Nenhum alerta no momento.</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={`${alert.type}-${alert.id}`} className="border-l-4 border-l-red-500 pl-3 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(alert.severity)} className="flex items-center gap-1">
                        {getSeverityIcon(alert.severity)}
                        {alert.severity === 'high' ? 'URGENTE' : 'Atenção'}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                    <p className="text-xs font-medium text-indigo-600 mt-1">→ {alert.action}</p>
                  </div>
                  <Link to={createPageUrl(alert.type === 'lead' ? `LeadProfile?id=${alert.id}` : `ClientProfile?id=${alert.id}`)}>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProactiveSalesAlerts;