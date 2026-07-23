import { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { buildDailySales, getSellers } from '@/lib/salesPerformanceData';
import SalesGoalSummary from '@/components/performance/SalesGoalSummary';
import SellerFilter from '@/components/performance/SellerFilter';
import TeamSalesChart from '@/components/performance/TeamSalesChart';

export default function ConsolidatedSalesPerformance({ sales, goals }) {
  const [seller, setSeller] = useState('all');
  const sellers = useMemo(() => getSellers(sales), [sales]);
  const data = useMemo(() => buildDailySales(sales, goals, seller), [sales, goals, seller]);

  return (
    <Card className="space-y-4 bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-foreground"><BarChart3 className="h-5 w-5 text-indigo-600" />Metas e vendas da equipe</h3>
          <p className="mt-1 text-xs text-muted-foreground">Últimos 14 dias comparados à meta diária</p>
        </div>
        <SellerFilter sellers={sellers} value={seller} onChange={setSeller} />
      </div>
      <SalesGoalSummary achieved={data.achieved} total={data.totalGoals} progress={data.progress} />
      <TeamSalesChart data={data.daily} />
    </Card>
  );
}