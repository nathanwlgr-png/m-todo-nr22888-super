import React from 'react';
import { useAILimit } from '@/components/AILimitProtection';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function AIUsageIndicator() {
  const { limitReached } = useAILimit();

  if (!limitReached) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-bounce">
      <Badge className="bg-orange-500 text-white px-4 py-2 shadow-lg">
        <AlertCircle className="w-4 h-4 mr-2" />
        Modo Cache - IA Limitada
      </Badge>
    </div>
  );
}