/**
 * WhatsAppRapido — botões de mensagem rápida por tipo para qualquer cliente/lead.
 * Nunca envia automaticamente. Sempre abre WhatsApp com texto pronto para aprovação.
 * Props: client (objeto com first_name, clinic_name, phone, city, equipment_sold)
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const TIPOS = [
  {
    key: 'abordagem_fria',
    label: '🧊 Abordagem Fria',
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    gerar: (c) =>
      `Olá, ${c.first_name || c.clinic_name || 'Dr(a)'}! Sou o Ricardo, representante Seamaty. Vi que a ${c.clinic_name || 'clínica'} de ${c.city || 'vocês'} pode se beneficiar dos nossos analisadores de sangue para pets — resultados em 3 minutos, sem terceirizar. Posso apresentar em 10 minutos? 🐾`,
  },
  {
    key: 'pos_visita',
    label: '✅ Pós-visita',
    color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    gerar: (c) =>
      `Olá, ${c.first_name || 'Dr(a)'}! Foi uma ótima conversa hoje. Como combinamos, segue abaixo o resumo e os próximos passos. Qualquer dúvida, pode me chamar aqui! 😊`,
  },
  {
    key: 'proposta',
    label: '📄 Enviar Proposta',
    color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    gerar: (c) =>
      `Olá, ${c.first_name || 'Dr(a)'}! Segue a proposta personalizada do ${c.equipment_interest || 'equipamento Seamaty'} para a ${c.clinic_name || 'clínica'}. ROI estimado em até 6 meses. Posso tirar dúvidas? 🔬`,
  },
  {
    key: 'followup',
    label: '🔄 Follow-up',
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    gerar: (c) =>
      `Olá, ${c.first_name || 'Dr(a)'}! Passando para saber se teve tempo de analisar a proposta do ${c.equipment_interest || 'equipamento'}. Alguma dúvida que posso esclarecer? 😊`,
  },
  {
    key: 'reativacao',
    label: '🔥 Reativação',
    color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    gerar: (c) =>
      `Olá, ${c.first_name || 'Dr(a)'}! Faz um tempo que não nos falamos. A Seamaty lançou novidades que combinam perfeitamente com a ${c.clinic_name || 'sua clínica'}. Posso te mostrar em 5 minutos? 🚀`,
  },
  {
    key: 'comodato',
    label: '🤝 Comodato',
    color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
    gerar: (c) =>
      `Olá, ${c.first_name || 'Dr(a)'}! Estou passando para apresentar uma condição especial de comodato do ${c.equipment_interest || 'analisador'}. Sem custo de equipamento, você paga só os insumos. Posso detalhar? 💡`,
  },
  {
    key: 'treinamento',
    label: '🎓 Treinamento/Pós-venda',
    color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    gerar: (c) =>
      `Olá, ${c.first_name || 'Dr(a)'}! Passando para agendar o treinamento do ${c.equipment_sold || 'equipamento'} e garantir que a equipe está confortável. Qual o melhor dia essa semana? 📚`,
  },
];

export default function WhatsAppRapido({ client }) {
  const [aberto, setAberto] = useState(false);

  if (!client) return null;

  const abrirWhatsApp = async (tipo) => {
    const tipoConfig = TIPOS.find(t => t.key === tipo);
    if (!tipoConfig) return;

    const mensagem = tipoConfig.gerar(client);
    const phone = (client.phone || '').replace(/\D/g, '');

    if (!phone) {
      toast.warning('Telefone não cadastrado. Edite o cliente para adicionar.');
      // Ainda copia o texto
      navigator.clipboard.writeText(mensagem).catch(() => {});
      toast.info('Mensagem copiada para área de transferência!');
      return;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');

    // Registrar no histórico (fire-and-forget, não bloqueia)
    base44.entities.Interaction?.create({
      client_id: client.id,
      client_name: client.first_name || client.full_name,
      type: 'whatsapp',
      notes: `[WA Rápido] Tipo: ${tipoConfig.label} — mensagem preparada`,
      date: new Date().toISOString(),
    }).catch(() => {});
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