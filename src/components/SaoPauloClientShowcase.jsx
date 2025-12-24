import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  Users, 
  Calendar,
  FileText,
  Sparkles,
  Phone,
  Mail,
  DollarSign,
  Target,
  Zap,
  BarChart3,
  MessageSquare,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock
} from 'lucide-react';

export default function SaoPauloClientShowcase() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  // Dados do cliente real em São Paulo
  const clientData = {
    name: "Dr. Carlos Eduardo Silva",
    clinic: "Clínica Veterinária Elite SP",
    city: "São Paulo",
    region: "Zona Sul - Moema",
    status: "quente",
    score: 92,
    phone: "+55 11 98765-4321",
    email: "carlos.silva@clinicaelitesp.com.br",
    projected_revenue: 145000,
    equipment_interest: "3DX Veterinário + Analisador Hematológico",
    visit_scheduled: "28/12/2025 - 14h30",
    numerology: 8,
    profile: "O Magnata - Foco em ROI e Expansão"
  };

  const features = [
    {
      icon: Users,
      title: "Perfil Completo",
      description: "Análise numerológica + comportamental",
      action: () => navigate(createPageUrl('ClientProfile') + '?id=demo-sp'),
      color: "bg-blue-50 border-blue-300 text-blue-700"
    },
    {
      icon: Brain,
      title: "IA Sales Intelligence",
      description: "Insights preditivos e recomendações",
      action: () => {},
      color: "bg-purple-50 border-purple-300 text-purple-700"
    },
    {
      icon: Calendar,
      title: "Agendar Visita",
      description: "Melhor dia numerológico: 29/12",
      action: () => navigate(createPageUrl('VisitPlanner')),
      color: "bg-green-50 border-green-300 text-green-700"
    },
    {
      icon: FileText,
      title: "Gerar Proposta",
      description: "Personalizada com numerologia",
      action: () => navigate(createPageUrl('ProposalGenerator')),
      color: "bg-orange-50 border-orange-300 text-orange-700"
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Automático",
      description: "Sequência de follow-up configurada",
      action: () => navigate(createPageUrl('WhatsAppInbox')),
      color: "bg-emerald-50 border-emerald-300 text-emerald-700"
    },
    {
      icon: BarChart3,
      title: "Análise de Mercado",
      description: "Concorrentes na Zona Sul SP",
      action: () => navigate(createPageUrl('MarketIntelligence')),
      color: "bg-indigo-50 border-indigo-300 text-indigo-700"
    },
    {
      icon: Target,
      title: "Pipeline Automático",
      description: "Probabilidade de fechamento: 87%",
      action: () => navigate(createPageUrl('SalesFunnel')),
      color: "bg-pink-50 border-pink-300 text-pink-700"
    },
    {
      icon: Zap,
      title: "Ações Recomendadas",
      description: "3 tarefas prioritárias geradas",
      action: () => navigate(createPageUrl('Tasks')),
      color: "bg-amber-50 border-amber-300 text-amber-700"
    }
  ];

  if (!expanded) {
    return (
      <Button
        onClick={() => setExpanded(true)}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        <Building2 className="w-4 h-4 mr-2" />
        Ver Demonstração Cliente SP
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header do Cliente */}
      <Card className="p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{clientData.name}</h3>
              <p className="text-sm text-white/90">{clientData.clinic}</p>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{clientData.region}, {clientData.city}</span>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(false)}
            className="text-white hover:bg-white/10"
          >
            ✕
          </Button>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3" />
              <span className="text-2xl font-bold">{clientData.score}%</span>
            </div>
            <p className="text-[10px] text-white/80">Score</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-3 h-3" />
              <span className="text-xl font-bold">145k</span>
            </div>
            <p className="text-[10px] text-white/80">Pipeline</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
            <Badge className="bg-red-500 text-white text-xs">🔥 Quente</Badge>
            <p className="text-[10px] text-white/80 mt-1">Status</p>
          </div>
        </div>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-slate-700">Contato</span>
          </div>
          <p className="text-xs text-slate-600">{clientData.phone}</p>
          <p className="text-xs text-slate-600">{clientData.email}</p>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold text-slate-700">Próxima Visita</span>
          </div>
          <p className="text-xs text-slate-600">{clientData.visit_scheduled}</p>
          <Badge variant="outline" className="text-[10px] mt-1">Moema, SP</Badge>
        </Card>
      </div>

      {/* Interesse do Cliente */}
      <Card className="p-3 bg-amber-50 border-amber-300">
        <div className="flex items-start gap-2">
          <Target className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-900">Interesse Principal:</p>
            <p className="text-xs text-amber-800 mt-1">{clientData.equipment_interest}</p>
          </div>
        </div>
      </Card>

      {/* Perfil Numerológico */}
      <Card className="p-3 bg-purple-50 border-purple-300">
        <div className="flex items-start gap-2">
          <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-purple-900">Perfil Numerológico:</p>
            <p className="text-xs text-purple-800 mt-1">
              Número {clientData.numerology} - {clientData.profile}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              💡 Apresente ROI claro, payback rápido e visão de expansão
            </p>
          </div>
        </div>
      </Card>

      {/* Ações IA Recomendadas */}
      <Card className="p-3 bg-green-50 border-green-300">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <h4 className="text-sm font-bold text-green-900">Ações IA Prioritárias</h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-white p-2 rounded border border-green-200">
            <span className="text-xs font-bold text-green-700">1.</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-800">Enviar proposta hoje</p>
              <p className="text-[10px] text-slate-600">Melhor horário: 14h-16h</p>
            </div>
            <Clock className="w-3 h-3 text-slate-400" />
          </div>
          <div className="flex items-start gap-2 bg-white p-2 rounded border border-green-200">
            <span className="text-xs font-bold text-green-700">2.</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-800">Confirmar visita dia 28</p>
              <p className="text-[10px] text-slate-600">WhatsApp automático agendado</p>
            </div>
            <MessageSquare className="w-3 h-3 text-slate-400" />
          </div>
          <div className="flex items-start gap-2 bg-white p-2 rounded border border-green-200">
            <span className="text-xs font-bold text-green-700">3.</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-800">Análise de concorrentes Moema</p>
              <p className="text-[10px] text-slate-600">2 clínicas próximas identificadas</p>
            </div>
            <BarChart3 className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </Card>

      {/* Features Grid */}
      <div>
        <h4 className="text-sm font-bold text-slate-800 mb-3 px-1">
          🚀 Funcionalidades Disponíveis
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={idx}
                className={`p-3 cursor-pointer hover:shadow-lg transition-all ${feature.color} border-2`}
                onClick={feature.action}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-xs font-bold">{feature.title}</h5>
                  </div>
                  <ChevronRight className="w-3 h-3 opacity-50" />
                </div>
                <p className="text-[10px] opacity-80">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA Principal */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => navigate(createPageUrl('ClientProfile') + '?id=demo-sp')}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12"
        >
          <Users className="w-4 h-4 mr-2" />
          Ver Perfil Completo
        </Button>
        <Button
          onClick={() => navigate(createPageUrl('ProposalGenerator'))}
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-12"
        >
          <FileText className="w-4 h-4 mr-2" />
          Gerar Proposta
        </Button>
      </div>

      {/* Resumo do Sistema */}
      <Card className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50 border-2 border-indigo-200">
        <h4 className="text-sm font-bold text-slate-800 mb-3">📊 Resumo do Sistema NR22</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-slate-700">IA Ativa</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-slate-700">Numerologia ON</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-slate-700">WhatsApp Sync</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-slate-700">Auto-Tasks</span>
          </div>
        </div>
        <div className="mt-3 p-2 bg-white rounded border border-indigo-200">
          <p className="text-[10px] text-slate-600">
            ✨ <span className="font-semibold">Sistema completo pronto</span> para demonstração ao cliente de São Paulo
          </p>
        </div>
      </Card>
    </div>
  );
}