/**
 * WhatsAppRapido — botões de mensagem rápida por tipo para qualquer cliente/lead.
 * Nunca envia automaticamente. Sempre abre WhatsApp com texto pronto para aprovação.
 * Identidade: Nathan Rosa — Consultor Técnico Comercial — Seamaty Brasil
 * Props: client (objeto com first_name, clinic_name, phone, city, equipment_sold, equipment_interest)
 */
import React, { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { IDENTIDADE, TEMPLATES_WHATSAPP } from '@/lib/SeamatyData';

const nome = (c) => c.first_name || c.full_name || 'Dr(a)';
const clinica = (c) => c.clinic_name || 'clínica';

const TIPOS = [
  { key: 'abordagem_fria', label: '🧊 Abordagem Fria',       color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',     gerar: TEMPLATES_WHATSAPP.abordagem_fria },
  { key: 'followup',       label: '🔄 Follow-up',            color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100', gerar: TEMPLATES_WHATSAPP.followup },
  { key: 'pos_visita',     label: '✅ Pós-visita',            color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',   gerar: TEMPLATES_WHATSAPP.pos_visita },
  { key: 'proposta',       label: '📄 Enviar Proposta',      color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100', gerar: TEMPLATES_WHATSAPP.proposta },
  { key: 'comodato',       label: '🤝 Comodato',             color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',       gerar: TEMPLATES_WHATSAPP.comodato },
  { key: 'treinamento',    label: '🎓 Treinamento/Pós-venda', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',  gerar: TEMPLATES_WHATSAPP.treinamento },
  { key: 'reativacao',     label: '🔥 Reativação',           color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',           gerar: TEMPLATES_WHATSAPP.reativacao },
];

export default function WhatsAppRapido({ client }) {
  const [aberto, setAberto] = useState(false);

  if (!client) return null;

  const abrirWhatsApp = async (tipoKey) => {
    const tipoConfig = TIPOS.find(t => t.key === tipoKey);
    if (!tipoConfig) return;

    const mensagem = tipoConfig.gerar(client);
    const phone = (client.phone || '').replace(/\D/g, '');

    if (!phone) {
      toast.warning('Telefone não cadastrado. Adicione o telefone no perfil do cliente.');
      try {
        navigator.clipboard.writeText(mensagem);
        toast.info('Mensagem copiada para área de transferência!');
      } catch (_) {}
      return;
    }

    // Abrir WhatsApp com texto pronto — nunca enviar automático
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(mensagem)}`, '_blank');

    // Registrar histórico (fire-and-forget, não bloqueia UI)
    try {
      await base44.entities.Interaction?.create({
        client_id: client.id,
        client_name: client.first_name || client.full_name || '',
        type: 'whatsapp',
        notes: `[WhatsApp Rápido] Tipo: ${tipoConfig.label} | Telefone: ${phone} | Status: mensagem_preparada\n\n${mensagem}`,
        date: new Date().toISOString(),
        status: 'mensagem_preparada',
      });
    } catch (err) {
      console.warn('[WhatsAppRapido] Histórico não salvo:', err?.message || err);
    }
  };

  return (
    <div className="border border-green-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setAberto(a => !a)}
        className="w-full flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-green-700">
          <MessageSquare className="w-4 h-4" /> WhatsApp Rápido
        </span>
        {aberto ? <ChevronUp className="w-4 h-4 text-green-600" /> : <ChevronDown className="w-4 h-4 text-green-600" />}
      </button>

      {aberto && (
        <div className="p-3 bg-white grid grid-cols-2 gap-2">
          {TIPOS.map(tipo => (
            <button
              key={tipo.key}
              onClick={() => abrirWhatsApp(tipo.key)}
              className={`text-left text-xs font-semibold px-3 py-2.5 rounded-lg border transition-colors ${tipo.color}`}
            >
              {tipo.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}