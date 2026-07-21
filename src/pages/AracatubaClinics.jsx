import React, { useMemo, useState } from 'react';
import { Download, Loader2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AracatubaClinicCard from '@/components/clients/AracatubaClinicCard';

const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const csvCell = (value) => `"${String(value || '').replace(/"/g, '""')}"`;

export default function AracatubaClinics() {
  const [search, setSearch] = useState('');
  const { data: clients = [], isLoading } = useQuery({ queryKey: ['aracatuba-clients'], queryFn: () => base44.entities.Client.list('-updated_date', 1000), staleTime: 120000 });
  const clinics = useMemo(() => clients.filter((c) => normalize(c.city).includes('aracatuba')).filter((c) => !search || normalize(`${c.clinic_name} ${c.full_name} ${c.phone}`).includes(normalize(search))).sort((a, b) => (a.priority_level || 9) - (b.priority_level || 9)), [clients, search]);
  const exportCsv = () => {
    const rows = [['Clínica','Cidade','Telefone','Instagram','Status','Prioridade','Equipamento sugerido','Próximo passo','Observações'], ...clinics.map((c) => [c.clinic_name || c.full_name,c.city,c.phone,c.instagram_handle,c.status,c.priority_level,c.equipment_suggestion || c.equipment_interest,c.next_action || c.ai_next_best_action,c.notes])];
    const blob = new Blob(['\uFEFF' + rows.map((row) => row.map(csvCell).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'clinicas-aracatuba.csv'; link.click(); URL.revokeObjectURL(link.href);
  };
  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-28"><div className="mx-auto max-w-5xl space-y-4">
      <header className="rounded-3xl bg-slate-900 p-5 text-white"><p className="text-xs font-bold uppercase tracking-widest text-orange-400">Seamaty Brasil • Compet Distribuidora</p><h1 className="mt-1 text-2xl font-black">Clínicas de Araçatuba</h1><p className="mt-1 text-sm text-slate-300">Visão operacional dos registros já cadastrados no CRM NR22888.</p></header>
      <div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar clínica ou telefone" className="h-11 pl-10" /></div><Button onClick={exportCsv} disabled={!clinics.length} className="h-11"><Download />CSV</Button></div>
      <p className="text-sm font-semibold text-slate-600">{clinics.length} clínicas encontradas</p>
      {isLoading ? <Loader2 className="mx-auto mt-12 animate-spin" /> : <div className="grid gap-3 md:grid-cols-2">{clinics.map((clinic) => <AracatubaClinicCard key={clinic.id} clinic={clinic} />)}</div>}
    </div></div>
  );
}