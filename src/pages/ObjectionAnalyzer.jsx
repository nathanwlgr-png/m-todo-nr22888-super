import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import ClientSelector from '@/components/ClientSelector';

export default function ObjectionAnalyzer() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const clientIdFromUrl = urlParams.get('id');

  const [selectedClientId, setSelectedClientId] = useState(clientIdFromUrl || null);
  const [objection, setObjection] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date')
  });

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;
      const clients = await base44.entities.Client.list();
      return clients.find(c => c.id === selectedClientId);
    },
    enabled: !!selectedClientId
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['all-sales'],
    queryFn: () => base44.entities.Sale.list('-created_date', 100)
  });

  const analyzeObjection = async () => {
    setLoading(true);
    try {
      const successCases = sales
        .filter(s => s.status === 'fechada')
        .slice(0, 10)
        .map(s => `Cliente: ${s.client_name}, Equipamento: ${s.equipment_name}, Valor: R$ ${s.sale_value}, Vendedor: ${s.salesperson}`)
        .join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em controle de objeções e persuasão ética.

PERFIL DO CLIENTE:
- Nome: ${client.first_name}
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
- Estilo de Decisão: ${client.decision_style}
- Tom: ${client.client_tone || 'Profissional'}
- Status: ${client.status} | Score: ${client.purchase_score}%

OBJEÇÃO LEVANTADA:
"${objection}"

CASOS DE SUCESSO (APRENDIZADO):
${successCases || 'Nenhum caso disponível'}

FRAMEWORKS:
1. SPIN Selling (Rackham): Transforme objeção em pergunta Implication/Need-Payoff
2. Persuasão (Cialdini): Reciprocidade, Compromisso, Prova Social, Autoridade, Simpatia, Escassez
3. Inteligência Emocional (Goleman): Empatia, reconhecimento, validação emocional
4. Arte da Guerra (Sun Tzu): Timing, estratégia, transformar fraqueza em força

TAREFA:
Analise esta objeção e forneça resposta estruturada em JSON:

{
  "tipo_objecao": "preço | timing | concorrência | confiança | necessidade | outro",
  "gravidade": "baixa | média | alta",
  "raiz_emocional": "Qual o medo/motivação por trás desta objeção",
  "framework_ideal": "Qual framework principal usar (SPIN/Cialdini/Int.Emocional/Arte da Guerra)",
  "respostas": {
    "validacao_empatica": "Primeiro valide a emoção (Int. Emocional)",
    "pergunta_spin": "Pergunta Implication ou Need-Payoff para reframing",
    "argumento_logico": "Argumento racional usando dados/ROI",
    "gatilho_cialdini": "Qual princípio de Cialdini usar e como",
    "prova_social": "Caso de sucesso relevante (se aplicável)"
  },
  "script_completo": "Resposta completa pronta para usar (3-4 frases)",
  "tecnicas_avancadas": ["2-3 técnicas extras para aprofundar"],
  "sinais_compra": ["2-3 sinais que indicam que a objeção foi superada"],
  "proximo_passo": "Ação concreta após controlar a objeção"
}

Baseie-se nos CASOS DE SUCESSO para aprender com vendas anteriores.
Adapte ao perfil NUMEROLÓGICO do cliente.
Seja PRÁTICO, ÉTICO e CONSULTIVO.`,
        response_json_schema: {
          type: "object",
          properties: {
            tipo_objecao: { type: "string" },
            gravidade: { type: "string" },
            raiz_emocional: { type: "string" },
            framework_ideal: { type: "string" },
            respostas: {
              type: "object",
              properties: {
                validacao_empatica: { type: "string" },
                pergunta_spin: { type: "string" },
                argumento_logico: { type: "string" },
                gatilho_cialdini: { type: "string" },
                prova_social: { type: "string" }
              }
            },
            script_completo: { type: "string" },
            tecnicas_avancadas: { type: "array", items: { type: "string" } },
            sinais_compra: { type: "array", items: { type: "string" } },
            proximo_passo: { type: "string" }
          }
        }
      });

      setAnalysis(response);
    } catch (error) {
      alert('Erro ao analisar objeção');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const gravidadeColors = {
    baixa: 'bg-green-100 text-green-700',
    média: 'bg-yellow-100 text-yellow-700',
    alta: 'bg-red-100 text-red-700'
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-900 to-orange-900 px-4 pt-4 pb-20 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Análise de Objeções</h1>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
          <ClientSelector
            clients={allClients}
            selectedClientId={selectedClientId}
            onClientChange={setSelectedClientId}
          />
        </div>
      </div>

      <div className="px-6 -mt-12 space-y-4">
        {/* Input */}
        <Card className="p-4 bg-white">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Qual objeção o cliente levantou?
          </label>
          <Textarea
            value={objection}
            onChange={(e) => setObjection(e.target.value)}
            placeholder='Ex: "Está muito caro" ou "Preciso conversar com meu sócio" ou "Já tenho um fornecedor"'
            className="min-h-[100px]"
          />
          <Button
            onClick={analyzeObjection}
            disabled={loading || !objection.trim()}
            className="w-full mt-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Analisar Objeção
              </>
            )}
          </Button>
        </Card>

        {analysis && (
          <>
            {/* Overview */}
            <Card className="p-4 bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">TIPO</p>
                  <p className="font-bold text-slate-800 capitalize">{analysis.tipo_objecao}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 text-right">GRAVIDADE</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${gravidadeColors[analysis.gravidade]}`}>
                    {analysis.gravidade.toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">RAIZ EMOCIONAL</p>
                <p className="text-sm text-slate-700">{analysis.raiz_emocional}</p>
              </div>
              <div className="mt-2">
                <p className="text-xs text-slate-500 mb-1">FRAMEWORK IDEAL</p>
                <p className="text-sm font-semibold text-indigo-700">{analysis.framework_ideal}</p>
              </div>
            </Card>

            {/* Script Completo */}
            <Card className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-lg">Script Pronto</h3>
              </div>
              <div className="bg-white rounded-lg p-4 border-2 border-emerald-400">
                <p className="text-slate-700 font-medium leading-relaxed">"{analysis.script_completo}"</p>
              </div>
            </Card>

            {/* Respostas Detalhadas */}
            <Card className="p-4 bg-white">
              <h3 className="font-bold text-slate-800 mb-3">🎯 Técnicas de Resposta</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-blue-600 font-medium mb-1">1. VALIDAÇÃO EMPÁTICA</p>
                  <p className="text-sm text-slate-700 bg-blue-50 p-2 rounded">{analysis.respostas.validacao_empatica}</p>
                </div>

                <div>
                  <p className="text-xs text-purple-600 font-medium mb-1">2. PERGUNTA SPIN</p>
                  <p className="text-sm text-slate-700 bg-purple-50 p-2 rounded italic">"{analysis.respostas.pergunta_spin}"</p>
                </div>

                <div>
                  <p className="text-xs text-indigo-600 font-medium mb-1">3. ARGUMENTO LÓGICO</p>
                  <p className="text-sm text-slate-700 bg-indigo-50 p-2 rounded">{analysis.respostas.argumento_logico}</p>
                </div>

                <div>
                  <p className="text-xs text-orange-600 font-medium mb-1">4. GATILHO CIALDINI</p>
                  <p className="text-sm text-slate-700 bg-orange-50 p-2 rounded">{analysis.respostas.gatilho_cialdini}</p>
                </div>

                {analysis.respostas.prova_social && (
                  <div>
                    <p className="text-xs text-green-600 font-medium mb-1">5. PROVA SOCIAL</p>
                    <p className="text-sm text-slate-700 bg-green-50 p-2 rounded">{analysis.respostas.prova_social}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Técnicas Avançadas */}
            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800">Técnicas Avançadas</h3>
              </div>
              <ul className="space-y-2">
                {analysis.tecnicas_avancadas.map((t, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="font-bold text-amber-600">•</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Sinais de Compra */}
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-slate-800">Sinais de Que Superou</h3>
              </div>
              <ul className="space-y-1">
                {analysis.sinais_compra.map((s, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    {s}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Próximo Passo */}
            <Card className="p-4 bg-indigo-50 border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800">Próximo Passo</h3>
              </div>
              <p className="text-slate-700 font-semibold">{analysis.proximo_passo}</p>
            </Card>

            <Button
              onClick={() => {
                setObjection('');
                setAnalysis(null);
              }}
              variant="outline"
              className="w-full"
            >
              Nova Análise
            </Button>
          </>
        )}
      </div>
    </div>
  );
}