import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function FollowUpScheduler({ client, onClose }) {
  const [nextContactDate, setNextContactDate] = useState(
    client.next_contact_date ? new Date(client.next_contact_date) : null
  );
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client']);
      queryClient.invalidateQueries(['clients']);
      toast.success('Follow-up agendado!');
      if (onClose) onClose();
    },
  });

  const handleSchedule = () => {
    if (!nextContactDate) {
      toast.error('Selecione uma data para o próximo contato');
      return;
    }

    updateClientMutation.mutate({
      id: client.id,
      data: {
        next_contact_date: format(nextContactDate, 'yyyy-MM-dd'),
        last_contact_date: format(new Date(), 'yyyy-MM-dd'),
        next_action: notes || `Follow-up agendado para ${format(nextContactDate, 'dd/MM/yyyy', { locale: ptBR })}`,
      }
    });
  };

  const quickSchedule = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setNextContactDate(date);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Bell className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Agendar Follow-up</h3>
          <p className="text-sm text-slate-500">{client.first_name}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">Agendamento Rápido</Label>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => quickSchedule(1)}
              className="text-xs"
            >
              Amanhã
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => quickSchedule(3)}
              className="text-xs"
            >
              3 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => quickSchedule(7)}
              className="text-xs"
            >
              1 semana
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => quickSchedule(14)}
              className="text-xs"
            >
              2 semanas
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Data do Próximo Contato</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {nextContactDate ? (
                  format(nextContactDate, 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span className="text-slate-400">Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={nextContactDate}
                onSelect={setNextContactDate}
                locale={ptBR}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Observações (opcional)</Label>
          <Input
            placeholder="Ex: Ligar para discutir proposta..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {client.status === 'quente' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">
              🔥 <strong>Cliente Quente:</strong> Recomendamos follow-up em até 2 dias
            </p>
          </div>
        )}

        {client.purchase_score >= 70 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">
              ⭐ <strong>Score Alto ({client.purchase_score}):</strong> Priorize este cliente!
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSchedule}
          disabled={!nextContactDate || updateClientMutation.isPending}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
        >
          <Clock className="w-4 h-4 mr-2" />
          Agendar Follow-up
        </Button>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        )}
      </div>
    </Card>
  );
}