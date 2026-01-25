import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles,
  Loader2,
  Copy,
  FileText,
  Mail,
  MessageSquare,
  Video
} from 'lucide-react';
import { toast } from 'sonner';

export default function AIContentGenerator({ client, context = '' }) {
  const [contentType, setContentType] = useState('email');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);

  const generateContent = async (type) => {
    setContentType(type);
    setGenerating(true);
    try {
      let prompt = '';
      
      switch(type) {
        case 'email':
          prompt = `Crie um email profissional de vendas para ${client?.first_name || 'o cliente'}.
Equipamento: ${client?.equipment_interest || 'equipamento veterinário'}
Status: ${client?.status || 'morno'}
Estilo: Persuasivo mas respeitoso
Tamanho: 3-4 parágrafos`;
          break;
          
        case 'whatsapp':
          prompt = `Crie uma mensagem de WhatsApp para ${client?.first_name || 'o cliente'}.
Equipamento: ${client?.equipment_interest || 'equipamento veterinário'}
Tom: Amigável e direto
Tamanho: 2-3 parágrafos curtos`;
          break;
          
        case 'proposta':
          prompt = `Crie uma proposta comercial para ${client?.first_name || 'o cliente'}.
Clínica: ${client?.clinic_name || 'a clínica'}
Equipamento: ${client?.equipment_interest || 'equipamento veterinário'}
Inclua: Benefícios, investimento, próximos passos`;
          break;
          
        case 'script_video':
          prompt = `Crie um script de vídeo de apresentação para ${client?.first_name || 'o cliente'}.
Equipamento: ${client?.equipment_interest || 'equipamento veterinário'}
Duração: 2-3 minutos
Tom: Profissional e entusiasmado`;
          break;
          
        case 'custom':
          prompt = customPrompt;
          break;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${prompt}

CONTEXTO ADICIONAL:
${context}

Cliente: ${client?.first_name || 'Cliente'}
Numerologia: ${client?.numerology_number || 'N/A'}
Perfil: ${client?.behavioral_profile || 'N/A'}

IMPORTANTE: Adapte ao perfil numerológico do cliente.`,
        response_json_schema: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            conteudo: { type: "string" },
            cta: { type: "string" },
            dicas_uso: { type: "array", items: { type: "string" } }
          }
        }
      });

      setGeneratedContent(result);
      toast.success('Conteúdo gerado!');
    } catch (error) {
      toast.error('Erro ao gerar conteúdo');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const copyContent = () => {
    if (generatedContent?.conteudo) {
      navigator.clipboard.writeText(generatedContent.conteudo);
      toast.success('Copiado!');
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Gerador de Conteúdo IA</h3>
          <p className="text-xs text-orange-700">Crie conteúdo automaticamente</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button
          onClick={() => generateContent('email')}
          disabled={generating}
          variant="outline"
          className="h-auto py-3 flex-col gap-1"
        >
          <Mail className="w-5 h-5" />
          <span className="text-xs">Email</span>
        </Button>
        <Button
          onClick={() => generateContent('whatsapp')}
          disabled={generating}
          variant="outline"
          className="h-auto py-3 flex-col gap-1"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-xs">WhatsApp</span>
        </Button>
        <Button
          onClick={() => generateContent('proposta')}
          disabled={generating}
          variant="outline"
          className="h-auto py-3 flex-col gap-1"
        >
          <FileText className="w-5 h-5" />
          <span className="text-xs">Proposta</span>
        </Button>
        <Button
          onClick={() => generateContent('script_video')}
          disabled={generating}
          variant="outline"
          className="h-auto py-3 flex-col gap-1"
        >
          <Video className="w-5 h-5" />
          <span className="text-xs">Script Vídeo</span>
        </Button>
      </div>

      <div className="space-y-2 mb-3">
        <Textarea
          placeholder="Ou digite seu próprio prompt personalizado..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          rows={3}
        />
        <Button
          onClick={() => generateContent('custom')}
          disabled={generating || !customPrompt}
          variant="outline"
          className="w-full"
        >
          Gerar Personalizado
        </Button>
      </div>

      {generating && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-orange-600 mr-2" />
          <span className="text-sm text-orange-600">Gerando conteúdo...</span>
        </div>
      )}

      {generatedContent && (
        <div className="space-y-3">
          <Card className="p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-slate-800">{generatedContent.titulo}</p>
              <Button onClick={copyContent} size="sm" variant="ghost">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap mb-3">
              {generatedContent.conteudo}
            </div>
            {generatedContent.cta && (
              <div className="p-2 bg-orange-50 rounded border border-orange-200">
                <p className="text-xs font-semibold text-orange-800 mb-1">Call-to-Action:</p>
                <p className="text-xs text-slate-700">{generatedContent.cta}</p>
              </div>
            )}
          </Card>

          {generatedContent.dicas_uso?.length > 0 && (
            <Card className="p-3 bg-blue-50 border border-blue-200">
              <p className="text-xs font-semibold text-blue-800 mb-1">💡 Dicas de Uso:</p>
              {generatedContent.dicas_uso.map((dica, i) => (
                <p key={i} className="text-xs text-slate-700">• {dica}</p>
              ))}
            </Card>
          )}

          <Button
            onClick={() => setGeneratedContent(null)}
            variant="outline"
            className="w-full"
          >
            Gerar Novo Conteúdo
          </Button>
        </div>
      )}
    </Card>
  );
}