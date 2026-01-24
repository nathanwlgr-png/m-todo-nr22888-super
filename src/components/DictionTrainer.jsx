import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Play, RotateCcw, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const DICTION_EXERCISES = [
  {
    title: 'Entonação Persuasiva',
    phrases: [
      'Este equipamento vai transformar sua clínica',
      'Você vai economizar 40% em tempo',
      'Vamos agendar uma demonstração sem compromisso',
      'Qualidade superior com menor custo'
    ]
  },
  {
    title: 'Velocidade de Fala',
    phrases: [
      'Olá, tudo bem? Tenho uma oportunidade especial para sua clínica.',
      'Nosso equipamento foi escolhido por 500 clínicas no Brasil.',
      'Reduz o tempo de diagnóstico em até 50% e aumenta a receita.',
      'Gostaria de agendar uma conversa para detalhar os benefícios?'
    ]
  },
  {
    title: 'Clareza Articulada',
    phrases: [
      'V-E-T-E-R-I-N-Á-R-I-A',
      'H-E-M-O-G-R-A-M-A',
      'D-I-A-G-N-Ó-S-T-I-C-O',
      'P-R-O-PO-S-T-A C-O-M-E-R-C-I-A-L'
    ]
  },
  {
    title: 'Tom Profissional',
    phrases: [
      'Bom dia, meu nome é [SEU NOME], trabalho com equipamentos veterinários.',
      'Posso oferecer uma solução que resolveria seus principais desafios?',
      'Baseado no meu conhecimento do seu mercado, recomendo...',
      'Vamos conversar sobre como maximizar seus lucros?'
    ]
  },
  {
    title: 'Gatilho de Urgência',
    phrases: [
      'Esta promoção é válida apenas até o final do mês.',
      'Apenas 3 clínicas ainda podem aproveitar este desconto.',
      'Preciso de uma resposta até amanhã para reservar sua unidade.',
      'Não quero que perca essa oportunidade exclusiva.'
    ]
  }
];

export default function DictionTrainer() {
  const [selectedExercise, setSelectedExercise] = useState(0);
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);

  const currentExercise = DICTION_EXERCISES[selectedExercise];
  const currentPhrase = currentExercise.phrases[currentPhraseIdx];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.onstart = () => setIsRecording(true);
      mediaRecorder.onstop = () => setIsRecording(false);

      mediaRecorder.start();
      toast.success('Gravação iniciada - leia a frase!');
    } catch (error) {
      toast.error('Permita acesso ao microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      toast.success('Gravação salva! Analise sua dicção.');
    }
  };

  const playPhrase = () => {
    const utterance = new SpeechSynthesisUtterance(currentPhrase);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const nextPhrase = () => {
    if (currentPhraseIdx < currentExercise.phrases.length - 1) {
      setCurrentPhraseIdx(currentPhraseIdx + 1);
    } else {
      toast.success('Parabéns! Você completou este exercício!');
      setCurrentPhraseIdx(0);
    }
  };

  const prevPhrase = () => {
    if (currentPhraseIdx > 0) {
      setCurrentPhraseIdx(currentPhraseIdx - 1);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
          <Mic className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-violet-900">🎤 Treinador de Dicção</p>
          <p className="text-xs text-violet-600">Melhore sua comunicação com exercícios práticos</p>
        </div>
      </div>

      {/* Seleção de Exercício */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {DICTION_EXERCISES.map((exercise, idx) => (
          <Button
            key={idx}
            onClick={() => {
              setSelectedExercise(idx);
              setCurrentPhraseIdx(0);
            }}
            variant={selectedExercise === idx ? 'default' : 'outline'}
            className={`whitespace-nowrap ${selectedExercise === idx ? 'bg-violet-600' : ''}`}
            size="sm"
          >
            {exercise.title}
          </Button>
        ))}
      </div>

      {/* Exercício Atual */}
      <div className="p-4 bg-white rounded-lg border-2 border-violet-200 mb-4">
        <div className="text-center mb-4">
          <p className="text-xs text-violet-600 font-semibold mb-2">
            Exercício: {currentExercise.title}
          </p>
          <Badge className="bg-violet-100 text-violet-700 mb-3">
            {currentPhraseIdx + 1} de {currentExercise.phrases.length}
          </Badge>

          <div className="p-4 bg-violet-50 rounded-lg border-2 border-violet-300 mb-4">
            <p className="text-lg font-bold text-violet-900">"{currentPhrase}"</p>
          </div>

          {/* Controles */}
          <div className="flex gap-2 justify-center mb-4">
            <Button
              onClick={playPhrase}
              size="sm"
              variant="outline"
              className="border-violet-300"
            >
              <Play className="w-4 h-4 mr-1" />
              Ouvir
            </Button>
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              size="sm"
              className={isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700'}
            >
              <Mic className="w-4 h-4 mr-1" />
              {isRecording ? 'Parar' : 'Gravar'}
            </Button>
          </div>

          {/* Navegação */}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={prevPhrase}
              disabled={currentPhraseIdx === 0}
              variant="outline"
              size="sm"
            >
              ← Anterior
            </Button>
            <Button
              onClick={nextPhrase}
              className="bg-violet-600 hover:bg-violet-700"
              size="sm"
            >
              Próxima →
            </Button>
          </div>
        </div>
      </div>

      {/* Dicas de Dicção */}
      <div className="p-3 bg-violet-100 rounded-lg border-2 border-violet-300 text-xs">
        <p className="font-bold text-violet-900 mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          💡 Dicas para Este Exercício
        </p>
        <ul className="space-y-1 text-violet-800">
          {selectedExercise === 0 && (
            <>
              <li>✓ Use pausas estratégicas para enfatizar pontos importantes</li>
              <li>✓ Varie o tom - não seja monotônico</li>
              <li>✓ Termine com tons ascendentes quando for uma pergunta</li>
            </>
          )}
          {selectedExercise === 1 && (
            <>
              <li>✓ Comece lentamente, depois aumente gradualmente</li>
              <li>✓ Mantenha ritmo constante - nem muito rápido nem muito lento</li>
              <li>✓ Pronuncie claramente cada sílaba</li>
            </>
          )}
          {selectedExercise === 2 && (
            <>
              <li>✓ Articule cada letra com precisão</li>
              <li>✓ Use os lábios e a língua corretamente</li>
              <li>✓ Palavras técnicas: reduza velocidade, aumente clareza</li>
            </>
          )}
          {selectedExercise === 3 && (
            <>
              <li>✓ Mantenha tom seguro e confiante</li>
              <li>✓ Evite sons nasalizados</li>
              <li>✓ Projete sua voz com confiança</li>
            </>
          )}
          {selectedExercise === 4 && (
            <>
              <li>✓ Aumente sutilmente a intensidade</li>
              <li>✓ Use pausas para criar suspense</li>
              <li>✓ Termine com certeza - sem dúvida na voz</li>
            </>
          )}
        </ul>
      </div>
    </Card>
  );
}