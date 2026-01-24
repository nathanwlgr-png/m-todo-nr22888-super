import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Sparkles, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppMasterAssistant() {
  const [connecting, setConnecting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const connectWhatsApp = async () => {
    setConnecting(true);
    try {
      const whatsappURL = base44.agents.getWhatsAppConnectURL('sales_assistant');
      window.open(whatsappURL, '_blank');
      toast.success('WhatsApp aberto! Escaneie o QR Code');
    } catch (error) {
      toast.error('Erro ao conectar WhatsApp');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-green-900 flex items-center gap-2">
            Assistente IA WhatsApp
            <Badge className="bg-green-600">MASTER</Badge>
          </h3>
          <p className="text-xs text-green-700">Vendas inteligente 24/7</p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-800">
            <strong>Acesso total:</strong> Clientes, documentos, propostas
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-800">
            <strong>Inteligência IA:</strong> SPIN, gatilhos, objeções
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-800">
            <strong>Busca web:</strong> Informações em tempo real
          </p>
        </div>
      </div>

      <Button
        onClick={connectWhatsApp}
        disabled={connecting}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Conectar WhatsApp
        <ExternalLink className="w-3 h-3 ml-2" />
      </Button>

      <p className="text-xs text-green-600 text-center mt-2">
        Use de qualquer lugar, 24/7
      </p>
    </Card>
  );
}