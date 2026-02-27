import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { openWhatsAppChunked } from '@/components/utils/whatsappChunks';

export default function WhatsAppProposalPackage({ client }) {
  const [sending, setSending] = useState(false);

  const sendWhatsAppPackage = async () => {
    if (!client.phone) {
      toast.error('Cliente não tem WhatsApp cadastrado');
      return;
    }

    if (!client.equipment_interest) {
      toast.error('Defina o equipamento de interesse primeiro');
      return;
    }

    setSending(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Crie um PACOTE COMPLETO DE VENDAS para WhatsApp com imagens, vídeos e textos persuasivos.

CLIENTE: ${client.first_name}
CLÍNICA: ${client.clinic_name}
EQUIPAMENTO INTERESSE: ${client.equipment_interest}
PERFIL NUMEROLÓGICO: ${client.behavioral_profile}
TOM: ${client.client_tone}
ORÇAMENTO: R$ ${client.available_budget || 'Não informado'}

GERE um pacote estruturado com:

1. **Mensagem de Abertura** (2-3 linhas personalizadas)
2. **Proposta Principal** com:
   - Equipamento: ${client.equipment_interest}
   - Especificações técnicas principais
   - Qualidades únicas do Seamaty
   - Benefícios diretos para o perfil dele
3. **Links de Vídeos** (YouTube Seamaty oficial)
4. **Imagens sugeridas** (descreva 2-3 imagens ideais)
5. **Bonificação do Mês**
6. **Chamada para Ação** (adaptada ao tom dele)

Adapte o tom ao perfil: ${client.client_tone || 'profissional'}
Use gatilhos: ${client.triggers_used?.join(', ') || 'Autoridade, Escassez, Prova Social'}

Retorne em formato de mensagens separadas prontas para copiar/colar no WhatsApp.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            opening_message: { type: "string" },
            main_proposal: { type: "string" },
            video_links: { type: "array", items: { type: "string" } },
            image_descriptions: { type: "array", items: { type: "string" } },
            monthly_bonus: { type: "string" },
            call_to_action: { type: "string" },
            complete_package_text: { type: "string" }
          }
        }
      });

      await navigator.clipboard.writeText(result.complete_package_text);
      const { total } = openWhatsAppChunked(client.phone, result.complete_package_text);
      if (total > 1) {
        toast.success(`Pacote dividido em ${total} partes. Envie em ordem!`);
      } else {
        toast.success('Pacote copiado! Abrindo WhatsApp...');
      }

      // Salvar como documento
      await base44.entities.GeneratedDocument.create({
        title: `Pacote WhatsApp - ${client.first_name} - ${client.equipment_interest}`,
        type: 'proposta',
        content: result.complete_package_text,
        summary: `Pacote de vendas completo com vídeos e imagens`,
        tags: ['whatsapp', client.first_name, client.equipment_interest]
      });

    } catch (error) {
      toast.error('Erro ao gerar pacote');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Pacote WhatsApp IA</h3>
          <p className="text-xs text-slate-600">Proposta + Vídeos + Imagens</p>
        </div>
      </div>

      <Button
        onClick={sendWhatsAppPackage}
        disabled={sending || !client.phone || !client.equipment_interest}
        className="w-full bg-green-600 hover:bg-green-700 h-12"
      >
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Preparando pacote...
          </>
        ) : (
          <>
            <MessageSquare className="w-4 h-4 mr-2" />
            Enviar Pacote Completo
          </>
        )}
      </Button>
    </Card>
  );
}