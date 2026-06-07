import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, Map, Search, RotateCcw, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const TEMP_COLORS = {
  quente: 'text-green-400',
  morno: 'text-yellow-400',
  frio: 'text-red-400',
  depois: 'text-purple-400',
};

const NEXT_ACTIONS = {
  quente: '📞 Ligar hoje — oportunidade quente! Agende visita.',
  morno: '💬 Enviar WhatsApp introdutório e agendar para esta semana.',
  frio: '📅 Programar follow-up para daqui 15 dias.',
  depois: '🗂️ Revisar na próxima operação de campo.',
};

export default function CacaSuccessPanel({ lead, onBack, onReset }) {
  const [investigating, setInvestigating] = useState(false);
  const [investigated, setInvestigated] = useState(false);

  const handleInvestigateFundo = async () => {
    setInvestigating(true);
    try {
      await base44.functions.invoke('investigateLeadPublicData', {
        company_name: lead.clinic_name,
        city: lead.city,
        lead_id: lead.id,
        include_web: true,
        include_social: true,
        include_cnpj: true,
      });
      setInvestigated(true);
      toast.success('Investigação iniciada! Resultados aparecerão no perfil do lead.');
    } catch {
      toast.error('Erro ao iniciar investigação. Tente pelo perfil do lead.');
    }
    setInvestigating(false);
  };

  const handleWhatsApp = () => {
    if (!lead.phone) { toast.error('Telefone não cadastrado.'); return; }
    const phone = lead.phone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá! Sou Nathan, consultor Seamaty Brasil. Gostaria de conversar sobre soluções de diagnóstico para sua clínica. Posso te apresentar nosso equipamento? 🐾`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleMap = () => {
    const q = encodeURIComponent(`${lead.clinic_name} ${lead.city}`);
    window.open(`https://maps.google.com/?q=${q}`, '_blank');
  };

  return (
    <Card className="bg-slate-950 border-green-600/50">
      <CardContent className="pt-6 space-y-5">

        {/* Confirmação */}
        <div className="text-center space-y-2">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
          <h2 className="text-green-400 font-black text-xl">✅ Lead Cadastrado!</h2>
          <p className="font-bold text-white text-base">{lead.clinic_name}</p>
          <p className="text-slate-400 text-sm">{lead.city}{lead.phone ? ` • ${lead.phone}` : ''}</p>
          <span className={`text-sm font-bold ${TEMP_COLORS[lead.temperatura] || 'text-slate-400'}`}>
            Temperatura: {lead.temperatura?.toUpperCase() || '—'}
          </span>
        </div>

        {/* Próxima ação */}
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
          <p className="text-[10px] text-orange-500 font-bold mb-1">🎯 PRÓXIMA AÇÃO RECOMENDADA</p>
          <p className="text-orange-200 text-sm">{NEXT_ACTIONS[lead.temperatura] || 'Defina a próxima ação no CRM.'}</p>
        </div>

        {/* Botões de ação rápida */}
        <div className="grid grid-cols-2 gap-2">
          {/* Investigar Fundo */}
          <Button
            className="h-12 bg-orange-700 hover:bg-orange-600 font-bold text-sm col-span-2"
            onClick={handleInvestigateFundo}
            disabled={investigating || investigated}
          >
            {investigating
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Investigando...</>
              : investigated
              ? '✅ Investigação Iniciada'
              : <><Search className="w-4 h-4 mr-2" /> 🔍 Investigar Fundo (IA)</>
            }
          </Button>

          {/* WhatsApp */}
          <Button
            className="h-11 bg-green-700 hover:bg-green-600 font-bold text-sm"
            onClick={handleWhatsApp}
            disabled={!lead.phone}
          >
            <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
          </Button>

          {/* Ver no Mapa */}
          <Button
            className="h-11 bg-blue-700 hover:bg-blue-600 font-bold text-sm"
            onClick={handleMap}
          >
            <Map className="w-4 h-4 mr-1" /> Ver no Mapa
          </Button>
        </div>

        {/* Ações de navegação */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 text-orange-400 border-orange-700 text-sm"
            onClick={onBack}
          >
            <Plus className="w-3 h-3 mr-1" /> Mais clínicas
          </Button>
          <Button
            variant="ghost"
            className="flex-1 text-slate-400 text-sm"
            onClick={onReset}
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Nova operação
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}