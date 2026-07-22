import { useEffect, useRef, useState } from 'react';

export default function useVoiceInput(onTranscript) {
  const recognition = useRef(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const instance = new SpeechRecognition();
    instance.lang = 'pt-BR';
    instance.continuous = false;
    instance.interimResults = false;
    instance.onresult = (event) => onTranscript(event.results[0][0].transcript);
    instance.onerror = () => { setError('Não consegui ouvir. Digite o pedido abaixo.'); setListening(false); };
    instance.onend = () => setListening(false);
    recognition.current = instance;
    return () => instance.abort();
  }, [onTranscript]);

  const toggle = () => {
    setError('');
    if (!recognition.current) return setError('Reconhecimento de voz indisponível neste navegador.');
    if (listening) recognition.current.stop();
    else { recognition.current.start(); setListening(true); }
  };

  return { listening, error, toggle };
}