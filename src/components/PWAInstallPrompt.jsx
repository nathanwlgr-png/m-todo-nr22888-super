import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShow(false);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = () => {
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If no install prompt, show manual install info on mobile
    const timer = setTimeout(() => {
      if (!show && isMobile) {
        setShow(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [show, isMobile]);

  const handleInstall = async () => {
    if (window.showInstallPrompt) {
      window.showInstallPrompt();
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-dismiss', Date.now());
  };

  if (!show || !isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-slate-900 to-slate-800 border-t border-orange-500/30 backdrop-blur-sm p-4 animate-in slide-in-from-bottom">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-5 h-5 text-orange-400" />
              <h3 className="font-bold text-white">Instalar Seamaty NR22</h3>
            </div>
            <p className="text-sm text-slate-300 mb-3">
              Adicione o app à sua tela inicial. Acesse offline, integração perfeita com seu tablet Samsung.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
              >
                <Download className="w-4 h-4" />
                Instalar Agora
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Depois
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}