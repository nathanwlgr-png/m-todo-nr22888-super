import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Send, Copy, Check, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppMaterialsIntegration({ client }) {
  const [copied, setCopied] = useState(null);
  const [sendingMaterial, setSendingMaterial] = useState(null);
  const queryClient = useQueryClient();

  // Buscar materiais disponíveis
  const { data: materials = [] } = useQuery({
    queryKey: ['materials', client?.id],
    queryFn: async () => {
      try {
        const docs = await base44.entities.ClientDocument?.list().catch(() => []);
        const ais = await base44.entities.AIKnowledgeDocument?.list().catch(() => []);
        return [...(docs || []), ...(ais || [])].filter(m => m?.file_url);
      } catch (error) {
        console.warn('Erro ao carregar materiais:', error);
        return [];
      }
    },
    enabled: !!client?.id,
  });

  // Enviar material via WhatsApp
  const sendMaterialMutation = useMutation({
    mutationFn: async (material) => {
      if (!client?.phone) {
        throw new Error('Cliente sem telefone cadastrado');
      }
      
      setSendingMaterial(material.id);
      
      return await base44.functions.invoke('sendFileViaWhatsApp', {
        client_id: client.id,
        client_phone: client.phone,
        file_url: material.file_url,
        file_name: material.title || 'documento.pdf',
        caption: `📄 ${material.title}\n\n${material.summary || 'Confira o material em anexo!'}`
      });
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success(`Material "${data.file_name}" enviado via WhatsApp!`);
        queryClient.invalidateQueries(['whatsapp-messages']);
      }
    },
    onError: (error) => {
      toast.error('Erro ao enviar: ' + error.message);
    },
    onSettled: () => {
      setSendingMaterial(null);
    },
  });

  const handleSendMaterial = (material) => {
    sendMaterialMutation.mutate(material);
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Link copiado!');
  };

  const handleDownloadMaterial = (material) => {
    const link = document.createElement('a');
    link.href = material.file_url;
    link.download = material.title || 'documento';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download iniciado!');
  };

  if (!client?.id) {
    return (
      <Card className="border-slate-200">
        <CardContent className="pt-6 text-center text-slate-500">
          <p className="text-sm">Selecione um cliente para acessar materiais</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Materiais do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Nenhum material disponível para este cliente
            </p>
          ) : (
            <div className="space-y-2">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-orange-300 transition-colors"
                >
                  <FileText className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">
                      {material.title}
                    </p>
                    {material.summary && (
                      <p className="text-xs text-slate-600 truncate mt-1">
                        {material.summary}
                      </p>
                    )}
                    {material.document_type && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {material.document_type}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {client?.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                        onClick={() => handleSendMaterial(material)}
                        disabled={sendingMaterial === material.id}
                      >
                        {sendingMaterial === material.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadMaterial(material)}
                    >
                      <Download className="w-3 h-3" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyLink(material.file_url)}
                    >
                      {copied === material.file_url ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {client?.phone && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <p className="text-xs text-green-700">
              ✓ WhatsApp conectado para: <span className="font-semibold">{client.phone}</span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}