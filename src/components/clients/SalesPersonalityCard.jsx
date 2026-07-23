import React from 'react';
import { Brain, Target } from 'lucide-react';
import { getFirstNameSalesProfile } from '@/lib/firstNameSalesProfile';

export default function SalesPersonalityCard({ client }) {
  if (!client?.first_name) return null;
  const profile = getFirstNameSalesProfile(client.first_name);
  return <section className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(168,85,247,0.25)' }}>
    <div className="mb-3 flex items-center gap-2">
      <Brain className="h-4 w-4 text-purple-400" />
      <h2 className="text-xs font-black uppercase tracking-widest text-purple-400">Leitura de Personalidade</h2>
    </div>
    <p className="text-sm font-black text-white">{profile.title}</p>
    <p className="mt-1 text-xs leading-relaxed text-slate-300">{profile.description}</p>
    <div className="mt-3 rounded-xl bg-slate-900 p-3">
      <p className="text-[10px] font-black uppercase text-blue-300">Como decide</p>
      <p className="mt-1 text-xs text-slate-300">{profile.decision}</p>
    </div>
    <div className="mt-2 rounded-xl bg-slate-900 p-3">
      <p className="flex items-center gap-1 text-[10px] font-black uppercase text-orange-300"><Target className="h-3 w-3" /> Gatilhos comerciais</p>
      <div className="mt-2 flex flex-wrap gap-1">{profile.triggers.map(trigger => <span key={trigger} className="rounded-full bg-orange-950 px-2 py-1 text-[10px] font-bold text-orange-200">{trigger}</span>)}</div>
      <p className="mt-2 text-xs leading-relaxed text-slate-300">{profile.communication}</p>
    </div>
  </section>;
}