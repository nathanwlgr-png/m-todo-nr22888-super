import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, TrendingUp, AlertTriangle, Star } from 'lucide-react';

const BAR_COLORS = {
  compra: 'from-indigo-500 to-purple-600',
  health: 'from-green-500 to-emerald-600',
  engagement: 'from-blue-500 to-cyan-600',
  conversao: 'from-orange-500 to-red-500',
};

function ScoreBar({ label, value, color, icon }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">{icon} {label}</span>
          <span className="text-lg font-bold text-slate-800">{Math.round(value || 0)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(value || 0, 100)}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function NR22ScorePreditivo({ client, scoreData, loadingScore, onRefresh }) {
  if (!client) return (
    <div className="text-center py-12 text-slate-400">
      <TrendingUp className="w-10 h-10 mx-auto mb-2" />
      <p className="text-sm">Selecione um cliente para ver o Score IA</p>
    </div>
  );

  const intel = client.ai_sales_intelligence || {};
  const conversao = intel.conversion_probability || scoreData?.conversion_probability || client.purchase_score || 0;
  const churnRisk = intel.churn_risk || scoreData?.churn_risk || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 text-sm">📊 Score NR22 — {client.first_name}</h2>
        <Button size="sm" onClick={onRefresh} disabled={loadingScore} variant="outline" className="h-7 text-xs">
          {loadingScore ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        </Button>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreBar label="Score Compra" value={client.purchase_score} color={BAR_COLORS.compra} icon="🎯" />
        <ScoreBar label="Health Score" value={client.health_score} color={BAR_COLORS.health} icon="💚" />
        <ScoreBar label="Engagement" value={client.engagement_score} color={BAR_COLORS.engagement} icon="⚡" />
        <ScoreBar label="Conversão IA" value={conversao} color={BAR_COLORS.conversao} icon="🔥" />
      </div>

      {/* Próxima ação + Churn */}
      {scoreData && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <p className="text-sm font-semibold text-slate-700">🤖 Score Preditivo IA</p>
            {scoreData.next_best_action && (
              <div className="bg-indigo-50 rounded-lg p-2">
                <p className="text-[10px] text-indigo-500 font-semibold uppercase">Próxima Melhor Ação</p>
                <p className="text-xs text-indigo-800 mt-0.5">{scoreData.next_best_action}</p>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Risco de Perda</span>
              <Badge className={`text-[10px] ${churnRisk > 60 ? 'bg-red-500' : churnRisk > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}>
                {Math.round(churnRisk)}%
              </Badge>
            </div>
            {scoreData.priority_level && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1"><Star className="w-3 h-3" /> Prioridade</span>
                <Badge className="bg-purple-500 text-[10px]">{scoreData.priority_level}/10</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dados CRM */}
      <Card>
        <CardContent className="p-3 space-y-1.5">
          <p className="text-sm font-semibold text-slate-700">📋 Dados CRM (47 variáveis)</p>
          {[
            ['Pipeline', client.pipeline_stage],
            ['Tipo Cliente', client.client_type],
            ['Volume Exames', client.current_volume],
            ['Orçamento', client.available_budget ? `R$ ${Number(client.available_budget).toLocaleString('pt-BR')}` : null],
            ['Equip. Atual', client.current_equipment],
            ['Interesse', client.equipment_interest],
            ['Tempo Mercado', client.market_time],
            ['Prioridade', client.attention_priority ? `${client.attention_priority}/10` : null],
            ['Segmento IA', client.ai_segment],
            ['LTV 12m', intel.ltv_12_months ? `R$ ${Number(intel.ltv_12_months).toLocaleString('pt-BR')}` : null],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-50 last:border-0">
              <span className="text-slate-500">{k}</span>
              <span className="text-slate-800 font-medium">{v}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Numerologia */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-3">
          <p className="text-sm font-semibold text-purple-800 mb-2">🔢 Perfil Numerológico</p>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
              {client.numerology_number || '?'}
            </div>
            <div>
              <p className="text-xs font-medium text-purple-800">{client.behavioral_profile || 'Perfil a analisar'}</p>
              <p className="text-[10px] text-purple-600">{client.decision_style || 'Estilo a identificar'}</p>
            </div>
          </div>
          {client.approach_tips && <p className="text-[10px] text-purple-700 bg-white/60 rounded p-2">{client.approach_tips}</p>}
          {client.numerology_tip && <p className="text-[10px] text-indigo-700 bg-indigo-100 rounded p-2 mt-1">💡 {client.numerology_tip}</p>}
        </CardContent>
      </Card>

      {/* Dores e objeções */}
      {(client.main_pains?.length > 0 || client.real_objections?.length > 0) && (
        <Card>
          <CardContent className="p-3 space-y-2">
            {client.main_pains?.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 font-semibold mb-1">😣 DORES IDENTIFICADAS</p>
                <div className="flex flex-wrap gap-1">
                  {client.main_pains.map((p, i) => <Badge key={i} className="text-[10px] bg-red-100 text-red-700">{p}</Badge>)}
                </div>
              </div>
            )}
            {client.real_objections?.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 font-semibold mb-1">🛡️ OBJEÇÕES REAIS</p>
                <div className="flex flex-wrap gap-1">
                  {client.real_objections.map((o, i) => <Badge key={i} className="text-[10px] bg-orange-100 text-orange-700">{o}</Badge>)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}