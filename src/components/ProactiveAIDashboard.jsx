import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  TrendingUp, AlertTriangle, Zap, Target, Brain, 
  ThumbsUp, ThumbsDown, Clock, ArrowRight, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProactiveAIDashboard() {
  // Top priority leads
  const { data: priorityLeads = [] } = useQuery({
    queryKey: ['priority-leads'],
    queryFn: async () => {
      const leads = await base44.entities.Lead.filter({});
      return leads
        .filter(l => l.predictive_score >= 70)
        .sort((a, b) => b.predictive_score - a.predictive_score)
        .slice(0, 5);
    }
  });

  // Sentiment alerts
  const { data: sentimentAlerts = [] } = useQuery({
    queryKey: ['sentiment-alerts'],
    queryFn: () => base44.entities.SentimentAlert?.filter({ status: 'open' }).catch(() => [])
  });

  // Pending AI messages
  const { data: pendingMessages = [] } = useQuery({
    queryKey: ['pending-ai-messages'],
    queryFn: () => base44.entities.PendingMessage?.filter({ status: 'pending' }).catch(() => [])
  });

  // Active alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['active-alerts'],
    queryFn: () => base44.entities.Alert?.filter({}).catch(() => [])
  });

  // Recent AI insights from documents
  const { data: recentDocs = [] } = useQuery({
    queryKey: ['recent-ai-docs'],
    queryFn: async () => {
      const docs = await base44.entities.AIKnowledgeDocument?.list('-last_used_date', 3).catch(() => []);
      return docs;
    }
  });

  const priorityColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500'
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Dashboard de Inteligência IA
          </CardTitle>
          <p className="text-sm text-purple-100">
            Insights proativos, alertas automáticos e ações recomendadas pela IA
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Leads Quentes</p>
                <p className="text-2xl font-bold text-green-600">{priorityLeads.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Alertas Sentimento</p>
                <p className="text-2xl font-bold text-red-600">{sentimentAlerts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Msgs Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">{pendingMessages.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Alertas Ativos</p>
                <p className="text-2xl font-bold text-blue-600">{alerts.length}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Leads */}
      {priorityLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Top 5 Leads Prioritários (Score IA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {priorityLeads.map(lead => (
                <Link key={lead.id} to={createPageUrl('LeadProfile') + '?id=' + lead.id}>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold">{lead.full_name}</p>
                      <p className="text-xs text-slate-600">{lead.company || 'Sem empresa'}</p>
                      {lead.next_best_action && (
                        <p className="text-xs text-indigo-600 mt-1">
                          💡 {lead.next_best_action}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${priorityColors[lead.priority_level] || 'bg-slate-500'} text-white`}>
                        Score: {lead.predictive_score}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sentiment Alerts */}
      {sentimentAlerts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ThumbsDown className="w-5 h-5 text-red-600" />
              Alertas de Sentimento Negativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentimentAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">{alert.client_name}</p>
                      <p className="text-sm text-red-700 mt-1">{alert.trigger_reason}</p>
                      {alert.recommended_action && (
                        <p className="text-xs text-red-600 mt-2">
                          🎯 {alert.recommended_action}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-red-600 text-white">{alert.severity}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Messages */}
      {pendingMessages.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Mensagens IA Aguardando Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingMessages.slice(0, 3).map(msg => (
                <div key={msg.id} className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-orange-900">{msg.recipient_name}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {msg.channel === 'whatsapp' ? '📱 WhatsApp' : '📧 Email'}
                      </Badge>
                    </div>
                    <Badge className={`${priorityColors[msg.priority] || 'bg-slate-500'} text-white`}>
                      {msg.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-orange-800 line-clamp-2">{msg.message_content}</p>
                  {msg.ai_reasoning && (
                    <p className="text-xs text-orange-600 mt-2">💡 {msg.ai_reasoning}</p>
                  )}
                  <Link to={createPageUrl('MessageApproval')}>
                    <Button size="sm" className="mt-2 w-full" variant="outline">
                      Revisar e Aprovar
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent AI Knowledge Used */}
      {recentDocs.length > 0 && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Base IA Recentemente Consultada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDocs.map(doc => (
                <div key={doc.id} className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-purple-900">{doc.title}</p>
                      <p className="text-sm text-purple-700 mt-1">{doc.summary}</p>
                      {doc.usage_count > 0 && (
                        <p className="text-xs text-purple-600 mt-2">
                          📊 Usado {doc.usage_count}x pela IA
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {doc.document_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}