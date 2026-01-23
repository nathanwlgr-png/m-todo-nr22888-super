import React from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import MobVendedorSync from '@/components/MobVendedorSync';
import MobVendedorInventoryViewer from '@/components/MobVendedorInventoryViewer';

export default function MobVendedorDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">mobVendedor</h1>
            <p className="text-sm text-slate-600">Sincronize seu estoque e vendas do Target Sistemas</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Sincronização */}
        <Card className="p-6 bg-white shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Integração Target Sistemas</h2>
          <MobVendedorSync />
        </Card>

        {/* Inventário */}
        <Card className="p-6 bg-white shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Controle de Estoque</h2>
          <MobVendedorInventoryViewer />
        </Card>

        {/* Info */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h3 className="font-semibold text-slate-800 mb-2">💡 Dicas</h3>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>✓ Sincronize regularmente para manter dados atualizados</li>
            <li>✓ Monitore equipamentos com estoque baixo</li>
            <li>✓ Use dados de vendas para planejar reposição</li>
            <li>✓ Dados são atualizados a cada 5 minutos automaticamente</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}