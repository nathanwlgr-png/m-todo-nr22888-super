import React from 'react';
import { Clock, FlaskConical, Image as ImageIcon } from 'lucide-react';

export default function ClientProductDemoCard({ product, onOpen }) {
  return (
    <button type="button" onClick={() => onOpen(product)} className="overflow-hidden rounded-2xl text-left active:scale-[0.98] transition-transform" style={{ background: '#171717', border: '1px solid rgba(255,107,0,0.25)' }}>
      <div className="aspect-[4/3] flex items-center justify-center overflow-hidden" style={{ background: '#0d0d0d' }}>
        {product.imagem_url ? <img src={product.imagem_url} alt={product.nome_produto} loading="lazy" className="h-full w-full object-contain p-2" /> : <ImageIcon className="h-9 w-9 text-slate-700" />}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-black text-white">{product.nome_produto}</p>
        <p className="mt-1 text-[10px] font-bold uppercase text-orange-400">{product.linha || product.categoria?.replaceAll('_', ' ')}</p>
        <div className="mt-2 space-y-1 text-[10px] text-slate-400">
          {product.tempo_resultado && <p className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-400" />{product.tempo_resultado}</p>}
          {product.volume_amostra && <p className="flex items-center gap-1"><FlaskConical className="h-3 w-3 text-green-400" />{product.volume_amostra}</p>}
        </div>
      </div>
    </button>
  );
}