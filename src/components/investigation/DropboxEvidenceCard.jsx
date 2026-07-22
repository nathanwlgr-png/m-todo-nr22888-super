import React from 'react';
import { FileCheck2 } from 'lucide-react';

export default function DropboxEvidenceCard({ evidence }) {
  if (!evidence) return null;
  return (
    <section className="rounded-2xl border border-blue-500/25 bg-neutral-950 p-4">
      <div className="mb-2 flex items-center gap-2 text-blue-400">
        <FileCheck2 className="h-4 w-4" />
        <h2 className="text-xs font-black uppercase tracking-widest">Base exata do Dropbox</h2>
      </div>
      <p className="text-xs leading-relaxed text-slate-300">{evidence.summary}</p>
      {!!evidence.exact_facts?.length && <ul className="mt-3 space-y-1">{evidence.exact_facts.map((fact, index) => <li key={index} className="text-xs text-slate-400">• {fact}</li>)}</ul>}
      {evidence.commercial_application && <p className="mt-3 rounded-xl bg-blue-500/10 p-3 text-xs text-blue-200">{evidence.commercial_application}</p>}
      {!!evidence.files_read?.length && <div className="mt-3 border-t border-neutral-800 pt-2">{evidence.files_read.map((file) => <p key={file.path} className="truncate text-[10px] text-slate-500" title={file.path}>{file.name}</p>)}</div>}
    </section>
  );
}