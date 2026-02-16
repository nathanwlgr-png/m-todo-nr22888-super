import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { 
  MessageSquare, Search, Zap, Target, BarChart3, 
  Navigation, Phone, Mail, FileText, Users, Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

const MASTER_COMMANDS = {
  'BUSCA_COMPLETA': {
    name: 'Busca Completa',
    description: 'Análise 360° do cliente: histórico, scores, próximas ações',
    icon: Search,
    color: 'bg-blue-100 text-blue-700',
    action: 'busca_completa'
  },
  'TURBO_VENDA': {
    name: 'Turbo Venda',
    description: 'Mensagem de impacto + argumentação científica + gatilho ético',
    icon: Zap,
    color: 'bg-orange-100 text-orange-700',
    action: 'turbo_venda'
  },
  'CONQUISTAR': {
    name: 'Conquistar',
    description: 'Abertura de primeiro contato + diferenciação + proposta irrecusável',
    icon: Target,
    color: 'bg-pink-100 text-pink-700',
    action: 'conquistar'
  },
  'ANALISE_PROFUNDA': {
    name: 'Análise Profunda',
    description: 'Sentimento + objeções + dores + motivadores + estratégia',
    icon: BarChart3,
    color: 'bg-purple-100 text-purple-700',
    action: 'analise_profunda'
  },
  'ROTA_OTIMIZADA': {
    name: 'Rota Otimizada',
    description: 'Calcular melhor rota para dia + 6 clínicas + cronograma',
    icon: Navigation,
    color: 'bg-green-100 text-green-700',
    action: 'rota_otimizada'
  },
  'CONTATO_QUENTE': {
    name: 'Contato Quente',
    description: 'Ligar ou enviar WhatsApp com contexto completo do cliente',
    icon: Phone,
    color: 'bg-red-100 text-red-700',
    action: 'contato_quente'
  },
  'PROPOSTA_PERSONALIZAVEL': {
    name: 'Proposta Personalizada',
    description: 'Gerar proposta científica + ROI + diferencial competitivo',
    icon: FileText,
    color: 'bg-indigo-100 text-indigo-700',
    action: 'proposta_personalizavel'
  },
  'COACHING_INSTANTANEO': {
    name: 'Coaching Instantâneo',
    description: 'Análise de conversa + feedback + melhores práticas aplicáveis',
    icon: Lightbulb,
    color: 'bg-yellow-100 text-yellow-700',
    action: 'coaching_instantaneo'
  },
  'SINCRONIZAR_LEADS': {
    name: 'Sincronizar Leads',
    description: 'Importar leads do WhatsApp + CRM + segmentação automática',
    icon: Users,
    color: 'bg-teal-100 text-teal-700',
    action: 'sincronizar_leads'
  },
  'EMAIL_INTELIGENTE': {
    name: 'Email Inteligente',
    description: 'Gerar email de follow-up personalizado + timeline + gatilho',
    icon: Mail,
    color: 'bg-cyan-100 text-cyan-700',
    action: 'email_inteligente'
  }
};

export default function WhatsAppMasterCommands({ clientId, clientName }) {
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [executing, setExecuting] = useState(false);

  const executeCommand = async (commandKey) => {
    setExecuting(true);
    try {
      const command = MASTER_COMMANDS[commandKey];
      
      // Simular execução - em produção seria uma função backend
      const result = await base44.functions.invoke('executeMasterCommand', {
        command: commandKey,
        clientId,
        clientName
      });

      toast.success(`${command.name} executado com sucesso!`);
      setSelectedCommand(commandKey);
    } catch (error) {
      toast.error(`Erro ao executar ${MASTER_COMMANDS[commandKey].name}`);
      console.error(error);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-bold text-slate-800">Master Command Center</h3>
            <p className="text-xs text-slate-600">Comandos nomeados para WhatsApp integrado</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(MASTER_COMMANDS).map(([key, cmd]) => {
          const Icon = cmd.icon;
          return (
            <Button
              key={key}
              onClick={() => executeCommand(key)}
              disabled={executing}
              variant="outline"
              className={`h-auto p-4 justify-start flex flex-col items-start ${cmd.color}`}
            >
              <div className="flex items-start gap-3 w-full">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm">{cmd.name}</p>
                  <p className="text-xs opacity-80 mt-1">{cmd.description}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {key}
                  </Badge>
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      {selectedCommand && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Último comando:</strong> {MASTER_COMMANDS[selectedCommand].name}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Você pode usar este comando direto no WhatsApp digitando: <code>/{selectedCommand}</code>
          </p>
        </Card>
      )}
    </div>
  );
}