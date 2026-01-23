import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import MobVendedorDataExport from '@/components/MobVendedorDataExport';

export default function MobVendedorBackup() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Backup mobVendedor</h1>
            <p className="text-sm text-slate-600">Exporte completo de clientes, vendas, produtos e campanhas</p>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <MobVendedorDataExport />
      </div>
    </div>
  );
}