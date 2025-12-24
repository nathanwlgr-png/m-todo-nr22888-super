import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Signal } from 'lucide-react';
import { toast } from 'sonner';

export default function DataSaverMode() {
  const [connectionType, setConnectionType] = useState('unknown');
  const [dataSaverEnabled, setDataSaverEnabled] = useState(false);

  useEffect(() => {
    // Detectar tipo de conexão
    const checkConnection = () => {
      if ('connection' in navigator) {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
          const type = conn.effectiveType; // '4g', '3g', '2g', 'slow-2g'
          setConnectionType(type);
          
          // Ativar automaticamente em 4G/3G
          if (type === '4g' || type === '3g') {
            const saved = localStorage.getItem('data_saver_mode');
            if (saved === null) {
              setDataSaverEnabled(true);
              localStorage.setItem('data_saver_mode', 'true');
              applyDataSaver(true);
            } else {
              setDataSaverEnabled(saved === 'true');
              applyDataSaver(saved === 'true');
            }
          }
        }
      }
    };

    checkConnection();

    // Monitorar mudanças de conexão
    if ('connection' in navigator) {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        conn.addEventListener('change', checkConnection);
        return () => conn.removeEventListener('change', checkConnection);
      }
    }
  }, []);

  const applyDataSaver = (enabled) => {
    if (enabled) {
      // Configurar economia de dados globalmente
      document.documentElement.setAttribute('data-saver-mode', 'true');
      
      // Desabilitar imagens pesadas
      document.querySelectorAll('img').forEach(img => {
        if (!img.dataset.essential) {
          img.loading = 'lazy';
        }
      });
      
      toast.success('💾 Economia de dados ativada');
    } else {
      document.documentElement.removeAttribute('data-saver-mode');
      toast.info('📡 Economia de dados desativada');
    }
  };

  const toggleDataSaver = () => {
    const newState = !dataSaverEnabled;
    setDataSaverEnabled(newState);
    localStorage.setItem('data_saver_mode', newState.toString());
    applyDataSaver(newState);
  };

  // Não mostrar em WiFi ou conexão desconhecida
  if (connectionType === 'wifi' || connectionType === 'unknown') {
    return null;
  }

  return (
    <Card className={`p-3 ${dataSaverEnabled ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'} border-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            dataSaverEnabled ? 'bg-green-600' : 'bg-amber-600'
          }`}>
            {dataSaverEnabled ? <WifiOff className="w-4 h-4 text-white" /> : <Signal className="w-4 h-4 text-white" />}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">
              {dataSaverEnabled ? '💾 Economia Ativada' : '📡 Modo Normal'}
            </p>
            <p className="text-[10px] text-slate-600">
              Conexão: {connectionType.toUpperCase()}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={dataSaverEnabled ? 'default' : 'outline'}
          onClick={toggleDataSaver}
          className={`text-xs ${dataSaverEnabled ? 'bg-green-600 hover:bg-green-700' : ''}`}
        >
          {dataSaverEnabled ? 'Desativar' : 'Ativar'}
        </Button>
      </div>
    </Card>
  );
}