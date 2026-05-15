import React from 'react';
import { AlertCircle, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AIUnavailableNotice({ reason = 'indisponível' }) {
  return (
    <Card className="border-yellow-500/30 bg-yellow-950/20">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-yellow-400 text-sm mb-1">
              ⚡ IA Temporariamente Indisponível
            </p>
            <p className="text-xs text-yellow-300 mb-3">
              {reason === 'indisponível'
                ? 'Os serviços de IA estão temporariamente indisponíveis. O CRM continua funcionando normalmente.'
                : reason === 'economic'
                ? 'Modo Econômico Ativo: IA será executada apenas quando você clicar explicitamente. Isso reduz o consumo de créditos.'
                : `${reason}. O CRM continua operacional.`}
            </p>
            <p className="text-[10px] text-yellow-600">
              💡 Dica: Você ainda pode usar todas as funcionalidades do CRM normalmente
            </p>
          </div>
          <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}