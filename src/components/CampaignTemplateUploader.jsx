import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Download, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CampaignTemplateUploader({ campaignId }) {
  const [uploading, setUploading] = useState(false);
  const [templateType, setTemplateType] = useState('proposta');
  const [templateName, setTemplateName] = useState('');
  const [paymentConditions, setPaymentConditions] = useState({
    a_vista: true,
    pics_36x: true,
    santander_financiamento: true,
    observacoes: 'Equipamentos não possuem desconto. Formas de pagamento: À vista, PICS até 36x, ou Financiamento Santander até 36x.'
  });
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['campaign-templates', campaignId],
    queryFn: () => base44.entities.CampaignTemplate.filter({ campaign_id: campaignId }),
    enabled: !!campaignId
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.CampaignTemplate.create({
        campaign_id: campaignId,
        template_type: templateType,
        template_name: templateName || file.name,
        file_url,
        payment_conditions: paymentConditions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['campaign-templates']);
      setTemplateName('');
      toast.success('Template enviado!');
    },
    onError: () => {
      toast.error('Erro ao enviar');
    },
    onSettled: () => {
      setUploading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CampaignTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaign-templates']);
      toast.success('Template removido');
    }
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-purple-600" />
        Templates da Campanha
      </h3>

      {/* Upload Section */}
      <div className="space-y-3 mb-5">
        <div>
          <Label>Tipo de Template</Label>
          <select
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="proposta">Proposta Comercial</option>
            <option value="contrato">Contrato</option>
            <option value="retorno_financeiro">Tabela Retorno Financeiro</option>
          </select>
        </div>

        <div>
          <Label>Nome do Template</Label>
          <Input
            placeholder="Ex: Proposta Padrão 2025"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </div>

        {/* Payment Conditions */}
        <div className="p-3 bg-white rounded-lg border border-purple-200">
          <p className="text-sm font-semibold text-slate-800 mb-2">Condições de Pagamento</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={paymentConditions.a_vista}
                onCheckedChange={(checked) => setPaymentConditions({...paymentConditions, a_vista: checked})}
              />
              <span className="text-sm">À Vista</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={paymentConditions.pics_36x}
                onCheckedChange={(checked) => setPaymentConditions({...paymentConditions, pics_36x: checked})}
              />
              <span className="text-sm">PICS até 36x</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={paymentConditions.santander_financiamento}
                onCheckedChange={(checked) => setPaymentConditions({...paymentConditions, santander_financiamento: checked})}
              />
              <span className="text-sm">Financiamento Santander até 36x</span>
            </label>
          </div>
          <div className="mt-2">
            <Label className="text-xs">Observações</Label>
            <Textarea
              value={paymentConditions.observacoes}
              onChange={(e) => setPaymentConditions({...paymentConditions, observacoes: e.target.value})}
              rows={2}
              className="text-xs"
            />
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !templateName}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Template
            </>
          )}
        </Button>
      </div>

      {/* Templates List */}
      {templates.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Templates Salvos:</p>
          {templates.map(template => (
            <div key={template.id} className="p-3 bg-white rounded-lg border flex items-center justify-between">
              <div className="flex-1">
                <p className="font-semibold text-sm text-slate-900">{template.template_name}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {template.template_type}
                </Badge>
              </div>
              <div className="flex gap-2">
                <a href={template.file_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost">
                    <Download className="w-4 h-4" />
                  </Button>
                </a>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(template.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}