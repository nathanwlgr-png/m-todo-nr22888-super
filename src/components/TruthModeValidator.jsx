import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

const CONFIDENCE_LEVELS = {
  confirmado: { icon: '🟢', label: 'Confirmado', color: 'bg-green-100 text-green-800' },
  provavel: { icon: '🟡', label: 'Provável', color: 'bg-yellow-100 text-yellow-800' },
  hipotese: { icon: '🔴', label: 'Hipótese', color: 'bg-red-100 text-red-800' },
  nao_encontrado: { icon: '⚫', label: 'Não confirmado', color: 'bg-slate-100 text-slate-800' }
};

export default function TruthModeValidator({ clientData = {} }) {
  const [showDetails, setShowDetails] = useState(false);

  // Validar cada campo
  const validations = {
    nome: {
      status: clientData.nome ? 'confirmado' : 'nao_encontrado',
      valor: clientData.nome || 'Não informado',
      fonte: clientData.nome_fonte || 'CRM'
    },
    telefone: {
      status: clientData.telefone ? 'confirmado' : 'nao_encontrado',
      valor: clientData.telefone || 'Não informado',
      fonte: clientData.telefone_fonte || 'Público/WhatsApp'
    },
    cidade: {
      status: clientData.cidade ? 'confirmado' : 'nao_encontrado',
      valor: clientData.cidade || 'Não informado',
      fonte: clientData.cidade_fonte || 'CRM'
    },
    equipamento: {
      status: clientData.equipamento_confirmado ? 'confirmado' : (clientData.equipamento_provavel ? 'provavel' : 'nao_encontrado'),
      valor: clientData.equipamento || 'Não informado',
      fonte: clientData.equipamento_fonte || 'A validar',
      aviso: !clientData.equipamento_confirmado ? 'Validar em visita' : null
    },
    ultima_compra: {
      status: clientData.ultima_compra ? 'confirmado' : 'nao_encontrado',
      valor: clientData.ultima_compra ? new Date(clientData.ultima_compra).toLocaleDateString('pt-BR') : 'Não encontrada',
      fonte: clientData.ultima_compra_fonte || 'Histórico vendas'
    }
  };

  const confirmados = Object.values(validations).filter(v => v.status === 'confirmado').length;
  const total = Object.keys(validations).length;

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              🔒 Modo Verdade Absoluta
            </CardTitle>
            <p className="text-xs text-slate-600 mt-1">
              {confirmados}/{total} dados confirmados • {Math.round((confirmados/total)*100)}% confiança
            </p>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-slate-400 hover:text-slate-600"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        
        {/* Barra de confiança */}
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all"
            style={{ width: `${(confirmados/total)*100}%` }}
          />
        </div>

        {/* Validações */}
        {showDetails && (
          <div className="space-y-2">
            {Object.entries(validations).map(([campo, val]) => {
              const conf = CONFIDENCE_LEVELS[val.status];
              return (
                <div key={campo} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-900 capitalize">{campo}</p>
                      <p className="text-xs text-slate-600 mt-1">{val.valor}</p>
                    </div>
                    <Badge className={conf.color}>
                      {conf.icon} {conf.label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>📌 Fonte: {val.fonte}</span>
                  </div>

                  {val.aviso && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-orange-600">
                      <AlertCircle className="w-3 h-3" />
                      {val.aviso}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Alerta se muitos dados faltam */}
        {confirmados < total * 0.6 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Cadastro incompleto — Validar em visita antes de análise IA
            </p>
          </div>
        )}

        {/* Recomendação */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            <CheckCircle2 className="w-3 h-3 inline mr-1" />
            <strong>Sistema nunca inventa dados.</strong> Se não encontrado = marca como "Não confirmado". Se dúvida = marca como "Precisa validar".
          </p>
        </div>

      </CardContent>
    </Card>
  );
}