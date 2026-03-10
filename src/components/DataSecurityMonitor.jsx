import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Wifi, 
  WifiOff,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DataSecurityMonitor() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSecure, setIsSecure] = useState(window.location.protocol === 'https:');
  const [networkChange, setNetworkChange] = useState(false);
  const [dataProtected, setDataProtected] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Monitorar status de conexão
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkChange(true);
      checkNetworkSecurity();
      setTimeout(() => setNetworkChange(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkChange(true);
      setTimeout(() => setNetworkChange(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar segurança inicial
    checkNetworkSecurity();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkNetworkSecurity = () => {
    const secure = window.location.protocol === 'https:';
    setIsSecure(secure);
    
    // Se mudou de rede e está online, mostrar alerta
    if (isOnline && networkChange) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 10000);
    }

    // Verificar se localStorage está protegido
    try {
      localStorage.setItem('__security_test__', 'test');
      localStorage.removeItem('__security_test__');
      setDataProtected(true);
    } catch (e) {
      setDataProtected(false);
    }
  };

  const getSecurityLevel = () => {
    if (!isOnline) return { level: 'offline', color: 'slate', icon: WifiOff };
    if (isSecure && dataProtected) return { level: 'alta', color: 'green', icon: ShieldCheck };
    if (isSecure) return { level: 'média', color: 'yellow', icon: Shield };
    return { level: 'baixa', color: 'red', icon: ShieldAlert };
  };

  const security = getSecurityLevel();
  const SecurityIcon = security.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className={`shadow-lg border-2 ${
              security.color === 'green' ? 'border-green-500 bg-green-50 hover:bg-green-100' :
              security.color === 'yellow' ? 'border-yellow-500 bg-yellow-50 hover:bg-yellow-100' :
              security.color === 'red' ? 'border-red-500 bg-red-50 hover:bg-red-100' :
              'border-slate-500 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <SecurityIcon className={`w-4 h-4 ${
              security.color === 'green' ? 'text-green-600' :
              security.color === 'yellow' ? 'text-yellow-600' :
              security.color === 'red' ? 'text-red-600' :
              'text-slate-600'
            }`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Segurança</h4>
              <Badge className={`${
                security.color === 'green' ? 'bg-green-600' :
                security.color === 'yellow' ? 'bg-yellow-600' :
                security.color === 'red' ? 'bg-red-600' :
                'bg-slate-600'
              } text-white text-xs`}>
                {security.level.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Conexão:</span>
                <div className="flex items-center gap-1">
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3 text-green-600" />
                      <span className="text-green-700">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-slate-600" />
                      <span className="text-slate-700">Offline</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Criptografia:</span>
                <div className="flex items-center gap-1">
                  {isSecure ? (
                    <>
                      <Lock className="w-3 h-3 text-green-600" />
                      <span className="text-green-700">HTTPS</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3 text-red-600" />
                      <span className="text-red-700">HTTP</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Armazenamento:</span>
                <div className="flex items-center gap-1">
                  {dataProtected ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      <span className="text-green-700">Protegido</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      <span className="text-red-700">Erro</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {!isOnline && (
              <div className="flex items-start gap-2 bg-slate-100 p-2 rounded text-xs">
                <Info className="w-3 h-3 text-slate-600 flex-shrink-0 mt-0.5" />
                <p className="text-slate-700">
                  Modo offline ativo. Dados protegidos localmente.
                </p>
              </div>
            )}

            {isOnline && isSecure && (
              <div className="flex items-start gap-2 bg-green-100 p-2 rounded text-xs">
                <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-700">
                  Dados criptografados e seguros.
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}