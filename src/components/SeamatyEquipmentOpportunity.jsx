/**
 * SeamatyEquipmentOpportunity — painel de oportunidades de equipamento para o ClientProfile
 * Mostra: equipamentos que possui, faltantes, upgrade sugerido, insumos
 * Fonte central: lib/SeamatyData.js
 */
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, TrendingUp, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EQUIPAMENTOS, sugerirUpgrade, formatPreco, getTextoPreco, validarTextoTecnico } from '@/lib/SeamatyData';

const TODOS_MODELOS = Object.keys(EQUIPAMENTOS).filter(m => m !== 'Maleta VG1');

export default function SeamatyEquipmentOpportunity({ client }) {
  const [aberto, setAberto] = useState(false);

  if (!client) return null;

  // Equipamentos que o cliente possui
  const equipsVendidos = [
    client.equipment_sold,
    client.current_equipment,
    ...(client.equipment_purchase_history || []).map(h => h.equipment_name),
  ].filter(Boolean).map(e => String(e).trim());

  // Upgrade sugerido
  const upgrades = sugerirUpgrade(client.current_equipment, [client.equipment_sold]);
  const topUpgrade = upgrades[0];

  // Equipamentos faltantes
  const faltantes = TODOS_MODELOS.filter(m => !equipsVendidos.some(e =>
    e.toUpperCase().includes(m.toUpperCase()) || m.toUpperCase().includes(e.toUpperCase())
  ));

  // Validação de erros técnicos (exibir alerta se notas tiverem termos proibidos)
  const errosTecnicos = validarTextoTecnico(client.notes || '');

  return (
    <div className="border border-orange-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setAberto(a => !a)}
        className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-orange-700">
          <TrendingUp className="w-4 h-4" /> Oportunidades Seamaty
        </span>
        {aberto ? <ChevronUp className="w-4 h-4 text-orange-600" /> : <ChevronDown className="w-4 h-4 text-orange-600" />}
      </button>

      {aberto && (
        <div className="bg-white p-3 space-y-4">
          {/* Equipamentos que possui */}
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">✅ Equipamentos no Cliente</p>
            {equipsVendidos.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum equipamento Seamaty registrado.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {equipsVendidos.map((e, i) => (
                  <Badge key={i} className="bg-green-100 text-green-700 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> {e}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Melhor oportunidade de upgrade */}
          {topUpgrade && (
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
              <p className="text-xs font-bold text-orange-700 mb-1">🎯 Melhor Oportunidade de Upgrade</p>
              <p className="text-sm font-black text-orange-800">{topUpgrade.equipamento}</p>
              <p className="text-xs text-orange-600 mt-1">{topUpgrade.motivo}</p>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                {getTextoPreco(topUpgrade.equipamento)}
              </p>
              <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                {(EQUIPAMENTOS[topUpgrade.equipamento]?.diferenciais || []).map((d, i) => (
                  <p key={i}>• {d}</p>
                ))}
              </div>
            </div>
          )}

          {/* Outros upgrades disponíveis */}
          {upgrades.length > 1 && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">🔭 Outras Oportunidades</p>
              <div className="space-y-2">
                {upgrades.slice(1).map((u, i) => (
                  <div key={i} className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-700">{u.equipamento}</p>
                      <Badge className={u.urgencia === 'alta' ? 'bg-red-100 text-red-700' : u.urgencia === 'media' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}>
                        {u.urgencia}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{u.motivo}</p>
                    <p className="text-xs text-slate-400 mt-1">{getTextoPreco(u.equipamento)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insumos */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">🧪 Insumos / Recorrência</p>
            <p className="text-xs text-slate-500">
              {equipsVendidos.length > 0
                ? `Verifique tabela oficial de insumos compatíveis com: ${equipsVendidos.join(', ')}`
                : 'Cadastre o equipamento do cliente para ver oportunidades de insumos.'}
            </p>
            <p className="text-xs text-orange-600 mt-1 font-medium">Preços de insumos: consultar tabela oficial Seamaty Brasil.</p>
          </div>

          {/* Alerta técnico */}
          {errosTecnicos.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-xs font-bold text-red-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> VALIDAÇÃO NECESSÁRIA — informação técnica divergente
              </p>
              {errosTecnicos.map((e, i) => (
                <p key={i} className="text-xs text-red-600 mt-1">• "{e.termo}" — {e.motivo}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}