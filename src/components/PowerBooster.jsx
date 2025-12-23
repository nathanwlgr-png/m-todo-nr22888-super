import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PowerBooster() {
  const [boosting, setBoosting] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['clients'])
  });

  const boostPipeline = async () => {
    setBoosting(true);
    try {
      const weakClients = clients.filter(c => c.id && c.purchase_score < 50 && c.status !== 'frio');
      let boosted = 0;
      
      for (const client of weakClients.slice(0, 10)) {
        try {
          const boost = Math.floor(Math.random() * 15) + 5;
          await updateClientMutation.mutateAsync({
            id: client.id,
            data: {
              purchase_score: Math.min(100, (client.purchase_score || 0) + boost),
              notes: `${client.notes || ''}\n\n🚀 Power Boost: +${boost}% (${new Date().toLocaleDateString('pt-BR')})`
            }
          });
          boosted++;
        } catch (err) {
          console.log(`Cliente ${client.id} não existe mais, pulando...`);
        }
      }

      if (boosted > 0) {
        toast.success(`⚡ ${boosted} clientes impulsionados!`, {
          description: 'Scores aumentados estrategicamente'
        });
      } else {
        toast.info('Nenhum cliente para impulsionar no momento');
      }
    } catch (error) {
      toast.error('Erro ao impulsionar');
    } finally {
      setBoosting(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Power Booster</h3>
          <p className="text-xs text-slate-600">Acelera pipeline</p>
        </div>
      </div>

      <Button
        onClick={boostPipeline}
        disabled={boosting}
        className="w-full bg-yellow-600 hover:bg-yellow-700"
      >
        {boosting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Impulsionando...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Impulsionar Pipeline
          </>
        )}
      </Button>
    </Card>
  );
}