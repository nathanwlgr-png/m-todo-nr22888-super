import * as React from 'react';
const { useMemo } = React;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function calcHealthScore(client) {
  // Days without contact (40%)
  let contactScore = 10;
  if (client.last_contact_date) {
    const days = Math.floor((Date.now() - new Date(client.last_contact_date)) / 86400000);
    if (days <= 7) contactScore = 40;
    else if (days <= 14) contactScore = 30;
    else if (days <= 30) contactScore = 20;
    else contactScore = 5;
  }

  // Pipeline stage (30%)
  const stageScores = {
    fechar_venda: 30, negociar_proposta: 25, demonstracao_tecnica: 20,
    apresentar_equipamento: 15, diagnosticar_necessidades: 10
  };
  const stage = client.visit_objective || client.pipeline_stage;
  const pipelineScore = stageScores[stage] || 10;

  // Purchase score (30%)
  const purchaseScore = Math.round((client.purchase_score || 50) * 0.3);

  return Math.min(100, contactScore + pipelineScore + purchaseScore);
}

export { calcHealthScore };

export default function WeeklyHealthReport({ clients }) {
  const hoje = new Date().getDay(); // 0=Dom, 1=Seg
  const isMonday = hoje === 1;

  const ranked = useMemo(() => {
    if (!clients?.length) return { attack: [], risk: [], close: [] };
    const scored = clients.map(c => ({ ...c, _hs: calcHealthScore(c) }));
    scored.sort((a, b) => b._hs - a._hs);

    return {
      attack: scored.filter(c => c._hs >= 60).slice(0, 5),
      risk: scored.filter(c => {
        if (!c.last_contact_date) return true;
        const days = Math.floor((Date.now() - new Date(c.last_contact_date)) / 86400000);
        return days > 21 && c.status !== 'frio';
      }).slice(0, 5),
      close: scored.filter(c =>
        (c.visit_objective === 'fechar_venda' || c.pipeline_stage === 'negociacao') && c._hs >= 50
      ).slice(0, 5),
    };
  }, [clients]);

  if (!isMonday && !clients?.length) return null;

  return (
    <Card className="mb-4 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          📊 Relatório Semanal da Carteira
          {isMonday && <Badge className="bg-indigo-600 text-white ml-auto text-xs">Segunda-feira</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Atacar primeiro */}
        {ranked.attack.length > 0 && (
          <div>
            <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> 🎯 Atacar Primeiro
            </p>
            <div className="space-y-1.5">
              {ranked.attack.map(c => (
                <Link key={c.id} to={createPageUrl(`ClientProfile?id=${c.id}`)}>
                  <div className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{c.first_name}</p>
                      <p className="text-xs text-slate-500">{c.clinic_name || c.city}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{c.city}</span>
                      <span className="w-8 h-8 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">{c._hs}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Em risco */}
        {ranked.risk.length > 0 && (
          <div>
            <p className="text-xs font-bold text-orange-700 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> ⚠️ Em Risco — Sem Contato
            </p>
            <div className="space-y-1.5">
              {ranked.risk.map(c => {
                const days = c.last_contact_date
                  ? Math.floor((Date.now() - new Date(c.last_contact_date)) / 86400000)
                  : null;
                return (
                  <Link key={c.id} to={createPageUrl(`ClientProfile?id=${c.id}`)}>
                    <div className="flex items-center justify-between px-3 py-2 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{c.first_name}</p>
                        <p className="text-xs text-orange-600">{days ? `${days} dias sem contato` : 'Sem contato registrado'}</p>
                      </div>
                      <span className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">{c._hs}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Pronto para fechar */}
        {ranked.close.length > 0 && (
          <div>
            <p className="text-xs font-bold text-indigo-700 mb-2 flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> 🏁 Prontos para Fechar
            </p>
            <div className="space-y-1.5">
              {ranked.close.map(c => (
                <Link key={c.id} to={createPageUrl(`ClientProfile?id=${c.id}`)}>
                  <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{c.first_name}</p>
                      <p className="text-xs text-slate-500">{c.equipment_interest || c.current_equipment}</p>
                    </div>
                    <span className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">{c._hs}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}