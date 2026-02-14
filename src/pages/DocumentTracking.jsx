import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentTracking() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const trackingPath = window.location.pathname;
  const trackingId = trackingPath.split('/v/')[1] || urlParams.get('id');
  
  const [tracking, setTracking] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  useEffect(() => {
    if (!trackingId) {
      toast.error('Link inválido');
      return;
    }

    const recordView = async () => {
      setTracking(true);
      
      try {
        // Detectar informações do dispositivo
        const deviceInfo = `${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} - ${navigator.platform}`;
        
        // Registrar visualização
        const response = await base44.functions.invoke('trackDocumentView', {
          tracking_id: trackingId,
          device_info: deviceInfo,
          location: 'Brasil' // Pode expandir com geolocalização
        });

        if (response.data.success) {
          setSuccess(true);
          toast.success(
            `✅ Visualização registrada!\n\n` +
            `📊 Total de visualizações: ${response.data.views}\n` +
            `🎯 Score de engajamento: ${response.data.engagement_score}%\n` +
            `💡 Interesse: ${response.data.interest_level}`,
            { duration: 6000 }
          );
        }
      } catch (error) {
        console.error('Erro ao rastrear:', error);
        toast.error('Erro ao registrar visualização');
      } finally {
        setTracking(false);
      }
    };

    recordView();
  }, [trackingId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center">
        {tracking && (
          <>
            <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Carregando documento...</h2>
            <p className="text-sm text-slate-600">Aguarde um momento</p>
          </>
        )}
        
        {success && !tracking && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">✅ Visualização Registrada</h2>
            <p className="text-sm text-slate-600 mb-4">
              O vendedor foi notificado que você visualizou este documento.
            </p>
            <Eye className="w-12 h-12 text-purple-400 mx-auto opacity-50 mb-4" />
            <p className="text-xs text-slate-500">
              Este é um link rastreável para análise de engajamento
            </p>
          </>
        )}

        {!tracking && !success && (
          <>
            <Eye className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Link Rastreável</h2>
            <p className="text-sm text-slate-600">
              Este link permite ao vendedor acompanhar visualizações de documentos
            </p>
          </>
        )}
      </Card>
    </div>
  );
}