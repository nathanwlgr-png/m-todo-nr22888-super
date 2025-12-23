import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, Briefcase } from 'lucide-react';
import OfflineStorage from '@/components/OfflineStorage';
import OfflineClientViewer from '@/components/OfflineClientViewer';

export default function OfflineMode() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Modo Offline</h1>
            <p className="text-blue-200 text-sm">Trabalhe sem internet na estrada</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Offline Storage */}
        <OfflineStorage />

        {/* Client Viewer */}
        <Card className="p-5 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-slate-700" />
            <h3 className="font-semibold text-slate-900">Clientes Salvos</h3>
          </div>
          <OfflineClientViewer />
        </Card>

        {/* Info */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-900 font-semibold mb-2">💡 Como funciona:</p>
          <ol className="text-xs text-blue-800 space-y-1">
            <li>1. Clique em "Baixar Tudo para Offline"</li>
            <li>2. Todos os clientes, campanhas e materiais ficam salvos</li>
            <li>3. Na estrada SEM internet, você acessa tudo</li>
            <li>4. Quando voltar online, clique para sincronizar</li>
            <li>5. Exportar arquivo JSON = backup no celular</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}