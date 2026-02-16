import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Zap, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation } from '@tanstack/react-query';

export default function ProposalGenerator() {
  const [templates, setTemplates] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [customData, setCustomData] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: templateList = [] } = useQuery({
    queryKey: ['proposal_templates'],
    queryFn: () => base44.entities.ProposalTemplate?.list().catch(() => [])
  });

  const { data: clientList = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client?.list().catch(() => [])
  });

  const { data: productList = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.SeamatyPriceTable?.list().catch(() => [])
  });

  useEffect(() => {
    setTemplates(templateList || []);
  }, [templateList]);

  useEffect(() => {
    setClients(clientList || []);
  }, [clientList]);

  useEffect(() => {
    setProducts(productList || []);
  }, [productList]);

  const generateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('generateAdvancedProposal', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.pdf_url) {
        toast.success('Proposta gerada! Clique para baixar');
        window.open(data.pdf_url, '_blank');
      } else {
        toast.success('Proposta gerada!');
      }
    },
    onError: (error) => {
      toast.error('Erro ao gerar proposta: ' + error.message);
    }
  });

  const handleGenerate = async () => {
    if (!selectedTemplate || !selectedClient) {
      toast.error('Selecione um template e um cliente');
      return;
    }

    setIsGenerating(true);
    await generateMutation.mutateAsync({
      template_id: selectedTemplate,
      client_identifier: selectedClient,
      products: selectedProducts,
      custom_data: customData,
      output_format: 'pdf'
    });
    setIsGenerating(false);
  };

  const toggleProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(p => p !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerador de Propostas Avançado
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          
          {/* Template Selection */}
          <div>
            <label className="font-semibold text-gray-700 block mb-2">Template de Proposta</label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client Selection */}
          <div>
            <label className="font-semibold text-gray-700 block mb-2">Cliente</label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.full_name}>
                    {c.full_name} ({c.clinic_name || 'Sem clínica'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products Selection */}
          <div>
            <label className="font-semibold text-gray-700 block mb-2">Produtos (Opcional)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 max-h-48 overflow-y-auto border rounded p-3">
              {products.map(p => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{p.product_name} (R$ {(p.price_cash || 0).toFixed(2)})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Data */}
          <div>
            <label className="font-semibold text-gray-700 block mb-2">Dados Customizados (JSON)</label>
            <Textarea
              placeholder='{"prazo_entrega": "30 dias", "condicoes_pagamento": "50% entrada + 50% na entrega"}'
              value={JSON.stringify(customData, null, 2)}
              onChange={(e) => {
                try {
                  setCustomData(JSON.parse(e.target.value));
                } catch (err) {
                  // Invalid JSON, let user continue typing
                }
              }}
              rows={4}
              className="font-mono text-sm"
            />
          </div>

          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !selectedTemplate || !selectedClient}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-6"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Gerar Proposta em PDF'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}