import React, { useState } from 'react';
import { ArrowLeft, Loader2, Save, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

const TEMPS = [
  { val: 'quente', label: '🟢 Quente', cls: 'bg-green-700 hover:bg-green-600' },
  { val: 'morno',  label: '🟡 Morno',  cls: 'bg-yellow-700 hover:bg-yellow-600' },
  { val: 'frio',   label: '🔴 Frio',   cls: 'bg-red-800 hover:bg-red-700' },
  { val: 'depois', label: '🟣 Ver depois', cls: 'bg-purple-800 hover:bg-purple-700' },
];

export default function CacaQuickForm({ clinic, onSave, onBack }) {
  const [form, setForm] = useState({
    clinic_name: clinic.name || '',
    city: clinic.city || '',
    phone: clinic.phone || '',
    address: clinic.address || '',
    temperatura: 'frio',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState(null); // 'quick' | 'investigate'

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (withInvestigate = false) => {
    if (!form.clinic_name || !form.city) return;
    setSaving(true);
    setMode(withInvestigate ? 'investigate' : 'quick');
    try {
      await onSave({ ...form, investigate: withInvestigate });
    } finally {
      setSaving(false);
      setMode(null);
    }
  };

  return (
    <Card className="bg-slate-950 border-orange-500/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={onBack} className="h-7 w-7 text-orange-400">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle className="text-orange-400 text-base">Cadastro Rápido</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Campos principais */}
        <div className="space-y-2">
          <Input
            placeholder="Nome da clínica *"
            value={form.clinic_name}
            onChange={e => set('clinic_name', e.target.value)}
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 h-11 text-base"
          />
          <Input
            placeholder="Cidade *"
            value={form.city}
            onChange={e => set('city', e.target.value)}
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
          <Input
            placeholder="WhatsApp / Telefone"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            type="tel"
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
          <Input
            placeholder="Endereço (opcional)"
            value={form.address}
            onChange={e => set('address', e.target.value)}
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Temperatura */}
        <div>
          <p className="text-xs text-orange-600 font-bold mb-2">TEMPERATURA</p>
          <div className="grid grid-cols-2 gap-2">
            {TEMPS.map(t => (
              <button
                key={t.val}
                onClick={() => set('temperatura', t.val)}
                className={`py-2 rounded-lg text-sm font-bold transition-all ${
                  form.temperatura === t.val ? t.cls + ' text-white ring-2 ring-white/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Observação */}
        <div>
          <p className="text-xs text-orange-600 font-bold mb-1">OBSERVAÇÃO RÁPIDA</p>
          <textarea
            placeholder="Ex: tem lab, sem equipamento, porte médio..."
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white text-sm placeholder:text-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Botões de ação */}
        <div className="space-y-2 pt-1">
          {/* Salvar rápido */}
          <Button
            className="w-full bg-green-600 hover:bg-green-700 h-11 font-bold text-base"
            onClick={() => handleSave(false)}
            disabled={!form.clinic_name || !form.city || saving}
          >
            {saving && mode === 'quick' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saving && mode === 'quick' ? 'Salvando lead...' : '✅ Cadastrar Prospecção Rápida'}
          </Button>

          {/* Salvar + Investigar */}
          <Button
            className="w-full bg-orange-700 hover:bg-orange-600 h-11 font-bold"
            onClick={() => handleSave(true)}
            disabled={!form.clinic_name || !form.city || saving}
          >
            {saving && mode === 'investigate' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
            {saving && mode === 'investigate' ? 'Salvando e agendando investigação...' : '🔍 Cadastrar + Investigar Fundo'}
          </Button>

          {/* Só salvar */}
          <Button
            variant="ghost"
            className="w-full text-slate-400 hover:text-white text-sm"
            onClick={() => handleSave(false)}
            disabled={!form.clinic_name || !form.city || saving}
          >
            Apenas salvar para depois
          </Button>
        </div>

        <p className="text-center text-slate-600 text-[10px]">
          * Campos obrigatórios. Investigação IA somente sob demanda.
        </p>
      </CardContent>
    </Card>
  );
}