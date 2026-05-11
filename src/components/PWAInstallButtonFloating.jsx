import React, { useState, useEffect } from 'react';
import { Download, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PWAInstallButtonFloating() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [step, setStep] = useState('prompt'); // 'prompt' | 'instructions'

  useEffect(() => {
    // Não mostrar se já está instalado como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Não mostrar se já fechou recentemente (24h)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 86400000) return;

    const ua = navigator.userAgent;
    if (/android/i.test(ua)) setPlatform('android');
    else if (/iphone|ipad|ipod/i.test(ua)) setPlatform('ios');
    else setPlatform('desktop');

    // Captura evento nativo (Chrome Android fora de iframe)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback: mostra após 4s se não tiver o evento (iframe, WebView, etc.)
    const timer = setTimeout(() => setShow(true), 4000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Instalação nativa via Chrome
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShow(false);
      setDeferredPrompt(null);
    } else {
      // Sem deferredPrompt: mostrar instruções manuais
      setStep('instructions');
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-install-dismissed', Date.now());
  };

  if (!show) return null;

  // ── Instruções manuais ──────────────────────
  if (step === 'instructions') {
    const appUrl = window.location.origin;
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.4)' }}>
          <div className="flex items-center justify-between p-4 border-b border-orange-900/40">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-orange-400" />
              <p className="font-black text-white">Instalar no Android</p>
            </div>
            <button onClick={handleDismiss}><X className="w-5 h-5 text-slate-400" /></button>
          </div>

          <div className="p-4 space-y-4">
            <div className="rounded-xl p-3 space-y-2" style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.2)' }}>
              <p className="text-xs font-black text-orange-400 uppercase tracking-wide">📲 Passo a passo:</p>
              <ol className="space-y-2">
                {[
                  'Abra este app no Chrome (não no navegador interno do Base44)',
                  'Toque nos 3 pontos ⋮ no canto superior direito do Chrome',
                  'Selecione "Adicionar à tela inicial" ou "Instalar app"',
                  'Confirme tocando em "Adicionar" — pronto! ✅',
                ].map((txt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
                    {txt}
                  </li>
                ))}
              </ol>
            </div>

            {/* Link direto para abrir no Chrome */}
            <a
              href={`intent://${appUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-white"
              style={{ background: 'linear-gradient(135deg, #ff6b00, #ff9500)' }}
            >
              <ExternalLink className="w-4 h-4" />
              Abrir no Chrome
            </a>

            <button onClick={handleDismiss} className="w-full text-xs text-slate-500 py-2">
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Prompt inicial ──────────────────────────
  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.4)' }}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-orange-400" />
            <div>
              <p className="font-black text-white text-sm">Instalar Seamaty NR22</p>
              <p className="text-[10px] text-orange-500">Acesso rápido • Funciona offline</p>
            </div>
          </div>
          <button onClick={handleDismiss}><X className="w-4 h-4 text-slate-500" /></button>
        </div>

        <div className="px-4 pb-4 flex gap-2 mt-2">
          <Button
            onClick={handleInstallClick}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-sm font-black gap-2"
          >
            <Download className="w-4 h-4" />
            Instalar Agora
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="border-slate-700 text-slate-400 text-sm"
          >
            Depois
          </Button>
        </div>
      </div>
    </div>
  );
}