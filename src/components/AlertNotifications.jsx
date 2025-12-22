import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, X, TrendingUp, Clock, AlertTriangle, ThermometerSun } from 'lucide-react';

export default function AlertNotifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', currentUser?.email],
    queryFn: () => base44.entities.Alert.filter({ 
      user_email: currentUser.email,
      dismissed: false 
    }),
    enabled: !!currentUser,
    refetchInterval: 30000 // Refetch a cada 30s
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.update(id, { dismissed: true }),
    onSuccess: () => queryClient.invalidateQueries(['alerts'])
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries(['alerts'])
  });

  const unreadCount = alerts.filter(a => !a.read).length;

  const handleAlertClick = (alert) => {
    if (!alert.read) {
      markReadMutation.mutate(alert.id);
    }
    if (alert.link_to) {
      navigate(createPageUrl(alert.link_to));
    }
    setIsOpen(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'high_score_lead': return TrendingUp;
      case 'lead_inactive': return Clock;
      case 'client_cold': return ThermometerSun;
      default: return AlertTriangle;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 border-red-300 text-red-700';
      case 'media': return 'bg-yellow-100 border-yellow-300 text-yellow-700';
      default: return 'bg-blue-100 border-blue-300 text-blue-700';
    }
  };

  if (!currentUser || alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-12 h-12 bg-orange-600 rounded-full shadow-lg flex items-center justify-center hover:bg-orange-700 transition-all"
      >
        <Bell className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Alerts Panel */}
      {isOpen && (
        <Card className="absolute top-14 right-0 w-80 max-h-[500px] overflow-y-auto shadow-2xl">
          <div className="p-3 border-b bg-slate-50 flex items-center justify-between sticky top-0 z-10">
            <h3 className="font-semibold text-slate-800">Alertas</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="divide-y">
            {alerts.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nenhum alerta</p>
              </div>
            ) : (
              alerts.map(alert => {
                const Icon = getIcon(alert.type);
                const isUnread = !alert.read;

                return (
                  <div
                    key={alert.id}
                    className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                      isUnread ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${getPriorityColor(alert.priority)} flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-sm font-semibold ${isUnread ? 'text-slate-900' : 'text-slate-600'}`}>
                            {alert.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissMutation.mutate(alert.id);
                            }}
                            className="h-6 w-6 p-0 hover:bg-slate-200"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <p className={`text-xs ${isUnread ? 'text-slate-700' : 'text-slate-500'}`}>
                          {alert.message}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getPriorityColor(alert.priority)} variant="outline">
                            {alert.priority}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {new Date(alert.created_date).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}
    </div>
  );
}