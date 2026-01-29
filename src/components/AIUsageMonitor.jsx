import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Zap } from 'lucide-react';

export default function AIUsageMonitor() {
  const [usage, setUsage] = useState(() => {
    const stored = localStorage.getItem('ai_usage');
    if (!stored) return { count: 0, date: new Date().toDateString() };
    const data = JSON.parse(stored);
    // Reset se for novo dia
    if (data.date !== new Date().toDateString()) {
      return { count: 0, date: new Date().toDateString() };
    }
    return data;
  });

  const limit = 100; // Limite diário seguro
  const percentage = (usage.count / limit) * 100;

  useEffect(() => {
    localStorage.setItem('ai_usage', JSON.stringify(usage));
  }, [usage]);

  // Incrementar uso
  window.trackAIUsage = () => {
    setUsage(prev => ({
      ...prev,
      count: prev.count + 1
    }));
  };

  if (percentage < 70) return null;

  return (
    <Card className="p-3 bg-orange-50 border-orange-200 mb-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-orange-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-orange-900">
            Uso de IA: {usage.count}/{limit}
          </p>
          <div className="h-2 bg-orange-200 rounded-full mt-1">
            <div 
              className="h-full bg-orange-600 rounded-full transition-all"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
        <Badge className="bg-orange-600 text-white">
          {Math.round(percentage)}%
        </Badge>
      </div>
    </Card>
  );
}