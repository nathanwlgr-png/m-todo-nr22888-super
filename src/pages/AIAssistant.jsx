import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Send, 
  HelpCircle,
  MessageCircle,
  Target,
  RotateCcw,
  Loader2,
  Sparkles,
  Save,
  Copy,
  Check,
  TrendingUp,
  FileText,
  Search,
  Brain,
  CheckSquare,
  Handshake,
  Globe,
  Zap
} from 'lucide-react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ChatMessage from '@/components/ChatMessage';
import QuickActionButton from '@/components/QuickActionButton';
import VoiceRecorderButton from '@/components/VoiceRecorderButton';
import MasterAIAssistant from '@/components/MasterAIAssistant';
import LiveSalesCoachingModule from '@/components/LiveSalesCoachingModule';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export default function AIAssistant() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const clientIdFromUrl = urlParams.get('id');
  
  const [selectedClientId, setSelectedClientId] = useState(clientIdFromUrl || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState({});
  const [generatedScript, setGeneratedScript] = useState(null);
  const [copied, setCopied] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const messagesEndRef = useRef(null);
  const [rolePlayMode, setRolePlayMode] = useState(false);
  const [analyzingTranscript, setAnalyzingTranscript] = useState(false);
  const fileInputRef = useRef(null);
  const [showMasterAI, setShowMasterAI] = useState(false);
  const [showLiveCoaching, setShowLiveCoaching] = useState(false);

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date')
  });

  const { data: client } = useQuery({
    queryKey: ['client', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;
      try {
        const clients = await base44.entities.Client.list();
        const found = clients.find(c => c && c.id === selectedClientId);
        if (!found) {
          setSelectedClientId(null);
          return null;
        }
        return found;
      } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        setSelectedClientId(null);
        return null;
      }
    },
    enabled: !!selectedClientId,
    retry: 0
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['client-visits', selectedClientId],
    queryFn: () => base44.entities.Visit.filter({ client_id: selectedClientId }),
    enabled: !!selectedClientId
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['client-tasks', selectedClientId],
    queryFn: () => base44.entities.Task.filter({ client_id: selectedClientId }),
    enabled: !!selectedClientId
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['client-sales', selectedClientId],
    queryFn: () => base44.entities.Sale.filter({ client_id: selectedClientId }),
    enabled: !!selectedClientId
  });

  const { data: followupLogs = [] } = useQuery({
    queryKey: ['client-followup-logs', selectedClientId],
    queryFn: () => base44.entities.FollowUpLog.filter({ client_id: selectedClientId }),
    enabled: !!selectedClientId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(selectedClientId, data),
    onSuccess: () => queryClient.invalidateQueries(['client', selectedClientId])
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (client && messages.length === 0 && client.first_name) {
      const greeting = `👋 Olá! Sou **Primori**, sua Assistente de Venda Integrativa.

🧠 **Metodologia Híbrida:**
• Numerologia Pitagórica + SPIN + Cialdini
• Análise Estatística + Inteligência Emocional
• Arte da Guerra (Sun Tzu)

📊 **Cliente:** ${client.first_name}
• Perfil: ${client.numerology_number} - ${client.behavioral_profile || 'Análise pendente'}
• Score: ${client.purchase_score || 50}% | Status: ${client.status}
• Estilo: ${client.decision_style || 'A definir'}

🎯 **Posso ajudar com:**
• Estratégias de abordagem personalizadas
• Perguntas SPIN contextualizadas
• Controle de objeções avançado
• Análise probabilística de fechamento
• Simulações de conversa (Modo Treinamento)

💬 Me faça uma pergunta ou use os botões rápidos acima!`;
      
      setMessages([{
        role: 'assistant',
        content: greeting
      }]);
    }
  }, [client]);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const getSystemContext = (isRolePlay = false) => {
    if (!client) return '';
    
    const vendorPersonality = currentUser && (currentUser.communication_style || currentUser.personality_traits?.length > 0)
      ? `
PERSONALIDADE DO VENDEDOR (você):
- Nome: ${currentUser.full_name}
- Estilo: ${currentUser.communication_style || 'Profissional'}
- Características: ${currentUser.personality_traits?.join(', ') || 'empático, consultivo'}
- Abordagem: ${currentUser.sales_approach || 'Consultiva'}
${currentUser.signature_phrases?.length > 0 ? `- Frases típicas: ${currentUser.signature_phrases.join(', ')}` : ''}

IMPORTANTE: Todas as sugestões devem refletir o estilo pessoal de ${currentUser.full_name}.
      `
      : '';
    
    const interactionHistory = `
HISTÓRICO DE INTERAÇÕES:
- Total de visitas: ${visits.length}
- Última visita: ${client.last_visit_date || 'Nenhuma ainda'}
- Tarefas pendentes: ${tasks.filter(t => t.status === 'pendente').length}
- Dores identificadas: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Gatilhos usados: ${client.triggers_used?.join(', ') || 'Nenhum'}
- Notas anteriores: ${client.notes?.substring(0, 200) || 'Sem notas'}
    `;

    if (isRolePlay) {
      return `
MODO TREINAMENTO - SIMULAÇÃO DE ROLE-PLAY

Você agora É o cliente ${client.first_name}. Interprete o papel dele de forma realista.

PERFIL DO CLIENTE (você):
- Nome: ${client.first_name}
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
- Estilo de Decisão: ${client.decision_style}
- Tom de Voz: ${client.client_tone || 'profissional'}
- Tipo: ${client.client_type}
- Papel: ${client.decision_role}
- Status: ${client.status} | Score: ${client.purchase_score}%
- Equipamento Atual: ${client.current_equipment || 'Nenhum'}
- Dores: ${client.main_pains?.join(', ') || 'Preço alto'}

${interactionHistory}

INSTRUÇÕES IMPORTANTES:
1. Responda SEMPRE em primeira pessoa como se você FOSSE ${client.first_name}
2. Mantenha o perfil numerológico (${client.behavioral_profile})
3. Use o tom de voz apropriado: ${client.client_tone || 'profissional'}
4. Seja realista: levante objeções típicas do seu perfil
5. Se perfil 4 ou 7: seja analítico, peça dados técnicos
6. Se perfil 3 ou 5: seja mais emocional e entusiasmado
7. Se perfil 1 ou 8: seja direto, foque em ROI
8. NÃO quebre o personagem. NÃO dê dicas ao vendedor.
9. Responda como um cliente REAL responderia

Comece a simulação reagindo ao que o vendedor disser.
      `;
    }
    
    return `
      ${vendorPersonality}

      VOCÊ É PRIMORI - IA DE VENDA INTEGRATIVA E GESTÃO
      
      FRAMEWORKS ESTRATÉGICOS INTEGRADOS:
      1. **Numerologia Pitagórica**: Perfis 1-9, 11, 22 (comportamento, decisão, comunicação)
      2. **SPIN Selling**: Situation, Problem, Implication, Need-Payoff (vendas consultivas)
      3. **Cialdini**: Reciprocidade, Compromisso, Prova Social, Autoridade, Escassez, Apreço
      4. **Inteligência Emocional**: Empatia, Autorregulação, Autoconsciência, Motivação
      5. **Arte da Guerra**: Timing, Estratégia, Conhecer o Cliente, Adaptabilidade
      6. **Análise Probabilística**: Estatísticas de conversão, padrões de comportamento
      7. **Neurovendas**: Gatilhos cerebrais, storytelling, ancoragem de valor

      Contexto do Cliente:
      - Nome: ${client.first_name}
      - Tipo: ${client.client_type}
      - Decisor: ${client.decision_role}
      - Perfil comportamental: ${client.behavioral_profile}
      - Estilo de decisão: ${client.decision_style}
      - Número numerológico: ${client.numerology_number}
      - Tom de voz: ${client.client_tone || 'não observado'}
      - Comunicação recomendada: ${client.recommended_communication || 'padrão'}
      - Status: ${client.status}
      - Score de compra: ${client.purchase_score}%
      - Objetivo da visita: ${client.visit_objective || 'diagnosticar'}
      
      ${interactionHistory}
      
      PRIMORI - METODOLOGIA INTEGRATIVA DE VENDAS:
      
      **ANÁLISE MULTI-CAMADAS:**
      1. **Numerológica**: Como o cliente ${client.numerology_number} pensa, decide e se comunica
      2. **Estatística**: Probabilidade de conversão baseada em dados históricos
      3. **Psicológica**: Motivadores inconscientes e gatilhos emocionais
      4. **Estratégica**: Timing ideal, sequência de abordagem, momento de fechamento
      
      **DADOS ESTATÍSTICOS PARA USAR:**
      • Perfil ${client.numerology_number}: taxa de conversão típica, ciclo médio de venda
      • ${client.client_type}: orçamento médio, objeções mais comuns
      • Score ${client.purchase_score}%: probabilidade de fechamento em 7/15/30 dias
      • Status ${client.status}: técnicas com maior ROI para este estágio
      
      **FORMATO DE RESPOSTA PRIMORI:**
      • Sempre cite o framework principal usado
      • Inclua probabilidades quando aplicável
      • Forneça scripts/perguntas prontas para usar
      • Indique QUANDO executar cada ação
      • Explique POR QUÊ a estratégia funciona para este perfil
      
      PRODUTOS:
      - Analisadores Bioquímicos: SMT-120VP, QT3
      - Analisadores de Gases Sanguíneos: VG1, VG2
      - Analisador de Imunofluorescência: VI1
      - Analisador Hematológico: VBC-50A
      - Analisador PCR: VQ1
      
      DIFERENCIAIS:
      - 25 meses de garantia (mercado oferece 12)
      - Manutenção vitalícia inclusa
      - Bonificação em insumos (não damos desconto no equipamento)
      - Certificação ISO 13485:2016
      - Tecnologia POCT de ponta
      
      **REGRAS DE OURO PRIMORI:**
      1. Cite o framework principal em cada resposta
      2. Combine no mínimo 2 frameworks por análise
      3. Forneça probabilidades baseadas em dados
      4. Seja ESTRATÉGICO, não genérico
      5. Máximo 4 parágrafos por resposta
      6. Sempre inclua ação CONCRETA e mensurável
      7. Use markdown para estruturar respostas longas
      
      Responda em português brasileiro com expertise consultiva.
    `;
  };

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = messages.slice(-6).map(m => 
        `${m.role === 'user' ? 'Vendedor' : rolePlayMode ? client?.first_name : 'Assistente'}: ${m.content}`
      ).join('\n\n');

      const enhancedPrompt = `${getSystemContext(rolePlayMode)}

HISTÓRICO DA CONVERSA ATUAL:
${conversationHistory}

${rolePlayMode ? 'Vendedor diz:' : 'Pergunta do vendedor:'} ${userMessage}

${!rolePlayMode ? `
INSTRUÇÕES PRIMORI (IA INTEGRATIVA):
1. Analise o contexto completo: perfil + histórico + pergunta
2. Forneça resposta ESTRATÉGICA multi-framework
3. Cite probabilidades e dados quando relevante
4. Seja CONCISO mas COMPLETO (máximo 4 parágrafos)
5. Sempre indique qual framework está usando
6. Se for sugestão de ação, inclua QUANDO fazer e COMO medir resultado
` : ''}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: enhancedPrompt
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ Erro ao processar. Tente novamente.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRolePlayMode = () => {
    if (!client) return;
    
    if (!rolePlayMode) {
      setMessages([{
        role: 'assistant',
        content: `🎭 **MODO TREINAMENTO ATIVADO**\n\nOlá, sou ${client.first_name || 'o cliente'}, ${client.decision_role || 'decisor'} na ${client.clinic_name || 'minha clínica'}.\n\n${client.behavioral_profile || 'Perfil analítico'}. ${client.decision_style || 'Decisões cuidadosas'}.\n\nComo você vai me abordar? 🤔`
      }]);
    } else {
      setMessages([{
        role: 'assistant',
        content: `Modo Treinamento desativado. Voltando ao modo assistente normal.\n\nComo posso ajudar?`
      }]);
    }
    setRolePlayMode(!rolePlayMode);
  };

  const analyzeTranscript = async (transcriptText) => {
    setAnalyzingTranscript(true);
    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um coach de vendas especializado. Analise esta transcrição de conversa com o cliente.

PERFIL DO CLIENTE:
- Nome: ${client.first_name}
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
- Estilo de Decisão: ${client.decision_style}
- Tom Ideal: ${client.recommended_communication || 'Não definido'}

TRANSCRIÇÃO:
${transcriptText}

Analise e forneça feedback estruturado:

**1. PONTOS FORTES** (2-3 pontos)
- O que o vendedor fez bem

**2. ÁREAS DE MELHORIA** (2-3 pontos críticos)
- Erros de comunicação
- Oportunidades perdidas

**3. ADERÊNCIA À METODOLOGIA** (score 0-10)
- SPIN Selling: [score/10] - comentário
- Numerologia: [score/10] - se adaptou ao perfil?
- Gatilhos Persuasão: [score/10] - usou quais?

**4. ANÁLISE DE TOM/LINGUAGEM**
- Tom usado vs. tom ideal para este cliente
- Linguagem apropriada ao perfil numerológico?

**5. PRÓXIMAS AÇÕES RECOMENDADAS** (3 ações específicas)

Seja DIRETO, CONSTRUTIVO e ACIONÁVEL. Use dados da transcrição.`
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `📊 **ANÁLISE DA CONVERSA**\n\n${analysis}`
      }]);
    } catch (error) {
      alert('Erro ao analisar transcrição');
    } finally {
      setAnalyzingTranscript(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      await analyzeTranscript(text);
    };
    reader.readAsText(file);
  };

  const generateQuickAction = async (type) => {
    setQuickLoading(prev => ({ ...prev, [type]: true }));
    setGeneratedScript(null);

    const prompts = {
      presentation: `Você é um especialista em comunicação e vendas consultivas.

Crie um guia COMPLETO de como se apresentar e fazer o primeiro contato com ${client?.first_name}.

═══════════════════════════════════════
📊 PERFIL NUMEROLÓGICO COMPLETO
═══════════════════════════════════════
- Número Nome: ${client?.numerology_number} - ${client?.behavioral_profile}
- Caminho de Vida: ${client?.life_path_number || 'Não disponível'}
- Estilo de Decisão: ${client?.decision_style}
- Tom Observado: ${client?.client_tone || 'Não observado'}
- Comunicação Recomendada: ${client?.recommended_communication || 'Padrão'}

═══════════════════════════════════════
💼 CONTEXTO DO CLIENTE
═══════════════════════════════════════
- Tipo: ${client?.client_type}
- Decisor: ${client?.decision_role}
- Clínica: ${client?.clinic_name || 'Não informada'}
- Status: ${client?.status} | Score: ${client?.purchase_score}%
- Visitas anteriores: ${visits.length}
- Equipamento atual: ${client?.current_equipment || 'Nenhum'}

═══════════════════════════════════════
🎯 SUA MISSÃO
═══════════════════════════════════════

Forneça um guia estruturado em MARKDOWN com:

**1. APRESENTAÇÃO PESSOAL (PRESENCIAL)**

**Tom e Postura Corporal:**
- Tom de voz ideal (grave/agudo, pausado/rápido)
- Linguagem corporal apropriada
- Distância física ideal
- Aperto de mão (firme/suave/médio)

**Frase de Abertura:**
- Primeira frase exata adaptada ao perfil numerológico
- Como mencionar seu nome e empresa
- Gancho de conexão emocional/racional

**Primeiros 30 Segundos:**
- O que falar (e o que NÃO falar)
- Como capturar atenção imediata
- Transição para conversa consultiva

---

**2. PRIMEIRO CONTATO POR CELULAR/WHATSAPP**

**Mensagem de Texto (WhatsApp):**
- Template de mensagem adaptado ao perfil
- Melhor horário para enviar
- Emoji strategy (usar ou não usar)
- Call-to-action ideal

**Ligação Telefônica:**
- Script de abertura (primeiras 3 frases)
- Como contornar secretária/recepção
- Melhor horário para ligar
- Tom de voz e ritmo da fala

---

**3. ESTRATÉGIA DE CONEXÃO EMOCIONAL**

Baseado no perfil numerológico ${client?.numerology_number}:
- Gatilho emocional principal (medo, ambição, segurança, reconhecimento)
- Palavras-chave que ressoam
- Histórias/analogias que funcionam
- Erros fatais a evitar

---

**4. DIFERENCIAÇÃO IMEDIATA**

Como se destacar da concorrência desde o primeiro contato:
- Proposta de valor em 1 frase
- Elemento surpresa/inesperado
- Prova social estratégica
- Bonificação diferencial (25 meses garantia, etc)

---

**5. CHECKLIST DE PREPARAÇÃO**

Antes do primeiro contato, tenha em mãos:
- [ ] ...
- [ ] ...
- [ ] ...

---

**6. SINAIS DE ALERTA**

Fique atento a estes sinais no primeiro contato:
- 🔴 Sinal de desinteresse: ...
- 🟡 Sinal de dúvida: ...
- 🟢 Sinal de engajamento: ...

Seja EXTREMAMENTE PRÁTICO e específico para este cliente. Use dados do perfil numerológico.`,
      question: `Gere UMA pergunta SPIN Selling para abrir a conversa com ${client?.first_name}. 
        Numerologia: ${client?.numerology_number} - ${client?.behavioral_profile}
        Tipo: ${client?.client_type}, Decisor: ${client?.decision_role}.
        
        Use SPIN (Situation/Problem/Implication/Need-Payoff) adaptado ao perfil numerológico.
        Indique qual tipo SPIN você usou.`,
      objection: `Controle de objeção estratégico para ${client?.first_name}.
        
        PERFIL: Numerologia ${client?.numerology_number} - ${client?.behavioral_profile}
        Tipo: ${client?.client_type}, Tom: ${client?.client_tone || 'padrão'}
        
        Combine:
        1. SPIN Selling: Transforme objeção em pergunta de Implication
        2. Persuasão (Cialdini): Use autoridade, prova social ou reciprocidade
        3. Inteligência Emocional: Empatia + autorregulação
        4. Numerologia: Adapte ao perfil comportamental
        
        Forneça:
        - Técnica principal (cite o framework)
        - Frase exemplo usando SPIN
        - Tom emocional ideal (Int. Emocional)
        
        Seja estratégico e multi-framework.`,
      closing: `Sugira UMA frase de fechamento adequada para ${client?.first_name}.
        Perfil: ${client?.behavioral_profile}. Objetivo: ${client?.visit_objective || 'apresentar_solucao'}.`,
      followup: `Crie UMA mensagem de follow-up curta e profissional para ${client?.first_name}.
        Tipo: ${client?.client_type}. Mantenha breve e com próximo passo claro.`,
      prospecting: `Crie técnicas de prospecção personalizadas para ${client?.first_name}.
        
        PERFIL NUMEROLÓGICO: ${client?.numerology_number} - ${client?.behavioral_profile}
        Tipo: ${client?.client_type}, Decisor: ${client?.decision_role}
        Tom: ${client?.client_tone || 'padrão'}
        
        Baseado no perfil, sugira:
        1) Melhor canal de contato (telefone, WhatsApp, email, presencial)
        2) Melhor horário e frequência de abordagem
        3) Estratégia de entrada (consultiva, técnica, ROI, emocional)
        4) Primeira frase de impacto personalizada
        
        Seja prático e acionável.`,
      needs: `Analise o histórico e preveja necessidades futuras de ${client?.first_name}.
        
        HISTÓRICO:
        - Visitas: ${visits.length}
        - Dores: ${client?.main_pains?.join(', ') || 'Não identificadas'}
        - Status: ${client?.status}, Score: ${client?.purchase_score}%
        - Equipamento atual: ${client?.current_equipment || 'Não informado'}
        
        Com base nisso, identifique:
        1) Equipamento(s) complementar(es) que ele pode precisar em breve
        2) Dores não exploradas ainda
        3) Momento ideal para upsell/cross-sell
        4) Gatilho emocional/prático a explorar na próxima interação
        
        Seja estratégico e preditivo.`,
      proposal: `Crie uma proposta comercial personalizada para ${client?.first_name}.
        
        PERFIL NUMEROLÓGICO: ${client?.numerology_number} - ${client?.behavioral_profile}
        Tom de voz: ${client?.client_tone || 'padrão'}
        Tipo: ${client?.client_type}
        Dores: ${client?.main_pains?.join(', ') || 'Gerais'}
        
        Adapte o tom da proposta (técnico, emocional, visual, ROI) ao perfil numerológico.
        
        Estruture em 3 parágrafos curtos:
        1) Abertura personalizada conectando com a dor específica
        2) Solução com diferenciais (garantia 25 meses, bonificação insumos)
        3) Call-to-action assertivo adaptado ao estilo de decisão
        
        Tom: ${client?.client_tone || 'profissional equilibrado'}
        Foco em conversão imediata.`,
      autoTasks: async () => {
        await handleAutoCreateTasks();
      },
      insights: `Você é um consultor de vendas especialista em análise psicológica e estratégica de clientes.

ANÁLISE PROFUNDA DO CLIENTE: ${client?.first_name}

═══════════════════════════════════════
📊 DADOS NUMEROLÓGICOS
═══════════════════════════════════════
- Número Nome: ${client?.numerology_number}
- Número Caminho de Vida: ${client?.life_path_number || 'Não disponível'}
- Perfil Comportamental: ${client?.behavioral_profile}
- Estilo de Decisão: ${client?.decision_style}
- Tom de Voz Observado: ${client?.client_tone || 'Não observado'}

═══════════════════════════════════════
💼 CONTEXTO PROFISSIONAL
═══════════════════════════════════════
- Tipo de Negócio: ${client?.client_type}
- Papel: ${client?.decision_role}
- Clínica: ${client?.clinic_name || 'Não informada'}
- Equipamento Atual: ${client?.current_equipment || 'Nenhum'}
- Status: ${client?.status} | Score: ${client?.purchase_score}%

═══════════════════════════════════════
📈 HISTÓRICO DE VENDAS
═══════════════════════════════════════
${sales.length > 0 ? sales.map(s => `- ${s.equipment_name}: R$ ${s.sale_value} (${s.status})`).join('\n') : '- Nenhuma venda registrada'}

═══════════════════════════════════════
📅 HISTÓRICO DE VISITAS
═══════════════════════════════════════
- Total de visitas: ${visits.length}
- Última visita: ${client?.last_visit_date || 'Nenhuma ainda'}
${visits.slice(0, 3).map(v => `- ${v.visit_type} em ${v.scheduled_date?.split('T')[0]} - ${v.status}`).join('\n')}

═══════════════════════════════════════
📝 INTERAÇÕES E FOLLOW-UPS
═══════════════════════════════════════
- Follow-ups enviados: ${followupLogs.length}
- Dores identificadas: ${client?.main_pains?.join(', ') || 'Não identificadas'}
- Gatilhos usados: ${client?.triggers_used?.join(', ') || 'Nenhum'}
- Tarefas pendentes: ${tasks.filter(t => t.status === 'pendente').length}

═══════════════════════════════════════
📋 NOTAS ANTERIORES
═══════════════════════════════════════
${client?.notes || 'Sem notas anteriores'}

═══════════════════════════════════════
🎯 SUA MISSÃO
═══════════════════════════════════════

Com base em TODOS os dados acima, forneça uma análise ESTRATÉGICA e PROFUNDA em formato estruturado:

**1. PERFIL PSICOLÓGICO COMPLETO** (2-3 parágrafos)
   - Combine numerologia + tom observado + comportamento nas visitas
   - Motivações profundas (medo, ambição, reconhecimento, segurança?)
   - Padrões de decisão observados no histórico

**2. MOTIVADORES PRINCIPAIS** (lista)
   - Gatilhos emocionais mais efetivos
   - Argumentos racionais que ressoam
   - Prova social que funciona (testemunhos, cases)

**3. ESTILO DE COMUNICAÇÃO IDEAL**
   - Tom exato (formal/informal, técnico/emocional, direto/indireto)
   - Canais preferidos (email, WhatsApp, presencial, ligação)
   - Frequência de contato ideal
   - Melhores horários baseados no perfil

**4. OBJEÇÕES PREVISTAS** (3-5 principais)
   - Liste objeções específicas que ele provavelmente levantará
   - Para cada objeção, forneça:
     * Por que essa objeção é provável (baseado em dados)
     * Técnica de controle (SPIN/Cialdini/Int. Emocional)
     * Frase exata de resposta

**5. ESTRATÉGIA DE PITCH PERSONALIZADA**
   - Abertura perfeita para este cliente
   - Sequência de argumentos (priorize ROI? Qualidade? Segurança? Inovação?)
   - Fechamento adaptado ao estilo de decisão dele
   - Momento ideal para pedir o fechamento

**6. PRÓXIMOS PASSOS TÁTICOS** (3-4 ações)
   - Ações imediatas para avançar na venda
   - O que NÃO fazer com este cliente
   - Oportunidades de upsell/cross-sell
   - Timeline esperado até fechamento

**7. ALERTA DE RISCO**
   - Sinais de que está esfriando
   - O que pode fazer perder esta venda
   - Como recuperar se esfriar

Use MARKDOWN para estruturar. Seja ESTRATÉGICO, não genérico. Cite dados específicos do histórico.`,
      suggestTasks: `Você é um assistente de produtividade em vendas. 

Analise o cliente ${client?.first_name} e sugira 3-5 tarefas CONCRETAS e ACIONÁVEIS para avançar na venda.

DADOS DO CLIENTE:
- Perfil: ${client?.numerology_number} - ${client?.behavioral_profile}
- Status: ${client?.status} | Score: ${client?.purchase_score}%
- Tipo: ${client?.client_type}
- Visitas: ${visits.length}
- Última visita: ${client?.last_visit_date || 'Nenhuma'}
- Dores: ${client?.main_pains?.join(', ') || 'Não identificadas'}
- Equipamento atual: ${client?.current_equipment || 'Nenhum'}
- Notas: ${client?.notes || 'Sem notas'}

Com base nisso, sugira tarefas no formato:

**1. [Tipo de tarefa] - [Título]**
Prioridade: [alta/media/baixa]
Prazo sugerido: [dias a partir de hoje]
Descrição: [2-3 linhas explicando o que fazer e por quê]

**2. [Tipo de tarefa] - [Título]**
...

Tipos válidos: follow_up, ligacao, email, visita

As tarefas devem:
- Ser específicas para este cliente
- Estar alinhadas com o perfil numerológico
- Ter objetivo claro (agendar, enviar, fechar, diagnosticar)
- Incluir timing estratégico

Seja prático e direto ao ponto.`
    };

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompts[type]
    });

    setGeneratedScript({ type, content: response });
    setQuickLoading(prev => ({ ...prev, [type]: false }));
  };

  const handleCopyScript = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (generatedScript && client?.phone) {
      const message = encodeURIComponent(generatedScript.content);
      window.open(`https://wa.me/${client.phone}?text=${message}`, '_blank');
      setWhatsappSent(true);
      setTimeout(() => setWhatsappSent(false), 2000);
    }
  };

  const createTasksMutation = useMutation({
    mutationFn: (tasks) => Promise.all(
      tasks.map(task => base44.entities.Task.create(task))
    ),
    onSuccess: () => {
      queryClient.invalidateQueries(['client-tasks']);
      toast.success('Tarefas criadas com sucesso!');
    }
  });

  const handleAutoCreateTasks = async () => {
    if (!selectedClientId || !client) {
      toast.error('Selecione um cliente primeiro');
      return;
    }

    setQuickLoading(prev => ({ ...prev, autoTasks: true }));

    try {
      const prompt = `Você é um assistente de automação de tarefas. Analise o cliente e crie 3-5 tarefas CONCRETAS e ACIONÁVEIS.

CLIENTE: ${client.first_name}
Status: ${client.status} | Score: ${client.purchase_score}%
Tipo: ${client.client_type}
Visitas: ${visits.length}
Última visita: ${client.last_visit_date || 'Nenhuma'}
Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
Equipamento: ${client.current_equipment || 'Nenhum'}

Crie tarefas no formato JSON:
{
  "tasks": [
    {
      "title": "Título curto e claro",
      "description": "Descrição detalhada do que fazer",
      "type": "follow_up" | "ligacao" | "email" | "visita",
      "priority": "baixa" | "media" | "alta",
      "due_days": 1-30 (dias a partir de hoje)
    }
  ]
}

Tarefas devem:
- Ser específicas para este cliente
- Ter objetivo claro (agendar, enviar, fechar)
- Incluir timing estratégico
- Estar alinhadas com perfil numerológico ${client.numerology_number}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string" },
                  priority: { type: "string" },
                  due_days: { type: "number" }
                }
              }
            }
          }
        }
      });

      const tasksToCreate = result.tasks.map(task => ({
        client_id: selectedClientId,
        client_name: client.first_name,
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        due_date: new Date(Date.now() + task.due_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pendente',
        auto_created: true
      }));

      await createTasksMutation.mutateAsync(tasksToCreate);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ **${tasksToCreate.length} Tarefas Criadas Automaticamente**\n\n${tasksToCreate.map((t, i) => 
          `${i + 1}. **${t.title}** (${t.type})\n   ⏰ ${t.due_date} | Prioridade: ${t.priority}\n   📝 ${t.description}`
        ).join('\n\n')}`
      }]);

    } catch (error) {
      toast.error('Erro ao criar tarefas: ' + error.message);
    } finally {
      setQuickLoading(prev => ({ ...prev, autoTasks: false }));
    }
  };

  const exportChatToPDF = () => {
    if (messages.length === 0) {
      toast.error('Nenhuma mensagem para exportar');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    let y = margin;

    const addText = (text, fontSize = 10, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, maxWidth);
      
      lines.forEach(line => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += fontSize * 0.5;
      });
      y += 2;
    };

    addText(`CONVERSA PRIMORI - ${client?.first_name || 'Assistente IA'}`, 14, true);
    addText(`Data: ${new Date().toLocaleString('pt-BR')}`, 9);
    y += 5;

    messages.forEach((msg) => {
      addText(msg.role === 'user' ? 'VOCÊ:' : 'PRIMORI:', 11, true);
      addText(msg.content, 10);
      y += 3;
    });

    doc.save(`Conversa_PRIMORI_${client?.first_name || 'IA'}_${Date.now()}.pdf`);
    toast.success('Chat exportado em PDF!');
  };

  const handleSaveAndContinue = () => {
    if (messages.length > 2) {
      const lastMessages = messages.slice(-4).map(m => m.content).join(' ');
      updateMutation.mutate({
        notes: lastMessages.substring(0, 500),
        last_visit_date: new Date().toISOString().split('T')[0]
      });
    }
    toast.success('Conversa salva com sucesso!');
  };

  const scriptLabels = {
    presentation: 'Como Se Apresentar',
    insights: 'Insights Profundos',
    prospecting: 'Prospecção',
    question: 'Pergunta',
    objection: 'Controle de Objeções',
    proposal: 'Proposta Comercial',
    closing: 'Fechamento',
    needs: 'Previsão de Necessidades',
    followup: 'Follow-up',
    suggestTasks: 'Sugestão de Tarefas',
    autoTasks: 'Tarefas Criadas'
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              {rolePlayMode ? '🎭 Treinamento' : (
                <>
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Primori
                </>
              )}
            </h1>
            {!rolePlayMode && (
              <p className="text-xs text-purple-600 font-medium">IA Venda Integrativa</p>
            )}
          </div>
          <Button
            variant={rolePlayMode ? "default" : "outline"}
            size="sm"
            onClick={toggleRolePlayMode}
            disabled={!selectedClientId}
            className={rolePlayMode ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            {rolePlayMode ? '🎭 Treinar' : '🎭 Treinar'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMasterAI(!showMasterAI)}
            className={showMasterAI ? 'bg-orange-100 border-orange-300' : ''}
          >
            <Globe className="w-4 h-4 mr-1" />
            Web
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLiveCoaching(!showLiveCoaching)}
            className={showLiveCoaching ? 'bg-purple-100 border-purple-300' : ''}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Live Coaching
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportChatToPDF}
            disabled={messages.length === 0}
          >
            <FileText className="w-4 h-4 mr-1" />
            PDF
          </Button>
          {selectedClientId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveAndContinue}
              className="text-emerald-600 border-emerald-200"
            >
              <Save className="w-4 h-4 mr-1" />
              Salvar
            </Button>
          )}
        </div>
        
        {/* Client Selector */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-600">Cliente</Label>
          <Select
            value={selectedClientId || ''}
            onValueChange={(value) => {
              setSelectedClientId(value === 'none' ? null : value);
              setMessages([]);
              setRolePlayMode(false);
            }}
          >
            <SelectTrigger className="h-12 bg-slate-50">
              <SelectValue placeholder="Selecione um cliente..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem cliente específico</SelectItem>
              {allClients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.first_name} {c.clinic_name ? `- ${c.clinic_name}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {client && (
            <p className="text-xs text-slate-500">
              {client.client_type ? `${client.client_type}` : 'Cliente'} • Score: {client.purchase_score}%
            </p>
          )}
        </div>
      </div>

      {/* Transcript Analysis */}
      {!rolePlayMode && (
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-cyan-800">Análise de Conversa</span>
            </div>
            <div className="flex gap-2">
              {client?.phone && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`https://wa.me/${client.phone}`, '_blank')}
                  className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  WhatsApp
                </Button>
              )}
              <a 
                href={base44.agents.getWhatsAppConnectURL('sales_assistant')} 
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  💬 Agente WhatsApp
                </Button>
              </a>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzingTranscript}
                className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
              >
                {analyzingTranscript ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload .txt
                  </>
                )}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <QuickActionButton
            icon={Handshake}
            label="Apresentação"
            onClick={() => generateQuickAction('presentation')}
            loading={quickLoading.presentation}
            className="shrink-0 bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-700 hover:bg-green-100 font-semibold"
          />
          <QuickActionButton
            icon={Brain}
            label="Insights Profundos"
            onClick={() => generateQuickAction('insights')}
            loading={quickLoading.insights}
            className="shrink-0 bg-gradient-to-r from-pink-50 to-rose-50 border-pink-300 text-pink-700 hover:bg-pink-100 font-semibold"
          />
          <QuickActionButton
            icon={Search}
            label="Prospecção"
            onClick={() => generateQuickAction('prospecting')}
            loading={quickLoading.prospecting}
            className="shrink-0 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          />
          <QuickActionButton
            icon={HelpCircle}
            label="Pergunta"
            onClick={() => generateQuickAction('question')}
            loading={quickLoading.question}
            className="shrink-0 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
          />
          <QuickActionButton
            icon={MessageCircle}
            label="Controle de Objeções"
            onClick={() => generateQuickAction('objection')}
            loading={quickLoading.objection}
            className="shrink-0 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
          />
          <QuickActionButton
            icon={FileText}
            label="Proposta"
            onClick={() => generateQuickAction('proposal')}
            loading={quickLoading.proposal}
            className="shrink-0 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
          />
          <QuickActionButton
            icon={Target}
            label="Fechamento"
            onClick={() => generateQuickAction('closing')}
            loading={quickLoading.closing}
            className="shrink-0 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          />
          <QuickActionButton
            icon={TrendingUp}
            label="Previsão"
            onClick={() => generateQuickAction('needs')}
            loading={quickLoading.needs}
            className="shrink-0 bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100"
          />
          <QuickActionButton
            icon={RotateCcw}
            label="Follow-up"
            onClick={() => generateQuickAction('followup')}
            loading={quickLoading.followup}
            className="shrink-0 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
          />
          <QuickActionButton
            icon={CheckSquare}
            label="Sugerir Tarefas"
            onClick={() => generateQuickAction('suggestTasks')}
            loading={quickLoading.suggestTasks}
            className="shrink-0 bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
          />
          <QuickActionButton
            icon={Zap}
            label="🤖 Criar Tarefas Auto"
            onClick={handleAutoCreateTasks}
            loading={quickLoading.autoTasks}
            className="shrink-0 bg-gradient-to-r from-fuchsia-50 to-purple-50 border-fuchsia-300 text-fuchsia-700 hover:bg-fuchsia-100 font-bold"
          />
        </div>
      </div>

      {/* Generated Script Modal */}
      {generatedScript && (
        <div className="p-4 bg-white border-b">
          <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-none">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                {scriptLabels[generatedScript.type]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyScript}
                className="h-8"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-slate-700 leading-relaxed">{generatedScript.content}</p>
            <div className="flex gap-2 mt-3">
              {client?.phone && (
                <Button
                  size="sm"
                  onClick={handleShareWhatsApp}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  {whatsappSent ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Enviado
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      WhatsApp
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateQuickAction(generatedScript.type)}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Nova
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGeneratedScript(null)}
              >
                Fechar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Master AI Assistant */}
      {showMasterAI && (
        <div className="px-4 pt-4">
          <MasterAIAssistant client={client} />
        </div>
      )}

      {/* Live Sales Coaching */}
      {showLiveCoaching && (
        <div className="px-4 pt-4">
          <LiveSalesCoachingModule 
            client={client} 
            visits={visits}
            interactions={followupLogs}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !showMasterAI && (
          <div className="text-center py-8 text-slate-400">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-orange-500" />
            <p className="font-medium">PRIMORI - Assistente Master Autônomo</p>
            <p className="text-sm mt-1">🌐 Pesquise qualquer coisa • 📄 Gere PDFs instantâneos • 💬 Chat IA Total</p>
            <p className="text-xs mt-2 text-orange-600">Clique em "Web" para começar pesquisas</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg.content} isUser={msg.role === 'user'} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        {rolePlayMode && (
          <div className="mb-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-700">
              🎭 Você está praticando com {client?.first_name}. Tente sua abordagem!
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <VoiceRecorderButton
            onTranscript={(transcript) => setInput(transcript)}
            size="icon"
            className="h-12 w-12 shrink-0"
          />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage(input)}
            placeholder={rolePlayMode ? "Sua abordagem/resposta..." : "Digite ou grave..."}
            className="flex-1 h-12 rounded-xl border-2"
            disabled={loading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className={`h-12 w-12 rounded-xl ${rolePlayMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}