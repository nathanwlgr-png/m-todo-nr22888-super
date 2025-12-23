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

  useEffect(() => {
    // Carregar do localStorage
    const savedNetworkMode = localStorage.getItem('network_mode') || 'wifi';
    const savedPerformanceMode = localStorage.getItem('performance_mode') || 'normal';
    setNetworkMode(savedNetworkMode);
    setPerformanceMode(savedPerformanceMode);
  }, []);

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
      <Card className="p-4 bg-white shadow-xl border-2 border-slate-300 w-72">
        <div className="space-y-4">
          {/* Network Mode */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Modo de Rede</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={networkMode === 'wifi' ? 'default' : 'outline'}
                onClick={() => networkMode !== 'wifi' && toggleNetworkMode()}
                className={networkMode === 'wifi' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <Wifi className="w-3 h-3 mr-1" />
                WiFi
              </Button>
              <Button
                size="sm"
                variant={networkMode === 'mobile' ? 'default' : 'outline'}
                onClick={() => networkMode !== 'mobile' && toggleNetworkMode()}
                className={networkMode === 'mobile' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                <Radio className="w-3 h-3 mr-1" />
                3G/4G
              </Button>
            </div>
          </div>

          {/* Performance Mode */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Performance</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={performanceMode === 'turbo' ? 'default' : 'outline'}
                onClick={() => setPerformanceLevel('turbo')}
                className={performanceMode === 'turbo' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                disabled={networkMode === 'mobile'}
              >
                <Zap className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant={performanceMode === 'normal' ? 'default' : 'outline'}
                onClick={() => setPerformanceLevel('normal')}
                className={performanceMode === 'normal' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                Normal
              </Button>
              <Button
                size="sm"
                variant={performanceMode === 'slow' ? 'default' : 'outline'}
                onClick={() => setPerformanceLevel('slow')}
                className={performanceMode === 'slow' ? 'bg-slate-600 hover:bg-slate-700' : ''}
              >
                <Battery className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Status Info */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-1">
              {getPerformanceConfig().description}
            </p>
            <p className="text-xs text-slate-600">
              {networkMode === 'wifi' ? '📶 Conexão completa' : '📱 Modo economia'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}