import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, DollarSign, X, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProactiveAlertsSystem() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [alerts, setAlerts] = useState([]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-alerts'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: user } = useQuery({
    queryKey: ['current-user-alerts'],
    queryFn: () => base44.auth.me()
  });

  const createAlertMutation = useMutation({
    mutationFn: (alertData) => base44.entities.Alert.create(alertData),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
    }
  });

  const dismissAlertMutation = useMutation({
    mutationFn: (alertId) => base44.entities.Alert.update(alertId, { dismissed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
    }
  });

  useEffect(() => {
    if (!clients.length || !user) return;

    const newAlerts = [];

    clients.forEach(client => {
      const churnRisk = client.ai_sales_intelligence?.churn_risk || 0;
      const healthScore = client.health_score || 50;
      const ltv = client.ltv_estimate || 0;
      const engagement = client.engagement_score || 0;

      // ALERTA 1: Cliente em Risco de Churn
      if (churnRisk > 70 && healthScore < 40) {
        newAlerts.push({
          id: `churn-${client.id}`,
          type: 'churn_risk',
          priority: 'high',
          client_id: client.id,
          client_name: client.first_name,
          title: `🚨 Cliente em Risco Crítico`,
          message: `${client.first_name} tem ${churnRisk}% de risco de churn. Health Score: ${healthScore}%. Ação imediata necessária!`,
          action_label: 'Ver Cliente'
        });
      }

      // ALERTA 2: Alto Potencial de Upsell
      if (ltv > 50000 && engagement > 70 && client.status === 'quente') {
        newAlerts.push({
          id: `upsell-${client.id}`,
          type: 'upsell_opportunity',
          priority: 'medium',
          client_id: client.id,
          client_name: client.first_name,
          title: `💰 Alto Potencial de Upsell`,
          message: `${client.first_name} tem LTV de R$ ${ltv.toLocaleString('pt-BR')} e engagement de ${engagement}%. Momento ideal para oferta!`,
          action_label: 'Ver Oportunidade'
        });
      }

      // ALERTA 3: Queda de Engagement
      if (engagement < 30 && healthScore < 50 && client.status !== 'frio') {
        newAlerts.push({
          id: `engagement-${client.id}`,
          type: 'low_engagement',
          priority: 'medium',
          client_id: client.id,
          client_name: client.first_name,
          title: `⚠️ Queda de Engagement`,
          message: `${client.first_name} está com engagement baixo (${engagement}%). Reengajar rapidamente.`,
          action_label: 'Reengajar'
        });
      }

      // ALERTA 4: Cliente VIP Inativo
      if (client.ai_segment === 'VIP' && healthScore < 60) {
        newAlerts.push({
          id: `vip-${client.id}`,
          type: 'vip_inactive',
          priority: 'high',
          client_id: client.id,
          client_name: client.first_name,
          title: `👑 Cliente VIP Inativo`,
          message: `${client.first_name} é VIP mas está com health ${healthScore}%. Prioridade máxima!`,
          action_label: 'Ação Urgente'
        });
      }
    });

    setAlerts(newAlerts);

    // Auto-criar alertas no banco se não existirem
    if (newAlerts.length > 0 && user) {
      newAlerts.slice(0, 5).forEach(alert => {
        createAlertMutation.mutate({
          user_email: user.email,
          title: alert.title,
          message: alert.message,
          type: alert.type,
          priority: alert.priority === 'high' ? 'alta' : 'media',
          link_to: `ClientProfile?id=${alert.client_id}`
        });
      });
    }
  }, [clients, user]);

  const getAlertColor = (priority) => {
    return priority === 'high' ? 'from-red-500 to-red-700' : 'from-orange-500 to-orange-600';
  };

  const getAlertIcon = (type) => {
    const icons = {
      churn_risk: AlertTriangle,
      upsell_opportunity: TrendingUp,
      low_engagement: AlertTriangle,
      vip_inactive: DollarSign
    };
    return icons[type] || Bell;
  };

  if (alerts.length === 0) return null;

  return (
    <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-5 h-5 text-red-600" />
        <h3 className="font-bold text-slate-800">🔔 Alertas Inteligentes</h3>
        <Badge className="bg-red-600 text-white">{alerts.length}</Badge>
      </div>

      <div className="space-y-2">
        {alerts.slice(0, 3).map((alert) => {
          const Icon = getAlertIcon(alert.type);
          
          return (
            <Card 
              key={alert.id}
              className={`p-3 bg-gradient-to-r ${getAlertColor(alert.priority)} border-none text-white cursor-pointer hover:opacity-90 transition-opacity`}
              onClick={() => navigate(createPageUrl(`ClientProfile?id=${alert.client_id}`))}
            >
              <div className="flex items-start gap-2">
                <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold mb-1">{alert.title}</p>
                  <p className="text-xs text-white/90">{alert.message}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {alerts.length > 3 && (
        <p className="text-xs text-slate-600 text-center mt-2">
          +{alerts.length - 3} alertas adicionais
        </p>
      )}
    </Card>
  );
}