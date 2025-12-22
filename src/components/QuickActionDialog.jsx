import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Calendar, CheckSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickActionDialog({ client, open, onOpenChange, actionType }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'media',
    type: 'follow_up',
    visit_type: 'demonstracao',
    scheduled_date: '',
    duration_minutes: 60
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client-tasks']);
      queryClient.invalidateQueries(['tasks']);
      toast.success('✓ Tarefa criada e salva!');
      onOpenChange(false);
      resetForm();
    }
  });

  const createVisitMutation = useMutation({
    mutationFn: (data) => base44.entities.Visit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client-visits']);
      queryClient.invalidateQueries(['visits']);
      toast.success('✓ Visita agendada e salva!');
      onOpenChange(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      priority: 'media',
      type: 'follow_up',
      visit_type: 'demonstracao',
      scheduled_date: '',
      duration_minutes: 60
    });
  };

  const handleSubmit = () => {
    if (actionType === 'task') {
      if (!formData.title || !formData.due_date) {
        toast.error('Preencha título e data');
        return;
      }
      createTaskMutation.mutate({
        client_id: client.id,
        client_name: client.first_name,
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date,
        priority: formData.priority,
        type: formData.type,
        status: 'pendente'
      });
    } else if (actionType === 'visit') {
      if (!formData.scheduled_date) {
        toast.error('Selecione data e hora');
        return;
      }
      createVisitMutation.mutate({
        client_id: client.id,
        client_name: client.first_name,
        scheduled_date: formData.scheduled_date,
        visit_type: formData.visit_type,
        duration_minutes: formData.duration_minutes,
        location: client.address || '',
        status: 'agendada'
      });
    }
  };

  const isLoading = createTaskMutation.isPending || createVisitMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {actionType === 'task' ? (
              <>
                <CheckSquare className="w-5 h-5" />
                Nova Tarefa
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                Agendar Visita
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cliente info */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-800">{client?.first_name}</p>
            <p className="text-xs text-slate-500">{client?.clinic_name}</p>
          </div>

          {actionType === 'task' ? (
            <>
              <div>
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Enviar proposta comercial"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes da tarefa..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data de Vencimento *</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="ligacao">Ligação</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="visita">Visita</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label>Data e Hora *</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo de Visita</Label>
                  <Select value={formData.visit_type} onValueChange={(v) => setFormData({ ...formData, visit_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primeira_visita">Primeira Visita</SelectItem>
                      <SelectItem value="demonstracao">Demonstração</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="fechamento">Fechamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Duração (min)</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Criar'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}