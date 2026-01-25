import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText,
  Loader2,
  Download,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function SystemDocumentationPDF() {
  const [generating, setGenerating] = useState(false);

  const generateDocumentation = async () => {
    setGenerating(true);
    try {
      toast.info('Gerando documentação completa...');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `DOCUMENTAÇÃO COMPLETA DO SISTEMA PRIMORI - MÉTODO NR22

Crie uma documentação COMPLETA e PROFISSIONAL do sistema CRM, incluindo:

═══════════════════════════════════════
1. VISÃO GERAL DO SISTEMA
═══════════════════════════════════════
- Nome: Primori / Método NR22
- Propósito: CRM Inteligente para vendas de equipamentos veterinários
- Principais diferenciais
- Tecnologias utilizadas (IA, numerologia, automação)

═══════════════════════════════════════
2. FUNCIONALIDADES PRINCIPAIS
═══════════════════════════════════════

**PROSPECÇÃO E CADASTRO:**
- Análise Completa de Clínica (IA + Equipamentos + Numerologia)
- Busca GPS (raio 50km da localização atual)
- Análise Regional por Cidade
- Importação em Massa (Excel, PDF, Word)
- Cadastro Manual

**GESTÃO DE CLIENTES:**
- Perfil completo do cliente
- Score Holístico 360°
- Next Best Actions IA
- Alertas de Mercado
- Gerador de Conteúdo IA

**NUMEROLOGIA E PERFIL:**
- Cálculo automático do número
- Perfil comportamental
- Estilo de decisão
- Dicas de abordagem personalizadas
- Melhores dias para fechamento

**ANÁLISES DE EQUIPAMENTOS:**
- Detecção via fotos (IA visual)
- Identificação de: Bioquímica, Hemogasômetro, Hemograma, Imunofluorescência, PCR
- Volume de exames estimado
- Recomendação de equipamento

**AUTOMAÇÕES:**
- Follow-ups automáticos
- Sequências personalizadas
- Alertas proativos
- Criação automática de tarefas

**INTELIGÊNCIA DE VENDAS:**
- Análise de concorrentes
- Tendências de mercado
- Previsão de churn
- Probabilidade de conversão
- LTV estimado

**COMUNICAÇÃO:**
- WhatsApp Master Assistant (acesso via WhatsApp)
- Gerador de mensagens contextuais
- Templates de email
- Scripts de vídeo
- Propostas automáticas

**COACHING E TREINAMENTO:**
- Análise de conversas
- Role-play com IA
- Desafios semanais
- Feedback em tempo real

**ANALYTICS E RELATÓRIOS:**
- Dashboard CRM completo
- Vendas por região/produto
- Pipeline visual
- Previsão de vendas
- Relatórios customizados

═══════════════════════════════════════
3. FLUXO DE TRABALHO RECOMENDADO
═══════════════════════════════════════
1. Prospecção (GPS ou busca manual)
2. Análise completa da clínica
3. Cadastro com perfil numerológico
4. Checklist pré-visita
5. Agendamento
6. Visita (com IA em tempo real)
7. Pós-visita (registro e análise)
8. Follow-ups automáticos
9. Análises e otimização

═══════════════════════════════════════
4. MÓDULOS DE IA
═══════════════════════════════════════
- Score Holístico 360°
- Next Best Actions
- Análise de Equipamentos (Visual AI)
- Perfil Numerológico Completo
- Alertas de Mercado em Tempo Real
- Churn Prediction
- Sales Forecasting
- Gerador de Conteúdo Multi-canal
- Pipeline Optimization

═══════════════════════════════════════
5. WHATSAPP MASTER ASSISTANT
═══════════════════════════════════════
Funcionalidades disponíveis via WhatsApp:
- Consultar clientes
- Ver tarefas pendentes
- Adicionar interações
- Agendar visitas
- Gerar propostas
- Análises rápidas
- Criar tarefas
- Enviar materiais
- Coaching em tempo real

═══════════════════════════════════════
6. INTEGRAÇÕES
═══════════════════════════════════════
- Google Calendar (agendamento automático)
- Google Slides (apresentações)
- Notion (documentação)
- Salesforce (CRM sync)
- Instagram/Facebook (análise social)
- Google Maps (GPS e rotas)
- Email (automático)

═══════════════════════════════════════
7. DADOS E SEGURANÇA
═══════════════════════════════════════
- Backup automático
- Sincronização em tempo real
- Controle de acesso por usuário
- Histórico completo de ações
- LGPD compliant

Seja EXTREMAMENTE DETALHADO e PROFISSIONAL.`,
        response_json_schema: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            versao: { type: "string" },
            data: { type: "string" },
            resumo_executivo: { type: "string" },
            funcionalidades: { type: "array", items: { type: "string" } },
            modulos_ia: { type: "array", items: { type: "string" } },
            fluxo_trabalho: { type: "array", items: { type: "string" } },
            whatsapp_features: { type: "array", items: { type: "string" } },
            integracoes: { type: "array", items: { type: "string" } },
            beneficios: { type: "array", items: { type: "string" } },
            proximos_passos: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Criar PDF
      const doc = new jsPDF();
      let y = 20;

      // Cabeçalho
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('PRIMORI - MÉTODO NR22', 20, y);
      y += 8;
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('Documentação Completa do Sistema', 20, y);
      y += 6;
      
      doc.setFontSize(10);
      doc.text(`Versão: ${result.versao || '1.0'}`, 20, y);
      y += 5;
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, y);
      y += 10;

      // Linha
      doc.setDrawColor(0, 0, 0);
      doc.line(20, y, 190, y);
      y += 10;

      // Resumo Executivo
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('RESUMO EXECUTIVO', 20, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const resumoLines = doc.splitTextToSize(result.resumo_executivo || '', 170);
      resumoLines.forEach(line => {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(line, 20, y);
        y += 5;
      });
      y += 8;

      // Funcionalidades
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('FUNCIONALIDADES PRINCIPAIS', 20, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      (result.funcionalidades || []).forEach(func => {
        if (y > 280) { doc.addPage(); y = 20; }
        const lines = doc.splitTextToSize(`• ${func}`, 165);
        lines.forEach(line => {
          doc.text(line, 25, y);
          y += 5;
        });
      });
      y += 8;

      // Módulos IA
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('MÓDULOS DE IA', 20, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      (result.modulos_ia || []).forEach(mod => {
        if (y > 280) { doc.addPage(); y = 20; }
        const lines = doc.splitTextToSize(`• ${mod}`, 165);
        lines.forEach(line => {
          doc.text(line, 25, y);
          y += 5;
        });
      });
      y += 8;

      // WhatsApp Features
      if (result.whatsapp_features?.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('WHATSAPP MASTER ASSISTANT', 20, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        result.whatsapp_features.forEach(feat => {
          if (y > 280) { doc.addPage(); y = 20; }
          const lines = doc.splitTextToSize(`• ${feat}`, 165);
          lines.forEach(line => {
            doc.text(line, 25, y);
            y += 5;
          });
        });
        y += 8;
      }

      // Benefícios
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('BENEFÍCIOS', 20, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      (result.beneficios || []).forEach(ben => {
        if (y > 280) { doc.addPage(); y = 20; }
        const lines = doc.splitTextToSize(`• ${ben}`, 165);
        lines.forEach(line => {
          doc.text(line, 25, y);
          y += 5;
        });
      });

      // Salvar e baixar
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], 'Primori_Documentacao_Completa.pdf', { type: 'application/pdf' });
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Download direto
      doc.save('Primori_Documentacao_Completa.pdf');

      toast.success('PDF gerado! Fazendo download...', { duration: 3000 });

      return file_url;
    } catch (error) {
      toast.error('Erro ao gerar PDF');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">📄 Documentação do Sistema</h3>
          <p className="text-xs text-indigo-700">Gerar manual completo em PDF</p>
        </div>
      </div>

      <Button
        onClick={generateDocumentation}
        disabled={generating}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Gerando documentação...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Gerar PDF Completo
          </>
        )}
      </Button>
    </Card>
  );
}