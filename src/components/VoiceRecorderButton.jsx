import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceRecorderButton({ onTranscript, size = "default", variant = "outline", className = "" }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'pt-BR';

      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        if (onTranscript) {
          onTranscript(transcript);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          toast.error('Permissão de microfone negada');
        } else {
          toast.error('Erro no reconhecimento de voz');
        }
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    } else {
      console.warn('Speech recognition not supported');
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      toast.error('Reconhecimento de voz não suportado neste navegador');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      toast.success('Gravação finalizada');
    } else {
      recognition.start();
      setIsRecording(true);
      toast.success('🎤 Gravando... Fale agora');
    }
  };

  if (!recognition) {
    return null;
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={toggleRecording}
      className={`${isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : ''} ${className}`}
    >
      {isRecording ? (
        <>
          <MicOff className="w-4 h-4" />
          {size !== "icon" && <span className="ml-2">Parar</span>}
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" />
          {size !== "icon" && <span className="ml-2">Gravar</span>}
        </>
      )}
    </Button>
  );
}