import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
import moment from 'moment';

export default function VisitEvaluationDialog({ open, onClose, clientData, onSave }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    visit_date: moment().format('YYYY-MM-DD'),
    visit_objective: 'diagnosticar_necessidades',
    visit_result: 'bom',
    equipment_presented: '',
    next_steps: '',
    client_feedback: '',
    obstacles: '',
    opportunities: ''
  });

  const handleSave = async () => {
    if (rating === 0) {
      alert('Por favor, avalie a visita (1-5 estrelas)');
      return;
    }

    const visitRecord = {
      client_id: clientData.id,
      client_name: clientData.first_name || clientData.clinic_name,
      clinic_name: clientData.clinic_name,
      city: clientData.city,
      month: moment(formData.visit_date).format('YYYY-MM'),
      rating,
      ...formData
    };

    await onSave(visitRecord);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📝 Avaliação da Visita</DialogTitle>
          <p className="text-sm text-slate-600">
            Cliente: <span className="font-semibold">{clientData?.first_name || clientData?.clinic_name}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rating */}
          <div>
            <Label>Avaliação da Visita *</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Data */}
          <div>
            <Label>Data da Visita *</Label>
            <Input
              type="date"
              value={formData.visit_date}
              onChange={e => setFormData({ ...formData, visit_date: e.target.value })}
            />
          </div>

          {/* Objetivo */}
          <div>
            <Label>Objetivo da Visita</Label>
            <Select
              value={formData.visit_objective}
              onValueChange={value => setFormData({ ...formData, visit_objective: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diagnosticar_necessidades">Diagnosticar Necessidades</SelectItem>
                <SelectItem value="apresentar_equipamento">Apresentar Equipamento</SelectItem>
                <SelectItem value="demonstracao_tecnica">Demonstração Técnica</SelectItem>
                <SelectItem value="negociar_proposta">Negociar Proposta</SelectItem>
                <SelectItem value="fechar_venda">Fechar Venda</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="pos_venda">Pós-venda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resultado */}
          <div>
            <Label>Resultado da Visita</Label>
            <Select
              value={formData.visit_result}
              onValueChange={value => setFormData({ ...formData, visit_result: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excelente">Excelente</SelectItem>
                <SelectItem value="bom">Bom</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="ruim">Ruim</SelectItem>
                <SelectItem value="sem_resposta">Sem Resposta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Equipamento */}
          <div>
            <Label>Equipamento Apresentado</Label>
            <Input
              placeholder="VG2, SMT-120, etc"
              value={formData.equipment_presented}
              onChange={e => setFormData({ ...formData, equipment_presented: e.target.value })}
            />
          </div>

          {/* Próximos Passos */}
          <div>
            <Label>Próximos Passos</Label>
            <Textarea
              placeholder="O que fazer a seguir..."
              value={formData.next_steps}
              onChange={e => setFormData({ ...formData, next_steps: e.target.value })}
              rows={2}
            />
          </div>

          {/* Oportunidades */}
          <div>
            <Label>Oportunidades Identificadas</Label>
            <Textarea
              placeholder="Oportunidades de venda..."
              value={formData.opportunities}
              onChange={e => setFormData({ ...formData, opportunities: e.target.value })}
              rows={2}
            />
          </div>

          {/* Obstáculos */}
          <div>
            <Label>Obstáculos Encontrados</Label>
            <Textarea
              placeholder="Dificuldades, objeções..."
              value={formData.obstacles}
              onChange={e => setFormData({ ...formData, obstacles: e.target.value })}
              rows={2}
            />
          </div>

          {/* Feedback */}
          <div>
            <Label>Feedback do Cliente</Label>
            <Textarea
              placeholder="O que o cliente disse..."
              value={formData.client_feedback}
              onChange={e => setFormData({ ...formData, client_feedback: e.target.value })}
              rows={2}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              Salvar Avaliação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}