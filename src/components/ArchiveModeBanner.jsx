import React from 'react';
import { Archive } from 'lucide-react';

// Aviso fixo indicando que este app é apenas consulta/arquivo.
// Não afeta nenhuma lógica — puramente informativo.
export default function ArchiveModeBanner() {
  return (
    <div
      className="w-full px-3 py-1.5 flex items-center justify-center gap-1.5 text-center shrink-0"
      style={{ background: '#2a1d05', borderBottom: '1px solid rgba(255,180,0,0.3)' }}
    >
      <Archive className="w-3 h-3 text-yellow-500 shrink-0" />
      <p className="text-[9px] sm:text-[10px] font-bold text-yellow-500 leading-tight">
        CRM SEAMATY — Método NR22888 master.
      </p>
    </div>
  );
}