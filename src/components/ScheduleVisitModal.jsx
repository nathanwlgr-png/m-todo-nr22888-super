import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, MapPin, Phone, Loader2, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const VISIT_TYPES = [
  { value: 'primeira_visita', label: '🤝 Primeira Visita' },
  { value: 'demonstracao', label: '🔬 Demonstração Técnica' },
  { value: 'followup', label: '📋 Follow-up' },
  { value: 'fechamento', label: '🏁 Fechamento' },
];

export default function ScheduleVisitModal({ client, open, onOpenChange }) {
  const today = new Date();
  const defaultDate = today.toISOString().slice(0, 10);
  const defaultTime = '09:00';

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [visitType, setVisitType] = useState('primeira_visita');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!client) return null;

  const handleSchedule = async () => {
    if (!date || !time) {
      toast.error('Informe data e hora da visita');
      return;
    }

    setLoading(true);
    try {
      const scheduledDate = new Date(`${date}T${time}:00`).toISOString();

      // 1. Criar visita na entidade
      const visit = await base44.entities.Visit.create({
        client_id: client.id,
        client_name: `${client.first_name}${client.clinic_name ? ' - ' + client.clinic_name : ''}`,
        scheduled_date: scheduledDate,
        visit_type: visitType,
        location: client.address || client.city || '',
        notes,
        status: 'agendada',
      });

      // 2. Criar evento no Google Calendar via backend function
      try {
        await base44.functions.invoke('createCalendarVisit', {
          visit_id: visit.id,
          client_name: client.first_name,
          clinic_name: client.clinic_name || '',
          phone: client.phone || '',
          address: client.address || client.city || '',
          scheduled_date: scheduledDate,
          visit_type: visitType,
          notes,
        });
        toast.success('Visita agendada e adicionada ao Google Calendar!');
      } catch (calErr) {
        toast.success('Visita salva no CRM! (Google Calendar indisponível)');
      }

      setDone(true);
      setTimeout(() => {
        setDone(false);
        onOpenChange(false);
        // Reset
        setDate(defaultDate);
        setTime(defaultTime);
        setNotes('');
        setVisitType('primeira_visita');
      }, 1500);

    } catch (err) {
      toast.error('Erro ao agendar visita: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Agendar Visita — {client.first_name}
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle className="w-14 h-14 text-green-500" />
            <p className="text-lg font-semibold text-slate-800">Visita Agendada!</p>
            <p className="text-sm text-slate-500">Evento criado no Google Calendar</p>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Info cliente */}
            <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="font-semibold">{client.first_name}</span>
                {client.clinic_name && <span className="text-slate-400">• {client.clinic_name}</span>}
              </div>
              {(client.address || client.city) && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{client.address || client.city}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>

            {/* Tipo de visita */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Tipo de Visita</label>
              <div className="grid grid-cols-2 gap-2">
                {VISIT_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setVisitType(t.value)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                      visitType === t.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Data
                </label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Hora
                </label>
                <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Observações (opcional)</label>
              <Input
                placeholder="Objetivo da visita, itens a levar..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleSchedule}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                {loading ? 'Agendando...' : 'Agendar Visita'}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}