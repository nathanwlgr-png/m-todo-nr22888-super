import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, MessageCircle } from 'lucide-react';

export default function AracatubaClinicCard({ clinic }) {
  const phone = String(clinic.phone || '').replace(/\D/g, '');
  const name = clinic.clinic_name || clinic.full_name || clinic.first_name;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="font-bold text-slate-900">{name}</h2><p className="text-xs text-slate-500">{clinic.city}</p></div>
        <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700">Prioridade {clinic.priority_level || 'a validar'}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div><dt className="text-slate-500">Status</dt><dd className="font-semibold">{clinic.status || 'morno'}</dd></div>
        <div><dt className="text-slate-500">Equipamento sugerido</dt><dd className="font-semibold">{clinic.equipment_suggestion || clinic.equipment_interest || 'A validar'}</dd></div>
        <div className="col-span-2"><dt className="text-slate-500">Próximo passo</dt><dd className="font-semibold">{clinic.next_action || clinic.ai_next_best_action || 'Validar contato e necessidade'}</dd></div>
        <div className="col-span-2"><dt className="text-slate-500">Observações</dt><dd className="line-clamp-3">{clinic.notes || 'Sem observações'}</dd></div>
      </dl>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Link to={`/ClienteDetalhe360?id=${clinic.id}`} className="flex h-10 items-center justify-center rounded-xl bg-orange-600 text-xs font-bold text-white">Abrir CRM</Link>
        {phone.length >= 10 ? <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center gap-1 rounded-xl border text-xs font-bold"><MessageCircle className="w-4 h-4" />WhatsApp</a> : <span className="flex h-10 items-center justify-center rounded-xl border text-xs text-slate-400">Sem telefone</span>}
        {clinic.instagram_handle ? <a href={clinic.instagram_handle.startsWith('http') ? clinic.instagram_handle : `https://instagram.com/${clinic.instagram_handle.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center gap-1 rounded-xl border text-xs font-bold"><ExternalLink className="w-4 h-4" />Instagram</a> : <span className="flex h-10 items-center justify-center rounded-xl border text-xs text-slate-400">Sem Instagram</span>}
      </div>
    </article>
  );
}