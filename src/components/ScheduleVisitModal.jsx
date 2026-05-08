import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar, Clock, MapPin, Phone, Loader2, CheckCircle,
  AlertTriangle, Mail, Shield, XCircle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const VISIT_TYPES = [
  { value: 'primeira_visita', label: '🤝 Primeira Visita' },
  { value: 'demonstracao',    label: '🔬 Demonstração' },
  { value: 'followup',        label: '📋 Follow-up' },
  { value: 'fechamento',      label: '🏁 Fechamento' },
];

const DURATION_OPTIONS = [
  { value: 30,  label: '30 min' },
  { value: 60,  label: '1h' },
  { value: 90,  label: '1h30' },
  { value: 120, label: '2h' },
];

// Formata ISO -> "HH:MM" pt-BR
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

export default function ScheduleVisitModal({ client, open, onOpenChange }) {
  const today = new Date();
  const defaultDate = today.toISOString().slice(0, 10);

  const [date, setDate]             = useState(defaultDate);
  const [time, setTime]             = useState('09:00');
  const [visitType, setVisitType]   = useState('primeira_visita');
  const [duration, setDuration]     = useState(60);
  const [notes, setNotes]           = useState('');
  const [vetEmail, setVetEmail]     = useState(client?.email || '');

  // estados de fluxo
  const [step, setStep]           = useState('form');   // 'form' | 'checking' | 'conflict' | 'done'
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading]     = useState(false);

  if (!client) return null;

  const scheduledISO = () => new Date(`${date}T${time}:00`).toISOString();

  // ── PASSO 1: verifica disponibilidade ──────────────────────────────────
  const handleCheckAvailability = async () => {
    if (!date || !time) { toast.error('Informe data e hora'); return; }
    setStep('checking');
    setLoading(true);

    try {
      const res = await base44.functions.invoke('createCalendarVisit', {
        action: 'check_availability',
        scheduled_date: scheduledISO(),
        duration_minutes: duration,
      });

      const data = res.data;

      if (!data.available) {
        setConflicts(data.conflicts || []);
        setStep('conflict');
      } else {
        // Horário livre → cria diretamente
        await createVisitAndEvent();
      }
    } catch (err) {
      // Se falhar a verificação (ex: Calendar não conectado), cria no CRM apenas
      toast.warning('Não foi possível verificar disponibilidade no Google Calendar. Salvando no CRM...');
      await createVisitAndEvent({ calendarFallback: true });
    } finally {
      setLoading(false);
    }
  };

  // ── PASSO 2: cria visita no CRM + evento no Calendar ──────────────────
  const createVisitAndEvent = async ({ calendarFallback = false } = {}) => {
    setLoading(true);
    try {
      const scheduledDate = scheduledISO();

      // Cria visita no CRM
      const visit = await base44.entities.Visit.create({
        client_id: client.id,
        client_name: `${client.first_name}${client.clinic_name ? ' - ' + client.clinic_name : ''}`,
        scheduled_date: scheduledDate,
        duration_minutes: duration,
        visit_type: visitType,
        location: client.address || client.city || '',
        notes,
        status: 'agendada',
      });

      if (!calendarFallback) {
        // Cria evento no Google Calendar + envia convite ao vet
        try {
          const calRes = await base44.functions.invoke('createCalendarVisit', {
            action: 'create',
            visit_id: visit.id,
            client_name: client.first_name,
            clinic_name: client.clinic_name || '',
            phone: client.phone || '',
            address: client.address || client.city || '',
            scheduled_date: scheduledDate,
            visit_type: visitType,
            notes,
            vet_email: vetEmail || '',
            duration_minutes: duration,
          });

          const calData = calRes.data;
          if (calData?.invite_sent && calData?.vet_email) {
            toast.success(`Visita agendada! Convite enviado para ${calData.vet_email} ✉️`);
          } else {
            toast.success('Visita agendada e adicionada ao Google Calendar!');
          }
        } catch {
          toast.success('Visita salva no CRM! (sincronização Calendar falhou)');
        }
      } else {
        toast.success('Visita salva no CRM!');
      }

      setStep('done');
      setTimeout(() => {
        setStep('form');
        setDate(defaultDate);
        setTime('09:00');
        setNotes('');
        setVisitType('primeira_visita');
        setDuration(60);
        setConflicts([]);
        onOpenChange(false);
      }, 1800);

    } catch (err) {
      toast.error('Erro ao agendar visita: ' + err.message);
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Agendar Visita — {client.first_name}
          </DialogTitle>
        </DialogHeader>

        {/* ── SUCESSO ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle className="w-14 h-14 text-green-500" />
            <p className="text-lg font-semibold text-slate-800">Visita Agendada!</p>
            <p className="text-sm text-slate-500">Evento criado no Google Calendar</p>
          </div>
        )}

        {/* ── VERIFICANDO ── */}
        {step === 'checking' && (
          <div className="flex flex-col items-center py-10 gap-3">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-sm font-medium text-slate-600">Verificando disponibilidade na agenda...</p>
          </div>
        )}

        {/* ── CONFLITO ── */}
        {step === 'conflict' && (
          <div className="space-y-4 mt-2">
            <div className="rounded-xl p-4 bg-red-50 border border-red-200 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700 text-sm">Conflito de horário detectado!</p>
                <p className="text-xs text-red-600 mt-1">
                  Já existe um compromisso no seu Google Calendar neste horário:
                </p>
                <ul className="mt-2 space-y-1">
                  {conflicts.map((c, i) => (
                    <li key={i} className="text-xs font-mono bg-red-100 rounded px-2 py-1 text-red-700">
                      {fmtTime(c.start)} → {fmtTime(c.end)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-sm text-slate-600">O que deseja fazer?</p>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="border-slate-300 text-slate-700 gap-2"
                onClick={() => setStep('form')}
              >
                <Clock className="w-4 h-4" />
                Escolher outro horário
              </Button>

              <Button
                className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
                disabled={loading}
                onClick={() => createVisitAndEvent()}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                Agendar mesmo assim (sobrepor)
              </Button>
            </div>
          </div>
        )}

        {/* ── FORMULÁRIO ── */}
        {step === 'form' && (
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

            {/* Data, Hora e Duração */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Data
                </label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Hora
                </label>
                <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Duração</label>
                <select
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1"
                >
                  {DURATION_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* E-mail do veterinário */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                E-mail do veterinário (convite automático)
              </label>
              <Input
                type="email"
                placeholder="dr.frank@clinicavet.com.br"
                value={vetEmail}
                onChange={e => setVetEmail(e.target.value)}
              />
              {vetEmail && vetEmail.includes('@') && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Convite de calendário será enviado automaticamente
                </p>
              )}
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
                onClick={handleCheckAvailability}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Shield className="w-4 h-4" />
                }
                {loading ? 'Verificando agenda...' : 'Verificar & Agendar'}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>

            <p className="text-xs text-slate-400 text-center">
              🛡️ Conflitos de horário serão detectados automaticamente antes de confirmar
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}