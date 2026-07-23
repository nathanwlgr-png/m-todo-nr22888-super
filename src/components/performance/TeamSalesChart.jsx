import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const money = (value) => `R$ ${Number(value || 0).toLocaleString('pt-BR')}`;

export default function TeamSalesChart({ data }) {
  return (
    <div className="h-72 w-full" role="img" aria-label="Vendas diárias comparadas com a meta diária">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
          <Tooltip formatter={(value, name) => [money(value), name === 'vendas' ? 'Vendas' : 'Meta diária']} />
          <Legend formatter={(value) => value === 'vendas' ? 'Vendas diárias' : 'Meta diária'} />
          <Bar dataKey="vendas" fill="#10b981" radius={[5, 5, 0, 0]} />
          <Line dataKey="meta" stroke="#4f46e5" strokeWidth={3} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}