import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  MapPin, Navigation, Camera, Plug, Send, Loader2, Check, X,
  ChevronDown, ChevronUp, ShieldCheck, ExternalLink, AlertTriangle
} from 'lucide-react';

// Painel "Resolver Pendências" — cada pendência do checklist 100% tem 1 botão de autorização/ação.
// SAFE: geocode em lote só gera sugestões na fila; conexões abrem OAuth; GPS/fotos abrem a ação certa.
export default function ResolverPendencias() {
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(null);
  const [resultados, setResultados] = useState({});

  // Conta clientes sem coordenada (para mostrar quantos faltam)
  const { data: semCoord = 0 } = useQuery({
    queryKey: ['clientes-sem-coord'],
    queryFn: async () => {
      const todos = await base44.entities.Client.list('-created_date', 500).catch(() => []);
      return todos.filter(c => (!c.latitude || !c.longitude) && (c.address || c.city)).length;
    },
    staleTime: 60000,
  });

  const setRes = (key, value) => setResultados(prev => ({ ...prev, [key]: value }));

  // 1. GPS físico — abre a captura de posição real no dispositivo
  const capturarGPS = () => {
    setBusy('gps');
    if (!navigator.geolocation) {
      setRes('gps', { ok: false, msg: 'Este dispositivo não suporta GPS.' });
      setBusy(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRes('gps', { ok: true, msg: `GPS ativo: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (precisão ${Math.round(pos.coords.accuracy)}m)` });
        setBusy(null);
      },
      (err) => {
        setRes('gps', { ok: false, msg: `GPS negado/erro: ${err.message}. Autorize a localização no navegador.` });
        setBusy(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 2. Geocode em lote SAFE — gera sugestões de coordenada para aprovação
  const geocodeLote = async () => {
    setBusy('geocode');
    try {
      const r = await base44.functions.invoke('geocodeLoteSafe', { limite: 10 });
      const d = r.data || {};
      setRes('geocode', { ok: d.success, msg: d.message || 'Concluído.' });
    } catch (e) {
      setRes('geocode', { ok: false, msg: e.message });
    } finally {
      setBusy(null);
    }
  };

  // 3. Conexões OAuth — não abrir conector com slug direto no app.
  // A autorização real é feita pelo assistente/Base44 para evitar falha no Samsung Browser.
  const abrirIntegracoes = (integration) => {
    setRes(integration, { ok: true, msg: 'Conexão preparada. A autorização segura deve ser confirmada pelo cartão de OAuth no chat/Base44.' });
    window.location.href = '/Integrations';
  };

  // 4. Telegram — teste real
  const testarTelegram = async () => {
    setBusy('telegram');
    try {
      const r = await base44.functions.invoke('testTelegramBot', {});
      const d = r.data || {};
      setRes('telegram', { ok: d.success, msg: d.message || 'Concluído.' });
    } catch (e) {
      setRes('telegram', { ok: false, msg: e.message });
    } finally {
      setBusy(null);
    }
  };

  const Acao = ({ id, icon: Icon, titulo, desc, tag, onClick, link, cor = '#ff9500', loading }) => {
    const res = resultados[id];
    return (
      <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cor}22` }}>
              <Icon className="w-4 h-4" style={{ color: cor }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-white leading-tight">{titulo}</p>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{desc}</p>
            </div>
          </div>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap bg-amber-500/10 text-amber-400">{tag}</span>
        </div>

        {link ? (
          <a href={link} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black text-black" style={{ background: cor }}>
            <ExternalLink className="w-3.5 h-3.5" /> Autorizar
          </a>
        ) : (
          <button onClick={onClick} disabled={loading} className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black text-black disabled:opacity-50" style={{ background: cor }}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Autorizar / Executar
          </button>
        )}

        {res && (
          <div className={`mt-2 flex items-start gap-1.5 text-[11px] ${res.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
            {res.ok ? <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
            <span>{res.msg}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl bg-[#0f0f11] border border-amber-500/30">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-amber-400">Resolver Pendências (botões de autorização)</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-amber-400" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Cada botão executa só a ação dele. Nada é aplicado no CRM sem sua aprovação.
          </div>

          <Acao
            id="gps"
            icon={Navigation}
            titulo="GPS físico em tablet/celular"
            desc="Ativa a leitura de localização real do dispositivo."
            tag="DISPOSITIVO REAL"
            onClick={capturarGPS}
            loading={busy === 'gps'}
            cor="#3b82f6"
          />

          <Acao
            id="geocode"
            icon={MapPin}
            titulo={`Validar coordenadas — ${semCoord} clientes sem GPS`}
            desc="Gera sugestões de coordenada (lote de 10) para você aprovar."
            tag="APROVAÇÃO HUMANA"
            onClick={geocodeLote}
            loading={busy === 'geocode'}
            cor="#10b981"
          />

          <Acao
            id="fotos"
            icon={Camera}
            titulo="29 produtos sem foto oficial"
            desc="Abre o gerenciador para subir as fotos oficiais."
            tag="UPLOAD MANUAL"
            link="/ProductManager"
            cor="#a855f7"
          />

          <Acao
            id="gmail"
            icon={Plug}
            titulo="Conectar Gmail"
            desc="Envio/leitura de e-mails exige autorização segura fora do navegador mobile."
            tag="OAUTH SEGURO"
            onClick={() => abrirIntegracoes('gmail')}
            loading={busy === 'gmail'}
            cor="#ef4444"
          />

          <Acao
            id="googledrive"
            icon={Plug}
            titulo="Conectar Google Drive / Docs"
            desc="Arquivos e documentos usam autorização OAuth segura do Base44."
            tag="OAUTH SEGURO"
            onClick={() => abrirIntegracoes('googledrive')}
            loading={busy === 'googledrive'}
            cor="#facc15"
          />

          <Acao
            id="instagram"
            icon={Plug}
            titulo="Conectar Instagram"
            desc="Publicação e comentários exigem autorização segura da conta Business."
            tag="OAUTH SEGURO"
            onClick={() => abrirIntegracoes('instagram')}
            loading={busy === 'instagram'}
            cor="#ec4899"
          />

          <Acao
            id="telegram"
            icon={Send}
            titulo="Telegram bot — teste real"
            desc="Envia uma mensagem de teste para validar o bot."
            tag="DISPOSITIVO REAL"
            onClick={testarTelegram}
            loading={busy === 'telegram'}
            cor="#0ea5e9"
          />
        </div>
      )}
    </div>
  );
}