import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from 'lucide-react';

export default function AddInteractionDialog({ client, trigger }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const [formData, setFormData] = useState({
    type: 'call',
    direction: 'outbound',
    subject: '',
    notes: '',
    duration_minutes: '',
    outcome: 'positive',
    next_action: ''
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Interaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['interactions']);
      alert('✓ Interação registrada e salva com sucesso!');
      setOpen(false);
      setFormData({
        type: 'call',
        direction: 'outbound',
        subject: '',
        notes: '',
        duration_minutes: '',
        outcome: 'positive',
        next_action: ''
      });
    }
  });

  const handleSubmit = () => {
    if (!formData.subject) return;

    createMutation.mutate({
      client_id: client.id,
      client_name: client.first_name,
      ...formData,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      created_by_name: currentUser?.full_name || currentUser?.email
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          className="w-full border-2 border-indigo-200 hover:bg-indigo-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Interação
        </Button>
      )}

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Interação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo *</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">📞 Ligação</SelectItem>
                  <SelectItem value="email">📧 Email</SelectItem>
                  <SelectItem value="meeting">🤝 Reunião</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  <SelectItem value="proposal_sent">📄 Proposta Enviada</SelectItem>
                  <SelectItem value="demo">🎯 Demonstração</SelectItem>
                  <SelectItem value="negotiation">💼 Negociação</SelectItem>
                  <SelectItem value="contract_signed">✅ Contrato Assinado</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Direção</Label>
              <Select value={formData.direction} onValueChange={(v) => setFormData({ ...formData, direction: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">📤 Saída</SelectItem>
                  <SelectItem value="inbound">📥 Entrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Assunto *</Label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Ex: Apresentação de proposta comercial"
            />
          </div>

          <div>
            <Label>Duração (minutos)</Label>
            <Input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              placeholder="Ex: 30"
            />
          </div>

          <div>
            <Label>Resultado</Label>
            <Select value={formData.outcome} onValueChange={(v) => setFormData({ ...formData, outcome: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">✅ Positivo</SelectItem>
                <SelectItem value="neutral">➖ Neutro</SelectItem>
                <SelectItem value="negative">❌ Negativo</SelectItem>
                <SelectItem value="no_answer">📵 Sem Resposta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detalhe o que foi discutido..."
              rows={4}
            />
          </div>

          <div>
            <Label>Próxima Ação</Label>
            <Input
              value={formData.next_action}
              onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
              placeholder="Ex: Enviar proposta até sexta-feira"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!formData.subject || createMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Registrar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}