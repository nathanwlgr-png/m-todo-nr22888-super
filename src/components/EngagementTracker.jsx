import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Eye, FileText, Image, Link, TrendingUp, Clock, Download, Share2, Bell, Smartphone, MapPin, Timer } from 'lucide-react';

export default function EngagementTracker({ clientId }) {
  const [trackingUrl, setTrackingUrl] = useState('');
  const [realTimeAlerts, setRealTimeAlerts] = useState([]);
  const queryClient = useQueryClient();

  const { data: engagements = [] } = useQuery({
    queryKey: ['engagements', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      return await base44.entities.DocumentEngagement.filter({ client_id: clientId });
    },
    enabled: !!clientId,
    refetchInterval: 10000 // Atualiza a cada 10 segundos
  });

  // Subscrição em tempo real para alertas
  useEffect(() => {
    if (!clientId) return;

    const unsubscribe = base44.entities.DocumentEngagement.subscribe((event) => {
      if (event.type === 'update' && event.data.client_id === clientId) {
        const eng = event.data;
        
        // Alerta para visualizações de alta prioridade
        if (eng.views_count >= 3 || eng.interest_level === 'muito_alto') {
          const alert = {
            id: Date.now(),
            title: eng.document_title,
            views: eng.views_count,
            interest: eng.interest_level,
            timestamp: new Date().toISOString()
          };
          
          setRealTimeAlerts(prev => [alert, ...prev.slice(0, 4)]);
          
          toast.success(
            `🔥 ALTA PRIORIDADE!\n\n${eng.client_name || 'Cliente'} visualizou "${eng.document_title}" ${eng.views_count}x!\n\nInteresse: ${eng.interest_level?.toUpperCase()}`,
            { duration: 10000 }
          );
        }
      }
    });

    return unsubscribe;
  }, [clientId]);

  const createTrackingMutation = useMutation({
    mutationFn: async (data) => {
      const trackingId = `trk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const trackingData = {
        ...data,
        tracking_id: trackingId,
        sent_at: new Date().toISOString(),
        views_count: 0,
        engagement_score: 0
      };
      
      const created = await base44.entities.DocumentEngagement.create(trackingData);
      
      // Gerar URL rastreável curta
      const baseUrl = window.location.origin;
      const shortUrl = `${baseUrl}/v/${trackingId}`;
      
      return { url: shortUrl, id: created.id };
    },
    onSuccess: (data) => {
      setTrackingUrl(data.url);
      queryClient.invalidateQueries(['engagements']);
      toast.success('✅ Link rastreável criado! Cliente será notificado quando abrir.', { duration: 5000 });
    }
  });

  const getTypeIcon = (type) => {
    switch(type) {
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'imagem': return <Image className="w-4 h-4" />;
      case 'link': return <Link className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getInterestColor = (level) => {
    switch(level) {
      case 'muito_alto': return 'bg-red-600';
      case 'alto': return 'bg-orange-600';
      case 'medio': return 'bg-yellow-600';
      case 'baixo': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const totalViews = engagements.reduce((sum, e) => sum + (e.views_count || 0), 0);
  const totalTimeSpent = engagements.reduce((sum, e) => sum + (e.time_spent_seconds || 0), 0);
  const avgEngagement = engagements.length > 0 
    ? Math.round(engagements.reduce((sum, e) => sum + (e.engagement_score || 0), 0) / engagements.length)
    : 0;
  
  const highInterestDocs = engagements.filter(e => 
    e.interest_level === 'muito_alto' || e.interest_level === 'alto'
  ).length;

  // Análise por dispositivo
  const deviceAnalysis = engagements.reduce((acc, e) => {
    if (e.view_history && Array.isArray(e.view_history)) {
      e.view_history.forEach(v => {
        const device = v.device_info || 'Desconhecido';
        acc[device] = (acc[device] || 0) + 1;
      });
    }
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-purple-900">📊 Rastreamento de Engajamento</h3>
            <p className="text-xs text-purple-600">Saiba quando cliente visualiza seus documentos</p>
          </div>
        </div>

        {/* Alertas em Tempo Real */}
        {realTimeAlerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {realTimeAlerts.map(alert => (
              <div key={alert.id} className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-3 rounded-lg animate-pulse">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="w-4 h-4" />
                  <p className="font-bold text-sm">ALERTA ALTA PRIORIDADE!</p>
                </div>
                <p className="text-xs">"{alert.title}" visualizado {alert.views} vezes</p>
                <p className="text-xs opacity-90">{new Date(alert.timestamp).toLocaleTimeString('pt-BR')}</p>
              </div>
            ))}
          </div>
        )}

        {/* Métricas Gerais */}
        {engagements.length > 0 && (
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-xl font-bold text-purple-900">{engagements.length}</p>
                <p className="text-xs text-purple-600">Enviados</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-xl font-bold text-purple-900">{totalViews}</p>
                <p className="text-xs text-purple-600">Views</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-xl font-bold text-purple-900">{avgEngagement}%</p>
                <p className="text-xs text-purple-600">Score</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2 text-center border border-green-300">
                <p className="text-xl font-bold text-green-900">{highInterestDocs}</p>
                <p className="text-xs text-green-700">🔥 Quentes</p>
              </div>
            </div>

            {/* Tempo total gasto */}
            {totalTimeSpent > 0 && (
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-purple-600" />
                  <p className="text-sm font-semibold text-purple-900">
                    Tempo Total: {Math.floor(totalTimeSpent / 60)}min {totalTimeSpent % 60}s
                  </p>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Média: {engagements.length > 0 ? Math.round(totalTimeSpent / engagements.length) : 0}s por documento
                </p>
              </div>
            )}

            {/* Análise por Dispositivo */}
            {Object.keys(deviceAnalysis).length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <p className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Smartphone className="w-3 h-3" />
                  Dispositivos:
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(deviceAnalysis).map(([device, count]) => (
                    <Badge key={device} variant="outline" className="text-xs">
                      {device}: {count}x
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Criar Link Rastreável */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-purple-900">Criar Link Rastreável:</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              onClick={() => {
                createTrackingMutation.mutate({
                  client_id: clientId,
                  document_type: 'pdf',
                  document_title: 'Proposta Comercial',
                  sent_via: 'whatsapp'
                });
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF/Proposta
            </Button>
            <Button
              size="sm"
              onClick={() => {
                createTrackingMutation.mutate({
                  client_id: clientId,
                  document_type: 'imagem',
                  document_title: 'Catálogo Produtos',
                  sent_via: 'whatsapp'
                });
              }}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Image className="w-4 h-4 mr-2" />
              Imagem
            </Button>
          </div>

          {trackingUrl && (
            <div className="bg-white rounded-lg p-3 border-2 border-purple-300">
              <p className="text-xs font-semibold text-purple-900 mb-2">Link Rastreável Gerado:</p>
              <div className="flex gap-2">
                <Input value={trackingUrl} readOnly className="text-xs" />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(trackingUrl);
                    toast.success('Link copiado!');
                  }}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-purple-600 mt-2">
                ⚠️ Envie este link ao cliente. Você será notificado quando ele visualizar!
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Lista de Documentos Rastreados */}
      {engagements.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-700">Histórico de Envios:</h4>
          {engagements.map((engagement) => (
            <Card key={engagement.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    {getTypeIcon(engagement.document_type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-900">
                      {engagement.document_title || 'Documento'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        {engagement.views_count || 0}x
                      </Badge>
                      {engagement.time_spent_seconds > 0 && (
                        <Badge variant="outline" className="text-xs bg-blue-50">
                          <Timer className="w-3 h-3 mr-1" />
                          {Math.floor(engagement.time_spent_seconds / 60)}:{String(engagement.time_spent_seconds % 60).padStart(2, '0')}
                        </Badge>
                      )}
                      {engagement.interest_level && (
                        <Badge className={`${getInterestColor(engagement.interest_level)} text-white text-xs`}>
                          {engagement.interest_level === 'muito_alto' ? '🔥🔥' : 
                           engagement.interest_level === 'alto' ? '🔥' :
                           engagement.interest_level === 'medio' ? '🌡️' : '❄️'}
                        </Badge>
                      )}
                      {engagement.downloaded && (
                        <Badge className="bg-indigo-600 text-white text-xs">
                          <Download className="w-3 h-3 mr-1" />
                          Baixado
                        </Badge>
                      )}
                      {engagement.response_received && (
                        <Badge className="bg-green-600 text-white text-xs">
                          ✓ Respondeu
                        </Badge>
                      )}
                    </div>
                    {engagement.last_viewed_at && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Última: {new Date(engagement.last_viewed_at).toLocaleString('pt-BR')}
                      </p>
                    )}

                    {/* Histórico de Visualizações Detalhado */}
                    {engagement.view_history && engagement.view_history.length > 0 && (
                      <div className="mt-2 p-2 bg-slate-50 rounded-lg">
                        <p className="text-xs font-semibold text-slate-700 mb-1">Histórico ({engagement.view_history.length}):</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {engagement.view_history.slice(-5).reverse().map((view, idx) => (
                            <div key={idx} className="text-xs text-slate-600 flex items-center gap-2 py-1 border-b last:border-b-0">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="flex-1">
                                {new Date(view.timestamp).toLocaleString('pt-BR')}
                              </span>
                              {view.device_info && view.device_info !== 'Desconhecido' && (
                                <Badge variant="outline" className="text-xs">
                                  <Smartphone className="w-2 h-2 mr-1" />
                                  {view.device_info}
                                </Badge>
                              )}
                              {view.location && view.location !== 'Desconhecido' && (
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="w-2 h-2 mr-1" />
                                  {view.location}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {engagement.engagement_score !== undefined && (
                  <div className="text-right">
                    <p className="text-xl font-bold text-purple-900">{engagement.engagement_score}%</p>
                    <p className="text-xs text-purple-600">Score</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}