import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Sparkles,
  User,
  Calendar,
  Brain,
  Target,
  MessageCircle,
  TrendingUp,
  Shield,
  Heart,
  Zap,
  Loader2
} from 'lucide-react';
import StrategicFrameworks from '@/components/StrategicFrameworks';

const nameProfiles = {
  1: {
    title: "Líder Nato",
    essence: "Independência, inovação, pioneirismo",
    strengths: "Decisivo, confiante, corajoso, visionário",
    challenges: "Pode ser impaciente ou dominador",
    communication: "Direto, assertivo, sem rodeios",
    icon: Zap
  },
  2: {
    title: "Diplomata",
    essence: "Cooperação, harmonia, sensibilidade",
    strengths: "Empático, paciente, mediador natural",
    challenges: "Pode ser indeciso ou dependente de aprovação",
    communication: "Gentil, colaborativo, busca consenso",
    icon: Heart
  },
  3: {
    title: "Comunicador Criativo",
    essence: "Expressão, criatividade, otimismo",
    strengths: "Carismático, inspirador, entusiasmado",
    challenges: "Pode dispersar energia ou ser superficial",
    communication: "Entusiasta, usa histórias e emoções",
    icon: MessageCircle
  },
  4: {
    title: "Construtor Metódico",
    essence: "Estabilidade, disciplina, praticidade",
    strengths: "Organizado, confiável, trabalhador",
    challenges: "Pode ser rígido ou resistente a mudanças",
    communication: "Estruturado, baseado em fatos e processos",
    icon: Shield
  },
  5: {
    title: "Aventureiro Versátil",
    essence: "Liberdade, mudança, adaptabilidade",
    strengths: "Curioso, flexível, energético",
    challenges: "Pode ser inquieto ou disperso",
    communication: "Dinâmico, busca novidades e opções",
    icon: TrendingUp
  },
  6: {
    title: "Protetor Responsável",
    essence: "Amor, responsabilidade, serviço",
    strengths: "Cuidadoso, confiável, harmonizador",
    challenges: "Pode ser perfeccionista ou controlador",
    communication: "Empático, foca em bem-estar e qualidade",
    icon: Heart
  },
  7: {
    title: "Analista Profundo",
    essence: "Sabedoria, introspecção, análise",
    strengths: "Inteligente, investigativo, espiritual",
    challenges: "Pode ser reservado ou crítico demais",
    communication: "Técnico, precisa de dados e lógica",
    icon: Brain
  },
  8: {
    title: "Empreendedor Ambicioso",
    essence: "Poder, sucesso material, realização",
    strengths: "Determinado, estratégico, autoritário",
    challenges: "Pode ser materialista ou controlador",
    communication: "Pragmático, foca em resultados e ROI",
    icon: Target
  },
  9: {
    title: "Visionário Humanitário",
    essence: "Compaixão, idealismo, universalidade",
    strengths: "Generoso, inspirador, altruísta",
    challenges: "Pode ser idealista demais ou disperso",
    communication: "Inspirador, conecta com propósito maior",
    icon: Sparkles
  },
  11: {
    title: "Iluminado Mestre",
    essence: "Intuição, inspiração, espiritualidade elevada",
    strengths: "Visionário, inspirador nato, sensível a energias",
    challenges: "Pode ser hipersensível ou idealista extremo",
    communication: "Profundo, transformador, visionário",
    icon: Sparkles
  },
  22: {
    title: "Construtor Mestre",
    essence: "Realização prática de grandes visões",
    strengths: "Transforma sonhos em realidade concreta",
    challenges: "Pressão interna por grandes realizações",
    communication: "Estratégico de longo prazo, pensa em legado",
    icon: Target
  }
};

