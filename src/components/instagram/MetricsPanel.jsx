import React from 'react';
import { Package, Image, Eye, Heart, Star } from 'lucide-react';

const TIPS = [
  { icon: '🎬', tip: 'Reels com narração pessoal geram 4x mais alcance que legendas genéricas', type: 'Reels' },
  { icon: '⏱️', tip: 'Melhor horário para vets: 7h-8h (pré-consulta) e 19h-21h (pós-expediente)', type: 'Timing' },
  { icon: '📖', tip: 'Storytelling real: "Uma clínica em Marília chegou a mim com..." converte mais que qualquer claim', type: 'Copy' },
  { icon: '🏷️', tip: '#VeterináriaModerna #DiagnósticoVet #Seamaty #LaboratórioVeterinário', type: 'Hashtags' },
  { icon: '🤝', tip: 'Marque a clínica parceira (sem citar nome do dono) aumenta alcance em 60%', type: 'Engajamento' },
  { icon: '💰', tip: 'Post sobre ROI financeiro da clínica tem mais engajamento do que post de produto', type: 'Estratégia' },
];

export default function MetricsPanel({ sales }) {
  const now = new Date();
  const monthlySales = sales.filter(s => {
    const d = new Date(s.sale_date || s.created_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const metrics = [
    { label: 'Instalações este mês', value: monthlySales.length, icon: Package, color: 'text-green-600', bg: 'bg-green-50', sub: 'Fontes de conteúdo' },
    { label: 'Posts possíveis', value: monthlySales.length * 5, icon: Image, color: 'text-purple-600', bg: 'bg-purple-50', sub: 'Feed + Reels + Stories' },
    { label: 'Alcance estimado', value: `${(monthlySales.length * 1200).toLocaleString('pt-BR')}`, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Visualizações/mês' },
    { label: 'Leads orgânicos', value: Math.round(monthlySales.length * 1200 * 0.04), icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', sub: '4% taxa média' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className={`${bg} rounded-xl p-3`}>
            <Icon className={`w-5 h-5 ${color} mb-1.5`} />
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-slate-700">{label}</p>
            <p className="text-[10px] text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-indigo-900 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-yellow-400" />
          <p className="font-bold text-sm">Dicas — Modo Nathan</p>
        </div>
        <div className="space-y-2.5">
          {TIPS.map(({ icon, tip, type }, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-base shrink-0">{icon}</span>
              <div>
                <span className="text-[10px] font-bold text-indigo-300 uppercase">{type} — </span>
                <span className="text-xs text-slate-300">{tip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-4 text-white">
        <p className="font-bold text-sm mb-1">🚀 Meta: 12 instalações/mês = 60 posts</p>
        <p className="text-xs text-pink-100 mb-2">Feed + Reels + 3 Stories por instalação</p>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (monthlySales.length / 12) * 100)}%` }} />
        </div>
        <p className="text-xs text-pink-100 mt-1">{monthlySales.length}/12 instalações • {Math.round((monthlySales.length / 12) * 100)}% da meta</p>
      </div>
    </div>
  );
}