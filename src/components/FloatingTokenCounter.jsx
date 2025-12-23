import { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Card } from '@/components/ui/card';
import { Zap, Wifi, Radio, Battery, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FloatingTokenCounter() {
  const [expanded, setExpanded] = useState(false);
  const [tokensRemaining, setTokensRemaining] = useState(117000000);
  const [networkMode, setNetworkMode] = useState('wifi');
  const [performanceMode, setPerformanceMode] = useState('normal');
  const [dataUsage, setDataUsage] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = React.useRef(null);

  useEffect(() => {
    const saved = parseInt(localStorage.getItem('tokens_remaining') || '117000000');
    const savedData = parseInt(localStorage.getItem('data_usage_kb') || '0');
    const savedNetwork = localStorage.getItem('network_mode') || 'wifi';
    const savedPerf = localStorage.getItem('performance_mode') || 'normal';
    
    setTokensRemaining(saved);
    setDataUsage(savedData);
    setNetworkMode(savedNetwork);
    setPerformanceMode(savedPerf);

    const interval = setInterval(() => {
      const increment = networkMode === 'wifi' ? 
        (performanceMode === 'turbo' ? 50 : performanceMode === 'normal' ? 20 : 5) :
        (performanceMode === 'normal' ? 10 : 5);
      
      setDataUsage(prev => {
        const newUsage = prev + increment;
        localStorage.setItem('data_usage_kb', newUsage.toString());
        return newUsage;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [networkMode, performanceMode]);

  const toggleNetworkMode = () => {
    const newMode = networkMode === 'wifi' ? 'mobile' : 'wifi';
    setNetworkMode(newMode);
    localStorage.setItem('network_mode', newMode);
    if (newMode === 'mobile') setPerformanceMode('normal');
  };

  const setPerformanceLevel = (level) => {
    setPerformanceMode(level);
    localStorage.setItem('performance_mode', level);
  };

  const handleDrag = (e, data) => {
    setPosition({ x: data.x, y: data.y });
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      setPosition({ x: 0, y: 0 });
    }, 5000);
  };

  const initialPosition = { x: window.innerWidth - 130, y: window.innerHeight / 2 - 60 };

  return (
    <Draggable 
      position={position}
      onDrag={handleDrag}
      defaultPosition={initialPosition}
    >
      <div className="fixed z-50 cursor-move" style={{ top: '50%', right: 24, transform: 'translateY(-50%)' }}>
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 shadow-2xl flex flex-col items-center justify-center hover:shadow-orange-500/50 transition-all active:scale-95"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              padding: '24px'
            }}
          >
            <span className="text-white font-black text-2xl">{Math.floor(tokensRemaining / 1000000)}</span>
            <span className="text-white text-xs font-semibold">milhões</span>
          </button>
        ) : (
          <Card className="w-64 p-4 bg-white shadow-2xl border-2 border-orange-500">
            <div className="text-center mb-3">
              <p className="text-3xl font-black text-orange-600">{Math.floor(tokensRemaining / 1000000)}M</p>
              <p className="text-xs text-slate-600">tokens restantes</p>
            </div>

            <div className="space-y-3">
              {/* Network */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={networkMode === 'wifi' ? 'default' : 'outline'}
                  onClick={toggleNetworkMode}
                  className={networkMode === 'wifi' ? 'bg-green-600' : ''}
                >
                  <Wifi className="w-3 h-3 mr-1" />
                  WiFi
                </Button>
                <Button
                  size="sm"
                  variant={networkMode === 'mobile' ? 'default' : 'outline'}
                  onClick={toggleNetworkMode}
                  className={networkMode === 'mobile' ? 'bg-orange-600' : ''}
                >
                  <Radio className="w-3 h-3 mr-1" />
                  3G/4G
                </Button>
              </div>

              {/* Performance */}
              <div className="grid grid-cols-3 gap-1">
                <Button
                  size="sm"
                  variant={performanceMode === 'turbo' ? 'default' : 'outline'}
                  onClick={() => setPerformanceLevel('turbo')}
                  className={performanceMode === 'turbo' ? 'bg-purple-600' : ''}
                  disabled={networkMode === 'mobile'}
                >
                  <Zap className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant={performanceMode === 'normal' ? 'default' : 'outline'}
                  onClick={() => setPerformanceLevel('normal')}
                  className={performanceMode === 'normal' ? 'bg-blue-600' : ''}
                >
                  Normal
                </Button>
                <Button
                  size="sm"
                  variant={performanceMode === 'slow' ? 'default' : 'outline'}
                  onClick={() => setPerformanceLevel('slow')}
                  className={performanceMode === 'slow' ? 'bg-slate-600' : ''}
                >
                  <Battery className="w-3 h-3" />
                </Button>
              </div>

              {/* Data Usage */}
              <div className="p-2 bg-slate-50 rounded-lg text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Dados:</span>
                  <span className="font-semibold text-slate-800">
                    {(dataUsage / 1024).toFixed(1)}MB
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-600">Atualiza:</span>
                  <span className="font-semibold text-slate-800">1min</span>
                </div>
              </div>

              <Button
                onClick={() => setExpanded(false)}
                variant="outline"
                className="w-full"
                size="sm"
              >
                Fechar
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Draggable>
  );
}