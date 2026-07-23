import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Brain, Clock, Loader2 } from 'lucide-react';

export default function AIRecommendationLog({ clientId }) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['ai-recommendations', clientId],
    queryFn: () => base44.entities.EliteAIRecommendationLog.filter(
      { cliente_id: clientId }, '-data_hora', 5
    ),
    enabled: !!clientId,
    staleTime: 30000,
  });

  return (
    <section className="rounded-2xl p-4 bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-purple-400" />
        <h2 className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Recomendações da IA</h2>
      </div>
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma recomendação gerada ainda.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <article key={entry.id} className="rounded-xl p-3 bg-muted border border-border">
              <p className="text-xs text-foreground whitespace-pre-wrap">{entry.resultado_resumido}</p>
              <p className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {entry.data_hora ? new Date(entry.data_hora).toLocaleString('pt-BR') : 'Data não informada'}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}