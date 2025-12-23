import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, Radio, Zap, Battery } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Alternador de Modo de Rede
 * WiFi: Modo completo, todas IAs ativas
 * 3G/4G: Modo econômico, reduz requisições e processamento
 */
export default function NetworkModeToggle() {
  const [networkMode, setNetworkMode] = useState('wifi'); // 'wifi' ou 'mobile'
  const [performanceMode, setPerformanceMode] = useState('normal'); // 'turbo', 'normal', 'slow'
  const [tokensRemaining, setTokensRemaining] = useState(120000000); // 120 milhões
  const [dataUsage, setDataUsage] = useState(0); // KB
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Carregar do localStorage
    const savedNetworkMode = localStorage.getItem('network_mode') || 'wifi';
    const savedPerformanceMode = localStorage.getItem('performance_mode') || 'normal';
    const savedTokens = parseInt(localStorage.getItem('tokens_remaining') || '120000000');
    const savedData = parseInt(localStorage.getItem('data_usage_kb') || '0');
    
    setNetworkMode(savedNetworkMode);
    setPerformanceMode(savedPerformanceMode);
    setTokensRemaining(savedTokens);
    setDataUsage(savedData);
  }, []);

  useEffect(() => {
    // Simular uso de dados baseado no modo
    const interval = setInterval(() => {
      const increment = networkMode === 'wifi' ? 
        (performanceMode === 'turbo' ? 50 : performanceMode === 'normal' ? 20 : 5) :
        (performanceMode === 'normal' ? 10 : 5);
      
      setDataUsage(prev => {
        const newUsage = prev + increment;
        localStorage.setItem('data_usage_kb', newUsage.toString());
        return newUsage;
      });
      
      setLastUpdate(new Date());
    }, 60000); // A cada 1 minuto

    return () => clearInterval(interval);
  }, [networkMode, performanceMode]);

  const toggleNetworkMode = () => {
    const newMode = networkMode === 'wifi' ? 'mobile' : 'wifi';
    setNetworkMode(newMode);
    localStorage.setItem('network_mode', newMode);

    if (newMode === 'mobile') {
      // Modo 3G/4G: economia automática
      toast.info('📱 Modo 3G/4G Ativado', {
        description: 'Economia de dados e bateria. IAs reduzidas.'
      });
      // Auto-ajustar para slow se estava em turbo
      if (performanceMode === 'turbo') {
        setPerformanceMode('normal');
        localStorage.setItem('performance_mode', 'normal');
      }
    } else {
      toast.success('📶 Modo WiFi Ativado', {
        description: 'Todas as funcionalidades disponíveis'
      });
    }
  };

  const setPerformanceLevel = (mode) => {
    if (networkMode === 'mobile' && mode === 'turbo') {
      toast.warning('Modo Turbo requer WiFi', {
        description: 'Conecte-se ao WiFi primeiro'
      });
      return;
    }

    setPerformanceMode(mode);
    localStorage.setItem('performance_mode', mode);

    const messages = {
      turbo: {
        title: '🚀 MODO TURBO ATIVADO',
        description: 'Todas IAs ativas, análises em tempo real, máxima performance'
      },
      normal: {
        title: '⚡ Modo Normal',
        description: 'Balanceamento ideal entre performance e economia'
      },
      slow: {
        title: '🐢 Modo Econômico Ativado',
        description: 'IAs essenciais apenas, economia máxima de recursos'
      }
    };

    toast.success(messages[mode].title, {
      description: messages[mode].description,
      duration: 5000
    });
  };

  const getNetworkConfig = () => {
    return {
      wifi: {
        ai_polling_interval: 5 * 60 * 1000, // 5 min
        auto_reports: true,
        auto_tasks: true,
        ai_corrections: true,
        background_sync: true
      },
      mobile: {
        ai_polling_interval: 15 * 60 * 1000, // 15 min
        auto_reports: false,
        auto_tasks: false,
        ai_corrections: false,
        background_sync: false
      }
    }[networkMode];
  };

  const getPerformanceConfig = () => {
    return {
      turbo: {
        enabled_ais: 18, // Todas
        description: '18 IAs ativas + correção automática',
        features: [
          'Auto Task Generator',
          'Sales Intelligence',
          'Predictive Analytics',
          'Content Generator',
          'Report Generator (auto)',
          'Task Manager',
          'CRM Sync',
          'Workflow Automation',
          'Numerology Analysis',
          'Market Intelligence',
          'Equipment Selector',
          'Objection Handler',
          'Voice Scanner',
          'Health Score Calculator',
          'Follow-up Sequencer',
          'Pipeline Optimization',
          'Dashboard Performance',
          'Error Correction (3 IAs)',
        ]
      },
      normal: {
        enabled_ais: 12,
        description: '12 IAs principais ativas',
        features: [
          'Sales Intelligence',
          'Predictive Analytics',
          'Content Generator',
          'Task Manager',
          'Numerology Analysis',
          'Equipment Selector',
          'Voice Scanner',
          'Health Score Calculator',
          'Follow-up Sequencer',
          'Pipeline Optimization',
          'Dashboard Performance',
          'Error Correction (básica)'
        ]
      },
      slow: {
        enabled_ais: 6,
        description: '6 IAs essenciais',
        features: [
          'Sales Intelligence (manual)',
          'Content Generator (manual)',
          'Task Manager (manual)',
          'Numerology Analysis',
          'Equipment Selector',
          'Voice Scanner'
        ]
      }
    }[performanceMode];
  };

  // Exportar configuração para uso global
  useEffect(() => {
    window.appNetworkMode = networkMode;
    window.appPerformanceMode = performanceMode;
    window.getNetworkConfig = getNetworkConfig;
    window.getPerformanceConfig = getPerformanceConfig;
  }, [networkMode, performanceMode]);

  return (
    <div className="fixed top-20 right-4 z-40">
      <Card className="p-2 bg-white shadow-lg border border-slate-200 w-44">
        <div className="space-y-2">
          {/* Network Mode */}
          <div className="grid grid-cols-2 gap-1">
            <Button
              size="sm"
              variant={networkMode === 'wifi' ? 'default' : 'outline'}
              onClick={() => networkMode !== 'wifi' && toggleNetworkMode()}
              className={`h-7 text-xs ${networkMode === 'wifi' ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              <Wifi className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant={networkMode === 'mobile' ? 'default' : 'outline'}
              onClick={() => networkMode !== 'mobile' && toggleNetworkMode()}
              className={`h-7 text-xs ${networkMode === 'mobile' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
            >
              <Radio className="w-3 h-3" />
            </Button>
          </div>

          {/* Performance Mode */}
          <div className="grid grid-cols-3 gap-1">
            <Button
              size="sm"
              variant={performanceMode === 'turbo' ? 'default' : 'outline'}
              onClick={() => setPerformanceLevel('turbo')}
              className={`h-6 ${performanceMode === 'turbo' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
              disabled={networkMode === 'mobile'}
            >
              <Zap className="w-2 h-2" />
            </Button>
            <Button
              size="sm"
              variant={performanceMode === 'normal' ? 'default' : 'outline'}
              onClick={() => setPerformanceLevel('normal')}
              className={`h-6 text-xs ${performanceMode === 'normal' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
            >
              N
            </Button>
            <Button
              size="sm"
              variant={performanceMode === 'slow' ? 'default' : 'outline'}
              onClick={() => setPerformanceLevel('slow')}
              className={`h-6 ${performanceMode === 'slow' ? 'bg-slate-600 hover:bg-slate-700' : ''}`}
            >
              <Battery className="w-2 h-2" />
            </Button>
          </div>

          {/* Status Info */}
          <div className="p-2 bg-slate-50 rounded space-y-1">
            <p className="text-xs text-slate-600 text-center">
              {networkMode === 'wifi' ? '📶' : '📱'} {performanceMode === 'turbo' ? '🚀' : performanceMode === 'normal' ? '⚡' : '🐢'}
            </p>
            <div className="text-xs text-slate-700">
              <p className="font-semibold">🎯 {(tokensRemaining / 1000000).toFixed(1)}M tokens</p>
              <p className="text-slate-500">{(dataUsage / 1024).toFixed(1)}MB usado</p>
              <p className="text-slate-400 text-[10px]">Atualiza: 1min</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}