import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image as ImageIcon } from 'lucide-react';

const fields = [['Descrição', 'descricao_comercial'], ['Especificações técnicas', 'especificacoes'], ['Parâmetros', 'parametros'], ['Tempo de resultado', 'tempo_resultado'], ['Volume de amostra', 'volume_amostra'], ['Indicado para', 'indicado_para'], ['Argumentos de venda', 'argumentos_venda']];

export default function ClientProductDemoDetails({ product, onClose }) {
  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto bg-zinc-950 text-white border-orange-500/30">
        {product && <>
          <DialogHeader><DialogTitle className="pr-6 text-xl text-white">{product.nome_produto}</DialogTitle></DialogHeader>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="aspect-[4/3] rounded-2xl flex items-center justify-center overflow-hidden bg-zinc-900">
              {product.imagem_url ? <img src={product.imagem_url} alt={product.nome_produto} className="h-full w-full object-contain p-3" /> : <ImageIcon className="h-14 w-14 text-zinc-700" />}
            </div>
            <div className="space-y-3">
              {fields.filter(([, key]) => product[key]).map(([label, key]) => <section key={key} className="rounded-xl bg-zinc-900 p-3"><h3 className="mb-1 text-[10px] font-black uppercase tracking-wider text-orange-400">{label}</h3><p className="whitespace-pre-line text-sm leading-relaxed text-zinc-200">{product[key]}</p></section>)}
            </div>
          </div>
        </>}
      </DialogContent>
    </Dialog>
  );
}