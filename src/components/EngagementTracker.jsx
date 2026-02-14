import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Eye, FileText, Image, Link, TrendingUp, Clock, Download, Share2 } from 'lucide-react';

export default function EngagementTracker({ clientId }) {
  const [trackingUrl, setTrackingUrl] = useState('');
  const queryClient = useQueryClient();

  const { data: engagements = [] } = useQuery({
    queryKey: ['engagements', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      return await base44.entities.DocumentEngagement.filter({ client_id: clientId });
    },
    enabled: !!clientId
  });

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
  const avgEngagement = engagements.length > 0 
    ? Math.round(engagements.reduce((sum, e) => sum + (e.engagement_score || 0), 0) / engagements.length)
    : 0;
  
  const highInterestDocs = engagements.filter(e => 
    e.interest_level === 'muito_alto' || e.interest_level === 'alto'
  ).length;

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

        {/* Métricas Gerais */}
        {engagements.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4">
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
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        {engagement.views_count || 0}x
                      </Badge>
                      {engagement.interest_level && (
                        <Badge className={`${getInterestColor(engagement.interest_level)} text-white text-xs`}>
                          {engagement.interest_level === 'muito_alto' ? '🔥🔥' : 
                           engagement.interest_level === 'alto' ? '🔥' :
                           engagement.interest_level === 'medio' ? '🌡️' : '❄️'}
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
                        Última visualização: {new Date(engagement.last_viewed_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
                {engagement.engagement_score && (
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