import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, TrendingUp, Target, Award, AlertCircle } from 'lucide-react';

export default function AdvancedSalesCoachingAnalyzer({ analysis, previousScores }) {
  if (!analysis) return null;

  const techniques = [
    { key: 'spin_selling', name: 'SPIN Selling', book: 'Neil Rackham', color: 'blue' },
    { key: 'cialdini', name: 'Cialdini (6 Gatilhos)', book: 'Robert Cialdini', color: 'purple' },
    { key: 'challenger', name: 'Challenger Sale', book: 'Dixon & Adamson', color: 'green' },
    { key: 'voss_negotiation', name: 'Negociação FBI', book: 'Chris Voss', color: 'red' },
    { key: 'gap_selling', name: 'Gap Selling', book: 'Keenan', color: 'indigo' },
    { key: 'closing', name: 'Fechamento', book: 'Zig Ziglar', color: 'orange' }
  ];

  const getColorClasses = (color) => ({
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300'
  }[color]);

  return (
    <div className="space-y-4">
      {/* Score Geral */}
      <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600" />
            <h3 className="font-bold text-indigo-900">Score Geral da Sessão</h3>
          </div>
          <div className="text-3xl font-black text-indigo-600">
            {analysis.overall_score}/100
          </div>
        </div>
        <Progress value={analysis.overall_score} className="h-3" />
        {previousScores && previousScores.length > 0 && (
          <p className="text-xs text-indigo-700 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {analysis.overall_score > previousScores[0] ? '+' : ''}
            {(analysis.overall_score - previousScores[0]).toFixed(1)} pontos vs última sessão
          </p>
        )}
      </Card>

      {/* Análise por Técnica */}
      <Card className="p-4">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          Análise por Framework de Vendas
        </h3>
        <div className="space-y-3">
          {techniques.map(tech => {
            const score = analysis.technique_scores?.[tech.key] || 0;
            const scorePercent = (score / 10) * 100;
            
            return (
              <div key={tech.key} className={`p-3 rounded-lg border-2 ${getColorClasses(tech.color)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">{tech.name}</p>
                    <p className="text-xs opacity-80">📚 {tech.book}</p>
                  </div>
                  <Badge className={`${getColorClasses(tech.color)} border-2`}>
                    {score}/10
                  </Badge>
                </div>
                <Progress value={scorePercent} className="h-2 mb-2" />
                {score < 7 && (
                  <div className="flex items-start gap-1 mt-2 p-2 bg-white/50 rounded">
                    <AlertCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs">
                      <span className="font-semibold">Foco:</span> Revisar conceitos de {tech.name}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Pontos Fortes */}
      {analysis.strengths?.length > 0 && (
        <Card className="p-4 bg-green-50 border-2 border-green-300">
          <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
            ✅ Pontos Fortes Identificados
          </h3>
          <div className="space-y-2">
            {analysis.strengths.map((strength, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-green-900">{strength}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Áreas de Melhoria */}
      {analysis.weaknesses?.length > 0 && (
        <Card className="p-4 bg-orange-50 border-2 border-orange-300">
          <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
            ⚠️ Áreas de Melhoria
          </h3>
          <div className="space-y-2">
            {analysis.weaknesses.map((weakness, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-600 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-orange-900">{weakness}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Próxima Conversa */}
      {analysis.next_conversation_tips?.length > 0 && (
        <Card className="p-4 bg-blue-50 border-2 border-blue-300">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Dicas para Próxima Conversa
          </h3>
          <div className="space-y-2">
            {analysis.next_conversation_tips.map((tip, idx) => (
              <div key={idx} className="p-2 bg-white rounded border border-blue-200">
                <p className="text-sm text-blue-900">{tip}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Oportunidades Perdidas */}
      {analysis.missed_opportunities?.length > 0 && (
        <Card className="p-4 bg-red-50 border-2 border-red-300">
          <h3 className="font-bold text-red-900 mb-3">🎯 Oportunidades Perdidas</h3>
          <div className="space-y-2">
            {analysis.missed_opportunities.map((opp, idx) => (
              <div key={idx} className="p-2 bg-white rounded border border-red-200">
                <p className="text-sm text-red-900">{opp}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}