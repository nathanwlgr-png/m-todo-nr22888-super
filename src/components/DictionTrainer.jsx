import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Play, RotateCcw, BookOpen, Sparkles, TrendingUp, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { addPhilosophicalEnding } from './PhilosophicalQuotes';

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
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const currentExercise = DICTION_EXERCISES[selectedExercise];
  const currentPhrase = currentExercise.phrases[currentPhraseIdx];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setIsRecording(false);
        
        stream.getTracks().forEach(track => track.stop());
        toast.success('Gravação salva!');
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        setEvaluation(null);
      };

      mediaRecorder.start();
      toast.success('Gravação iniciada - leia a frase!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Permita acesso ao microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const evaluateRecording = async () => {
    if (!audioBlob) {
      toast.error('Grave primeiro!');
      return;
    }

    setEvaluating(true);
    try {
      // Upload áudio
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });

      // Avaliar com IA
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta gravação de voz e avalie a dicção, clareza e apresentação.

EXERCÍCIO: ${currentExercise.title}
FRASE ALVO: "${currentPhrase}"

CRITÉRIOS DE AVALIAÇÃO:
1. Clareza (0-25 pontos): Articulação, pronúncia correta
2. Ritmo (0-25 pontos): Velocidade adequada, pausas
3. Tom/Entonação (0-25 pontos): Variação, ênfase, confiança
4. Profissionalismo (0-25 pontos): Postura vocal, credibilidade

Avalie de forma construtiva mas honesta. Dê nota geral de 0-100 e feedback específico.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            nota_geral: { type: "number" },
            clareza_pontos: { type: "number" },
            ritmo_pontos: { type: "number" },
            tom_pontos: { type: "number" },
            profissionalismo_pontos: { type: "number" },
            pontos_fortes: { type: "array", items: { type: "string" } },
            pontos_melhorar: { type: "array", items: { type: "string" } },
            dicas_especificas: { type: "array", items: { type: "string" } },
            comparacao_ideal: { type: "string" },
            proximos_passos: { type: "array", items: { type: "string" } }
          }
        }
      });

      setEvaluation(result);
      toast.success(addPhilosophicalEnding('Avaliação completa, Nathan!'));
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao avaliar: ' + error.message);
    } finally {
      setEvaluating(false);
    }
  };

  const playRecording = () => {
    if (audioURL) {
      const audio = new Audio(audioURL);
      audio.play();
    }
  };

  const playPhrase = () => {
    const utterance = new SpeechSynthesisUtterance(currentPhrase);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const nextPhrase = () => {
    setAudioBlob(null);
    setAudioURL(null);
    setEvaluation(null);
    
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
              Ouvir Frase
            </Button>
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              size="sm"
              className={isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-violet-600 hover:bg-violet-700'}
              disabled={evaluating}
            >
              <Mic className="w-4 h-4 mr-1" />
              {isRecording ? 'Parar' : 'Gravar Voz'}
            </Button>
            {audioURL && (
              <Button
                onClick={playRecording}
                size="sm"
                variant="outline"
                className="border-green-300 text-green-700"
              >
                <Play className="w-4 h-4 mr-1" />
                Ouvir Gravação
              </Button>
            )}
          </div>

          {/* Botão de Avaliação */}
          {audioBlob && !evaluation && (
            <div className="mb-4">
              <Button
                onClick={evaluateRecording}
                disabled={evaluating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {evaluating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Avaliando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Avaliar Minha Dicção
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Resultado da Avaliação */}
          {evaluation && (
            <div className="mb-4 space-y-3">
              {/* Nota Geral */}
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-300">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-amber-900">📊 Nota Geral</p>
                  <Badge className={
                    evaluation.nota_geral >= 80 ? 'bg-green-600' :
                    evaluation.nota_geral >= 60 ? 'bg-yellow-600' :
                    'bg-orange-600'
                  }>
                    {evaluation.nota_geral}/100
                  </Badge>
                </div>
                <Progress value={evaluation.nota_geral} className="h-3" />
              </div>

              {/* Detalhamento */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="font-semibold text-blue-900">Clareza</p>
                  <p className="text-blue-700 text-lg font-bold">{evaluation.clareza_pontos}/25</p>
                </div>
                <div className="p-2 bg-purple-50 rounded border border-purple-200">
                  <p className="font-semibold text-purple-900">Ritmo</p>
                  <p className="text-purple-700 text-lg font-bold">{evaluation.ritmo_pontos}/25</p>
                </div>
                <div className="p-2 bg-pink-50 rounded border border-pink-200">
                  <p className="font-semibold text-pink-900">Tom</p>
                  <p className="text-pink-700 text-lg font-bold">{evaluation.tom_pontos}/25</p>
                </div>
                <div className="p-2 bg-green-50 rounded border border-green-200">
                  <p className="font-semibold text-green-900">Profiss.</p>
                  <p className="text-green-700 text-lg font-bold">{evaluation.profissionalismo_pontos}/25</p>
                </div>
              </div>

              {/* Pontos Fortes */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-300">
                <p className="text-xs font-bold text-green-900 mb-2 flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  ✅ Pontos Fortes
                </p>
                <ul className="space-y-1">
                  {evaluation.pontos_fortes?.map((ponto, i) => (
                    <li key={i} className="text-xs text-green-700">• {ponto}</li>
                  ))}
                </ul>
              </div>

              {/* Pontos a Melhorar */}
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-300">
                <p className="text-xs font-bold text-orange-900 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  🎯 Pontos a Melhorar
                </p>
                <ul className="space-y-1">
                  {evaluation.pontos_melhorar?.map((ponto, i) => (
                    <li key={i} className="text-xs text-orange-700">• {ponto}</li>
                  ))}
                </ul>
              </div>

              {/* Dicas Específicas */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-300">
                <p className="text-xs font-bold text-blue-900 mb-2">💡 Dicas Específicas</p>
                <ul className="space-y-1">
                  {evaluation.dicas_especificas?.map((dica, i) => (
                    <li key={i} className="text-xs text-blue-700">• {dica}</li>
                  ))}
                </ul>
              </div>

              {/* Próximos Passos */}
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-300">
                <p className="text-xs font-bold text-purple-900 mb-2">🚀 Próximos Passos</p>
                <ul className="space-y-1">
                  {evaluation.proximos_passos?.map((passo, i) => (
                    <li key={i} className="text-xs text-purple-700">• {passo}</li>
                  ))}
                </ul>
              </div>

              {/* Comparação com Ideal */}
              {evaluation.comparacao_ideal && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-300">
                  <p className="text-xs font-bold text-amber-900 mb-1">🎭 Comparação com Ideal</p>
                  <p className="text-xs text-amber-700">{evaluation.comparacao_ideal}</p>
                </div>
              )}
            </div>
          )}

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