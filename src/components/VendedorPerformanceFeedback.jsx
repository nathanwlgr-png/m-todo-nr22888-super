import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Award } from 'lucide-react';

export default function VendedorPerformanceFeedback({ salespersonEmail }) {
  const { data: allAnalyses = [] } = useQuery({
    queryKey: ['all-visit-analyses'],
    queryFn: () => base44.entities.VisitAnalysis.list('-visit_date', 500)
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const userEmail = salespersonEmail || currentUser?.email;

  const feedback = useMemo(() => {
    const userAnalyses = allAnalyses.filter(a => a.salesperson_email === userEmail);
    const othersAnalyses = allAnalyses.filter(a => a.salesperson_email !== userEmail);

    if (userAnalyses.length === 0) return null;

    // Técnicas do usuário
    const userTechniques = {};
    userAnalyses.forEach(a => {
      a.techniques_used?.forEach(tech => {
        if (!userTechniques[tech]) {
          userTechniques[tech] = { count: 0, success: 0 };
        }
        userTechniques[tech].count++;
        if (a.sale_closed) userTechniques[tech].success++;
      });
    });

    // Técnicas dos outros
    const othersTechniques = {};
    othersAnalyses.forEach(a => {
      a.techniques_used?.forEach(tech => {
        if (!othersTechniques[tech]) {
          othersTechniques[tech] = { count: 0, success: 0 };
        }
        othersTechniques[tech].count++;
        if (a.sale_closed) othersTechniques[tech].success++;
      });
    });

    // Comparação
    const comparison = Object.keys(userTechniques).map(tech => {
      const userRate = userTechniques[tech].count > 0 
        ? (userTechniques[tech].success / userTechniques[tech].count * 100).toFixed(1)
        : 0;
      
      const othersRate = othersTechniques[tech]?.count > 0
        ? (othersTechniques[tech].success / othersTechniques[tech].count * 100).toFixed(1)
        : 0;

      return {
        technique: tech,
        userRate: parseFloat(userRate),
        othersRate: parseFloat(othersRate),
        delta: parseFloat(userRate) - parseFloat(othersRate),
        userCount: userTechniques[tech].count
      };
    }).sort((a, b) => b.delta - a.delta);

    const userConversion = (userAnalyses.filter(a => a.sale_closed).length / userAnalyses.length * 100).toFixed(1);
    const othersConversion = othersAnalyses.length > 0 
      ? (othersAnalyses.filter(a => a.sale_closed).length / othersAnalyses.length * 100).toFixed(1)
      : 0;

    return {
      comparison,
      userConversion: parseFloat(userConversion),
      othersConversion: parseFloat(othersConversion),
      totalVisits: userAnalyses.length
    };
  }, [allAnalyses, userEmail]);

  if (!feedback) return null;

  const topTechniques = feedback.comparison.filter(c => c.delta > 0).slice(0, 3);
  const needsImprovement = feedback.comparison.filter(c => c.delta < -5).slice(0, 3);

  return (
    <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-800">Seu Desempenho vs Time</h3>
      </div>

      {/* Conversão Geral */}
      <div className="p-4 bg-white rounded-lg mb-4">
        <p className="text-xs text-slate-500 mb-2">Taxa de Conversão</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-blue-700">{feedback.userConversion}%</p>
            <p className="text-xs text-slate-500">Você</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-slate-500">{feedback.othersConversion}%</p>
            <p className="text-xs text-slate-500">Média do Time</p>
          </div>
        </div>
        <div className="mt-2">
          {feedback.userConversion > feedback.othersConversion ? (
            <Badge className="bg-green-100 text-green-700">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{(feedback.userConversion - feedback.othersConversion).toFixed(1)}% acima
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700">
              <TrendingDown className="w-3 h-3 mr-1" />
              {(feedback.userConversion - feedback.othersConversion).toFixed(1)}% abaixo
            </Badge>
          )}
        </div>
      </div>

      {/* Suas Melhores Técnicas */}
      {topTechniques.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-green-700 mb-2">✅ Suas Melhores Técnicas</p>
          <div className="space-y-2">
            {topTechniques.map((item, idx) => (
              <div key={idx} className="p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{item.technique}</span>
                  <Badge className="bg-green-600 text-white">
                    +{item.delta.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Você: {item.userRate}% | Time: {item.othersRate}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Precisa Melhorar */}
      {needsImprovement.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-orange-700 mb-2">⚠️ Para Desenvolver</p>
          <div className="space-y-2">
            {needsImprovement.map((item, idx) => (
              <div key={idx} className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{item.technique}</span>
                  <Badge className="bg-orange-600 text-white">
                    {item.delta.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Você: {item.userRate}% | Time: {item.othersRate}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <p className="text-xs text-blue-700">
          📊 Baseado em {feedback.totalVisits} visitas analisadas
        </p>
      </div>
    </Card>
  );
}