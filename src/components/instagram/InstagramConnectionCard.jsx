import React from 'react';
import { Instagram, Loader2, LogIn, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InstagramConnectionCard({ user, connected, account, loading, onLogin, onConnect, onDisconnect }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Instagram className="h-4 w-4 text-pink-600" /> Instagram Business
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : !user ? (
        <Button onClick={onLogin} className="w-full gap-2"><LogIn /> Entrar para conectar</Button>
      ) : connected ? (
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-sm font-semibold">@{account?.username}</p><p className="text-xs text-muted-foreground">Conta individual conectada</p></div>
          <Button variant="outline" size="sm" onClick={onDisconnect}><Unplug /> Desconectar</Button>
        </div>
      ) : (
        <Button onClick={onConnect} className="w-full bg-pink-600 hover:bg-pink-700">Conectar minha conta</Button>
      )}
    </div>
  );
}