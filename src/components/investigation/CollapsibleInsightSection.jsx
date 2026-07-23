import React, { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const TONES = {
  blue: { border: 'border-blue-500/20', title: 'text-blue-400' },
  orange: { border: 'border-orange-500/20', title: 'text-orange-400' },
};

export default function CollapsibleInsightSection({ title, icon, tone, children }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const colors = TONES[tone] || TONES.blue;

  return (
    <section className={`rounded-2xl border bg-slate-900 ${colors.border}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen(current => !current)}
        className="flex min-h-12 w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className={`text-xs font-black uppercase tracking-widest ${colors.title}`}>{icon} {title}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${colors.title} ${open ? 'rotate-180' : ''}`} />
      </button>
      <div id={contentId} hidden={!open} className="px-4 pb-4">{children}</div>
    </section>
  );
}