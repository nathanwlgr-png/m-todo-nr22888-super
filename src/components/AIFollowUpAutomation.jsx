import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, Send, Copy, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AIFollowUpAutomation() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [generatedMessage, setGeneratedMessage] = useState(null);
  const [generating, setGenerating] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-followup'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions-all'],
    queryFn: () => base44.entities.Interaction.list()
  });

  // Clientes que precisam de follow-up
  const needsFollowUp = clients.filter(c => {
    const lastContact = c.last_contact_date ? new Date(c.last_contact_date) : null;
    const daysSinceContact = lastContact ? Math.floor((new Date() - lastContact) / (1000 * 60 * 60 * 24)) : 999;
    return daysSinceContact > 7 && c.status !== 'frio' && !c.sale_closed;
  }).sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0));

  const generateFollowUp = async (client) => {
    setGenerating(true);
    setSelectedClient(client);
    
    try {
      // Buscar interações do cliente
      const clientInteractions = interactions.filter(i => i.client_id === client.id);
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Gere uma mensagem de follow-up personalizada e persuasiva para WhatsApp.

CLIENTE:
- Nome: ${client.first_name}
- Clínica: ${client.clinic_name || 'N/A'}
- Status: ${client.status}
- Score: ${client.purchase_score || 0}/100
- Perfil Numerológico: ${client.numerology_number} - ${client.behavioral_profile || 'N/A'}
- Tom recomendado: ${client.client_tone || 'profissional'}
- Equipamento Interesse: ${client.equipment_interest || 'não especificado'}
- Último contato: ${client.last_contact_date || 'nunca'}
- Objeções conhecidas: ${client.real_objections?.join(', ') || 'nenhuma'}
- Motivadores: ${client.purchase_motivators?.join(', ') || 'não identificados'}

HISTÓRICO RECENTE:
${clientInteractions.slice(-3).map(i => `- ${i.type}: ${i.subject} (${i.outcome})`).join('\n') || 'Sem interações recentes'}

CONTEXTO:
- Já se passaram ${Math.floor((new Date() - new Date(client.last_contact_date || Date.now())) / (1000 * 60 * 60 * 24))} dias desde último contato
- Pipeline: ${client.pipeline_stage || 'lead'}

INSTRUÇÕES:
1. Mensagem curta (máx 3 parágrafos)
2. Personalizada com base no perfil numerológico
3. Use o tom adequado: ${client.client_tone || 'profissional'}
4. Mencione algo específico do histórico
5. Call-to-action claro
6. Natural para WhatsApp (sem formalidade excessiva)
7. Inclua emoji apropriado (1 ou 2 no máximo)

Gere a mensagem em português:`,
        response_json_schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            suggested_time: { type: "string" },
            reasoning: { type: "string" },
            best_day: { type: "string" },
            approach_strategy: { type: "string" }
          }
        }
      });

      setGeneratedMessage({ client, ...result });
      toast.success('Follow-up gerado!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar follow-up');
    } finally {
      setGenerating(false);
    }
  };

  const copyMessage = () => {
    if (generatedMessage?.message) {
      navigator.clipboard.writeText(generatedMessage.message);
      toast.success('Mensagem copiada!');
    }
  };

  const sendViaWhatsApp = () => {
    if (!generatedMessage?.client?.phone || !generatedMessage?.message) {
      toast.error('Cliente sem WhatsApp');
      return;
    }
    
    const phone = generatedMessage.client.phone.replace(/\D/g, '');
    const message = encodeURIComponent(generatedMessage.message);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Sparkles className="w-5 h-5" />
          IA: Follow-Up Automático
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!generatedMessage ? (
          <>
            <p className="text-xs text-purple-700 font-semibold">
              📊 {needsFollowUp.length} clientes precisam de follow-up
            </p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {needsFollowUp.slice(0, 10).map(client => {
                const daysSince = client.last_contact_date 
                  ? Math.floor((new Date() - new Date(client.last_contact_date)) / (1000 * 60 * 60 * 24))
                  : 999;
                
                return (
                  <div
                    key={client.id}
                    className="p-2 bg-white rounded border border-purple-200 hover:border-purple-400 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {client.first_name}
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {client.clinic_name || 'Sem clínica'}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge className={
                            client.status === 'quente' ? 'bg-red-500' :
                            client.status === 'morno' ? 'bg-orange-500' :
                            'bg-blue-500'
                          }>
                            {client.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {client.purchase_score || 0}%
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {daysSince}d atrás
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => generateFollowUp(client)}
                        disabled={generating}
                        className="bg-purple-600 hover:bg-purple-700 shrink-0"
                      >
                        {generating && selectedClient?.id === client.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {needsFollowUp.length === 0 && (
              <div className="text-center py-8 text-purple-600">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Todos os follow-ups em dia! 🎉</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">
                  {generatedMessage.client.first_name}
                </p>
                <p className="text-xs text-slate-600">
                  {generatedMessage.client.clinic_name}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setGeneratedMessage(null)}
              >
                Voltar
              </Button>
            </div>

            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {generatedMessage.message}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-purple-100 rounded">
                <p className="font-semibold text-purple-900 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Melhor Horário
                </p>
                <p className="text-purple-700 mt-0.5">{generatedMessage.suggested_time}</p>
              </div>
              <div className="p-2 bg-pink-100 rounded">
                <p className="font-semibold text-pink-900 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Melhor Dia
                </p>
                <p className="text-pink-700 mt-0.5">{generatedMessage.best_day}</p>
              </div>
            </div>

            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs font-semibold text-blue-900">📋 Estratégia:</p>
              <p className="text-xs text-blue-700 mt-1">{generatedMessage.approach_strategy}</p>
            </div>

            <div className="p-2 bg-amber-50 rounded border border-amber-200">
              <p className="text-xs font-semibold text-amber-900">💡 Raciocínio IA:</p>
              <p className="text-xs text-amber-700 mt-1">{generatedMessage.reasoning}</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={copyMessage}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copiar
              </Button>
              <Button
                onClick={sendViaWhatsApp}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="sm"
                disabled={!generatedMessage.client.phone}
              >
                <Send className="w-3 h-3 mr-1" />
                WhatsApp
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}