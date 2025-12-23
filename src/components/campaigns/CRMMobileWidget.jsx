import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, MessageCircle, Phone, Calendar, CheckSquare } from 'lucide-react';

export default function CRMMobileWidget({ client, compact = false }) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Card className="p-3 bg-white shadow-xl border-2 border-orange-500">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-semibold">CRM Rápido</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {client?.phone && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`https://wa.me/${client.phone}`, '_blank')}
                className="h-8"
              >
                <MessageCircle className="w-3 h-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(createPageUrl(`ClientProfile?id=${client?.id}`))}
              className="h-8"
            >
              <CheckSquare className="w-3 h-3" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <Smartphone className="w-5 h-5 text-orange-600" />
        <h3 className="font-semibold text-slate-900">CRM Móvel</h3>
        <Badge className="bg-orange-100 text-orange-700 text-xs">Rápido</Badge>
      </div>

      {client ? (
        <div className="space-y-2">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="font-semibold text-slate-800">{client.first_name}</p>
            <p className="text-xs text-slate-600">{client.clinic_name || 'N/A'}</p>
            <div className="mt-2">
              <Badge className={
                client.status === 'quente' ? 'bg-red-500' :
                client.status === 'morno' ? 'bg-yellow-500' :
                'bg-blue-400'
              }>
                {client.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {client.phone && (
              <Button
                size="sm"
                onClick={() => window.open(`https://wa.me/${client.phone}`, '_blank')}
                className="bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                WhatsApp
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
            >
              Ver Perfil
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 text-center py-4">
          Selecione um cliente para ações rápidas
        </p>
      )}
    </Card>
  );
}