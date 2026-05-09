import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useModuleProtection } from '@/hooks/useModuleProtection';
import { base44 } from '@/api/base44Client';

/**
 * Página de demonstração — mostra como usar proteção de módulo
 */
export default function ModuleProtectionDemo() {
  const { safeInvoke, moduleStates } = useModuleProtection();

  const testFunctions = [
    { name: 'predictiveSalesAnalysis', label: '📈 Análise Preditiva', module: 'predictive' },
    { name: 'aiClientSegmentation', label: '👥 Segmentação', module: 'segmentation' },
    { name: 'analyzeSalesInteraction', label: '🎙️ Análise de Chamadas', module: 'callAnalysis' },
  ];

  const handleTest = async (functionName) => {
    try {
      const result = await safeInvoke(
        (fn, p) => base44.functions.invoke(fn, p),
        functionName,
        {}
      );
      console.log('✅ Sucesso:', result);
    } catch (err) {
      console.error('❌ Erro:', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <h1 className="text-3xl font-black text-slate-900">🛡️ Proteção de Módulos</h1>
        <p className="text-slate-600">Teste cada função — verá aviso se módulo tiver desligado</p>

        {/* Status */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6 space-y-2">
            <p className="text-sm font-bold text-blue-900">Estado dos Módulos:</p>
            {testFunctions.map(f => (
              <div key={f.module} className="flex items-center gap-2 text-sm">
                {moduleStates[f.module] ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={moduleStates[f.module] ? 'text-green-900' : 'text-red-900'}>
                  {f.label}: {moduleStates[f.module] ? '✅ ATIVO' : '❌ DESLIGADO'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Teste */}
        <Card>
          <CardHeader>
            <CardTitle>Teste de Proteção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {testFunctions.map(f => (
              <Button
                key={f.name}
                onClick={() => handleTest(f.name)}
                variant={moduleStates[f.module] ? 'default' : 'outline'}
                className="w-full"
              >
                Testar: {f.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Guia */}
        <Card className="bg-indigo-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-base">💡 Como Usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>✅ Vá em <strong>Configurações de Consumo</strong></p>
            <p>✅ Desative um módulo</p>
            <p>✅ Volte aqui e tente usar a função — receberá aviso</p>
            <p>✅ Reative em Configurações e a função funcionará</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}