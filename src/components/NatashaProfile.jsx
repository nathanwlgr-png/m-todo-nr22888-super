import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function NatashaProfile() {
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState(null);

  const generateNatashaProfile = async () => {
    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um analista de vendas especialista em numerologia. Gere um PERFIL COMPLETO E DETALHADO para:

DADOS DA CLIENTE:
Nome Completo: Natasha Gabriela Aparecida Rosa
Data de Nascimento: 15 de Julho de 1993
Cidade: Marília, SP
Localização: Próximo à Casa de Ração e Veterinária Bom Pastor
Profissão: Proprietária de Clínica Veterinária
Situação Familiar: Mora em apartamento com 1 filho
Contexto Pessoal: Mãe empreendedora, equilibrando clínica e família

INSTRUÇÕES - PERFIL EXTREMAMENTE DETALHADO:

1. ANÁLISE NUMEROLÓGICA COMPLETA:
   - Calcule o número do nome completo (soma de todas as letras)
   - Calcule o número do caminho de vida (15/07/1993)
   - Identifique números mestres
   - Análise de vogais (desejo da alma)
   - Análise de consoantes (personalidade externa)
   - Significado profundo de cada número

2. PERFIL COMPORTAMENTAL DETALHADO:
   - Personalidade completa (como ela age, pensa, decide)
   - Estilo de comunicação (direta, analítica, emocional?)
   - Motivadores de compra principais
   - Objeções prováveis e como lidar
   - Gatilhos mentais mais efetivos
   - Tom de voz preferido

3. ESTRATÉGIA DE VENDAS PERSONALIZADA:
   - Melhor abordagem inicial (presencial, telefone, WhatsApp?)
   - Canal de comunicação ideal
   - Melhor horário para contato
   - Como apresentar o produto
   - Argumentos de venda mais efetivos
   - Como criar urgência
   - Técnica de fechamento ideal

4. ANÁLISE DE CONTEXTO:
   - Localização estratégica (perto da Bom Pastor)
   - Potencial de compra
   - Equipamentos recomendados
   - ROI estimado
   - Concorrência local

5. MAPA DE AÇÕES PRÁTICAS:
   - 10 ações imediatas recomendadas (priorizadas)
   - Melhor argumento de vendas
   - Frases para usar na conversa
   - Como superar objeções específicas
   - Script de abordagem inicial
   - Script de fechamento

6. PERGUNTAS ESTRATÉGICAS PARA AVANÇAR A VENDA:
   - Liste 15 perguntas abertas e direcionadas para:
     * Identificar dores e necessidades (5 perguntas)
     * Descobrir orçamento e urgência (5 perguntas)
     * Criar rapport e conexão (5 perguntas)
   - Perguntas que considerem contexto de mãe empreendedora
   - Perguntas sobre volume de atendimentos
   - Perguntas sobre terceirização de exames atual
   - Perguntas sobre crescimento da clínica

7. ANÁLISE PSICOLÓGICA:
   - Perfil de decisor (rápido/lento, racional/emocional)
   - O que valoriza mais (economia, qualidade, status, resultados?)
   - Medos e inseguranças prováveis
   - Como gerar confiança
   - Palavras que funcionam

FORMATO:
Crie um relatório EXTREMAMENTE DETALHADO em formato de documento profissional.
Use markdown para estruturar bem.
Seja PRÁTICO, ACIONÁVEL e ESPECÍFICO.
Mínimo 3000 palavras.`,
        add_context_from_internet: true
      });

      const fullProfile = `
╔═══════════════════════════════════════════════════════════════════════╗
║                     PERFIL COMPLETO DE CLIENTE                        ║
║                  Natasha Gabriela Aparecida Rosa                      ║
║                     Método NR22 - Análise Total                       ║
╚═══════════════════════════════════════════════════════════════════════╝


═══════════════════════════════════════════════════════════════════════
📋 DADOS BÁSICOS
═══════════════════════════════════════════════════════════════════════

Nome Completo: Natasha Gabriela Aparecida Rosa
Data de Nascimento: 15 de Julho de 1993 (31 anos)
Cidade: Marília, SP
Localização: Próximo à Casa de Ração e Veterinária Bom Pastor
Profissão: Proprietária de Clínica Veterinária


${response}


═══════════════════════════════════════════════════════════════════════
                    DADOS PARA CRM (JSON)
═══════════════════════════════════════════════════════════════════════

{
  "full_name": "Natasha Gabriela Aparecida Rosa",
  "first_name": "Natasha",
  "birthdate": "1993-07-15",
  "city": "Marília",
  "clinic_name": "Clínica Natasha Rosa (confirmar nome real)",
  "address": "Próximo à Casa de Ração Bom Pastor, Marília, SP",
  "status": "morno",
  "lead_source": "analise_mercado_ia",
  "client_type": "clinica_pequena",
  "priority_level": 2
}


═══════════════════════════════════════════════════════════════════════
                          CONCLUSÃO
═══════════════════════════════════════════════════════════════════════

Cliente com ALTO POTENCIAL DE COMPRA.
Perfil numerológico indica receptividade a abordagem estruturada.
AÇÃO IMEDIATA: Contato presencial ou WhatsApp personalizado.

Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
Sistema: Método NR22

═══════════════════════════════════════════════════════════════════════
`;

      setProfile(fullProfile);

      // Salvar no repositório
      await base44.entities.GeneratedDocument.create({
        title: 'Perfil Completo - Natasha Gabriela Aparecida Rosa',
        type: 'relatorio',
        content: fullProfile,
        summary: 'Perfil numerológico completo e estratégia de vendas para Natasha Rosa - Marília',
        tags: ['natasha', 'marilia', 'perfil completo', 'numerologia', 'bom pastor']
      });

      // Criar/atualizar cliente no CRM
      try {
        const existingClients = await base44.entities.Client.filter({ first_name: 'Natasha' });
        
        const clientData = {
          full_name: 'Natasha Gabriela Aparecida Rosa',
          first_name: 'Natasha',
          birthdate: '1993-07-15',
          city: 'Marília',
          clinic_name: 'Clínica Natasha Rosa',
          address: 'Próximo à Casa de Ração Bom Pastor, Marília, SP',
          status: 'morno',
          lead_source: 'analise_mercado_ia',
          client_type: 'clinica_pequena',
          priority_level: 2,
          purchase_score: 65
        };

        if (existingClients.length > 0) {
          await base44.entities.Client.update(existingClients[0].id, clientData);
          toast.success('Cliente atualizado no CRM');
        } else {
          await base44.entities.Client.create(clientData);
          toast.success('Cliente cadastrado no CRM');
        }
      } catch (error) {
        console.error('Erro ao salvar cliente:', error);
      }

      toast.success('✅ Perfil completo gerado e salvo!');

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar perfil');
    } finally {
      setGenerating(false);
    }
  };

  const downloadProfile = () => {
    const blob = new Blob([profile], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Perfil_Natasha_Rosa.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Perfil baixado!');
  };

  const copyProfile = async () => {
    try {
      await navigator.clipboard.writeText(profile);
      toast.success('Perfil copiado!');
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const sendToWhatsApp = () => {
    // Formato resumido para WhatsApp
    const whatsappMessage = `🎯 *PERFIL ESTRATÉGICO - NATASHA ROSA*

📋 *Dados:*
• Natasha Gabriela Aparecida Rosa
• 31 anos (15/07/1993)
• Proprietária de Clínica Veterinária
• Marília - Próx. Bom Pastor
• Mora em apartamento com 1 filho

${profile}

---
Documento completo disponível.
Gerado em: ${new Date().toLocaleDateString('pt-BR')}`;

    const phoneNumber = ''; // Número será preenchido pelo botão flutuante
    const encodedMessage = encodeURIComponent(whatsappMessage);
    
    // Copiar para área de transferência
    navigator.clipboard.writeText(whatsappMessage);
    toast.success('✅ Mensagem copiada! Use o botão verde flutuante do WhatsApp');
    
    // Se houver número configurado, abrir direto
    if (phoneNumber) {
      window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-pink-600 flex items-center justify-center shadow-lg">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Perfil: Natasha Rosa</h3>
          <p className="text-xs text-slate-600">Análise completa + estratégia de vendas</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-white rounded-lg border border-pink-200">
          <p className="text-sm font-semibold text-pink-800 mb-1">👤 Cliente:</p>
          <p className="text-xs text-slate-700 font-medium">Natasha Gabriela Aparecida Rosa</p>
          <p className="text-xs text-slate-600">📍 Marília - Próx. Bom Pastor</p>
          <p className="text-xs text-slate-600">📅 Nascimento: 15/07/1993</p>
        </div>

        {!profile ? (
          <Button
            onClick={generateNatashaProfile}
            disabled={generating}
            className="w-full bg-pink-600 hover:bg-pink-700 h-12"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Gerando perfil completo...
              </>
            ) : (
              <>
                <User className="w-5 h-5 mr-2" />
                Gerar Perfil Completo da Natasha
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
              <p className="text-xs font-semibold text-green-800 mb-1">✅ Perfil Gerado!</p>
              <p className="text-xs text-green-700">Salvo em Documentos Gerados + CRM</p>
            </div>

            <Button
              onClick={sendToWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700 h-12 mb-2"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              💬 Enviar para WhatsApp (Pronto!)
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={copyProfile}
                className="border-pink-300"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copiar
              </Button>
              <Button
                size="sm"
                onClick={downloadProfile}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Download className="w-3 h-3 mr-1" />
                Baixar PDF
              </Button>
            </div>

            <Button
              onClick={generateNatashaProfile}
              variant="outline"
              className="w-full border-pink-300 text-pink-700"
            >
              Gerar Novamente
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}