import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Copy, 
  CheckCircle2,
  Smartphone,
  Zap,
  Bot,
  QrCode
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Integração do Bot WhatsApp
 * Conecta e gerencia o chatbot WhatsApp com todos os módulos de IA
 */
export default function WhatsAppBotIntegration() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState(null);
  const [testing, setTesting] = useState(false);

  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/api/functions/whatsappBot`;
    navigator.clipboard.writeText(url);
    setWebhookUrl(url);
    toast.success('URL copiada! Cole no webhook do WhatsApp Business API');
  };

  const testBot = async () => {
    if (!testMessage.trim()) {
      toast.error('Digite uma mensagem de teste');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/functions/whatsappBot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          from: 'test_user'
        })
      });

      const data = await response.json();
      setTestResponse(data);
      toast.success('Teste enviado!');
    } catch (error) {
      toast.error('Erro ao testar bot');
      console.error(error);
    } finally {
      setTesting(false);
    }
  };

  const commands = [
    { cmd: 'buscar [nome]', desc: 'Buscar cliente no CRM', icon: '🔍' },
    { cmd: 'playbook [nome]', desc: 'Gerar playbook de vendas', icon: '🎯' },
    { cmd: 'performance', desc: 'Ver performance da equipe', icon: '📊' },
    { cmd: 'quentes', desc: 'Listar clientes quentes', icon: '🔥' },
    { cmd: 'tarefas', desc: 'Ver tarefas pendentes', icon: '✅' },
    { cmd: 'resumo', desc: 'Resumo do dia', icon: '📅' },
    { cmd: 'ajuda', desc: 'Ver todos os comandos', icon: '💬' }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800">Assistente WhatsApp Master</h3>
            <p className="text-xs text-green-700">Bot inteligente com acesso total aos módulos de IA</p>
          </div>
          <Badge className="bg-green-600 text-white">
            <Zap className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        </div>

        <div className="bg-white rounded-lg p-3 border border-green-200">
          <p className="text-xs font-semibold text-slate-700 mb-2">🔗 URL do Webhook:</p>
          <div className="flex gap-2">
            <Input
              value={webhookUrl || `${window.location.origin}/api/functions/whatsappBot`}
              readOnly
              className="text-xs"
            />
            <Button
              onClick={copyWebhookUrl}
              variant="outline"
              size="sm"
              className="border-green-300"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            💡 Cole esta URL no WhatsApp Business API ou Twilio
          </p>
        </div>
      </Card>

      {/* Comandos */}
      <Card className="p-4">
        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-600" />
          Comandos Disponíveis
        </h4>
        <div className="space-y-2">
          {commands.map((cmd, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start gap-2">
                <span className="text-lg">{cmd.icon}</span>
                <div className="flex-1">
                  <code className="text-xs font-mono bg-green-100 text-green-800 px-2 py-1 rounded">
                    {cmd.cmd}
                  </code>
                  <p className="text-xs text-slate-600 mt-1">{cmd.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Teste do Bot */}
      <Card className="p-4 bg-blue-50 border-blue-300">
        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Testar Bot
        </h4>
        <div className="space-y-2">
          <Input
            placeholder="Digite uma mensagem de teste (ex: ajuda)"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && testBot()}
          />
          <Button
            onClick={testBot}
            disabled={testing}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {testing ? 'Testando...' : 'Enviar Teste'}
          </Button>

          {testResponse && (
            <div className="p-3 bg-white rounded-lg border border-blue-200 mt-3">
              <p className="text-xs font-semibold text-blue-800 mb-2">📱 Resposta do Bot:</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {testResponse.message}
              </p>
              {testResponse.success && (
                <Badge className="mt-2 bg-green-100 text-green-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Sucesso
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Setup Guide */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300">
        <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Como Conectar
        </h4>
        <ol className="space-y-2 text-sm text-slate-700">
          <li className="flex gap-2">
            <span className="font-bold text-purple-600">1.</span>
            <span>Crie conta no WhatsApp Business API ou Twilio</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-purple-600">2.</span>
            <span>Copie a URL do webhook acima</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-purple-600">3.</span>
            <span>Cole no campo "Webhook URL" da plataforma</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-purple-600">4.</span>
            <span>Configure método POST</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-purple-600">5.</span>
            <span>Teste enviando "ajuda" pelo WhatsApp!</span>
          </li>
        </ol>
      </Card>

      {/* Features */}
      <Card className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50">
        <h4 className="font-bold text-indigo-900 mb-3">✨ Recursos Integrados</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Busca de Clientes', icon: '🔍' },
            { label: 'Playbook IA', icon: '🎯' },
            { label: 'Performance Equipe', icon: '📊' },
            { label: 'Tarefas', icon: '✅' },
            { label: 'Clientes Quentes', icon: '🔥' },
            { label: 'Resumos', icon: '📅' },
            { label: 'Análise SPIN', icon: '🎪' },
            { label: 'Coaching', icon: '🏆' }
          ].map((feature, i) => (
            <div key={i} className="p-2 bg-white rounded border border-indigo-200 text-center">
              <span className="text-lg">{feature.icon}</span>
              <p className="text-xs text-slate-700 font-medium">{feature.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}