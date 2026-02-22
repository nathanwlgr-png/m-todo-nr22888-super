import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, TrendingUp, FileText, MapPin, Phone } from 'lucide-react';

// Hub central de acesso ao NR22888 Master
export default function NR22MasterHub() {
  const [selectedFeature, setSelectedFeature] = useState(null);

  const features = [
    {
      id: 'intelligence',
      icon: Sparkles,
      title: '🧠 IA Vendas',
      desc: 'Inteligência completa de clientes',
      color: 'from-purple-600 to-pink-600',
      access: 'Análise em tempo real + recomendações'
    },
    {
      id: 'proposals',
      icon: FileText,
      title: '📊 Propostas IA',
      desc: 'Gera propostas automáticas',
      color: 'from-blue-600 to-cyan-600',
      access: 'Google Slides integrado'
    },
    {
      id: 'routes',
      icon: MapPin,
      title: '🗺️ Rotas',
      desc: 'Otimiza visitas do dia',
      color: 'from-green-600 to-emerald-600',
      access: 'Mapa + ordenação inteligente'
    },
    {
      id: 'whatsapp',
      icon: Phone,
      title: '💬 WhatsApp',
      desc: 'Chat direto com Master',
      color: 'from-green-600 to-green-700',
      access: 'Todos comandos via WhatsApp'
    },
    {
      id: 'analytics',
      icon: TrendingUp,
      title: '📈 Analytics Geo',
      desc: 'Dashboard regional',
      color: 'from-orange-600 to-red-600',
      access: 'Vendas por cidade + performance'
    },
    {
      id: 'automation',
      icon: Zap,
      title: '⚡ Automação',
      desc: 'Workflows automáticos',
      color: 'from-yellow-600 to-orange-600',
      access: 'Follow-up + tarefas inteligentes'
    }
  ];

  return (
    <div className="space-y-3">
      {/* Status Master */}
      <Card className="border-0 bg-gradient-to-r from-slate-900 to-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-400" />
                NR22888 TURBO SUPREME
              </h1>
              <p className="text-xs text-slate-300 mt-1">Assistente Master de Vendas • IA Avançada • Acesso Total</p>
            </div>
            <Badge className="bg-green-500 text-white animate-pulse">● ONLINE</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Features */}
      <div className="grid grid-cols-2 gap-2">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card 
              key={feature.id} 
              className={`cursor-pointer hover:shadow-lg transition-all border-0 overflow-hidden`}
            >
              <div className={`bg-gradient-to-br ${feature.color} h-1`} />
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    <Icon className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">{feature.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{feature.desc}</p>
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-slate-600 italic border-l-2 border-slate-300 pl-2">
                  {feature.access}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Atalhos Diretos */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-3">
          <p className="text-xs font-bold text-purple-700 mb-2">🚀 ACESSO DIRETO</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { emoji: '💬', label: 'WhatsApp', page: 'WhatsAppAgentMaster' },
              { emoji: '🗺️', label: 'Geo Map', page: 'AnalyticsDashboardGeo' },
              { emoji: '🎯', label: 'Vendas', page: 'Home' }
            ].map((link, idx) => (
              <Button
                key={idx}
                variant="ghost"
                className="text-xs h-8 text-purple-700 hover:bg-purple-100"
              >
                <span className="text-sm">{link.emoji}</span>
                <span className="ml-1">{link.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-2.5">
          <p className="text-[10px] text-slate-600 leading-relaxed">
            <strong>✨ Master NR22888 Turbo:</strong> Assistente de vendas com IA avançada. Acesso via WhatsApp, Dashboard ou Comandos rápidos. Integrado com Google Slides, Notion e todas as ferramentas de análise.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}