import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function ClientHealthScore({ client, compact = false }) {
  const score = client.health_score || 0;
  const factors = client.health_score_factors || {};

  const getScoreColor = (score) => {
    if (score >= 80) return { bg: 'from-green-500 to-emerald-600', text: 'text-green-600', badge: 'bg-green-100 text-green-700' };
    if (score >= 60) return { bg: 'from-blue-500 to-indigo-600', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' };
    if (score >= 40) return { bg: 'from-yellow-500 to-orange-600', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' };
    return { bg: 'from-red-500 to-pink-600', text: 'text-red-600', badge: 'bg-red-100 text-red-700' };
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Crítico';
  };

  const colors = getScoreColor(score);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-slate-200"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - score / 100)}`}
              className={colors.text}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-700">{score}</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-700">Health Score</p>
          <Badge className={`text-xs ${colors.badge}`}>{getScoreLabel(score)}</Badge>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-5 bg-gradient-to-br from-slate-50 to-white border-2 shadow-lg">
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-lg`}>
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-800 mb-1">Client Health Score</h3>
          <p className="text-xs text-slate-600">Saúde geral do relacionamento</p>
        </div>
      </div>

      {/* Score Visual */}
      <div className="relative mb-4">
        <div className="flex items-center justify-between mb-2">
          <Badge className={`${colors.badge} font-bold`}>{getScoreLabel(score)}</Badge>
          <span className={`text-3xl font-bold ${colors.text}`}>{score}/100</span>
        </div>
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${colors.bg} transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Factors */}
      {factors.explanation && (
        <div className="bg-slate-50 rounded-lg p-3 mb-3">
          <p className="text-xs text-slate-600 leading-relaxed">{factors.explanation}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {factors.purchase_history !== undefined && (
          <div className="bg-white rounded-lg p-2 border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500">Histórico Compras</p>
              {factors.purchase_history >= 70 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
            </div>
            <p className="text-sm font-bold text-slate-800">{factors.purchase_history}%</p>
          </div>
        )}

        {factors.engagement_level !== undefined && (
          <div className="bg-white rounded-lg p-2 border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500">Engajamento</p>
              {factors.engagement_level >= 70 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
            </div>
            <p className="text-sm font-bold text-slate-800">{factors.engagement_level}%</p>
          </div>
        )}

        {factors.status_weight !== undefined && (
          <div className="bg-white rounded-lg p-2 border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500">Status</p>
              {factors.status_weight >= 70 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
            </div>
            <p className="text-sm font-bold text-slate-800">{factors.status_weight}%</p>
          </div>
        )}

        {factors.ai_analyses !== undefined && (
          <div className="bg-white rounded-lg p-2 border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500">Análises IA</p>
              {factors.ai_analyses >= 70 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
            </div>
            <p className="text-sm font-bold text-slate-800">{factors.ai_analyses}%</p>
          </div>
        )}
      </div>

      {client.health_score_updated && (
        <p className="text-xs text-slate-400 text-center mt-3">
          Atualizado: {new Date(client.health_score_updated).toLocaleDateString('pt-BR')}
        </p>
      )}
    </Card>
  );
}