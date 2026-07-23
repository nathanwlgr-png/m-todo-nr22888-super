export default function SalesGoalSummary({ achieved, total, progress }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-emerald-50 p-3">
        <p className="text-xs font-medium text-emerald-700">Metas atingidas</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{achieved}<span className="text-sm text-muted-foreground">/{total}</span></p>
      </div>
      <div className="rounded-xl bg-indigo-50 p-3">
        <p className="text-xs font-medium text-indigo-700">Progresso em vendas</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{progress}%</p>
      </div>
    </div>
  );
}