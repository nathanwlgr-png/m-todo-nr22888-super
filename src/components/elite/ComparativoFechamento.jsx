import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, AlertTriangle, MessageSquare, FileText } from 'lucide-react';

const DIFERENCIAIS = [
  ['Laboratório interno', 'Resultado rápido na clínica', 'Cliente deixa de depender de laboratório externo'],
  ['ROI consultivo', 'Proposta com economia mensal', 'Venda defendida por número, não por preço'],
  ['Portfólio Seamaty', 'Bioquímica, hematologia, hemogas e imuno', 'Mais exames no mesmo relacionamento'],
  ['Campo + suporte', 'Vendedor com rota, agenda e WhatsApp', 'Menos atrito até assinatura'],
];

function ComparativoLinha({ item }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-[11px]">
      <div className="rounded-xl p-2 bg-emerald-500/10 border border-emerald-500/25">
        <p className="font-black text-emerald-300">✓ {item[0]}</p>
        <p className="text-slate-300 mt-1">{item[1]}</p>
      </div>
      <div className="rounded-xl p-2 bg-red-500/10 border border-red-500/25">
        <p className="font-black text-red-300">⚠ Concorrente</p>
        <p className="text-slate-300 mt-1">{item[2]}</p>
      </div>
    </div>
  );
}

export default function ComparativoFechamento() {
  const { data: concorrentes = [] } = useQuery({
    queryKey: ['comparativo-fechamento'],
    queryFn: () => base44.entities.CompetitorTracker.filter({ ativo: true }, '-ultima_investigacao', 20).catch(() => []),
    staleTime: 300000,
  });

  const quente = concorrentes.find(c => c.status_monitoramento === 'oportunidade_quente' || c.nivel_ameaca === 'critico' || c.argumento_contra) || concorrentes[0];

  return (
    <div className="rounded-2xl p-4 bg-[#0f0f11] border border-emerald-500/25 shadow-xl space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xs font-black text-emerald-300 uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Comparativo para Fechar</h2>
          <p className="text-[11px] text-slate-400 mt-1">Use lado a lado: Seamaty x oferta concorrente.</p>
        </div>
        <span className="text-[9px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 font-black">SEM IA</span>
      </div>

      <div className="space-y-2">
        {DIFERENCIAIS.map(item => <ComparativoLinha key={item[0]} item={item} />)}
      </div>

      {quente && (
        <div className="rounded-xl p-3 bg-orange-500/10 border border-orange-500/30">
          <p className="text-[10px] font-black text-orange-300 uppercase flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Contra-argumento pronto</p>
          <p className="text-xs text-slate-200 mt-1 font-bold">{quente.nome}{quente.marca_concorrente ? ` · ${quente.marca_concorrente}` : ''}</p>
          <p className="text-[11px] text-slate-300 mt-1">{quente.argumento_contra || quente.oportunidade_detectada || 'Investigue este concorrente e use ROI + velocidade de resultado como âncora de fechamento.'}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Link to="/GenerateWhatsAppIntegrated" className="rounded-xl py-2 text-center text-xs font-black bg-emerald-600 text-white flex items-center justify-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> SPIN</Link>
        <Link to="/ProposalGenerator" className="rounded-xl py-2 text-center text-xs font-black bg-orange-600 text-white flex items-center justify-center gap-1"><FileText className="w-3.5 h-3.5" /> Proposta</Link>
      </div>
    </div>
  );
}