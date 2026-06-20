/**
 * PWAInstallButtonFloating v2
 * - Só aparece no live app (não no editor base44)
 * - Detecta plataforma e oferece instalação nativa ou instruções
 * - Botão grande e visível no tablet
 */
import React, { useEffect, useState } from 'react';
import { Download, X, ExternalLink, Smartphone } from 'lucide-react';

export default function PWAInstallButtonFloating() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [step, setStep] = useState('prompt'); // 'prompt' | 'instructions'

  useEffect(() => {
    // ── BLOQUEAR no editor do Base44 ──────────────────────────────
    const isEditor = window.location.hostname.includes('base44.com') ||
                     window.location.hostname.includes('localhost') ||
                     window.self !== window.top; // dentro de iframe

    if (isEditor) return;

    // Não mostrar se já está instalado como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Não mostrar se fechou recentemente (24h)
    const dismissed = localStorage.getItem('pwa-dismissed-v2');
    if (dismissed && Date.now() - Number(dismissed) < 86400000) return;

    const ua = navigator.userAgent;
    if (/android/i.test(ua)) setPlatform('android');
    else if (/iphone|ipad|ipod/i.test(ua)) setPlatform('ios');
    else setPlatform('desktop');

    // Captura evento nativo Chrome/Edge
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Não abrir modal automaticamente: no campo, o aviso PWA não pode cobrir CRM/WhatsApp.
    const timer = null;

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
        localStorage.setItem('pwa-dismissed-v2', Date.now());
      }
      setDeferredPrompt(null);
    } else {
      setStep('instructions');
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-dismissed-v2', Date.now());
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed right-4 bottom-24 z-[80] rounded-full px-4 py-3 text-xs font-black text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, #ff6b00, #ff9500)', border: '1px solid rgba(255,255,255,0.18)' }}
      >
        Instalar app
      </button>
    );
  }

  // ── Instruções manuais ──────────────────────────────────────────
  if (step === 'instructions') {
    const steps = platform === 'ios'
      ? [
          'Toque no botão Compartilhar ⬆️ na barra inferior do Safari',
          'Role para baixo e toque "Adicionar à Tela de Início"',
          'Toque "Adicionar" no canto superior direito',
          'O app aparece na sua tela inicial! ✅',
        ]
      : [
          'Abra este app no Chrome (não no Base44 editor)',
          'Toque nos 3 pontos ⋮ no canto superior direito',
          'Toque "Adicionar à tela inicial" ou "Instalar app"',
          'Confirme tocando "Adicionar" ✅',
        ];

    return (
      <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.4)' }}>
          <div className="flex items-center justify-between p-5 border-b border-orange-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,107,0,0.15)' }}>
                <Smartphone className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="font-black text-white text-sm">Instalar como App</p>
                <p className="text-[11px] text-orange-500">Seamaty NR22888</p>
              </div>
            </div>
            <button onClick={handleDismiss}><X className="w-5 h-5 text-slate-400" /></button>
          </div>

          <div className="p-5 space-y-4">
            <ol className="space-y-3">
              {steps.map((txt, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0" style={{ background: 'linear-gradient(135deg, #ff6b00, #ff9500)' }}>{i + 1}</span>
                  <span className="text-sm text-slate-300 mt-0.5">{txt}</span>
                </li>
              ))}
            </ol>

            {platform === 'android' && (
              <a
                href={`intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-black text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #ff6b00, #ff9500)' }}
              >
                <ExternalLink className="w-4 h-4" />
                Abrir no Chrome
              </a>
            )}

            <button onClick={handleDismiss} className="w-full text-xs text-slate-500 py-2">
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Prompt inicial ──────────────────────────────────────────────
  return (
    <div className="fixed bottom-24 left-4 right-4 z-[90] max-w-sm mx-auto">
      <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ background: '#111', border: '2px solid rgba(255,107,0,0.5)' }}>
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #ff6b00, #ff9500)' }}>
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-black text-white text-base">Instalar Seamaty NR22</p>
            <p className="text-xs text-orange-400">Como app nativo no seu tablet</p>
          </div>
          <button onClick={handleDismiss}><X className="w-4 h-4 text-slate-500" /></button>
        </div>

        <div className="px-5 pb-5 space-y-2">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {['Acesso rápido', 'Rápido', 'Tela cheia'].map(f => (
              <div key={f} className="text-center py-2 rounded-xl text-[11px] font-bold text-orange-300" style={{ background: 'rgba(255,107,0,0.08)' }}>
                ✓ {f}
              </div>
            ))}
          </div>

          <button
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-base"
            style={{ background: 'linear-gradient(135deg, #ff6b00, #ff9500)' }}
          >
            <Download className="w-5 h-5" />
            Instalar Agora
          </button>

          <button onClick={handleDismiss} className="w-full text-xs text-slate-600 py-2">
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}