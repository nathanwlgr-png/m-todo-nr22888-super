/**
 * SeamatyEquipmentPanel — Painel de oportunidades de equipamentos no perfil do cliente.
 * Mostra: o que possui, o que falta, upgrade sugerido, preços corretos, script SPIN.
 * Usa SeamatyMaster como fonte central — nunca preço fixo aqui.
 */
import React, { useState } from 'react';
import { SPECS, PRECOS, formatPreco, getSugestaoUpgrade, getEquipamentosFaltantes, gerarScriptSPIN, IDENTIDADE } from '@/lib/SeamatyMaster';
import { ChevronDown, ChevronUp, Zap, TrendingUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function SeamatyEquipmentPanel({ client }) {
  const [expandSPIN, setExpandSPIN] = useState(false);

  if (!client) return null;

  const equipAtual = client.current_equipment || client.equipment_sold || '';
  const equipInteresse = client.equipment_interest || '';

  const faltantes = getEquipamentosFaltantes(equipAtual);
  const upgrade = getSugestaoUpgrade(equipAtual);
  const spin = gerarScriptSPIN(client);

  const specAtual = equipAtual ? SPECS[equipAtual] : null;
  const specInteresse = equipInteresse ? SPECS[equipInteresse] : null;
  const precoInteresse = equipInteresse ? PRECOS[equipInteresse] : null;

  const abrirWhatsAppOportunidade = (equip) => {
    const phone = (client.phone || '').replace(/\D/g, '');
    const nome = client.first_name || client.full_name || 'Dr(a)';
    const spec = SPECS[equip] || {};
    const preco = PRECOS[equip];
    const msg = `Olá, ${nome}. Tudo bem? Sou o Nathan Rosa, Consultor Técnico Comercial da Seamaty Brasil.\n\nOportunidade para a ${client.clinic_name || 'clínica'}: o *${equip}* — ${spec.descricao || ''}.\n\n${spec.parametros ? '📊 ' + spec.parametros : ''}\n${spec.tempo ? '⏱ ' + spec.tempo : ''}\n\n${preco ? '💰 À vista: ' + formatPreco(preco.avista) + ' | 5x cartão: ' + formatPreco(preco.cartao5x) : 'Preço sob validação'}\n\nPosso te mostrar em 10 minutos como isso funciona na rotina da clínica?\n\n${IDENTIDADE.assinatura}`;

    if (!phone) {
      try { navigator.clipboard.writeText(msg); } catch (_) {}
      toast.info('Telefone não cadastrado — mensagem copiada!');
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(255,107,0,0.08)' }}>
        <TrendingUp className="w-4 h-4 text-orange-400" />
        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">⚡ Oportunidades Seamaty</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Equipamento atual */}
        {equipAtual && (
          <div className="rounded-xl p-3" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <p className="text-[10px] text-slate-500 uppercase mb-1">Equipamento Atual</p>
            <p className="text-sm font-black text-white">{equipAtual}</p>
            {specAtual && (
              <p className="text-[11px] text-slate-400 mt-0.5">{specAtual.descricao}</p>
            )}
          </div>
        )}

        {/* Interesse */}
        {equipInteresse && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.3)' }}>
            <p className="text-[10px] text-orange-400 uppercase mb-1">Interesse Identificado</p>
            <p className="text-sm font-black text-orange-300">{equipInteresse}</p>
            {specInteresse && (
              <div className="mt-1 space-y-0.5">
                <p className="text-[11px] text-slate-400">{specInteresse.descricao}</p>
                <p className="text-[11px] text-slate-500">⏱ {specInteresse.tempo} | 📊 {specInteresse.parametros}</p>
              </div>
            )}
            {precoInteresse && (
              <div className="mt-2 flex gap-2">
                <span className="text-[11px] font-black text-green-400">À vista: {formatPreco(precoInteresse.avista)}</span>
                <span className="text-[11px] text-slate-500">5×: {formatPreco(precoInteresse.cartao5x)}</span>
              </div>
            )}
            <button
              onClick={() => abrirWhatsAppOportunidade(equipInteresse)}
              className="mt-2 w-full py-2 rounded-lg text-[11px] font-black flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(37,211,102,0.15)', color: '#25d366', border: '1px solid rgba(37,211,102,0.3)' }}
            >
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp — Proposta {equipInteresse}
            </button>
          </div>
        )}

        {/* Equipamentos faltantes */}
        {faltantes.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-blue-400 uppercase font-black">💡 Oportunidades de Completar Ciclo</p>
            {faltantes.map(({ equip, motivo }) => (
              <div key={equip} className="rounded-xl p-3" style={{ background: 'rgba(0,191,255,0.06)', border: '1px solid rgba(0,191,255,0.2)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-black text-blue-300">{equip}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{motivo}</p>
                    {PRECOS[equip] && (
                      <p className="text-[11px] text-green-400 mt-1">À vista: {formatPreco(PRECOS[equip].avista)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => abrirWhatsAppOportunidade(equip)}
                    className="p-2 rounded-lg shrink-0"
                    style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)' }}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upgrade sugerido */}
        {upgrade && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <p className="text-[10px] text-purple-400 uppercase font-black mb-1">🚀 Upgrade Sugerido</p>
            <p className="text-sm font-black text-purple-300">{upgrade.sugestao}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{upgrade.motivo}</p>
            <p className="text-[11px] text-purple-400 mt-0.5">✅ {upgrade.ganho}</p>
            {PRECOS[upgrade.sugestao] && (
              <p className="text-[11px] text-green-400 mt-1">À vista: {formatPreco(PRECOS[upgrade.sugestao].avista)}</p>
            )}
            <button
              onClick={() => abrirWhatsAppOportunidade(upgrade.sugestao)}
              className="mt-2 w-full py-1.5 rounded-lg text-[11px] font-black flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }}
            >
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp — Upgrade {upgrade.sugestao}
            </button>
          </div>
        )}

        {/* Script SPIN */}
        <div>
          <button
            onClick={() => setExpandSPIN(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-black"
            style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)', color: '#fb923c' }}
          >
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Script SPIN Sugerido</span>
            {expandSPIN ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {expandSPIN && (
            <div className="mt-2 space-y-2 rounded-xl p-3" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
              {[
                { label: 'S — Situação', text: spin.situacao, color: '#60a5fa' },
                { label: 'P — Problema', text: spin.problema, color: '#f87171' },
                { label: 'I — Implicação', text: spin.implicacao, color: '#fb923c' },
                { label: 'N — Necessidade', text: spin.necessidade, color: '#4ade80' },
                { label: '🎯 Fechamento', text: spin.fechamento, color: '#c084fc' },
              ].map(({ label, text, color }) => (
                <div key={label} className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase" style={{ color }}>{label}</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}