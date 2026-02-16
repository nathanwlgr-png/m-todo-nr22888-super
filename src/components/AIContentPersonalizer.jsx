import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, Copy, Mail, MessageSquare, Share2, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function AIContentPersonalizer({ contact }) {
  const [customContext, setCustomContext] = useState('');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [activeType, setActiveType] = useState('email_prospeccao');

  const generateMutation = useMutation({
    mutationFn: async (content_type) => {
      const response = await base44.functions.invoke('generatePersonalizedContent', {
        contact_id: contact.id,
        content_type,
        custom_context: customContext
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      toast.success('Conteúdo gerado!');
    }
  });

  const handleGenerate = (type) => {
    setActiveType(type);
    generateMutation.mutate(type);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const contentTypes = [
    { id: 'email_prospeccao', icon: Mail, label: 'Email Prospecção', color: 'indigo' },
    { id: 'email_followup', icon: Mail, label: 'Email Follow-up', color: 'blue' },
    { id: 'whatsapp_sequence', icon: MessageSquare, label: 'Sequência WhatsApp', color: 'green' },
    { id: 'social_linkedin', icon: Share2, label: 'Post LinkedIn', color: 'cyan' },
    { id: 'social_instagram', icon: Share2, label: 'Story Instagram', color: 'pink' }
  ];

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Gerador de Conteúdo IA
        </CardTitle>
        <p className="text-xs text-slate-600">
          Conteúdo personalizado baseado em perfil, sentimento e engajamento
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-2 block">
            Contexto Adicional (opcional)
          </label>
          <Input
            placeholder="Ex: Mencionar caso de sucesso do Dr. João..."
            value={customContext}
            onChange={(e) => setCustomContext(e.target.value)}
            className="text-sm"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {contentTypes.map(type => (
            <Button
              key={type.id}
              size="sm"
              variant="outline"
              onClick={() => handleGenerate(type.id)}
              disabled={generateMutation.isPending}
              className="h-auto py-2 flex-col gap-1"
            >
              <type.icon className={`w-4 h-4 text-${type.color}-600`} />
              <span className="text-xs">{type.label}</span>
            </Button>
          ))}
        </div>

        {generateMutation.isPending && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
            <span className="text-sm text-purple-600">Gerando conteúdo personalizado...</span>
          </div>
        )}

        {generatedContent && (
          <div className="space-y-3 border-t pt-4">
            {generatedContent.subject && (
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-purple-700">ASSUNTO</p>
                  <Button size="sm" variant="ghost" onClick={() => handleCopy(generatedContent.subject)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm font-semibold text-slate-800">{generatedContent.subject}</p>
              </div>
            )}

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700">CONTEÚDO PRINCIPAL</p>
                <Button size="sm" variant="ghost" onClick={() => handleCopy(generatedContent.content)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {generatedContent.content}
              </p>
            </div>

            {generatedContent.alternative_version && (
              <details>
                <summary className="text-xs font-semibold text-indigo-600 cursor-pointer">
                  Ver Versão Alternativa
                </summary>
                <div className="bg-indigo-50 rounded-lg p-3 mt-2">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {generatedContent.alternative_version}
                  </p>
                </div>
              </details>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-blue-50 rounded p-2">
                <p className="font-semibold text-blue-700">Melhor Horário</p>
                <p className="text-slate-600">{generatedContent.best_send_time}</p>
              </div>
              <div className="bg-green-50 rounded p-2">
                <p className="font-semibold text-green-700">Taxa Esperada</p>
                <p className="text-slate-600">{generatedContent.expected_response_rate}%</p>
              </div>
            </div>

            {generatedContent.personalization_elements?.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-purple-700 mb-2">Elementos de Personalização:</p>
                <div className="flex flex-wrap gap-1">
                  {generatedContent.personalization_elements.map((elem, i) => (
                    <Badge key={i} className="bg-purple-200 text-purple-800 text-xs">
                      {elem}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {contact.email && activeType.startsWith('email') && (
                <Button
                  size="sm"
                  className="flex-1 bg-indigo-600"
                  onClick={() => window.open(`mailto:${contact.email}?subject=${encodeURIComponent(generatedContent.subject)}&body=${encodeURIComponent(generatedContent.content)}`)}
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Abrir no Email
                </Button>
              )}
              {contact.phone && activeType === 'whatsapp_sequence' && (
                <Button
                  size="sm"
                  className="flex-1 bg-green-600"
                  onClick={() => window.open(`https://wa.me/${contact.phone}?text=${encodeURIComponent(generatedContent.content.split('\n\n')[0])}`)}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  WhatsApp
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}