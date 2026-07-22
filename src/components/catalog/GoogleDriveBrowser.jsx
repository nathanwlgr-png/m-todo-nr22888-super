import React, { useState } from 'react';
import { ExternalLink, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useGoogleDriveFiles from '@/hooks/useGoogleDriveFiles';

export default function GoogleDriveBrowser() {
  const [search, setSearch] = useState('');
  const { loading, connected, files, load, connect } = useGoogleDriveFiles();
  return <section className="rounded-2xl border bg-card p-4">
    <h2 className="mb-1 font-bold">Catálogos e fotos no Google Drive</h2>
    <p className="mb-3 text-xs text-muted-foreground">Cada usuário conecta a própria conta. O CRM possui acesso somente leitura.</p>
    {!connected && !loading && <Button onClick={connect} className="w-full">Conectar meu Google Drive</Button>}
    {loading && <Loader2 className="mx-auto h-5 w-5 animate-spin" />}
    {connected && <>
      <div className="mb-3 flex gap-2"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar catálogo ou foto" /><Button variant="outline" size="icon" onClick={() => load(search)}><Search className="h-4 w-4" /></Button></div>
      <div className="max-h-64 space-y-2 overflow-y-auto">{files.map((file) => <a key={file.id} href={file.webViewLink} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-between rounded-xl border p-3 text-sm"><span className="truncate">{file.name}</span><ExternalLink className="h-4 w-4 shrink-0" /></a>)}</div>
      {!files.length && <p className="py-3 text-center text-sm text-muted-foreground">Nenhum arquivo encontrado.</p>}
    </>}
  </section>;
}