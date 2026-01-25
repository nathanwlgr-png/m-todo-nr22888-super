import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Zap, Loader2, Mail, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartInteractionProcessor({ client, onTasksCreated }) {
  const [text, setText] = useState('');
  const [source, setSource] = useState('email');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const processInteraction = async () => {
    if (!text.trim()) {
      toast.error('Digite o conteúdo da interação');
      return;
    }

    setProcessing(true);
    try {
      const response = await base44.functions.invoke('autoProcessInteraction', {
        client_id: client.id,
        interaction_text: text,
        source
      });

      if (response.data.success) {
        setResult(response.data);
        toast.success(`${response.data.tasks_created} tarefa(s) criada(s) automaticamente!`);
        if (onTasksCreated) onTasksCreated();
      } else {
        toast.error('Erro ao processar');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar interação');
    } finally {
      setProcessing(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'positivo') return 'bg-green-100 text-green-700';
    if (sentiment === 'negativo') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getOutcomeIcon = (outcome) => {
    if (outcome === 'positive') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (outcome === 'negative') return <AlertCircle className="w-4 h-4 text-red-600" />;
    return <AlertCircle className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm">Automação Inteligente</CardTitle>
              <p className="text-xs text-muted-foreground">Cole email ou conversa para processar</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Source Selector */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={source === 'email' ? 'default' : 'outline'}
              onClick={() => setSource('email')}
              className={source === 'email' ? 'bg-purple-600' : ''}
            >
              <Mail className="w-4 h-4 mr-1" />
              Email
            </Button>
            <Button
              size="sm"
              variant={source === 'whatsapp' ? 'default' : 'outline'}
              onClick={() => setSource('whatsapp')}
              className={source === 'whatsapp' ? 'bg-green-600' : ''}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              WhatsApp
            </Button>
            <Button
              size="sm"
              variant={source === 'call' ? 'default' : 'outline'}
              onClick={() => setSource('call')}
              className={source === 'call' ? 'bg-blue-600' : ''}
            >
              Ligação
            </Button>
          </div>

          {/* Text Input */}
          <Textarea
            placeholder={`Cole aqui o conteúdo do ${source === 'email' ? 'email' : source === 'whatsapp' ? 'chat WhatsApp' : 'resumo da ligação'}...\n\nA IA vai analisar e criar tarefas automaticamente!`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="bg-white"
          />

          {/* Process Button */}
          <Button
            onClick={processInteraction}
            disabled={processing || !text.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando IA...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Processar e Criar Tarefas
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="bg-white border-purple-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Análise Completa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sentiment & Outcome */}
            <div className="flex gap-2">
              <Badge className={getSentimentColor(result.analysis.sentiment)}>
                {result.analysis.sentiment}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                {getOutcomeIcon(result.analysis.interaction_outcome)}
                {result.analysis.interaction_outcome}
              </Badge>
              <Badge className={
                result.analysis.urgency_level === 'alta' ? 'bg-red-100 text-red-700' :
                result.analysis.urgency_level === 'media' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }>
                {result.analysis.urgency_level}
              </Badge>
            </div>

            {/* Key Points */}
            {result.analysis.key_points?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2">📌 Pontos Chave:</p>
                <ul className="text-sm space-y-1">
                  {result.analysis.key_points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-purple-600">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tasks Created */}
            {result.automation_applied.tasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2">✅ Tarefas Criadas ({result.tasks_created}):</p>
                <div className="space-y-2">
                  {result.automation_applied.tasks.map((task) => (
                    <Card key={task.id} className="bg-green-50 border-green-200 p-2">
                      <p className="text-sm font-semibold text-green-900">{task.title}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Next Action */}
            {result.automation_applied.next_action && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs font-semibold text-purple-900 mb-1">🎯 Próxima Ação:</p>
                <p className="text-sm text-purple-700">{result.automation_applied.next_action}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}