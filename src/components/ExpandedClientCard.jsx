import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  User, Building2, MapPin, Phone, Mail, Calendar, 
  TrendingUp, Target, Sparkles, DollarSign, ThermometerSun,
  ArrowRight, Package, Zap
} from 'lucide-react';

const statusColors = {
  quente: 'bg-red-500',
  morno: 'bg-yellow-500',
  frio: 'bg-blue-400'
};

const statusLabels = {
  quente: '🔥 Quente',
  morno: '🌡️ Morno',
  frio: '❄️ Frio'
};

export default function ExpandedClientCard({ client }) {
  const navigate = useNavigate();

  if (!client || !client.id || client.is_deleted) {
    return null;
  }

  return (
    <Card className="p-6 hover:shadow-2xl transition-all duration-300 border-2 border-indigo-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">
              {client.first_name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{client.first_name}</h3>
            {client.clinic_name && (
              <p className="text-sm text-slate-600 flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {client.clinic_name}
              </p>
            )}
            {client.city && (
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {client.city}
              </p>
            )}
          </div>
        </div>
        <Badge className={`${statusColors[client.status]} text-white px-3 py-1`}>
          {statusLabels[client.status]}
        </Badge>
      </div>

      {/* Análise Rápida IA */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-2xl font-bold text-purple-700">{client.numerology_number || '?'}</p>
          <p className="text-xs text-purple-600">Numerologia</p>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-2xl font-bold text-orange-700">{client.purchase_score || 50}%</p>
          <p className="text-xs text-orange-600">Score</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-2xl font-bold text-green-700">{client.total_visits_count || 0}</p>
          <p className="text-xs text-green-600">Visitas</p>
        </div>
      </div>

      {/* Perfil Comportamental */}
      {client.behavioral_profile && (
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 mb-3">
          <p className="text-xs font-semibold text-indigo-700 mb-1">🧠 Perfil Comportamental</p>
          <p className="text-sm text-slate-700">{client.behavioral_profile}</p>
          {client.decision_style && (
            <p className="text-xs text-indigo-600 mt-1">Decisão: {client.decision_style}</p>
          )}
        </div>
      )}

      {/* Informações de Contato */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {client.email && (
          <div className="p-2 bg-slate-50 rounded flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-700 truncate">{client.email}</span>
          </div>
        )}
        {client.phone && (
          <div className="p-2 bg-green-50 rounded flex items-center gap-2">
            <Phone className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700">{client.phone}</span>
          </div>
        )}
      </div>

      {/* Equipamento */}
      {client.equipment_interest && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
          <p className="text-xs font-semibold text-blue-700 mb-1">🎯 Interesse</p>
          <p className="text-sm font-semibold text-slate-800">{client.equipment_interest}</p>
        </div>
      )}

      {/* Orçamento e Deadline */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {client.available_budget && (
          <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-xs text-emerald-600 mb-0.5">💰 Orçamento</p>
            <p className="text-sm font-bold text-emerald-700">
              R$ {Number(client.available_budget).toLocaleString('pt-BR')}
            </p>
          </div>
        )}
        {client.decision_deadline && (
          <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-600 mb-0.5">⏰ Prazo</p>
            <p className="text-sm font-bold text-amber-700">
              {new Date(client.decision_deadline).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}
      </div>

      {/* Dores Principais */}
      {client.main_pains && client.main_pains.length > 0 && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-3">
          <p className="text-xs font-semibold text-red-700 mb-2">⚠️ Dores Identificadas</p>
          <div className="flex flex-wrap gap-1">
            {client.main_pains.slice(0, 3).map((pain, idx) => (
              <Badge key={idx} className="bg-red-100 text-red-700 text-xs">
                {pain}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Motivadores */}
      {client.purchase_motivators && client.purchase_motivators.length > 0 && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-3">
          <p className="text-xs font-semibold text-green-700 mb-2">✓ Motivadores</p>
          <div className="flex flex-wrap gap-1">
            {client.purchase_motivators.slice(0, 3).map((motivator, idx) => (
              <Badge key={idx} className="bg-green-100 text-green-700 text-xs">
                {motivator}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Próxima Ação */}
      {client.next_action && (
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-3">
          <p className="text-xs font-semibold text-yellow-700 mb-1">📋 Próxima Ação</p>
          <p className="text-sm text-slate-700">{client.next_action}</p>
        </div>
      )}

      {/* Dicas de Abordagem */}
      {client.approach_tips && (
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 mb-4">
          <p className="text-xs font-semibold text-purple-700 mb-1">💡 Dica Estratégica</p>
          <p className="text-sm text-slate-700">{client.approach_tips}</p>
        </div>
      )}

      {/* Botão Ver Perfil Completo */}
      <Button
        onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Ver Perfil Completo e Análise IA
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </Card>
  );
}