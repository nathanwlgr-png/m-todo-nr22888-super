import React, { useMemo, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function DynamicPurchasePropensityScore({ client, interactions = [], visits = [], sales = [] }) {
  const [score, setScore] = useState(null);
  const [factors, setFactors] = useState(null);

  const calculateScore = useMemo(() => {
    if (!client) return null;

    let totalScore = 50; // baseline
    const factorsBreakdown = {};

    // 1. STATUS (20 pontos)
    const statusScore = {
      quente: 20,
      morno: 10,
      frio: 0
    };
    factorsBreakdown.status = statusScore[client.status] || 0;
    totalScore += factorsBreakdown.status;

    // 2. PURCHASE SCORE EXISTING (15 pontos)
    if (client.purchase_score) {
      factorsBreakdown.purchase_score = Math.min(15, Math.floor(client.purchase_score / 10));
      totalScore += factorsBreakdown.purchase_score;
    }

    // 3. ENGAGEMENT (25 pontos)
    const daysSinceLastContact = client.last_contact_date 
      ? Math.floor((Date.now() - new Date(client.last_contact_date)) / (1000 * 60 * 60 * 24))
      : 999;
    
    let engagementScore = 0;
    if (daysSinceLastContact <= 3) engagementScore = 25;
    else if (daysSinceLastContact <= 7) engagementScore = 20;
    else if (daysSinceLastContact <= 14) engagementScore = 15;
    else if (daysSinceLastContact <= 30) engagementScore = 10;
    else engagementScore = 0;

    factorsBreakdown.engagement = engagementScore;
    totalScore += engagementScore;

    // 4. VISIT HISTORY (20 pontos)
    const recentVisits = visits.filter(v => {
      const visitDate = new Date(v.scheduled_date);
      const daysSince = (Date.now() - visitDate) / (1000 * 60 * 60 * 24);
      return daysSince <= 30 && v.status === 'realizada';
    }).length;

    const visitScore = Math.min(20, recentVisits * 7);
    factorsBreakdown.visits = visitScore;
    totalScore += visitScore;

    // 5. INTERACTIONS QUALITY (15 pontos)
    const interactionTypes = {
      proposal_sent: 5,
      meeting: 3,
      demo: 4,
      negotiation: 5,
      email: 1,
      call: 2
    };

    let interactionScore = 0;
    interactions?.slice(0, 10).forEach(interaction => {
      interactionScore += interactionTypes[interaction.type] || 0;
    });
    interactionScore = Math.min(15, interactionScore);
    factorsBreakdown.interactions = interactionScore;
    totalScore += interactionScore;

    // 6. SALES PIPELINE STAGE (10 pontos)
    const pipelineScores = {
      proposta: 8,
      negociacao: 10,
      fechado: 10,
      qualificado: 5,
      lead: 0
    };
    factorsBreakdown.pipeline = pipelineScores[client.pipeline_stage] || 0;
    totalScore += factorsBreakdown.pipeline;

    // 7. BUDGET & DECISION DEADLINE (5 pontos)
    let deadlineScore = 0;
    if (client.decision_deadline) {
      const daysUntilDeadline = Math.floor((new Date(client.decision_deadline) - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline <= 7 && daysUntilDeadline > 0) deadlineScore = 5;
      else if (daysUntilDeadline <= 0) deadlineScore = 10; // passed deadline = high pressure
    }
    if (client.available_budget && client.available_budget > 0) deadlineScore += 3;
    
    factorsBreakdown.urgency = Math.min(10, deadlineScore);
    totalScore += factorsBreakdown.urgency;

    // Cap at 100
    totalScore = Math.min(100, totalScore);

    return { total: Math.round(totalScore), factors: factorsBreakdown };
  }, [client, interactions, visits, sales]);

  useEffect(() => {
    if (calculateScore) {
      setScore(calculateScore.total);
      setFactors(calculateScore.factors);
    }
  }, [calculateScore]);

  if (!score || score === null) return null;

  const getScoreColor = (s) => {
    if (s >= 80) return 'from-green-500 to-emerald-600';
    if (s >= 60) return 'from-blue-500 to-indigo-600';
    if (s >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getScoreLabel = (s) => {
    if (s >= 80) return 'Muito Alta';
    if (s >= 60) return 'Alta';
    if (s >= 40) return 'Média';
    return 'Baixa';
  };

  return (
    <Card className={`p-4 bg-gradient-to-r ${getScoreColor(score)} shadow-lg`}>
      <div className="space-y-3">
        {/* Score Principal */}
        <div className="bg-white/20 backdrop-blur rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-white">Propensão de Compra</p>
            <Badge className="bg-white/30 text-white">{getScoreLabel(score)}</Badge>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <p className="text-4xl font-black text-white">{score}</p>
              <p className="text-xs text-white/80">/ 100</p>
            </div>
            <div className="flex-1 h-12 bg-white/20 rounded-lg overflow-hidden">
              <div 
                className="h-full bg-white/60 transition-all duration-500"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Fatores Breakdown */}
        {factors && (
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-white mb-2">📊 Componentes</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(factors).map(([key, value]) => (
                <div key={key} className="bg-white/10 rounded px-2 py-1">
                  <p className="text-white/80 capitalize">{key}</p>
                  <p className="font-bold text-white">{value} pts</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recomendação */}
        <div className="bg-white/20 backdrop-blur rounded-lg p-2">
          <div className="flex items-start gap-2">
            {score >= 80 ? (
              <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
            ) : score >= 60 ? (
              <TrendingUp className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
            )}
            <p className="text-xs text-white/90">
              {score >= 80 && '🎯 Pronto para fechamento - Foco em assinatura'}
              {score >= 60 && score < 80 && '📈 Quente - Intensifique follow-ups'}
              {score >= 40 && score < 60 && '⏳ Morno - Agregue valor e desperte interesse'}
              {score < 40 && '❄️ Frio - Reinicie com novo ângulo ou arquivo'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}