const lifePathProfiles = {
  1: {
    mission: "Desenvolver independência e liderança",
    karmic: "Aprender a liderar sem dominar",
    affinity: "Empreendedorismo, inovação, pioneirismo"
  },
  2: {
    mission: "Desenvolver cooperação e diplomacia",
    karmic: "Aprender a se posicionar sem perder harmonia",
    affinity: "Trabalho em equipe, mediação, parcerias"
  },
  3: {
    mission: "Desenvolver criatividade e expressão",
    karmic: "Aprender a focar energia criativa",
    affinity: "Comunicação, artes, motivação"
  },
  4: {
    mission: "Construir bases sólidas e estruturas",
    karmic: "Aprender flexibilidade sem perder estabilidade",
    affinity: "Processos, organização, confiabilidade"
  },
  5: {
    mission: "Buscar liberdade e novas experiências",
    karmic: "Aprender compromisso sem perder liberdade",
    affinity: "Mudanças, viagens, versatilidade"
  },
  6: {
    mission: "Servir e cuidar com amor",
    karmic: "Aprender a dar sem se anular",
    affinity: "Cuidado, ensino, harmonização"
  },
  7: {
    mission: "Buscar conhecimento profundo e verdade",
    karmic: "Aprender a confiar na intuição e não só na lógica",
    affinity: "Pesquisa, análise, espiritualidade"
  },
  8: {
    mission: "Alcançar poder e abundância material",
    karmic: "Aprender equilíbrio entre material e espiritual",
    affinity: "Negócios, finanças, gestão"
  },
  9: {
    mission: "Servir a humanidade com compaixão",
    karmic: "Aprender desapego e perdão",
    affinity: "Causas sociais, ensino, cura"
  },
  11: {
    mission: "Iluminar e inspirar através da intuição",
    karmic: "Aprender a manifestar visões no plano material",
    affinity: "Espiritualidade, inspiração, transformação"
  },
  22: {
    mission: "Construir legados que transformam o mundo",
    karmic: "Aprender a lidar com grande poder criativo",
    affinity: "Grandes projetos, legado, impacto global"
  }
};

