import { useState, useEffect } from 'react';
import { getModo, setModo } from '@/lib/ModoVendedor';
import { ShieldCheck, Briefcase } from 'lucide-react';

export default function ModoVendedorToggle({ onChange }) {
  const [modo, setModoState] = useState(getModo());

  const toggle = () => {
    const novo = modo === 'vendedor' ? 'admin' : 'vendedor';
    setModo(novo);
    setModoState(novo);
    onChange?.(novo);
  };

  const isVendedor = modo === 'vendedor';

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all"
      style={{
        background: isVendedor ? 'rgba(255,107,0,0.15)' : 'rgba(139,92,246,0.15)',
        border: `1px solid ${isVendedor ? 'rgba(255,107,0,0.4)' : 'rgba(139,92,246,0.4)'}`,
        color: isVendedor ? '#ff9500' : '#a78bfa',
      }}
    >
      {isVendedor ? <Briefcase className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
      {isVendedor ? 'Vendedor' : 'Admin'}
    </button>
  );
}