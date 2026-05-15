import * as React from 'react';
const { useEffect, useState } = React;
import { Check, X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PWAStatusChecklist() {
  const [checks, setChecks] = useState({
    manifest: false,
    sw: false,
    offline: false,
    https: false,
    installable: false,
  });

  useEffect(() => {
    const checkPWA = async () => {
      // Check manifest
      const hasManifest = !!document.querySelector('link[rel="manifest"]');

      // Check service worker
      const hasSW = 'serviceWorker' in navigator;
      const swRegistered = hasSW && navigator.serviceWorker.controller;

      // Check HTTPS/localhost
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';

      // Check if can install
      const installable = typeof window.showInstallPrompt === 'function';

      // Check offline capability
      const hasCache = hasManifest && hasSW;

      setChecks({
        manifest: hasManifest,
        sw: swRegistered,
        offline: hasCache,
        https: isSecure,
        installable: installable || isSecure,
      });
    };

    setTimeout(checkPWA, 1000);
  }, []);

  const items = [
    { label: 'Manifest.json', status: checks.manifest, tip: 'Meta informações do app' },
    { label: 'Service Worker', status: checks.sw, tip: 'Cache offline ativo' },
    { label: 'HTTPS/Secure', status: checks.https, tip: 'Protocolo seguro' },
    { label: 'Instalável', status: checks.installable, tip: 'Pronto para instalar' },
    { label: 'Modo Offline', status: checks.offline, tip: 'Funciona sem internet' },
  ];

  const allGood = Object.values(checks).every(v => v);

  return (
    <Card className="border border-orange-500/30 bg-gradient-to-br from-orange-950/20 to-slate-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-400">
          {allGood ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          Status PWA — Aplicativo Instalável
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
              {item.status ? (
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <X className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${item.status ? 'text-green-400' : 'text-red-400'}`}>
                  {item.label}
                </p>
                <p className="text-xs text-slate-500">{item.tip}</p>
              </div>
            </div>
          ))}
        </div>

        {allGood && (
          <div className="mt-4 p-3 rounded-lg bg-green-950/30 border border-green-700/50">
            <p className="text-sm text-green-400 font-bold">
              ✅ Aplicativo pronto para instalar no tablet Samsung
            </p>
            <p className="text-xs text-green-600 mt-1">
              Clique em "Instalar Agora" quando a notificação aparecer, ou acesse: Menu → Instalar aplicativo
            </p>
          </div>
        )}

        {!allGood && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-950/30 border border-yellow-700/50">
            <p className="text-sm text-yellow-400 font-bold">
              ⚠️ Alguns requisitos não foram atendidos
            </p>
            <ul className="text-xs text-yellow-600 mt-2 space-y-1 ml-4 list-disc">
              {!checks.manifest && <li>Manifest.json não encontrado</li>}
              {!checks.sw && <li>Service Worker não registrado</li>}
              {!checks.https && <li>Requer HTTPS (localhost OK para dev)</li>}
              {!checks.installable && <li>Verifique suporte do navegador</li>}
            </ul>
          </div>
        )}

        <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs font-bold text-slate-300 mb-2">📲 Como instalar no tablet:</p>
          <ol className="text-xs text-slate-400 space-y-1 ml-4 list-decimal">
            <li>Abra no Samsung Internet ou Chrome</li>
            <li>Toque no botão "Instalar Agora" que aparecerá</li>
            <li>Ou: Menu (⋮) → Instalar aplicativo</li>
            <li>Ícone aparecerá na tela inicial</li>
            <li>Toque para abrir como app nativo</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}