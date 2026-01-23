import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Copy, Zap, Sparkles, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppCommandHub() {
  const [copied, setCopied] = useState('');

  const commands = [
    {
      titulo: 'Buscar Cliente',
      comando: 'Buscar cliente [NOME]',
      exemplo: 'Buscar cliente João Silva',
      descricao: 'Retorna análise completa do cliente',
      cor: 'bg-blue-500'
    },
    {
      titulo: 'Top Clientes',
      comando: 'Top clientes quentes',
      exemplo: 'Top clientes quentes',
      descricao: 'Lista 5 clientes mais quentes',
      cor: 'bg-red-500'
    },
    {
      titulo: 'Relatório Vendas',
      comando: 'Relatório vendas mês',
      exemplo: 'Relatório vendas mês',
      descricao: 'Resumo executivo do mês',
      cor: 'bg-green-500'
    },
    {
      titulo: 'Próximas Visitas',
      comando: 'Minhas visitas hoje',
      exemplo: 'Minhas visitas hoje',
      descricao: 'Lista visitas agendadas',
      cor: 'bg-purple-500'
    },
    {
      titulo: 'Criar Lead',
      comando: 'Novo lead [NOME] [EMPRESA] [TELEFONE]',
      exemplo: 'Novo lead Maria Pet Center 11999999999',
      descricao: 'Cria lead rapidamente',
      cor: 'bg-orange-500'
    },
    {
      titulo: 'Análise IA',
      comando: 'Analisar cliente [NOME]',
      exemplo: 'Analisar cliente Pedro',
      descricao: 'Análise profunda com IA',
      cor: 'bg-indigo-500'
    }
  ];

  const copyCommand = (comando) => {
    navigator.clipboard.writeText(comando);
    setCopied(comando);
    toast.success('Comando copiado!');
    setTimeout(() => setCopied(''), 2000);
  };

  const openWhatsApp = () => {
    const message = `Olá! Comandos disponíveis:\n\n${commands.map(c => `• ${c.comando}`).join('\n')}`;
    window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            Central de Comandos WhatsApp
          </CardTitle>
          <Button
            onClick={openWhatsApp}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Phone className="w-4 h-4 mr-1" />
            Abrir
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-3">
          <p className="text-xs text-yellow-700">
            <Zap className="w-4 h-4 inline mr-1" />
            <strong>Controle tudo via WhatsApp!</strong> Copie os comandos e envie para o bot.
          </p>
        </div>

        {commands.map((cmd, i) => (
          <div
            key={i}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-green-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cmd.cor}`} />
                <p className="font-semibold text-sm text-slate-800">{cmd.titulo}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyCommand(cmd.exemplo)}
                className="h-6 px-2"
              >
                {copied === cmd.exemplo ? (
                  <span className="text-xs text-green-600">✓</span>
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
            
            <div className="bg-slate-50 p-2 rounded font-mono text-xs text-slate-700 mb-2">
              {cmd.comando}
            </div>
            
            <p className="text-xs text-slate-500">{cmd.descricao}</p>
            <p className="text-xs text-slate-400 mt-1">Ex: {cmd.exemplo}</p>
          </div>
        ))}

        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 mt-0.5" />
            <p className="text-xs text-purple-700">
              <strong>IA Integrada:</strong> O bot usa IA para entender comandos naturais. 
              Pode falar como quiser que ele entende!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}