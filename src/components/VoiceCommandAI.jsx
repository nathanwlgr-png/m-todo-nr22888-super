import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Mic, Volume2 } from 'lucide-react';

export default function VoiceCommandAI() {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activated, setActivated] = useState(false);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = async (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log('Ouvido:', transcript);

        // Detecta ativação com "NR" ou "Hey NR"
        if (transcript.includes('nr') || transcript.includes('hey nr') || transcript.includes('ei nr')) {
          setActivated(true);
          speak('Sim, estou aqui. O que você precisa?');
          
          // Remove "nr" do comando
          const command = transcript.replace(/nr|hey nr|ei nr/gi, '').trim();
          
          if (command.length > 0) {
            await processCommand(command);
          }
        } else if (activated) {
          // Se já ativado, processa qualquer comando
          await processCommand(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Erro de reconhecimento:', event.error);
        if (event.error === 'no-speech') {
          // Ignora erro de silêncio
          return;
        }
        setListening(false);
      };

      recognitionRef.current.onend = () => {
        // Reinicia automaticamente
        if (listening) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.log('Já está ouvindo');
          }
        }
      };

      // Inicia automaticamente
      startListening();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    try {
      recognitionRef.current?.start();
      setListening(true);
      toast.success('🎤 NR está ouvindo');
    } catch (error) {
      console.log('Já está ouvindo');
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setActivated(false);
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const processCommand = async (command) => {
    setProcessing(true);
    console.log('Processando comando:', command);

    try {
      // Busca contexto atual
      const currentPath = window.location.pathname;
      const clients = await base44.entities.Client.list('-updated_date', 10).catch(() => []);
      
      const contextPrompt = `Você é NR, uma IA assistente pessoal de vendas por comando de voz.

COMANDO DO USUÁRIO: "${command}"

CONTEXTO ATUAL:
- Página atual: ${currentPath}
- Últimos clientes: ${clients.map(c => `${c.first_name} (${c.clinic_name || 'Sem clínica'})`).join(', ')}

CAPACIDADES DISPONÍVEIS:
1. Navegação: "ir para clientes", "abrir perfil do João", "ir para home"
2. Informações: "qual o melhor cliente", "cliente do dia", "quantos clientes quentes", "resumo de vendas"
3. Ações: "enviar WhatsApp para [cliente]", "enviar email para [cliente]", "criar tarefa para [cliente]"
4. Leitura: "ler informações do [cliente]", "ler score de [nome]", "ler notas do [cliente]"

INSTRUÇÕES:
1. Interprete o comando e retorne JSON estruturado
2. Se o comando for ambíguo, sugira ação
3. Se mencionar nome de cliente, tente encontrar nos dados

Retorne:
{
  "action": "navigate|read|send_whatsapp|send_email|create_task|info|search",
  "target": "página ou cliente",
  "message": "resposta verbal para o usuário",
  "data": { /* dados necessários para a ação */ }
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: contextPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            action: { type: "string" },
            target: { type: "string" },
            message: { type: "string" },
            data: { type: "object" }
          }
        }
      });

      console.log('Resultado:', result);

      // Executa ação
      await executeAction(result);

      // Responde verbalmente
      speak(result.message);
      
      // Desativa após executar comando
      setTimeout(() => setActivated(false), 3000);

    } catch (error) {
      console.error('Erro ao processar comando:', error);
      speak('Desculpe, não consegui processar esse comando.');
    } finally {
      setProcessing(false);
    }
  };

  const executeAction = async (result) => {
    const { action, target, data } = result;

    switch (action) {
      case 'navigate':
        const pageMap = {
          'home': 'Home',
          'clientes': 'Clients',
          'tarefas': 'Tasks',
          'agenda': 'TaskCalendar',
          'perfil': data.clientId ? `ClientProfile?id=${data.clientId}` : 'Clients',
          'mapa': 'ClientsMap',
          'vendas': 'SalesAnalytics'
        };
        
        const page = pageMap[target.toLowerCase()] || target;
        navigate(createPageUrl(page));
        toast.success(`Navegando para ${target}`);
        break;

      case 'read':
        // Lê informações
        toast.info(`Lendo informações: ${data.info || target}`);
        break;

      case 'send_whatsapp':
        if (data.phone && data.message) {
          window.open(`https://wa.me/${data.phone}?text=${encodeURIComponent(data.message)}`, '_blank');
          toast.success('Abrindo WhatsApp');
        }
        break;

      case 'send_email':
        if (data.email) {
          window.location.href = `mailto:${data.email}?subject=${encodeURIComponent(data.subject || 'Contato')}&body=${encodeURIComponent(data.message || '')}`;
          toast.success('Abrindo email');
        }
        break;

      case 'create_task':
        if (data.clientId && data.title) {
          await base44.entities.Task.create({
            client_id: data.clientId,
            client_name: data.clientName,
            title: data.title,
            description: data.description,
            type: 'follow_up',
            priority: 'media',
            status: 'pendente'
          });
          toast.success('Tarefa criada');
        }
        break;

      case 'info':
      case 'search':
        // Mostra informação via toast
        toast.info(data.info || 'Informação solicitada');
        break;

      default:
        toast.info('Comando executado');
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => listening ? stopListening() : startListening()}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50 transition-all ${
          listening 
            ? activated
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse scale-110'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600 animate-pulse'
            : 'bg-gradient-to-br from-slate-600 to-slate-700'
        }`}
      >
        {processing ? (
          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
        ) : listening ? (
          activated ? (
            <Volume2 className="w-7 h-7 text-white animate-bounce" />
          ) : (
            <Mic className="w-7 h-7 text-white" />
          )
        ) : (
          <Mic className="w-7 h-7 text-white opacity-50" />
        )}
      </button>

      {/* Indicador de status */}
      {listening && (
        <div className="fixed bottom-24 right-6 bg-black/80 text-white text-xs px-4 py-2 rounded-full z-50">
          {processing ? '⚡ Processando...' : activated ? '🎤 Ouvindo comando' : '👂 Diga "NR"'}
        </div>
      )}
    </>
  );
}