import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Plus, X, CheckCircle, MapPin, Wrench, Target, Trophy, MessageSquare, Building2, Shield } from 'lucide-react';

const CLINIC_TYPES = [
  'Clínica Pequena (1-2 vets)',
  'Clínica Média (3-5 vets)',
  'Hospital Veterinário',
  'Clínica Especializada',
  'Laboratório Terceirizado',
];

const EMPTY_CASE = {
  title: '',
  problem: '',
  equipment_used: '',
  strategy: '',
  result: '',
  approach_phrase: '',
  clinic_type: '',
  city: '',
  objection_won: '',
  approved_to_share: false,
};

function CaseForm({ onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY_CASE);
  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const fields = [
    { key: 'title', label: 'Título do Caso', icon: BookOpen, placeholder: 'Ex: Clínica que triplicou diagnósticos em 60 dias' },
    { key: 'problem', label: '🔴 Problema Inicial', icon: null, placeholder: 'Qual era a dor/situação da clínica antes?' },
    { key: 'equipment_used', label: '⚙️ Equipamento/Insumo Usado', icon: Wrench, placeholder: 'Ex: VG2 + reagentes de hematologia' },
    { key: 'strategy', label: '🎯 Estratégia Aplicada', icon: Target, placeholder: 'Como você conduziu a venda/implementação?' },
    { key: 'result', label: '🏆 Resultado Obtido', icon: Trophy, placeholder: 'Ex: Clínica passou de 40 para 120 exames/mês' },
    { key: 'approach_phrase', label: '💬 Frase de Abordagem', icon: MessageSquare, placeholder: 'A frase que abriu a conversa ou fechou a venda' },
    { key: 'city', label: '📍 Cidade/Região', icon: MapPin, placeholder: 'Ex: Interior de SP, Grande São Paulo' },
    { key: 'objection_won', label: '🛡️ Objeção Vencida', icon: Shield, placeholder: 'Qual objeção foi superada? Como?' },
  ];

  return (
    <div className="bg-white border border-purple-200 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Plus className="w-4 h-4 text-purple-600" /> Novo Caso Real
        </h3>
        <button onClick={onCancel}><X className="w-4 h-4 text-slate-400" /></button>
      </div>

      <div className="space-y-3">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-xs font-bold text-slate-600 mb-1 block">{label}</label>
            {key === 'problem' || key === 'strategy' || key === 'result' || key === 'objection_won' ? (
              <textarea
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400 resize-none"
                rows={2}
                placeholder={placeholder}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
              />
            ) : (
              <Input
                placeholder={placeholder}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                className="text-sm"
              />
            )}
          </div>
        ))}

        <div>
          <label className="text-xs font-bold text-slate-600 mb-1 block">🏥 Tipo de Clínica</label>
          <div className="flex flex-wrap gap-1">
            {CLINIC_TYPES.map(type => (
              <button
                key={type}
                onClick={() => set('clinic_type', type)}
                className={`text-xs px-2 py-1 rounded-full border transition-all ${form.clinic_type === type ? 'bg-purple-600 text-white border-purple-600' : 'border-slate-200 text-slate-600 hover:border-purple-300'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="approved"
            checked={form.approved_to_share}
            onChange={e => set('approved_to_share', e.target.checked)}
            className="w-4 h-4 accent-purple-600"
          />
          <label htmlFor="approved" className="text-xs text-slate-600">
            ✅ Aprovado para compartilhar publicamente (sem nome da clínica)
          </label>
        </div>

        <Button
          onClick={() => onSave(form)}
          className="w-full bg-purple-600 hover:bg-purple-700 h-9 text-sm"
          disabled={!form.title || !form.problem}
        >
          <CheckCircle className="w-4 h-4 mr-1" /> Salvar Caso Real
        </Button>
      </div>
    </div>
  );
}

function CaseCard({ c }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border border-slate-200">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="font-bold text-sm text-slate-800">{c.title}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {c.clinic_type && <Badge className="text-[10px] bg-slate-100 text-slate-600 border-0">{c.clinic_type}</Badge>}
              {c.city && (
                <Badge className="text-[10px] bg-blue-50 text-blue-600 border-0 flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" /> {c.city}
                </Badge>
              )}
              {c.approved_to_share && <Badge className="text-[10px] bg-green-50 text-green-700 border-0">✅ Aprovado</Badge>}
            </div>
          </div>
          <button onClick={() => setOpen(p => !p)} className="text-xs text-purple-600 ml-2 shrink-0">
            {open ? 'Ocultar' : 'Ver'}
          </button>
        </div>

        <p className="text-xs text-red-600 font-medium">🔴 {c.problem?.slice(0, 80)}{c.problem?.length > 80 ? '...' : ''}</p>

        {open && (
          <div className="mt-3 space-y-2 border-t pt-2">
            {c.equipment_used && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">⚙️ Equipamento/Insumo</p>
                <p className="text-xs text-slate-700">{c.equipment_used}</p>
              </div>
            )}
            {c.strategy && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">🎯 Estratégia</p>
                <p className="text-xs text-slate-700">{c.strategy}</p>
              </div>
            )}
            {c.result && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">🏆 Resultado</p>
                <p className="text-xs font-semibold text-green-700">{c.result}</p>
              </div>
            )}
            {c.approach_phrase && (
              <div className="bg-purple-50 rounded-lg p-2">
                <p className="text-[10px] font-bold text-purple-500 uppercase mb-0.5">💬 Frase de Abordagem</p>
                <p className="text-xs text-purple-800 italic">"{c.approach_phrase}"</p>
              </div>
            )}
            {c.objection_won && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">🛡️ Objeção Vencida</p>
                <p className="text-xs text-slate-700">{c.objection_won}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CaseLibrary({ cases: externalCases }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: cases = externalCases } = useQuery({
    queryKey: ['cases-library'],
    queryFn: () => base44.entities.SalesKnowledgeBase?.list('-created_date', 50).catch(() => []),
    staleTime: 30000,
    initialData: externalCases,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SalesKnowledgeBase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases-library'] });
      setShowForm(false);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-bold text-slate-800">📚 Biblioteca de Casos Reais</h2>
          <p className="text-xs text-slate-500">Histórias comerciais reais usadas pela IA para gerar conteúdo</p>
        </div>
        <Button onClick={() => setShowForm(p => !p)} size="sm" className="bg-purple-600 hover:bg-purple-700 h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Novo Caso
        </Button>
      </div>

      {showForm && (
        <CaseForm
          onSave={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
        <p className="text-xs font-bold text-amber-700 mb-1">💡 Como usar a Biblioteca</p>
        <ul className="text-xs text-amber-600 space-y-0.5 list-disc list-inside">
          <li>Cadastre casos reais das suas visitas (sem nome do cliente)</li>
          <li>A IA usa esses casos como inspiração ao gerar conteúdo</li>
          <li>Marque como "Aprovado" casos que você pode referenciar publicamente</li>
          <li>Quanto mais casos, mais rico e personalizado o conteúdo gerado</li>
        </ul>
      </div>

      <div className="space-y-3">
        {cases.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border">
            <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-500">Biblioteca vazia</p>
            <p className="text-xs text-slate-400 mt-1">Cadastre seu primeiro caso real para enriquecer a IA</p>
          </div>
        ) : (
          cases.map((c, i) => <CaseCard key={c.id || i} c={c} />)
        )}
      </div>
    </div>
  );
}