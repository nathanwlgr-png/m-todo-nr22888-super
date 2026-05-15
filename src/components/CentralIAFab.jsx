// Botão flutuante fixo — Acesso rápido Central IA Master
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Brain } from 'lucide-react';

export default function CentralIAFab() {
  return (
    <Link to={createPageUrl('CentralIAMaster')}>
      <div
        className="fixed z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl active:scale-95 transition-transform"
        style={{
          bottom: 80,
          right: 16,
          background: 'linear-gradient(135deg, #1a0050, #3b0080)',
          border: '1px solid rgba(139,92,246,0.6)',
          boxShadow: '0 0 20px rgba(139,92,246,0.4)',
        }}
      >
        <Brain className="w-5 h-5 text-purple-300" />
        <span className="text-xs font-black text-purple-200">Central IA</span>
      </div>
    </Link>
  );
}