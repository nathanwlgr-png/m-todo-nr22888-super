import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Processa em lotes os clientes sem coordenada via geocodeLoteSafe.
 * Cada coordenada vira uma sugestão na fila de aprovação (nada é aplicado automaticamente).
 */
export default function BotaoGeocodificarRestantes() {
  const [processando, setProcessando] = useState(false);
  const [status, setStatus] = useState(null);

  const processarLote = async () => {
    setProcessando(true);
    try {
      const res = await base44.functions.invoke('geocodeLoteSafe', { limit: 50 });
      const data = res.data || {};

      if (data.status === 'sem_api_key') {
        toast.error('Google Maps não configurado.');
      } else if (data.status === 'google_api_bloqueada') {
        toast.error(`Google bloqueou a chave (${data.google_status}).`);
      } else if (data.error && /rate limit/i.test(data.error)) {
        toast.warning('Limite temporário atingido. Aguarde 1 minuto e tente de novo.');
      } else if (data.success) {
        setStatus({ sugestoes: data.sugestoes, restantes: data.restantes });
        if (data.restantes > 0) {
          toast.success(`${data.sugestoes} novas sugestões. Faltam ${data.restantes} — clique de novo.`);
        } else {
          toast.success('Todos os clientes processados! Confira a fila de aprovação.');
        }
      } else {
        toast.error('Não foi possível processar agora.');
      }
    } catch (e) {
      toast.error('Erro ao processar. Tente novamente em instantes.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <button
      onClick={processarLote}
      disabled={processando}
      className="px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 text-white disabled:opacity-60"
      style={{ background: '#388e3c' }}
      title="Gera coordenadas para clientes sem localização (vão para a fila de aprovação)"
    >
      {processando ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
      {processando
        ? 'Localizando...'
        : status
          ? `Localizar restantes (${status.restantes})`
          : 'Localizar clientes restantes'}
    </button>
  );
}