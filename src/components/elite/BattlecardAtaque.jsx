import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Swords, Shield, Target, Crosshair } from 'lucide-react';

// Marcas concorrentes conhecidas (mesma lista do CompetitorTracker)
const MARCAS = ['Seamaty', 'Idexx', 'Heska', 'Zoetis', 'Mindray', 'Biocom', 'Biobrasil', 'Wiener', 'Bioclin', 'Labtest', 'Kovalent'];

// Detecta a marca concorrente a partir do texto do equipamento atual do cliente
function detectarMarca(texto) {
  if (!texto) return null;
  const t = texto.toLowerCase();
  return MARCAS.find(m => m !== 'Seamaty' && t.includes(m.toLowerCase())) || null;
}

/**
 * Battlecard de Ataque — cruza o equipamento atual do cliente com a Matriz V10
 * (CompetitorTracker) e exibe o argumento de venda Seamaty + objeções já prontos.
 * Sem IA: match instantâneo, zero consumo de tokens.
 */
export default function BattlecardAtaque({ currentEquipment, cnpj, clinicName }) {
  const { data: trackers = [] } = useQuery({
    queryKey: ['battlecard-trackers'],
    queryFn: () => base44.entities.CompetitorTracker.filter({ ativo: true }, '-updated_date', 50).catch(() => []),
    staleTime: 5 * 60 * 1000,
  });

  const marca = detectarMarca(currentEquipment);
  if (!marca) return null;

  // Procura na matriz: primeiro por CNPJ exato, depois pela marca
  const porCnpj = cnpj && trackers.find(t => t.cnpj && t.cnpj.replace(/\D/g, '') === String(cnpj).replace(/\D/g, ''));
  const porMarca = trackers.find(t => t.marca_concorrente === marca && t.argumento_contra);
  const tracker = porCnpj?.argumento_contra ? porCnpj : porMarca;

  if (!tracker?.argumento_contra) return null;

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.35)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-red-400" />
          <p className="text-xs font-black text-red-400 uppercase tracking-widest">Battlecard de Ataque</p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
          style={{ background: 'rgba(255,68,68,0.15)', color: '#ff6b6b' }}>
          vs {marca}
        </span>
      </div>

      <p className="text-[11px] text-slate-500 mb-3">
        Cliente usa <strong className="text-red-300">{marca}</strong>. Use o roteiro abaixo para converter.
      </p>

      {/* Argumento de ataque Seamaty */}
      <div className="rounded-xl p-3 mb-2" style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.25)' }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Target className="w-3.5 h-3.5 text-green-400" />
          <p className="text-[10px] font-black text-green-400 uppercase tracking-wider">Argumento Seamaty</p>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{tracker.argumento_contra}</p>
      </div>

      {/* Oportunidade detectada */}
      {tracker.oportunidade_detectada && (
        <div className="rounded-xl p-3 mb-2" style={{ background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.25)' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Crosshair className="w-3.5 h-3.5 text-orange-400" />
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-wider">Brecha Detectada</p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{tracker.oportunidade_detectada}</p>
        </div>
      )}

      {/* Inteligência IA do concorrente */}
      {tracker.inteligencia_ia && (
        <div className="rounded-xl p-3" style={{ background: 'rgba(0,191,255,0.06)', border: '1px solid rgba(0,191,255,0.2)' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Inteligência do Concorrente</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{tracker.inteligencia_ia}</p>
        </div>
      )}
    </div>
  );
}