import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, TrendingUp, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function RealtimeCoachingWidget({ interaction }) {
  const coachingMutation = useMutation({
    mutationFn: () => base44.functions.invoke('realtimeCoachingAnalysis', {
      interaction_id: interaction.id
    }),
    onSuccess: (response) => {
      toast.success('Coaching gerado!');
    }
  });

  const coaching = coachingMutation.data?.data?.coaching;

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Coaching IA em Tempo Real
          </CardTitle>
          {!coaching && (
            <Button
              size="sm"
              onClick={() => coachingMutation.mutate()}
              disabled={coachingMutation.isPending}
            >
              {coachingMutation.isPending ? 'Analisando...' : 'Analisar'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {coaching ? (
          <>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
              <span className="text-sm font-semibold">Performance</span>
              <Badge className={
                coaching.score >= 80 ? 'bg-green-500' :
                coaching.score >= 60 ? 'bg-blue-500' : 'bg-orange-500'
              }>
                {coaching.score}/100
              </Badge>
            </div>

            {coaching.strengths?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm font-semibold text-green-900 flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  Pontos Fortes:
                </p>
                <ul className="text-xs text-green-800 space-y-1">
                  {coaching.strengths.map((s, i) => (
                    <li key={i}>✅ {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {coaching.improvements?.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <p className="text-sm font-semibold text-orange-900 flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Melhorias:
                </p>
                <ul className="text-xs text-orange-800 space-y-1">
                  {coaching.improvements.map((imp, i) => (
                    <li key={i}>💡 {imp}</li>
                  ))}
                </ul>
              </div>
            )}

            {coaching.sentiment_handling && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  Como Tratar o Sentimento:
                </p>
                <p className="text-xs text-blue-800">{coaching.sentiment_handling}</p>
              </div>
            )}

            {coaching.suggested_script && (
              <details className="text-xs">
                <summary className="cursor-pointer text-indigo-600 font-semibold">
                  Ver Script Sugerido
                </summary>
                <div className="mt-2 bg-slate-50 p-3 rounded border whitespace-pre-wrap">
                  {coaching.suggested_script}
                </div>
              </details>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-600">
            Clique em "Analisar" para receber feedback da IA sobre esta interação.
          </p>
        )}
      </CardContent>
    </Card>
  );
}