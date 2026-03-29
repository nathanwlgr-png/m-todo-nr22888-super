import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapPin, X, Loader2, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QuickVisitButton() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['quick-visit-clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100),
    staleTime: 120000,
    enabled: open,
  });

  const filtered = clients.filter(c =>
    !search || (c.clinic_name || c.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const now = new Date().toISOString();
    await base44.entities.Visit.create({
      client_id: selected.id,
      client_name: selected.clinic_name || selected.full_name,
      scheduled_date: now,
      status: 'realizada',
      notes,
    });
    await base44.entities.Client.update(selected.id, { last_visit_date: now.split('T')[0] });
    setSaving(false);
    setDone(true);
    setTimeout(() => {
      setOpen(false);
      setDone(false);
      setSelected(null);
      setNotes('');
      setSearch('');
    }, 1500);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all"
        title="Registrar Visita Rápida"
      >
        <MapPin className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl p-5 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            <h2 className="font-bold text-lg">Registrar Visita Rápida</h2>
          </div>
          <button onClick={() => setOpen(false)}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {!selected ? (
          <>
            <input
              autoFocus
              placeholder="Buscar cliente ou clínica..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <div className="overflow-y-auto flex-1 space-y-1">
              {filtered.slice(0, 20).map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-teal-50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-sm">{c.clinic_name || c.full_name}</p>
                    <p className="text-xs text-slate-400">{c.city || 'Sem cidade'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          </>
        ) : done ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-teal-600">
            <Check className="w-16 h-16" />
            <p className="font-bold text-lg">Visita registrada!</p>
          </div>
        ) : (
          <>
            <div className="bg-teal-50 rounded-xl p-3 mb-4">
              <p className="font-semibold text-teal-800">{selected.clinic_name || selected.full_name}</p>
              <button onClick={() => setSelected(null)} className="text-xs text-teal-600 underline">trocar cliente</button>
            </div>
            <textarea
              placeholder="Notas da visita (opcional)..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 mb-4"
            />
            <Button
              onClick={save}
              disabled={saving}
              className="w-full bg-teal-600 hover:bg-teal-700 gap-2 h-12 text-base"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
              Salvar Visita Agora
            </Button>
          </>
        )}
      </div>
    </div>
  );
}