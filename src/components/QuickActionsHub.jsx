import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import {
  Users,
  UserPlus,
  Calendar,
  TrendingUp,
  FileText,
  Target,
  Sparkles,
  MessageSquare,
  BarChart3,
  Search,
  Zap,
  Brain,
  MapPin,
  GraduationCap
} from 'lucide-react';

export default function QuickActionsHub() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Search,
      titulo: 'Buscar Cliente',
      descricao: 'Busca inteligente',
      cor: 'from-blue-500 to-blue-600',
      pagina: 'Home',
      destaque: true
    },
    {
      icon: Brain,
      titulo: 'Análise IA',
      descricao: 'Insights automáticos',
      cor: 'from-purple-500 to-purple-600',
      pagina: 'SalesReportsAI',
      destaque: true
    },
    {
      icon: Users,
      titulo: 'Clientes',
      descricao: 'Ver todos',
      cor: 'from-green-500 to-green-600',
      pagina: 'Home'
    },
    {
      icon: UserPlus,
      titulo: 'Leads',
      descricao: 'Gestão de leads',
      cor: 'from-orange-500 to-orange-600',
      pagina: 'Leads'
    },
    {
      icon: Calendar,
      titulo: 'Visitas',
      descricao: 'Agendar/Ver',
      cor: 'from-indigo-500 to-indigo-600',
      pagina: 'ScheduledAgenda'
    },
    {
      icon: Target,
      titulo: 'Vendas',
      descricao: 'Pipeline',
      cor: 'from-emerald-500 to-emerald-600',
      pagina: 'PossibleSales'
    },
    {
      icon: BarChart3,
      titulo: 'Relatórios',
      descricao: 'Performance',
      cor: 'from-pink-500 to-pink-600',
      pagina: 'SalesReportsAI'
    },
    {
      icon: Sparkles,
      titulo: 'Assistente IA',
      descricao: 'Chat inteligente',
      cor: 'from-violet-500 to-violet-600',
      pagina: 'AIAssistant'
    },
    {
      icon: MessageSquare,
      titulo: 'WhatsApp',
      descricao: 'Central de comandos',
      cor: 'from-green-600 to-green-700',
      pagina: 'WhatsAppInbox'
    },
    {
      icon: FileText,
      titulo: 'Documentos',
      descricao: 'Propostas/Contratos',
      cor: 'from-slate-500 to-slate-600',
      pagina: 'DocumentRepository'
    },
    {
      icon: Zap,
      titulo: 'Automações',
      descricao: 'Fluxos inteligentes',
      cor: 'from-yellow-500 to-yellow-600',
      pagina: 'AutomationManager'
    },
    {
      icon: TrendingUp,
      titulo: 'Metas',
      descricao: 'Acompanhar',
      cor: 'from-red-500 to-red-600',
      pagina: 'Goals'
    },
    {
      icon: MapPin,
      titulo: 'Pesquisa de Mercado',
      descricao: 'Encontrar clínicas',
      cor: 'from-cyan-500 to-blue-600',
      pagina: 'MarketResearch'
    },
    {
      icon: GraduationCap,
      titulo: 'Sales Coaching',
      descricao: 'Feedback de vendas',
      cor: 'from-purple-500 to-indigo-600',
      pagina: 'SalesCoaching'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <button
            key={i}
            onClick={() => navigate(createPageUrl(action.pagina))}
            className={`
              relative p-3 rounded-xl shadow-md hover:shadow-lg transition-all
              bg-gradient-to-br ${action.cor} text-white
              ${action.destaque ? 'col-span-3 h-20' : 'aspect-square'}
            `}
          >
            {action.destaque && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              </div>
            )}
            
            <div className={`flex ${action.destaque ? 'items-center gap-3' : 'flex-col items-center justify-center h-full'}`}>
              <Icon className={action.destaque ? 'w-8 h-8' : 'w-6 h-6'} />
              <div className={action.destaque ? 'flex-1 text-left' : 'text-center'}>
                <p className={`font-bold ${action.destaque ? 'text-base' : 'text-xs'} mt-1`}>
                  {action.titulo}
                </p>
                <p className={`text-white/80 ${action.destaque ? 'text-sm' : 'text-[10px]'} mt-0.5`}>
                  {action.descricao}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}