import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  FileText,
  Users,
  Handshake,
  CheckCircle2,
  AlertCircle,
  MinusCircle
} from 'lucide-react';

const interactionIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  whatsapp: MessageSquare,
  proposal_sent: FileText,
  demo: Users,
  negotiation: Handshake,
  contract_signed: CheckCircle2,
  other: MinusCircle
};

const interactionLabels = {
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  whatsapp: 'WhatsApp',
  proposal_sent: 'Proposta Enviada',
  demo: 'Demonstração',
  negotiation: 'Negociação',
  contract_signed: 'Contrato Assinado',
  other: 'Outro'
};

const outcomeColors = {
  positive: 'bg-green-100 text-green-700 border-green-300',
  neutral: 'bg-slate-100 text-slate-700 border-slate-300',
  negative: 'bg-red-100 text-red-700 border-red-300',
  no_answer: 'bg-amber-100 text-amber-700 border-amber-300'
};

const outcomeLabels = {
  positive: '✅ Positivo',
  neutral: '➖ Neutro',
  negative: '❌ Negativo',
  no_answer: '📵 Sem Resposta'
};

export default function InteractionTimeline({ interactions = [] }) {
  if (!interactions.length) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Nenhuma interação registrada</p>
      </Card>
    );
  }

  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date)
  );

  return (
    <div className="space-y-3">
      {sortedInteractions.map((interaction) => {
        const Icon = interactionIcons[interaction.type] || MinusCircle;
        
        return (
          <Card key={interaction.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h4 className="font-semibold text-slate-800">{interaction.subject}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {interactionLabels[interaction.type]}
                      </Badge>
                      {interaction.direction && (
                        <span className="text-xs text-slate-500">
                          {interaction.direction === 'inbound' ? '📥 Recebido' : '📤 Enviado'}
                        </span>
                      )}
                      {interaction.duration_minutes && (
                        <span className="text-xs text-slate-500">
                          ⏱️ {interaction.duration_minutes} min
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right text-xs text-slate-500">
                    {format(new Date(interaction.created_date), 'dd MMM yyyy', { locale: ptBR })}
                    <br />
                    {format(new Date(interaction.created_date), 'HH:mm')}
                  </div>
                </div>
                
                {interaction.notes && (
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {interaction.notes}
                  </p>
                )}
                
                {interaction.outcome && (
                  <div className="mt-2">
                    <Badge className={`${outcomeColors[interaction.outcome]} text-xs`}>
                      {outcomeLabels[interaction.outcome]}
                    </Badge>
                  </div>
                )}
                
                {interaction.next_action && (
                  <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs font-medium text-amber-800">
                      📌 Próxima ação: {interaction.next_action}
                    </p>
                  </div>
                )}
                
                {interaction.created_by_name && (
                  <p className="text-xs text-slate-400 mt-2">
                    Por {interaction.created_by_name}
                  </p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}