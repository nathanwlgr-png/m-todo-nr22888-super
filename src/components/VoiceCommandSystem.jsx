import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Sistema de Comando de Voz Avançado
 * Ativa com "NR" e executa com "executar"
 */
export default function VoiceCommandSystem() {
  const [listening, setListening] = useState(false);
  const [activated, setActivated] = useState(false);
  const [command, setCommand] = useState('');
  const [executing, setExecuting] = useState(false);
  const recognitionRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')
          .toLowerCase();

        // Detectar palavra de ativação "NR"
        if (transcript.includes('nr') || transcript.includes('ener')) {
          setActivated(true);
          setCommand('');
          toast.success('🎤 IA ativada! Diga seu comando...', {
            description: 'Finalize com "executar"'
          });
        }

        // Se ativado, capturar comando
        if (activated) {
          if (transcript.includes('executar')) {
            executeCommand(command);
            setActivated(false);
            setCommand('');
          } else {
            setCommand(transcript);
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          toast.info('Nenhuma fala detectada');
        }
      };

      recognitionRef.current.onend = () => {
        if (listening) {
          recognitionRef.current.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [listening, activated, command]);

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setActivated(false);
      toast.info('Comando de voz desativado');
    } else {
      recognitionRef.current?.start();
      setListening(true);
      toast.success('🎤 Escutando... Diga "NR" para ativar');
    }
  };

  const executeCommand = async (cmd) => {
    setExecuting(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é uma IA executora de comandos de vendas. Execute este comando:

"${cmd}"

Analise e retorne JSON com:
{
  "action": "criar_tarefa|ligar_cliente|enviar_mensagem|atualizar_status|criar_visita|gerar_relatorio|outro",
  "parameters": {
    "client_name": "nome do cliente (se mencionado)",
    "task_title": "título da tarefa",
    "description": "descrição detalhada",
    "priority": "alta|media|baixa",
    "date": "YYYY-MM-DD"
  },
  "confirmation": "Mensagem de confirmação clara do que será feito"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            action: { type: "string" },
            parameters: { 
              type: "object",
              properties: {
                client_name: { type: "string" },
                task_title: { type: "string" },
                description: { type: "string" },
                priority: { type: "string" },
                date: { type: "string" }
              }
            },
            confirmation: { type: "string" }
          }
        }
      });

      // Executar ação
      if (result.action === 'criar_tarefa') {
        await base44.entities.Task.create({
          title: result.parameters.task_title,
          description: result.parameters.description,
          priority: result.parameters.priority || 'media',
          due_date: result.parameters.date || new Date().toISOString().split('T')[0],
          auto_created: true
        });
        queryClient.invalidateQueries(['all-tasks']);
      }

      toast.success('✅ Comando executado!', {
        description: result.confirmation,
        duration: 5000
      });

    } catch (error) {
      console.error('Erro ao executar comando:', error);
      toast.error('Erro ao executar comando');
    } finally {
      setExecuting(false);
    }
  };

  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 border-purple-700">
      <div className="flex items-center gap-3">
        <Button
          onClick={toggleListening}
          size="lg"
          className={listening ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}
        >
          {listening ? (
            <><MicOff className="w-5 h-5 mr-2" /> Parar</>
          ) : (
            <><Mic className="w-5 h-5 mr-2" /> Ativar Voz</>
          )}
        </Button>
        
        <div className="flex-1">
          {listening && (
            <div className="space-y-1">
              <p className="text-xs text-purple-200">
                {activated ? '🔥 ATIVADA - Comando capturado' : '👂 Escutando... Diga "NR"'}
              </p>
              {command && (
                <p className="text-sm text-white font-medium">{command}</p>
              )}
            </div>
          )}
          {executing && (
            <div className="flex items-center text-yellow-300">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">Executando...</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}