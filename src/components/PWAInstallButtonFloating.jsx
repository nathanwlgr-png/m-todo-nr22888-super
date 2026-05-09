import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Apple, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PWAInstallButtonFloating() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Detecta plataforma
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) {
      setPlatform('android');
    } else if (/iphone|ipad|ipod/i.test(ua)) {
      setPlatform('ios');
    } else {
      setPlatform('desktop');
    }

    // Verifica se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Se não tiver o evento (ex: iOS), mostra instruções manualmente
    const timer = setTimeout(() => {
      if (!deferredPrompt) {
        setShow(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-install-dismissed', Date.now());
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5" />
            <div>
              <p className="font-bold">Instalar Seamaty NR22</p>
              <p className="text-xs opacity-90">App + Offline + Rápido</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white hover:opacity-75"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {platform === 'android' && (
            <>
              <p className="text-sm text-slate-700">
                Acesse sem internet, sincroniza quando voltar online.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm space-y-2">
                <p className="font-semibold text-blue-900">📲 Para Android:</p>
                <ol className="text-blue-800 space-y-1 ml-4 list-decimal">
                  <li>Clique em <strong>"Instalar Agora"</strong> abaixo</li>
                  <li>Confirme no popup do navegador</li>
                  <li>O app aparece na sua tela inicial</li>
                </ol>
              </div>
              <Button
                onClick={handleInstallClick}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                <Download className="w-4 h-4" />
                Instalar Agora (Android)
              </Button>
            </>
          )}

          {platform === 'ios' && (
            <>
              <p className="text-sm text-slate-700">
                Acesse sem internet, sincroniza quando voltar online.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm space-y-2">
                <p className="font-semibold text-amber-900 flex items-center gap-2">
                  <Apple className="w-4 h-4" /> Para iPhone/iPad:
                </p>
                <ol className="text-amber-800 space-y-1 ml-4 list-decimal">
                  <li>Clique no botão <strong>Compartilhar</strong> (⬆️) no Safari</li>
                  <li>Procure por <strong>"Adicionar à Tela de Início"</strong></li>
                  <li>Confirme e o app fica na home</li>
                </ol>
              </div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleDismiss();
                }}
                className="block w-full text-center py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-lg text-sm"
              >
                Entendido ✓
              </a>
            </>
          )}

          {platform === 'desktop' && (
            <>
              <p className="text-sm text-slate-700">
                Instale na sua máquina para acesso rápido e offline.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-2">
                <p className="font-semibold text-green-900 flex items-center gap-2">
                  <Chrome className="w-4 h-4" /> Para Desktop:
                </p>
                <ol className="text-green-800 space-y-1 ml-4 list-decimal">
                  <li>Clique em <strong>"Instalar Agora"</strong> abaixo</li>
                  <li>Ou clique no ícone de instalação na barra do navegador</li>
                  <li>O app abre como janela independente</li>
                </ol>
              </div>
              <Button
                onClick={handleInstallClick}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                <Download className="w-4 h-4" />
                Instalar Agora (Desktop)
              </Button>
            </>
          )}

          <p className="text-xs text-slate-500 text-center mt-3">
            💾 Funciona offline | 📱 Sincroniza automático | ⚡ Acesso rápido
          </p>
        </div>
      </div>
    </div>
  );
}