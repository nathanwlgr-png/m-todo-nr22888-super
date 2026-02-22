import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function CityAnalyticsCard({ clients = [] }) {
  const byCity = useMemo(() => {
    return clients.reduce((acc, c) => {
      const city = c.city || 'Outro';
      acc[city] = {
        count: (acc[city]?.count || 0) + 1,
        hot: (acc[city]?.hot || 0) + (c.status === 'quente' ? 1 : 0),
        revenue: (acc[city]?.revenue || 0) + (c.available_budget || 0),
        score: (acc[city]?.score || 0) + (c.purchase_score || 0)
      };
      return acc;
    }, {});
  }, [clients]);

  const sorted = Object.entries(byCity)
    .map(([city, data]) => ({
      city,
      count: data.count,
      hot: data.hot,
      revenue: data.revenue,
      avgScore: Math.round(data.score / data.count)
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-2">
      {/* Top Cidades */}
      <Card className="border-indigo-200">
        <CardContent className="p-2.5">
          <p className="text-xs font-bold text-indigo-700 mb-2">🏘️ TOP CIDADES ({sorted.length})</p>
          <div className="space-y-1.5">
            {sorted.slice(0, 5).map((city, idx) => (
              <div key={city.city} className="flex items-center justify-between text-xs p-1.5 bg-gradient-to-r from-indigo-50 to-transparent rounded">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold">{idx + 1}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{city.city}</p>
                    <p className="text-[9px] text-slate-500">{city.hot} quentes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-600">{city.count}</p>
                  <p className="text-[9px] text-slate-500">Score: {city.avgScore}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribuição Completa */}
      {sorted.length > 5 && (
        <Card>
          <CardContent className="p-2.5">
            <p className="text-xs font-bold text-slate-700 mb-2">📋 TODAS AS CIDADES</p>
            <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
              {sorted.map((city) => (
                <div key={city.city} className="text-[8px] bg-slate-50 p-1 rounded flex justify-between border border-slate-200">
                  <span className="font-semibold text-slate-700">{city.city}</span>
                  <span className="text-indigo-600 font-bold">{city.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}