export default function NumerologyAnalysis() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0];
    },
    enabled: !!clientId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Cliente não encontrado</p>
      </div>
    );
  }

  const nameProfile = nameProfiles[client.numerology_number] || nameProfiles[1];
  const lifePathProfile = client.life_path_number ? lifePathProfiles[client.life_path_number] : null;
  const NameIcon = nameProfile.icon;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 px-4 pt-4 pb-24 rounded-b-[2rem] overflow-hidden tech-grid">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="relative flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Análise Numerológica Completa</h1>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">{client.numerology_number}</span>
            </div>
            {client.life_path_number && (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">{client.life_path_number}</span>
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">{client.first_name}</h2>
          <p className="text-purple-200 text-sm">{nameProfile.title}</p>
        </div>
      </div>

      <div className="px-6 -mt-16 space-y-4">
        {/* Nome - Essência */}
        <Card className="p-5 bg-white shadow-lg border-none">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-800">Número do Nome: {client.numerology_number}</h3>
          </div>
          <Badge className="mb-3 bg-purple-100 text-purple-700">{nameProfile.title}</Badge>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">ESSÊNCIA</p>
              <p className="text-slate-700">{nameProfile.essence}</p>
            </div>
            
            <div>
              <p className="text-xs text-emerald-600 font-medium mb-1">✓ FORÇAS</p>
              <p className="text-slate-700">{nameProfile.strengths}</p>
            </div>
            
            <div>
              <p className="text-xs text-amber-600 font-medium mb-1">⚠ DESAFIOS</p>
              <p className="text-slate-700">{nameProfile.challenges}</p>
            </div>
            
            <div>
              <p className="text-xs text-indigo-600 font-medium mb-1">💬 COMUNICAÇÃO</p>
              <p className="text-slate-700">{nameProfile.communication}</p>
            </div>
          </div>
        </Card>

        {/* Caminho de Vida */}
        {lifePathProfile && (
          <Card className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800">Caminho de Vida: {client.life_path_number}</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-indigo-600 font-medium mb-1">🎯 MISSÃO DE VIDA</p>
                <p className="text-slate-700">{lifePathProfile.mission}</p>
              </div>
              
              <div>
                <p className="text-xs text-purple-600 font-medium mb-1">🔮 LIÇÃO KÁRMICA</p>
                <p className="text-slate-700">{lifePathProfile.karmic}</p>
              </div>
              
              <div>
                <p className="text-xs text-pink-600 font-medium mb-1">💫 AFINIDADES</p>
                <p className="text-slate-700">{lifePathProfile.affinity}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Dica Estratégica de Vendas */}
        <Card className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-slate-800">💡 Dica Estratégica Multi-Framework</h3>
          </div>
          
          <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
            <p className="text-xs text-orange-600 font-medium mb-2">Numerologia + SPIN + Persuasão + Arte da Guerra + Int. Emocional</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {getSalesTip(client.numerology_number, client.life_path_number, client.behavioral_profile)}
            </p>
          </div>
        </Card>

        {/* Strategic Frameworks */}
        <Card className="p-5 bg-gradient-to-br from-slate-900 to-indigo-900 border-none">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-white">Frameworks Estratégicos</h3>
          </div>
          <StrategicFrameworks numerologyNumber={client.numerology_number} />
        </Card>

        {/* Perfil Comportamental */}
        <Card className="p-5 bg-white shadow-md border-none">
          <h3 className="font-semibold text-slate-800 mb-3">Perfil Comportamental</h3>
          <p className="text-slate-700 mb-3">{client.behavioral_profile}</p>
          
          <h3 className="font-semibold text-slate-800 mb-2">Estilo de Decisão</h3>
          <p className="text-slate-700">{client.decision_style}</p>
        </Card>
      </div>
    </div>
  );
}

function getSalesTip(nameNumber, lifePathNumber, behavioralProfile) {
  const tips = {
    1: "Este cliente valoriza ser pioneiro e inovador. Use frases como 'Você será o primeiro na região' ou 'Isso posiciona você como líder'. Mostre tecnologia de ponta e não perca tempo com detalhes excessivos.",
    2: "Construa confiança gradualmente. Envolva a equipe dele na decisão. Use frases como 'Vamos construir isso juntos' ou 'Sua equipe vai adorar'. Não pressione - dê tempo.",
    3: "Use storytelling! Conte casos de sucesso emocionantes. Mostre como ele será reconhecido. Use entusiasmo e frases inspiradoras. Faça ele IMAGINAR o resultado.",
    4: "Forneça documentação completa, cronogramas detalhados, certificações. Mostre garantias e processos estruturados. Seja meticuloso e confiável. ROI calculado é essencial.",
    5: "Apresente múltiplas opções e flexibilidade. Crie senso de oportunidade única 'por tempo limitado'. Mostre versatilidade do equipamento. Seja dinâmico na apresentação.",
    6: "Foque no bem-estar dos animais e tranquilidade da equipe. Use frases como 'Seus pacientes merecem o melhor'. Mostre qualidade superior e suporte dedicado.",
    7: "Forneça especificações técnicas completas, estudos científicos, comparativos. Não pressione - deixe ele analisar. Seja preciso e técnico. Responda todas as perguntas com profundidade.",
    8: "Vá direto ao ponto: ROI, aumento de margem, crescimento de receita. Use números concretos. Mostre como isso amplia o negócio dele. Seja pragmático e ambicioso.",
    9: "Conecte ao propósito maior. Mostre como isso eleva o padrão de atendimento veterinário. Use frases como 'Transformar vidas' ou 'Fazer diferença'. Inspire.",
    11: "Apresente visão disruptiva. Mostre como ele será referência e inspiração. Use linguagem transformadora. Conecte tecnologia com impacto profundo. Seja visionário.",
    22: "Pense GRANDE. Fale de legado, impacto regional, futuro de longo prazo. Mostre cases de transformação institucional. Use frases como 'Construir referência duradoura'."
  };

  let tip = tips[nameNumber] || tips[1];
  
  // Se tiver caminho de vida, adiciona insight extra
  if (lifePathNumber && lifePathNumber !== nameNumber) {
    const lifeTips = {
      1: " Apele para o lado empreendedor e independente dele.",
      2: " Construa parcerias e mostre que você é um aliado confiável.",
      3: " Use criatividade na apresentação - seja memorável.",
      4: " Demonstre confiabilidade e processos sólidos.",
      5: " Mostre como isso traz novas possibilidades e crescimento.",
      6: " Enfatize cuidado, qualidade e responsabilidade.",
      7: " Forneça profundidade técnica e fundamentação científica.",
      8: " Foque em crescimento financeiro e expansão do negócio.",
      9: " Conecte com propósito humanitário e impacto social.",
      11: " Inspire transformação e visão de futuro.",
      22: " Mostre como isso constrói algo duradouro e significativo."
    };
    tip += lifeTips[lifePathNumber] || "";
  }
  
  return tip;
}