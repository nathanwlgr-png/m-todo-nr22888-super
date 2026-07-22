import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clipboard, ExternalLink, FileText, MessageCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import WhatsAppSendModal from '@/components/WhatsAppSendModal';

const buildLink = (request) => `${window.location.origin}/CatalogoCliente?codigo=${encodeURIComponent(request.client_code)}&pedido=${request.id}&token=${encodeURIComponent(request.access_token)}`;

export default function ClientCatalogRequestPanel({ client }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const { data: requests = [], refetch } = useQuery({
    queryKey: ['catalog-requests', client.id],
    queryFn: () => base44.entities.CatalogRequest.filter({ client_id: client.id }, '-updated_date', 10),
  });
  const latest = requests[0];
  const expired = latest && (!latest.expires_at || new Date(latest.expires_at).getTime() <= Date.now());

  useEffect(() => {
    const unsubscribe = base44.entities.CatalogRequest.subscribe(event => {
      if (event.data?.client_id === client.id) refetch();
    });
    return unsubscribe;
  }, [client.id, refetch]);

  const prepareWhatsApp = () => {
    if (!client.phone) { toast.error('Cliente sem WhatsApp cadastrado'); return; }
    const name = client.first_name || client.full_name || 'Olá';
    const clinic = client.clinic_name ? ` para a ${client.clinic_name}` : '';
    const items = (latest.selected_items || []).map(item => `• ${item.quantity || 1}x ${item.product_name}`).join('\n');
    setMessage(`Olá, ${name}. Revisei sua seleção${clinic}:\n${items}\n\nVou validar compatibilidade, quantidades, aplicação técnica e condição comercial antes de montar o orçamento. Posso preparar a proposta com as opções de pagamento adequadas ao seu cenário?`);
  };

  const createRequest = async () => {
    const code = client.external_code || client.id;
    const verificationCode = String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000);
    const request = await base44.entities.CatalogRequest.create({
      client_id: client.id, client_code: code,
      client_name: client.clinic_name || client.full_name || client.first_name,
      access_token: crypto.randomUUID(), verification_code: verificationCode,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'enviado', selected_items: [], revision: 0,
      change_history: [{ changed_at: new Date().toISOString(), action: 'criado', actor: 'vendedor' }],
    });
    queryClient.invalidateQueries({ queryKey: ['catalog-requests', client.id] });
    await navigator.clipboard.writeText(buildLink(request));
    const name = client.first_name || client.full_name || 'Olá';
    setMessage(`Olá, ${name}. Use este link para selecionar os produtos e quantidades (sem valores):\n${buildLink(request)}\n\nCódigo de confirmação: ${verificationCode}\nO link é válido por 24 horas.`);
    toast.success('Link temporário criado e copiado');
  };

  const updateStatus = async (status, action) => {
    const history = [...(latest.change_history || []), { changed_at: new Date().toISOString(), action, actor: 'vendedor' }];
    await base44.entities.CatalogRequest.update(latest.id, {
      status, change_history: history,
      ...(status === 'validado' ? { validated_at: new Date().toISOString() } : {}),
    });
    queryClient.invalidateQueries({ queryKey: ['catalog-requests', client.id] });
    toast.success(status === 'validado' ? 'Seleção validada' : 'Seleção reaberta');
  };

  return (
    <section className="rounded-2xl border border-orange-500/20 bg-neutral-950 p-4">
      <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-orange-400">Catálogo para o cliente</p>
      {!latest || expired ? <><button onClick={createRequest} className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black">{expired ? 'Criar novo link de 24 horas' : 'Criar e copiar link'}</button>{expired && <p className="mt-2 text-center text-xs text-slate-500">O link anterior expirou.</p>}</> : <>
        <div className="mb-3 flex items-center justify-between gap-2"><div><p className="text-sm font-bold text-white">{latest.selected_items?.length || 0} produtos · {(latest.selected_items || []).reduce((sum, item) => sum + (item.quantity || 1), 0)} unidades</p><p className="text-xs text-slate-500">Status: {latest.status} · revisão {latest.revision || 0}{latest.signed_at ? ' · confirmado por código' : ''}</p><p className="text-[10px] text-slate-600">Expira: {latest.expires_at ? new Date(latest.expires_at).toLocaleString('pt-BR') : '—'}</p></div><span className="text-xs text-slate-500">{latest.client_code}</span></div>
        {(latest.selected_items || []).map(item => <p key={`${item.product_source}:${item.product_id}`} className="border-t border-neutral-800 py-2 text-xs text-slate-300"><strong>{item.quantity || 1}x</strong> {item.product_name}</p>)}
        {!!latest.change_history?.length && <div className="mt-3 rounded-xl bg-neutral-900 p-3"><p className="mb-2 text-[10px] font-black uppercase text-slate-500">Últimas alterações</p>{latest.change_history.slice(-5).reverse().map((change, index) => <p key={`${change.changed_at}-${index}`} className="text-[11px] text-slate-400">{change.action}{change.product_name ? `: ${change.product_name}` : ''}{change.quantity ? ` (${change.quantity}x)` : ''} · {new Date(change.changed_at).toLocaleString('pt-BR')}</p>)}</div>}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={async () => { await navigator.clipboard.writeText(buildLink(latest)); toast.success('Link copiado'); }} className="flex items-center justify-center gap-2 rounded-xl border border-orange-500/30 py-2 text-xs font-bold text-orange-400"><Clipboard className="h-4 w-4" />Copiar link</button>
          <a href={buildLink(latest)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 py-2 text-xs font-bold text-slate-300"><ExternalLink className="h-4 w-4" />Abrir</a>
          <button onClick={() => setMessage(`Olá, ${client.first_name || client.full_name || ''}. Selecione os produtos e quantidades neste link (sem valores):\n${buildLink(latest)}\n\nCódigo de confirmação: ${latest.verification_code}\nVálido por 24 horas.`)} className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-xs font-black text-black"><MessageCircle className="h-4 w-4" />Enviar link e código no WhatsApp</button>
          {latest.status === 'aguardando_validacao' && <button onClick={() => updateStatus('validado', 'validado')} className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-green-500 py-2 text-xs font-black text-black"><CheckCircle2 className="h-4 w-4" />Validar para orçamento</button>}
          {latest.status === 'validado' && <><a href={`/ProposalGenerator?client_id=${client.id}&catalog_request_id=${latest.id}`} className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-xs font-black text-black"><FileText className="h-4 w-4" />Gerar orçamento e pagamento</a><button onClick={() => updateStatus('reaberto', 'reaberto')} className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-slate-700 py-2 text-xs font-bold text-slate-300"><RotateCcw className="h-4 w-4" />Permitir alterações</button></>}
          {!!latest.selected_items?.length && <button onClick={prepareWhatsApp} className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-xs font-black text-black"><MessageCircle className="h-4 w-4" />WhatsApp personalizado</button>}
        </div>
        {latest.status === 'validado' && <button onClick={createRequest} className="mt-2 w-full py-2 text-xs font-bold text-orange-400">Criar nova seleção</button>}
      </>}
      {message && <WhatsAppSendModal client={client} initialMessage={message} onClose={() => setMessage('')} />}
    </section>
  );
}