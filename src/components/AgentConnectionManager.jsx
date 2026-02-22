import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function AgentConnectionManager() {
  const [agents, setAgents] = useState([
    {
      id: 'whatsapp_nr22888_turbo',
      name: '🤖 NR22888 TURBO Master',
      description: 'Assistente de vendas com 22 IAs',
      status: 'desconectado',
      whatsappUrl: null,
      type: 'whatsapp'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  // Get WhatsApp connection URL
  const connectAgent = async (agentId) => {
    try {
      setLoading(true);
      const url = base44.agents.getWhatsAppConnectURL(agentId);
      
      setAgents(agents.map(a => 
        a.id === agentId ? { ...a, whatsappUrl: url, status: 'conectado' } : a
      ));
      
      toast.success('Link de conexão gerado!');
    } catch (error) {
      toast.error('Erro ao gerar link');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Link copiado!');
  };

  const openWhatsApp = (url) => {
    window.open(url, '_blank');
  };

  useEffect(() => {
    // Auto-load agents on mount
    agents.forEach(agent => {
      if (!agent.whatsappUrl) {
        connectAgent(agent.id);
      }
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900 mb-1">🔗 Gerenciador de Agentes</h2>
        <p className="text-sm text-slate-600">Conecte e gerencie seus assistentes de vendas por WhatsApp</p>
      </div>

      <div className="grid gap-4">
        {agents.map(agent => (
          <Card key={agent.id} className={agent.status === 'conectado' ? 'border-green-200' : 'border-yellow-200'}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{agent.name}</CardTitle>
                <Badge className={agent.status === 'conectado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                  {agent.status === 'conectado' ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Conectado</>
                  ) : (
                    <><AlertCircle className="w-3 h-3 mr-1" /> Desconectado</>
                  )}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1">{agent.description}</p>
            </CardHeader>

            <CardContent className="space-y-3">
              {agent.whatsappUrl && (
                <div className="space-y-2">
                  {/* Connection Link */}
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-2">Link de Conexão:</p>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 flex items-center justify-between gap-2">
                      <code className="text-[10px] text-slate-700 truncate flex-1">
                        {agent.whatsappUrl.substring(0, 50)}...
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => copyToClipboard(agent.whatsappUrl, agent.id)}
                      >
                        {copied === agent.id ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-[10px]">
                    <p className="font-semibold text-blue-900 mb-2">📱 Como Conectar:</p>
                    <ol className="space-y-1 text-blue-800 list-decimal list-inside">
                      <li>Clique no botão "Abrir no WhatsApp" abaixo</li>
                      <li>Envie a mensagem sugerida ao agente</li>
                      <li>Aguarde confirmação de ativação</li>
                      <li>Use o comando <code className="bg-blue-100 px-1 rounded">/start</code> para começar</li>
                    </ol>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => openWhatsApp(agent.whatsappUrl)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 h-9 text-sm"
                    >
                      <LinkIcon className="w-3 h-3 mr-2" />
                      Abrir no WhatsApp
                    </Button>
                    <Button
                      onClick={() => connectAgent(agent.id)}
                      disabled={loading}
                      variant="outline"
                      className="h-9"
                    >
                      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : '🔄'}
                    </Button>
                  </div>
                </div>
              )}

              {!agent.whatsappUrl && (
                <div className="text-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Gerando link...</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Commands */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">⚡ Comandos Rápidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-[10px] text-purple-800 font-semibold mb-2">Após conectar, envie estes comandos ao bot:</p>
          <div className="space-y-1 text-[10px]">
            <div className="bg-white/50 rounded p-1.5"><code className="font-mono text-purple-700">/start</code> — Iniciar</div>
            <div className="bg-white/50 rounded p-1.5"><code className="font-mono text-purple-700">/help</code> — Listar todos os comandos</div>
            <div className="bg-white/50 rounded p-1.5"><code className="font-mono text-purple-700">/analise [cliente]</code> — Analisar cliente</div>
            <div className="bg-white/50 rounded p-1.5"><code className="font-mono text-purple-700">/pipeline</code> — Ver pipeline</div>
            <div className="bg-white/50 rounded p-1.5"><code className="font-mono text-purple-700">/disconnect</code> — Desconectar</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}