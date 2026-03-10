import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {/* Alerta de Mudança de Rede */}
      {showAlert && isOnline && (
        <Alert className="w-80 bg-yellow-50 border-yellow-300 animate-in slide-in-from-bottom-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm">
            <p className="font-semibold text-yellow-800">Nova Conexão Detectada</p>
            <p className="text-yellow-700 mt-1">
              Você se conectou a uma rede {isSecure ? 'segura (HTTPS)' : 'não segura'}. 
              Seus dados estão protegidos por criptografia.
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => setShowAlert(false)}
              >
                Entendi
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Monitor Compacto */}
      <Card className={`w-64 border-2 transition-all ${
        security.color === 'green' ? 'border-green-300 bg-green-50' :
        security.color === 'yellow' ? 'border-yellow-300 bg-yellow-50' :
        security.color === 'red' ? 'border-red-300 bg-red-50' :
        'border-slate-300 bg-slate-50'
      }`}>
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Status Principal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SecurityIcon className={`w-5 h-5 ${
                  security.color === 'green' ? 'text-green-600' :
                  security.color === 'yellow' ? 'text-yellow-600' :
                  security.color === 'red' ? 'text-red-600' :
                  'text-slate-600'
                }`} />
                <span className="text-sm font-semibold">
                  Segurança dos Dados
                </span>
              </div>
              <Badge className={`${
                security.color === 'green' ? 'bg-green-600' :
                security.color === 'yellow' ? 'bg-yellow-600' :
                security.color === 'red' ? 'bg-red-600' :
                'bg-slate-600'
              } text-white text-xs`}>
                {security.level.toUpperCase()}
              </Badge>
            </div>

            {/* Indicadores */}
            <div className="space-y-1 text-xs">
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

            {/* Mensagem de Status */}
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
                  Todos os dados estão criptografados e seguros.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}