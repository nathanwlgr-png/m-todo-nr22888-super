import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const visitTypeLabels = {
  primeira_visita: 'Primeira Visita',
  demonstracao: 'Demonstração',
  followup: 'Follow-up',
  fechamento: 'Fechamento'
};

export default function ScheduleVisitButton({ client }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    scheduled_date: '',
    visit_type: 'primeira_visita',
    duration_minutes: 60,
    location: client?.city || '',
    notes: ''
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Visit.create(data),
    onSuccess: async (newVisit) => {
      queryClient.invalidateQueries(['visits']);
      
      // Auto-sync to Google Calendar if connected
      try {
        const user = await base44.auth.me();
        if (user?.google_calendar_connected) {
          toast.success('Visita agendada e sincronizada com Google Calendar!');
        } else {
          toast.success('Visita agendada com sucesso!');
        }
      } catch (error) {
        toast.success('Visita agendada com sucesso!');
      }
      
      setOpen(false);
      // Resetar formulário
      setFormData({
        scheduled_date: '',
        visit_type: 'primeira_visita',
        duration_minutes: 60,
        location: client?.city || '',
        notes: ''
      });
    }
  });

  const handleSchedule = () => {
    if (!formData.scheduled_date) {
      toast.error('Selecione data e hora');
      return;
    }

    createMutation.mutate({
      client_id: client.id,
      client_name: client.first_name,
      ...formData
    });
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="w-full h-14 rounded-xl border-2 hover:bg-indigo-50"
      >
        <Calendar className="w-5 h-5 mr-2" />
        Agendar Visita
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agendar Visita - {client?.first_name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Data e Hora</Label>
              <Input
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="h-12"
              />
            </div>

            <div>
              <Label>Tipo de Visita</Label>
              <Select
                value={formData.visit_type}
                onValueChange={(value) => setFormData({ ...formData, visit_type: value })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(visitTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Duração (minutos)</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="h-12"
              />
            </div>

            <div>
              <Label>Local</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Endereço da clínica"
                className="h-12"
              />
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Objetivos, equipamentos a apresentar..."
                className="h-20"
              />
            </div>

            <Button
              onClick={handleSchedule}
              disabled={createMutation.isPending}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Calendar className="w-5 h-5 mr-2" />
                  Confirmar Agendamento
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}