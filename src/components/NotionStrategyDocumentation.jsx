import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, ExternalLink, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function NotionStrategyDocumentation({ client }) {
  const [generating, setGenerating] = useState(false);
  const [notionUrl, setNotionUrl] = useState(null);

  const generateDocumentation = async () => {
    setGenerating(true);
    try {
      const result = await base44.functions.invoke('documentSalesStrategy', {
        client_id: client.id,
        strategy_type: 'complete'
      });

      setNotionUrl(result.notion_url);
      toast.success('Estratégia documentada no Notion!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao documentar: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <BookOpen className="w-5 h-5" />
          Documentação de Estratégia - Notion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!notionUrl ? (
          <>
            <p className="text-sm text-gray-700">
              Documente automaticamente toda a estratégia de vendas no Notion
            </p>

            <div className="p-3 bg-purple-100 rounded-lg border border-purple-300">
              <p className="text-xs font-semibold text-purple-800 mb-2">Inclui:</p>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>• Perfil comportamental do cliente</li>
                <li>• Análise de necessidades e dores</li>
                <li>• Estratégia de abordagem personalizada</li>
                <li>• Controle de objeções com argumentos</li>
                <li>• Plano de fechamento e timeline</li>
                <li>• Action items rastreáveis</li>
              </ul>
            </div>

            <Button
              onClick={generateDocumentation}
              disabled={generating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Documentar no Notion
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
              <p className="text-sm font-semibold text-green-800 mb-2">
                ✅ Estratégia documentada!
              </p>
              <p className="text-xs text-gray-700 mb-3">
                Documento completo criado no Notion com todas as seções e action items.
              </p>
              <Button
                onClick={() => window.open(notionUrl, '_blank')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir no Notion
              </Button>
            </div>

            <Button
              onClick={() => setNotionUrl(null)}
              variant="outline"
              className="w-full"
            >
              Nova Documentação
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}