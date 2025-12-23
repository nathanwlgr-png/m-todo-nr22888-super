import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Loader2, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function ProposalContractGenerator({ client, campaignId }) {
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['campaign-templates', campaignId],
    queryFn: () => base44.entities.CampaignTemplate.filter({ campaign_id: campaignId }),
    enabled: !!campaignId
  });

  const proposalTemplates = templates.filter(t => t.template_type === 'proposta');
  const contractTemplates = templates.filter(t => t.template_type === 'contrato');
  const roiTemplates = templates.filter(t => t.template_type === 'retorno_financeiro');

  const generateDocument = async (type) => {
    if (!selectedEquipment) {
      toast.error('Selecione um equipamento');
      return;
    }

    setGenerating(true);
    try {
      const equipmentData = equipment.find(e => e.id === selectedEquipment);
      const template = templates.find(t => t.id === selectedTemplate);

      // Gerar documento com IA
      const prompt = `Crie um ${type === 'proposta' ? 'documento de PROPOSTA COMERCIAL' : 'CONTRATO DE VENDA'} profissional.

DADOS DO CLIENTE:
- Nome: ${client.full_name || client.first_name}
- CNPJ: ${client.cnpj || 'N/A'}
- Razão Social: ${client.razao_social || client.clinic_name}
- Email: ${client.email}
- Telefone: ${client.phone}
- Endereço: ${client.address}, ${client.city} - ${client.cep}

EQUIPAMENTO:
- Nome: ${equipmentData.name}
- Categoria: ${equipmentData.category}
- Preço: R$ ${equipmentData.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
- Especificações: ${equipmentData.specifications}
- Bonificação do Mês: ${equipmentData.monthly_bonus}

CONDIÇÕES DE PAGAMENTO:
${template?.payment_conditions?.a_vista ? '✓ À Vista' : ''}
${template?.payment_conditions?.pics_36x ? '✓ PICS em até 36 vezes' : ''}
${template?.payment_conditions?.santander_financiamento ? '✓ Financiamento Santander até 36 vezes' : ''}

OBSERVAÇÕES: ${template?.payment_conditions?.observacoes || 'Equipamentos não possuem desconto.'}

${type === 'proposta' ? 
`Crie uma PROPOSTA COMERCIAL completa e profissional com:
1. Cabeçalho da empresa
2. Dados do cliente
3. Descrição detalhada do equipamento e benefícios
4. Valor e condições de pagamento claras
5. Prazo de validade da proposta (30 dias)
6. Próximos passos

Formato: Markdown profissional` 
: 
`Crie um CONTRATO DE COMPRA E VENDA completo com:
1. Qualificação das partes (Vendedor e Comprador)
2. Objeto do contrato (equipamento)
3. Valor e forma de pagamento
4. Prazo de entrega
5. Garantia
6. Cláusulas de rescisão
7. Foro
8. Data e assinaturas

Formato: Markdown jurídico profissional`}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      // Salvar como documento do cliente
      await base44.entities.ClientDocument.create({
        client_id: client.id,
        client_name: client.first_name,
        title: `${type === 'proposta' ? 'Proposta' : 'Contrato'} - ${equipmentData.name}`,
        type: type === 'proposta' ? 'proposta' : 'contrato',
        notes: result
      });

      queryClient.invalidateQueries(['client-documents']);
      toast.success(`${type === 'proposta' ? 'Proposta' : 'Contrato'} gerado com sucesso!`);

      // Abrir preview em nova aba
      const blob = new Blob([result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

    } catch (error) {
      toast.error('Erro ao gerar documento');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-orange-600" />
        Gerador de Proposta & Contrato
      </h3>

      <div className="space-y-3">
        {/* Equipment Selection */}
        <div>
          <Label>Selecione o Equipamento</Label>
          <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha o equipamento" />
            </SelectTrigger>
            <SelectContent>
              {equipment.map(eq => (
                <SelectItem key={eq.id} value={eq.id}>
                  {eq.name} - R$ {eq.price.toLocaleString('pt-BR')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template Selection */}
        {proposalTemplates.length > 0 && (
          <div>
            <Label>Template Base (opcional)</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Usar template salvo" />
              </SelectTrigger>
              <SelectContent>
                {proposalTemplates.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.template_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ROI Table Info */}
        {roiTemplates.length > 0 && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs font-semibold text-green-800 mb-1">📊 Tabela de ROI Disponível</p>
            {roiTemplates.map(roi => (
              <a
                key={roi.id}
                href={roi.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-700 underline block"
              >
                {roi.template_name}
              </a>
            ))}
          </div>
        )}

        {/* Generate Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            onClick={() => generateDocument('proposta')}
            disabled={generating || !selectedEquipment}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Gerar Proposta
              </>
            )}
          </Button>

          <Button
            onClick={() => generateDocument('contrato')}
            disabled={generating || !selectedEquipment}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Gerar Contrato
              </>
            )}
          </Button>
        </div>

        {selectedEquipment && (
          <p className="text-xs text-slate-600 text-center">
            Documentos serão salvos automaticamente no perfil do cliente
          </p>
        )}
      </div>
    </Card>
  );
}