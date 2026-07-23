export default function SellerFilter({ sellers, value, onChange }) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
      Vendedor
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 min-w-40 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
        <option value="all">Toda a equipe</option>
        {sellers.map((seller) => <option key={seller} value={seller}>{seller.split('@')[0]}</option>)}
      </select>
    </label>
  );
}