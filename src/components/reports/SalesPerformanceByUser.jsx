import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Award } from 'lucide-react';

export default function SalesPerformanceByUser({ sales = [], dateFilter }) {
  const filteredSales = sales.filter(s => {
    if (!dateFilter.start || !dateFilter.end) return true;
    const saleDate = new Date(s.sale_date);
    return saleDate >= new Date(dateFilter.start) && saleDate <= new Date(dateFilter.end);
  });

  // Agrupar por vendedor
  const userStats = {};
  filteredSales.forEach(sale => {
    if (sale.status !== 'fechada' && sale.status !== 'entregue') return;
    
    const user = sale.salesperson || 'Não atribuído';
    if (!userStats[user]) {
      userStats[user] = {
        totalValue: 0,
        count: 0,
        sales: []
      };
    }
    userStats[user].totalValue += sale.sale_value || 0;
    userStats[user].count += 1;
    userStats[user].sales.push(sale);
  });

  // Calcular ticket médio e ordenar
  const sortedUsers = Object.entries(userStats)
    .map(([user, stats]) => ({
      user,
      ...stats,
      avgTicket: stats.totalValue / stats.count
    }))
    .sort((a, b) => b.totalValue - a.totalValue);

  if (sortedUsers.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-slate-500">Nenhuma venda no período</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sortedUsers.map((userStat, index) => (
        <Card key={userStat.user} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-slate-100' : index === 2 ? 'bg-orange-100' : 'bg-blue-50'
            }`}>
              {index < 3 ? (
                <Award className={`w-5 h-5 ${
                  index === 0 ? 'text-yellow-600' : index === 1 ? 'text-slate-600' : 'text-orange-600'
                }`} />
              ) : (
                <span className="text-lg font-bold text-slate-600">#{index + 1}</span>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-800">{userStat.user}</h4>
                {index === 0 && <Badge className="bg-yellow-500">🏆 Top</Badge>}
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Valor Total</p>
                  <p className="text-lg font-bold text-green-600">
                    R$ {(userStat.totalValue / 1000).toFixed(0)}k
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-500 mb-1">Vendas</p>
                  <p className="text-lg font-bold text-indigo-600">
                    {userStat.count}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-500 mb-1">Ticket Médio</p>
                  <p className="text-lg font-bold text-purple-600">
                    R$ {(userStat.avgTicket / 1000).toFixed(0)}k
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}