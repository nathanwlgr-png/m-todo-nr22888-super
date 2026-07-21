import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentTracking() {
  const urlParams = new URLSearchParams(window.location.search);
  const trackingId = urlParams.get('id');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [engagement, setEngagement] = useState(null);
  const [startTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    if (!trackingId) {
      toast.error('Link inválido');
      setLoading(false);
      return;
    }

    loadEngagement();
  }, [trackingId]);

  // Rastrear tempo gasto
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Enviar atualização de tempo quando usuário sai
  useEffect(() => {
    const handleUnload = () => {
      if (engagement) {
        trackView(timeSpent);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [engagement, timeSpent]);

  const loadEngagement = async () => {
    try {
      const engagements = await base44.entities.DocumentEngagement.filter({ tracking_id: trackingId });
      
      if (engagements.length === 0) {
        toast.error('Documento não encontrado');
        return;
      }

      setEngagement(engagements[0]);
      
      // Registrar visualização inicial
      await trackView(0);
      
    } catch (error) {
      toast.error('Erro ao carregar documento');
    } finally {
      setLoading(false);
    }
  };

  const trackView = async (seconds) => {
    if (!engagement) return;

    try {
      // Detectar dispositivo e localização
      const deviceInfo = /mobile|android|iphone/i.test(navigator.userAgent) ? 'Mobile' :
                         /tablet|ipad/i.test(navigator.userAgent) ? 'Tablet' : 'Desktop';
      
      let location = 'Desconhecido';
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            location = `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`;
          },
          () => {}
        );
      }

      await base44.functions.invoke('trackDocumentView', {
        tracking_id: trackingId,
        device_info: deviceInfo,
        location: location,
        time_spent_seconds: seconds
      });
    } catch (error) {
      console.error('Erro ao rastrear:', error);
    }
  };

  const handleDownload = async () => {
    await trackView(timeSpent);
    
    // Marcar como baixado
    await base44.functions.invoke('trackDocumentView', {
      tracking_id: trackingId,
      downloaded: true
    });

    if (engagement.document_url) {
      window.open(engagement.document_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!engagement) {
    return <div className="min-h-screen flex items-center justify-center p-6"><Card className="p-6 text-center"><h1 className="font-bold">Rastreamento não encontrado</h1><p className="text-sm text-slate-600 mt-2">Abra um link válido de proposta para consultar o sinal de interesse.</p></Card></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">
                {engagement?.document_title || 'Documento'}
              </h1>
              <p className="text-sm text-slate-600">
                Enviado por {engagement?.created_by || 'Vendedor'}
              </p>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 mb-4 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-600" />
                <p className="font-semibold text-purple-900">Sinal de interesse registrado</p>
              </div>
              <p className="text-sm text-purple-700">Tempo: {Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, '0')}</p>
            </div>
            <p className="text-xs text-purple-700">
              A abertura e o clique indicam interesse, mas não comprovam leitura completa do documento.
            </p>
          </div>

          {engagement?.document_url && (
            <Button
              onClick={handleDownload}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Download className="w-5 h-5 mr-2" />
              Baixar Documento
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}