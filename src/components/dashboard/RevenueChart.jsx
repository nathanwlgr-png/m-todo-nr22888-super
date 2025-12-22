import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function RevenueChart({ clients }) {
  const data = useMemo(() => {
    const groupedData = {
      quente: 0,
      morno: 0,
      frio: 0
    };

    clients.forEach(client => {
      const status = client.status || 'morno';
      groupedData[status] += client.projected_revenue || 0;
    });

    return [
      { name: 'Quentes', value: groupedData.quente, color: '#ef4444' },
      { name: 'Mornos', value: groupedData.morno, color: '#eab308' },
      { name: 'Frios', value: groupedData.frio, color: '#60a5fa' }
    ];
  }, [clients]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Nenhuma receita projetada</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip 
          formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}