import * as React from 'react';
const { useState } = React;
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AlertTriangle, ChevronRight, MessageSquare, Zap, X } from 'lucide-react';

// Clientes com volume entre 40-60 exames/mês = zona de comodato ideal
function isComodatoZone(client) {
  const vol = client.current_volume;
  // current_volume enum: 'menos_40_mes' | '40_120_mes' | '120_230_mes' | 'mais_230_mes'
  // Zona alvo: 40_120_mes + sem equipamento próprio ou com equipamento antigo
  if (vol !== '40_120_mes') return false;
  // Extra peso: sem equipamento atual ou terceirizado
  return true;
}

function getComodatoScore(client) {
  let score = 0;
  if (client.current_volume === '40_120_mes') score += 60;
  if (!client.current_equipment || client.current_equipment === '' || client.current_equipment?.toLowerCase().includes('terceiriz')) score += 25;
  if (client.client_type === 'laboratorio_terceirizado' || client.client_type === 'clinica_pequena' || client.client_type === 'clinica_media') score += 15;
  if (client.pipeline_stage === 'lead' || client.pipeline_stage === 'qualificado') score += 10;
  return Math.min(100, score);
}

export default function ComodatoAlertMonitor() {
  const [dismissed, setDismissed] = useState({});
  const [expanded, setExpanded] = useState(true);

  const { data: clients = [] } = useQuery({
    queryKey: ['comodato-monitor'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
    staleTime: 120000,
  });

  const targets = clients
    .filter(c => isComodatoZone(c) && !dismissed[c.id])
    .map(c => ({ ...c, _comodatoScore: getComodatoScore(c) }))
    .sort((a, b) => b._comodatoScore - a._comodatoScore)
    .slice(0, 8);

  if (targets.length === 0) return null;

  const whatsMsg = (c) => {
    const nome = c.first_name || 'Dr(a).';
    return encodeURIComponent(
      `Olá ${nome}! 👋 Sou o Nathan da Seamaty Brasil.\n\n` +
      `Analisando o perfil da ${c.clinic_name || 'sua clínica'}, identificamos que vocês estão no volume ideal para nosso modelo de *COMODATO* — você usa o equipamento sem custo de aquisição, pagando apenas pelos insumos conforme o uso.\n\n` +
      `Com 40-60 exames bioquímicos/mês, o ROI é imediato e você elimina a dependência de laboratório terceirizado. Posso te mostrar os números?`
    );
  };

  return (
    <div className="rounded-2xl mb-4 overflow-hidden" style={{ background: '#0d0000', border: '2px solid rgba(239,68,68,0.5)', boxShadow: '0 0 20px rgba(239,68,68,0.15)' }}>
      {/* Header pulsante */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: 'linear-gradient(90deg, #1a0000, #2d0000)' }}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          </div>
          <span className="text-sm font-black text-red-400">🔴 OPORTUNIDADE COMODATO — {targets.length} CLÍNICAS</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse"
            style={{ background: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>
            ZONA 40-60 EXAMES/MÊS
          </span>
        </div>
        <ChevronRight className={`w-4 h-4 text-red-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Subtítulo */}
      <div className="px-4 py-2 text-xs" style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
        💡 Volume ideal para comodato: cliente usa o equip. sem custo de compra, paga só insumos. ROI imediato.
      </div>

      {expanded && (
        <div className="divide-y" style={{ borderColor: 'rgba(239,68,68,0.1)' }}>
          {targets.map((c) => {
            const phone = c.phone?.replace(/\D/g, '');
            const whatsUrl = phone ? `https://wa.me/${phone}?text=${whatsMsg(c)}` : null;
            return (
              <div key={c.id} className="px-4 py-3 flex items-center gap-3"
                style={{ background: 'rgba(239,68,68,0.04)' }}>

                {/* Score */}
                <div className="w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}>
                  <p className="text-xs font-black text-red-400 leading-none">{c._comodatoScore}</p>
                  <p className="text-[7px] text-red-600">pts</p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white truncate">{c.first_name} {c.full_name?.split(' ').slice(-1)[0] || ''}</p>
                  <p className="text-xs truncate" style={{ color: '#fca5a5' }}>{c.clinic_name || c.city || '—'}</p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                      40-60 exames/mês
                    </span>
                    {!c.current_equipment && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(245,158,11,0.2)', color: '#fcd34d' }}>
                        sem equip. próprio
                      </span>
                    )}
                    {c.city && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: '#888' }}>{c.city}</span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {whatsUrl && (
                    <a href={whatsUrl} target="_blank" rel="noopener noreferrer">
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                        style={{ background: 'rgba(0,200,81,0.2)', border: '1px solid rgba(0,200,81,0.4)' }}
                        title="Enviar proposta comodato via WhatsApp">
                        <MessageSquare className="w-4 h-4 text-green-400" />
                      </button>
                    </a>
                  )}
                  <Link to={`${createPageUrl('ClientProfile')}?id=${c.id}`}>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <ChevronRight className="w-4 h-4 text-red-400" />
                    </button>
                  </Link>
                  <button
                    onClick={() => setDismissed(p => ({ ...p, [c.id]: true }))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: '#1a1a1a', border: '1px solid #333' }}
                    title="Dispensar alerta">
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {expanded && (
        <div className="px-4 py-2 flex items-center justify-between"
          style={{ background: 'rgba(239,68,68,0.06)', borderTop: '1px solid rgba(239,68,68,0.15)' }}>
          <span className="text-[10px] font-bold" style={{ color: '#888' }}>
            <Zap className="w-3 h-3 inline mr-1 text-yellow-500" />
            Comodato: SMT-120VP / QT3 · ~40 exames bioquím./mês = ROI imediato
          </span>
          <Link to={createPageUrl('Clients')}>
            <span className="text-[10px] font-bold text-red-500 underline">ver todos</span>
          </Link>
        </div>
      )}
    </div>
  );
}