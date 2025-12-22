import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, Send, Download, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function ProposalGenerator({ client, onProposalGenerated }) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedSale, setSelectedSale] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['proposal-templates'],
    queryFn: () => base44.entities.ProposalTemplate.filter({ is_active: true })
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['client-sales', client.id],
    queryFn: () => base44.entities.Sale.filter({ client_id: client.id }),
    enabled: !!client.id
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list()
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const createDocumentMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client-documents']);
      toast.success('Proposta salva com sucesso!');
      if (onProposalGenerated) onProposalGenerated();
      setOpen(false);
      resetState();
    }
  });

  const resetState = () => {
    setSelectedTemplate('');
    setSelectedSale('');
    setGeneratedContent('');
    setDocumentTitle('');
  };

  const fillPlaceholders = (content, data) => {
    let filled = content;
    
    // Cliente
    filled = filled.replace(/\{\{client_name\}\}/g, data.client?.first_name || '');
    filled = filled.replace(/\{\{client_full_name\}\}/g, data.client?.full_name || data.client?.first_name || '');
    filled = filled.replace(/\{\{client_email\}\}/g, data.client?.email || '');
    filled = filled.replace(/\{\{client_phone\}\}/g, data.client?.phone || '');
    filled = filled.replace(/\{\{client_city\}\}/g, data.client?.city || '');
    filled = filled.replace(/\{\{clinic_name\}\}/g, data.client?.clinic_name || '');
    
    // Equipamento e Venda
    if (data.sale) {
      filled = filled.replace(/\{\{equipment_name\}\}/g, data.sale.equipment_name || '');
      filled = filled.replace(/\{\{sale_value\}\}/g, 
        data.sale.sale_value ? `R$ ${data.sale.sale_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''
      );
      filled = filled.replace(/\{\{payment_terms\}\}/g, data.sale.payment_terms || '');
      
      // Buscar detalhes do equipamento
      const equip = data.equipment?.find(e => e.name === data.sale.equipment_name);
      if (equip) {
        filled = filled.replace(/\{\{equipment_price\}\}/g, 
          equip.price ? `R$ ${equip.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''
        );
        filled = filled.replace(/\{\{equipment_specifications\}\}/g, equip.specifications || '');
        filled = filled.replace(/\{\{monthly_bonus\}\}/g, equip.monthly_bonus || '');
      }
    }
    
    // Data e vendedor
    filled = filled.replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString('pt-BR'));
    filled = filled.replace(/\{\{salesperson_name\}\}/g, data.user?.full_name || data.user?.email || '');
    
    return filled;
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error('Selecione um template');
      return;
    }

    setGenerating(true);
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      const sale = selectedSale ? sales.find(s => s.id === selectedSale) : null;
      
      const data = {
        client,
        sale,
        equipment,
        user
      };

      const content = fillPlaceholders(template.content, data);
      setGeneratedContent(content);
      setDocumentTitle(`${template.name} - ${client.first_name}`);
      
      toast.success('Proposta gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar proposta:', error);
      toast.error('Erro ao gerar proposta');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent) {
      toast.error('Gere a proposta primeiro');
      return;
    }

    // Criar um arquivo de texto com o conteúdo
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const file = new File([blob], `${documentTitle}.txt`, { type: 'text/plain' });

    try {
      // Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Criar registro de documento
      await createDocumentMutation.mutateAsync({
        client_id: client.id,
        client_name: client.first_name,
        title: documentTitle,
        type: 'proposta',
        file_url,
        generated_from_template_id: selectedTemplate,
        related_sale_id: selectedSale || null,
        is_signed: false
      });

      // Abrir email para envio
      const emailBody = `Olá ${client.first_name},\n\nSegue em anexo a proposta comercial para ${selectedSale ? sales.find(s => s.id === selectedSale)?.equipment_name : 'nossos equipamentos'}.\n\nEstou à disposição para esclarecer qualquer dúvida.\n\nAtenciosamente,\n${user?.full_name || 'Equipe Venda NR'}`;
      
      const emailTo = client.contract_signature_email || client.email;
      
      if (emailTo) {
        window.open(`mailto:${emailTo}?subject=${encodeURIComponent(documentTitle)}&body=${encodeURIComponent(emailBody)}`, '_blank');
      }
    } catch (error) {
      console.error('Erro ao salvar proposta:', error);
      toast.error('Erro ao salvar proposta');
    }
  };

  const handleDownload = () => {
    if (!generatedContent) return;

    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Download iniciado!');
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="w-full h-12 border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Gerar Proposta
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar Proposta para {client.first_name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!generatedContent ? (
              <>
                <div>
                  <Label>Selecione o Template *</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.template_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {sales.length > 0 && (
                  <div>
                    <Label>Venda Relacionada (Opcional)</Label>
                    <Select value={selectedSale} onValueChange={setSelectedSale}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma venda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {sales.map((sale) => (
                          <SelectItem key={sale.id} value={sale.id}>
                            {sale.equipment_name} - R$ {sale.sale_value?.toLocaleString('pt-BR')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={generating || !selectedTemplate}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
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
              </>
            ) : (
              <>
                <div>
                  <Label>Título do Documento</Label>
                  <Input
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Conteúdo Gerado</Label>
                  <div className="p-4 bg-slate-50 rounded-lg border max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-sans">{generatedContent}</pre>
                  </div>
                </div>

                <Card className="p-4 bg-amber-50 border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>Próximos passos:</strong> Salve a proposta ou baixe para edição. 
                    Para enviar para assinatura eletrônica, você precisará habilitar as Funções de Backend.
                  </p>
                </Card>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setGeneratedContent('');
                      setDocumentTitle('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Gerar Novamente
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={createDocumentMutation.isPending}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {createDocumentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}