import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, MessageSquare, Navigation, AlertTriangle } from 'lucide-react';

/**
 * Ranking do Dia Seamaty — TOP 10 Oportunidades
 * Mostra: fechamento rápido, insumos, hospitais, labo, parados, perto, quentes
 */

export default function RankingDoDiaSeamaty({ clients = [], sales = [] }) {
  const [selectedClient, setSelectedClient] = useState(null);

  const rankingData = useMemo(() => {
    if (!clients || clients.length === 0) return [];

    // Calcular score
    const scored = clients.map(client => {
      let score = 0;
      const now = new Date();

      // +20 emergência (sem contato há 30+ dias)
      if (client.last_contact_date) {
        const daysSinceContact = (now - new Date(client.last_contact_date)) / 86400000;
        if (daysSinceContact > 30) score += 20;
      } else {
        score += 20;
      }

      // +15 envia exame para fora (não tem equipamento)
      if (!client.current_equipment) score += 15;

      // +15 cliente parado (proposta há 30+ dias)
      if (client.last_contact_follow_up_date) {
        const daysSinceFollowUp = (now - new Date(client.last_contact_follow_up_date)) / 86400000;
        if (daysSinceFollowUp > 30) score += 15;
      }

      // +15 cidade estratégica (lista pré-definida)
      const strategicCities = ['Marília', 'Bauru', 'Botucatu', 'Garça'];
      if (strategicCities.includes(client.city)) score += 15;

      // +10 crescimento (múltiplas compras)
      const clientSales = sales.filter(s => s.client_id === client.id);
      if (clientSales.length > 1) score += 10;

      // +10 forte digital (Instagram ou website)
      if (client.instagram_handle || client.website) score += 10;

      // +10 comodato (clínica pequena/média sem equipamento)
      if (client.client_type === 'clinica_pequena' && !client.current_equipment) score += 10;

      // +10 gap equipamento (tem equipamento velho)
      if (client.equipment_sold && !client.current_equipment) score += 10;

      // +5 influência regional (hospital ou laboratório)
      if (['hospital_veterinario', 'laboratorio_terceirizado'].includes(client.client_type)) score += 5;

      // +5 potencial insumo (tem equipamento confirmado)
      if (client.current_equipment) score += 5;

      // Classificação
      let priority = 'frio';
      if (score >= 90) priority = 'raro';
      else if (score >= 75) priority = 'urgente';
      else if (score >= 60) priority = 'quente';
      else if (score >= 40) priority = 'potencial';

      return {
        ...client,
        calculatedScore: score,
        priority,
        reason: getScoreReason(client, score),
      };
    });

    // Ordenar por score e retornar TOP 10
    return scored
      .filter(c => c.calculatedScore > 0)
      .sort((a, b) => b.calculatedScore - a.calculatedScore)
      .slice(0, 10);
  }, [clients, sales]);

  const priorityColors = {
    raro: 'bg-red-600 text-white',
    urgente: 'bg-orange-600 text-white',
    quente: 'bg-yellow-600 text-white',
    potencial: 'bg-blue-600 text-white',
    frio: 'bg-slate-600 text-white',
  };

  const priorityEmoji = {
    raro: '🔥',
    urgente: '⚠️',
    quente: '🎯',
    potencial: '💡',
    frio: '❄️',
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ArrowUp className="w-5 h-5 text-yellow-400" />
            🏆 Ranking do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rankingData.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Nenhuma oportunidade identificada</p>
          ) : (
            <div className="space-y-3">
              {rankingData.map((client, idx) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedClient?.id === client.id
                      ? 'bg-slate-700 border-yellow-500'
                      : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* RANKING */}
                    <div className="text-2xl font-black text-yellow-400">
                      #{idx + 1}
                    </div>

                    {/* INFO PRINCIPAL */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white truncate">
                          {client.full_name || client.clinic_name}
                        </p>
                        <Badge className={priorityColors[client.priority]}>
                          {priorityEmoji[client.priority]} {client.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        📍 {client.city} · Score: <span className="font-bold text-yellow-400">{client.calculatedScore}</span>
                      </p>
                      <p className="text-xs text-slate-300 mt-1">{client.reason}</p>
                    </div>

                    {/* AÇÕES RÁPIDAS */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-400 hover:bg-green-950"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://wa.me/${client.phone?.replace(/\D/g, '')}`, '_blank');
                        }}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* DETALHE EXPANDIDO */}
                  {selectedClient?.id === client.id && (
                    <div className="mt-4 pt-4 border-t border-slate-600 space-y-2 text-sm">
                      <div>
                        <p className="text-slate-400">Equipamento Atual:</p>
                        <p className="font-bold text-white">
                          {client.current_equipment || '❌ Sem equipamento (OPORTUNIDADE!)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Último Contato:</p>
                        <p className="font-bold text-white">
                          {client.last_contact_date ? new Date(client.last_contact_date).toLocaleDateString('pt-BR') : 'Nunca contatado'}
                        </p>
                      </div>
                      {client.phone && (
                        <div>
                          <p className="text-slate-400">WhatsApp:</p>
                          <p className="font-bold text-white">{client.phone}</p>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-600">
                        <Button size="sm" className="flex-1 gap-1 bg-green-600 hover:bg-green-700">
                          <MessageSquare className="w-3 h-3" />
                          WhatsApp
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-1">
                          <Navigation className="w-3 h-3" />
                          Visita
                        </Button>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getScoreReason(client, score) {
  const reasons = [];
  const now = new Date();

  if (client.last_contact_date) {
    const daysSinceContact = (now - new Date(client.last_contact_date)) / 86400000;
    if (daysSinceContact > 30) reasons.push(`⏰ Sem contato há ${Math.floor(daysSinceContact)} dias`);
  } else {
    reasons.push('⏰ Nunca contatado');
  }

  if (!client.current_equipment) reasons.push('🎯 Sem equipamento (VG2, SMT, etc)');
  if (['hospital_veterinario', 'laboratorio_terceirizado'].includes(client.client_type)) reasons.push('🏥 Hospital/Laboratório');
  if (client.instagram_handle || client.website) reasons.push('💻 Digital strong');

  return reasons.slice(0, 2).join(' · ');
}