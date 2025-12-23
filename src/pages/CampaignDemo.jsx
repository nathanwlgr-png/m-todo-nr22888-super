import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, MessageCircle, Mail, Calendar, TrendingUp, Eye, CheckCircle2 } from 'lucide-react';

export default function CampaignDemo() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const demoClient = {
    name: "Dr. João Silva",
    clinic: "Clínica Vida Animal",
    city: "Marília",
    profile: "Analítico",
    tone: "Cauteloso",
    status: "morno",
    score: 65
  };

  const campaignFlow = [
    {
      step: 1,
      title: "Análise IA do Cliente",
      icon: Eye,
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
            <p className="font-semibold text-purple-900 mb-2">🤖 IA Analisando...</p>
            <div className="space-y-1 text-sm text-purple-800">
              <p>✓ Perfil: Analítico (precisa dados, ROI, provas)</p>
              <p>✓ Tom: Cauteloso (abordar com segurança)</p>
              <p>✓ Necessidade: Hemograma + Bioquímico</p>
              <p>✓ Melhor horário: Tarde (14h-17h)</p>
              <p>✓ Probabilidade de engajamento: 78%</p>
            </div>
          </div>
        </div>
      )
    },
    {
      step: 2,
      title: "Mensagem WhatsApp Personalizada",
      icon: MessageCircle,
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-green-700" />
              <span className="font-semibold text-green-900">WhatsApp - 14h30</span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-slate-800 mb-3">
                Olá Dr. João! 👋
                <br/><br/>
                Vi que a <strong>Clínica Vida Animal</strong> está crescendo em Marília. Parabéns! 🎉
                <br/><br/>
                Sabe o que <strong>I-V-E-T-E, Grupo Estimação e HPGV</strong> têm em comum?
                <br/><br/>
                Todos escolheram <strong>Seamaty BC-5000</strong> para hemograma + bioquímico.
                <br/><br/>
                <strong>Por quê?</strong>
                <br/>
                • Resultado em 60 segundos (não 15min)
                <br/>
                • 99.5% de precisão validada
                <br/>
                • ROI: R$ 15k/mês de economia
                <br/><br/>
                Quer ver os <strong>números reais</strong> de clínicas em Marília que já usam?
                <br/><br/>
                Posso te mostrar! 📊
              </p>
              <Badge className="bg-green-600 text-white">Mensagem enviada ✓</Badge>
            </div>
          </div>
        </div>
      )
    },
    {
      step: 3,
      title: "Monitoramento em Tempo Real",
      icon: TrendingUp,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 mb-1">Status</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-900">Lido às 14:35</span>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-700 mb-1">Engajamento</p>
              <p className="text-2xl font-bold text-green-900">Alto</p>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <p className="font-semibold text-yellow-900 mb-2">🔥 IA Detectou:</p>
            <p className="text-sm text-yellow-800">
              Cliente MUITO interessado! Abriu em 5 minutos e leu por 45 segundos.
              <br/><br/>
              <strong>Próxima ação sugerida:</strong> Ligar em 2 horas para agendar demo presencial.
            </p>
          </div>
        </div>
      )
    },
    {
      step: 4,
      title: "Email de Follow-up (Automático)",
      icon: Mail,
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-indigo-50 rounded-xl border-2 border-indigo-200">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-indigo-700" />
              <span className="font-semibold text-indigo-900">Email - 17h (mesmo dia)</span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="font-bold text-slate-900 mb-2">
                Assunto: Dr. João - Dados reais de economia na Clínica Vida Animal
              </p>
              <hr className="my-2" />
              <div className="text-sm text-slate-800 space-y-2">
                <p>Olá Dr. João,</p>
                <p>
                  Como prometido, aqui estão os <strong>números reais</strong> de clínicas em Marília usando BC-5000:
                </p>
                <ul className="list-disc ml-5 space-y-1 text-slate-700">
                  <li>Hospital Popular PET: R$ 18k economia/mês</li>
                  <li>HPGV: 200+ exames/dia com 1 técnico</li>
                  <li>Clínica Planetas: ROI em 4 meses</li>
                </ul>
                <p>
                  <strong>Para Clínica Vida Animal especificamente:</strong>
                  <br/>
                  • Volume estimado: 120 exames/mês
                  <br/>
                  • Economia projetada: R$ 12.500/mês
                  <br/>
                  • Payback: 5 meses
                </p>
                <p className="font-semibold text-indigo-700">
                  Te ligo amanhã às 10h para mostrar os relatórios completos?
                </p>
                <p>Abraço,<br/>Nathan - Venda NR</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      step: 5,
      title: "Tarefa Automática Criada",
      icon: Calendar,
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
            <p className="font-semibold text-orange-900 mb-3">📅 IA Criou Tarefa:</p>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-bold text-slate-900 mb-2">
                🔥 LEAD QUENTE - Ligar AMANHÃ 10h
              </p>
              <p className="text-sm text-slate-700 mb-3">
                Dr. João Silva - Clínica Vida Animal
                <br/>
                <br/>
                <strong>Contexto:</strong> Cliente abriu WhatsApp e email. Alto engajamento.
                <br/>
                <br/>
                <strong>Objetivo da ligação:</strong>
                <br/>
                • Confirmar interesse nos dados
                <br/>
                • Agendar visita presencial com demo
                <br/>
                • Levar tablet com calculadora de ROI
                <br/>
                <br/>
                <strong>Abordagem:</strong> Perfil analítico - focar em números, não emoção.
              </p>
              <Badge className="bg-orange-600 text-white">Alta Prioridade</Badge>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Demo de Campanha</h1>
            <p className="text-purple-200 text-sm">Veja como funciona na prática</p>
          </div>
        </div>

        {/* Cliente Demo */}
        <div className="bg-white/10 backdrop-blur p-4 rounded-xl">
          <p className="text-white text-sm mb-2">Cliente de Exemplo:</p>
          <p className="text-white font-bold text-lg">{demoClient.name}</p>
          <p className="text-purple-200 text-sm">{demoClient.clinic} - {demoClient.city}</p>
          <div className="flex gap-2 mt-2">
            <Badge className="bg-yellow-500 text-white">{demoClient.status}</Badge>
            <Badge className="bg-purple-600 text-white">{demoClient.profile}</Badge>
            <Badge className="bg-indigo-600 text-white">Score: {demoClient.score}</Badge>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Progress */}
        <Card className="p-4 bg-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-slate-900">Fluxo da Campanha</span>
            <span className="text-sm text-slate-600">Passo {activeStep + 1}/5</span>
          </div>
          <div className="flex gap-2">
            {campaignFlow.map((flow, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`flex-1 h-2 rounded-full transition-all ${
                  i === activeStep 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
                    : i < activeStep 
                    ? 'bg-green-500' 
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </Card>

        {/* Content */}
        <Card className="p-5 bg-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            {React.createElement(campaignFlow[activeStep].icon, {
              className: "w-6 h-6 text-purple-600"
            })}
            <h2 className="font-bold text-slate-900">{campaignFlow[activeStep].title}</h2>
          </div>
          {campaignFlow[activeStep].content}
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          {activeStep > 0 && (
            <Button
              onClick={() => setActiveStep(activeStep - 1)}
              variant="outline"
              className="flex-1"
            >
              ← Anterior
            </Button>
          )}
          {activeStep < campaignFlow.length - 1 && (
            <Button
              onClick={() => setActiveStep(activeStep + 1)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              Próximo →
            </Button>
          )}
        </div>

        {/* Vídeo de Abordagem */}
        <Card className="p-5 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300">
          <div className="flex items-center gap-3 mb-4">
            <Play className="w-6 h-6 text-orange-600" />
            <h3 className="font-bold text-slate-900">📹 Vídeo de Abordagem</h3>
          </div>
          
          <div className="aspect-video bg-slate-900 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-orange-600/20"></div>
            <div className="relative text-center">
              <Play className="w-16 h-16 text-white mb-3 mx-auto" />
              <p className="text-white font-semibold mb-1">Vídeo: Abordagem Perfeita</p>
              <p className="text-white/80 text-sm">Como fazer primeira ligação</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-white rounded-lg">
              <p className="font-semibold text-slate-900 mb-2">🎯 Estrutura da Abordagem:</p>
              <ol className="text-sm text-slate-700 space-y-1">
                <li><strong>1. Quebra-gelo (5s):</strong> "Dr. João, tudo bem? Nathan aqui da Venda NR"</li>
                <li><strong>2. Validação (10s):</strong> "Vi que abriu minha mensagem sobre o BC-5000..."</li>
                <li><strong>3. Valor (15s):</strong> "Trouxe dados reais de Marília - R$ 18k economia/mês"</li>
                <li><strong>4. Pergunta (5s):</strong> "Quer ver os números da sua clínica?"</li>
                <li><strong>5. Agenda (5s):</strong> "Amanhã 15h funciona pra você?"</li>
              </ol>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="font-semibold text-orange-900 mb-2">⚡ Tom de Voz:</p>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Volume: Médio (confiante, não agressivo)</li>
                <li>• Ritmo: Pausado (analítico precisa processar)</li>
                <li>• Energia: Moderada (profissional)</li>
                <li>• Ênfase: Nos NÚMEROS (R$ 18k, 99.5%)</li>
              </ul>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900 mb-2">🤝 Linguagem Corporal (Presencial):</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Postura: Ligeiramente inclinado (interesse)</li>
                <li>• Gestos: Abertos, palmas visíveis</li>
                <li>• Contato visual: Direto mas suave</li>
                <li>• Espaço: 1 metro (respeito)</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Resultados Esperados */}
        <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
          <h3 className="font-bold text-green-900 mb-4">📊 Resultados Esperados</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-800">Taxa de Abertura</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-green-200 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-green-600"></div>
                </div>
                <span className="font-bold text-green-900">85%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-800">Taxa de Resposta</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-green-200 rounded-full overflow-hidden">
                  <div className="w-[65%] h-full bg-green-600"></div>
                </div>
                <span className="font-bold text-green-900">65%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-800">Taxa de Conversão</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-green-200 rounded-full overflow-hidden">
                  <div className="w-[35%] h-full bg-green-600"></div>
                </div>
                <span className="font-bold text-green-900">35%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}