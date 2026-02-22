import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AgentConnectionManager from '@/components/AgentConnectionManager';

export default function AgentSetup() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">⚙️ Configuração de Agentes</h1>
          <p className="text-slate-600">Conecte seus assistentes de IA ao WhatsApp e comece a vender</p>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <AgentConnectionManager />
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl mb-2">🤖</p>
              <h3 className="font-semibold text-sm text-slate-900 mb-1">22 IAs Ativas</h3>
              <p className="text-xs text-slate-600">Análise completa de vendas, CRM e mercado</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-2xl mb-2">📱</p>
              <h3 className="font-semibold text-sm text-slate-900 mb-1">WhatsApp Nativo</h3>
              <p className="text-xs text-slate-600">Acesso direto pelo seu celular</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-2xl mb-2">⚡</p>
              <h3 className="font-semibold text-sm text-slate-900 mb-1">Tempo Real</h3>
              <p className="text-xs text-slate-600">Respostas instantâneas com IA</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}