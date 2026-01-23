import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MobiMigrationTool from '@/components/MobiMigrationTool';

export default function MobiMigration() {
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
            <h1 className="text-2xl font-bold text-slate-900">Migração MOBI → NR22</h1>
            <p className="text-sm text-slate-600">Importar todos os dados do sistema MOBI e replicar estrutura de vendas</p>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <MobiMigrationTool />

        {/* Informações */}
        <div className="mt-8 space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="font-semibold text-blue-900">📋 O que será migrado:</p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
              <li>✅ Todos os clientes ativos do MOBI</li>
              <li>✅ Histórico completo de vendas</li>
              <li>✅ Estoque de todos os produtos</li>
              <li>✅ Estrutura de vendas (comissões, metas, descontos)</li>
              <li>✅ Informações de fornecedores</li>
            </ul>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
            <p className="font-semibold text-amber-900">🗑️ O que será apagado:</p>
            <ul className="text-sm text-amber-800 mt-2 space-y-1 ml-4">
              <li>❌ Clientes criados antes da migração NR22</li>
              <li>⚠️ Dados antigos sem IA/scoring</li>
            </ul>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="font-semibold text-green-900">🎯 Resultado:</p>
            <ul className="text-sm text-green-800 mt-2 space-y-1 ml-4">
              <li>✓ Sistema NR22 com dados MOBI integrados</li>
              <li>✓ Pasta estruturada replicando MOBI</li>
              <li>✓ Todos os clientes com histórico</li>
              <li>✓ Estoque e vendas sincronizadas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}