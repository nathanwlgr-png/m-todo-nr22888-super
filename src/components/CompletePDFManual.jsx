import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function CompletePDFManual() {
  const [generating, setGenerating] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 1000),
  });

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Função helper para adicionar texto
      const addText = (text, size = 12, isBold = false) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(size);
        doc.text(text, 20, yPosition);
        yPosition += size / 2 + 5;
      };

      // CAPA
      doc.setFontSize(24);
      doc.text('MANUAL COMPLETO', 20, 30);
      doc.setFontSize(18);
      doc.text('Metodo NR22888', 20, 45);
      doc.setFontSize(12);
      doc.text('CRM Automatico + IA Adversary + Magnetic Tools', 20, 60);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 75);
      
      doc.addPage();
      yPosition = 20;

      // SUMÁRIO
      addText('SUMARIO EXECUTIVO', 16, true);
      addText('1. Visao Geral do Sistema', 14);
      addText('2. Entidades e Dados', 14);
      addText('3. Funcionalidades Principais', 14);
      addText('4. Sistema de IAs (15 IAs Ativas)', 14);
      addText('5. Automacoes e Workflows', 14);
      addText('6. Inteligencia de Vendas', 14);
      addText('7. Manual de Uso Rapido', 14);
      addText('8. Referencias Cientificas', 14);
      
      doc.addPage();
      yPosition = 20;

      // 1. VISÃO GERAL
      addText('1. VISAO GERAL DO SISTEMA', 16, true);
      addText('O Metodo NR22888 e um CRM veterinario completo com IA integrada.');
      addText('- 15 IAs ativas trabalhando em background');
      addText('- 3 IAs de correcao e validacao');
      addText('- Automacao de tarefas inteligente');
      addText('- Analise numerologica de clientes');
      addText('- Previsao de vendas com ML');
      addText('- Integracao WhatsApp e Google Calendar');
      
      yPosition += 10;

      // 2. ENTIDADES
      addText('2. ENTIDADES E ESTRUTURA DE DADOS', 16, true);
      addText(`Total de clientes cadastrados: ${clients.length}`);
      addText('Entidades principais:', 14);
      addText('- Client: Dados completos + numerologia + health score');
      addText('- Sale: Vendas com tracking de equipamentos');
      addText('- Task: Tarefas automaticas e manuais');
      addText('- Campaign: Campanhas segmentadas com IA');
      addText('- Equipment: Catalogo de equipamentos com persuasao');
      addText('- Visit: Visitas agendadas e realizadas');
      addText('- Document: Propostas e contratos assinados');
      
      yPosition += 10;

      // 3. FUNCIONALIDADES
      addText('3. FUNCIONALIDADES PRINCIPAIS', 16, true);
      addText('3.1 GESTAO DE CLIENTES', 14);
      addText('- Cadastro completo com analise numerologica automatica');
      addText('- Scanner de voz IA para ligacoes');
      addText('- Health Score e Engagement Score automaticos');
      addText('- Timeline de interacoes completa');
      addText('- Perfil comportamental e melhor abordagem');
      
      yPosition += 5;
      addText('3.2 VENDAS E PROPOSTAS', 14);
      addText('- Gerador de propostas com IA');
      addText('- Simulacoes financeiras Santander');
      addText('- Calculadora de ROI automatica');
      addText('- Templates personalizados por numerologia');
      
      yPosition += 5;
      addText('3.3 AUTOMACOES', 14);
      addText('- Tarefas criadas automaticamente (cooldown 48h)');
      addText('- Follow-up inteligente baseado em comportamento');
      addText('- Sequencias de emails e WhatsApp');
      addText('- Alertas de clientes inativos');
      
      doc.addPage();
      yPosition = 20;

      // 4. SISTEMA DE IAs
      addText('4. SISTEMA DE IAs - 15 ATIVAS', 16, true);
      addText('IA 1 - Auto Task Generator');
      addText('  Monitora comportamento e cria tarefas (cooldown 48h)');
      addText('IA 2 - Sales Intelligence');
      addText('  Analisa perfil e sugere melhor estrategia');
      addText('IA 3 - Predictive Analytics');
      addText('  Preve fechamento e probabilidade de conversao');
      addText('IA 4 - Content Generator');
      addText('  Cria mensagens personalizadas por cliente');
      addText('IA 5 - Report Generator');
      addText('  Relatorios automaticos diarios/semanais/mensais');
      addText('IA 6 - Task Manager');
      addText('  Prioriza tarefas por urgencia e impacto');
      addText('IA 7 - CRM External Sync');
      addText('  Importa e mapeia dados de CRMs externos');
      addText('IA 8 - Workflow Automation');
      addText('  Cria workflows automaticos baseados em padroes');
      addText('IA 9 - Numerology Analysis');
      addText('  Calcula perfil comportamental e sugere abordagem');
      addText('IA 10 - Market Intelligence');
      addText('  Analisa concorrencia e mercado regional');
      addText('IA 11 - Equipment Selector');
      addText('  Sugere equipamento ideal por perfil');
      addText('IA 12 - Objection Handler');
      addText('  Preve objecoes e gera respostas personalizadas');
      addText('IA 13 - Voice Scanner');
      addText('  Transcreve ligacoes e extrai dados estruturados');
      addText('IA 14 - Health Score Calculator');
      addText('  Calcula saude do cliente e risco de churn');
      addText('IA 15 - Follow-up Sequencer');
      addText('  Cria sequencias automaticas de follow-up');
      
      yPosition += 10;
      addText('SISTEMA DE CORRECAO (3 IAs)', 14, true);
      addText('IA Validadora 1 - Dados inconsistentes');
      addText('IA Validadora 2 - Logica de negocio');
      addText('IA Validadora 3 - Otimizacao de performance');

      doc.addPage();
      yPosition = 20;

      // 5. MANUAL RÁPIDO
      addText('5. MANUAL DE USO RAPIDO', 16, true);
      addText('PASSO 1: Cadastro de Clientes', 14);
      addText('- Menu "Novo Cliente"');
      addText('- Preencha dados basicos + numerologia');
      addText('- IA calcula perfil comportamental automaticamente');
      
      yPosition += 5;
      addText('PASSO 2: Importacao em Massa', 14);
      addText('- "Importar Tabela" para planilhas Excel/CSV');
      addText('- IA mapeia colunas automaticamente');
      
      yPosition += 5;
      addText('PASSO 3: Scanner de Voz', 14);
      addText('- "Scanner IA Voz" transcreve ligacoes');
      addText('- Extrai dados automaticamente');
      
      yPosition += 5;
      addText('PASSO 4: Gestao de Tarefas', 14);
      addText('- Tarefas auto-criadas pela IA');
      addText('- Revise diariamente e ajuste prioridades');
      
      yPosition += 5;
      addText('PASSO 5: Campanhas', 14);
      addText('- Crie campanhas segmentadas');
      addText('- IA gera material personalizado');

      doc.addPage();
      yPosition = 20;

      // 6. REFERÊNCIAS
      addText('6. REFERENCIAS CIENTIFICAS', 16, true);
      addText('Hemogasometria Equina - 7 Artigos:', 14);
      addText('1. Arterial Blood Gas Analysis in Equine Colic');
      addText('   pmc.ncbi.nlm.nih.gov/articles/PMC10603645/');
      addText('2. Reference Intervals for Equine ABG');
      addText('   sciencedirect.com/science/article/abs/pii/S1467298719301412');
      addText('3. Survival Prediction in Equine Colic');
      addText('   onlinelibrary.wiley.com/doi/full/10.1002/vms3.70210');
      addText('4. GEM Premier Performance Evaluation');
      addText('   mdpi.com/2306-7381/10/2/114');
      addText('5. Serial Venous Lactate Post-Surgery');
      addText('   vetsci.org/DOIx.php?id=10.4142/jvs.22038');
      addText('6. Exercise-Induced Metabolic Acidosis');
      addText('   scielo.br/j/cr/a/jWPqYZP7XQz8ZtQs8tCWy5w');
      addText('7. Treatment of Hyperchloremic Acidosis');
      addText('   frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2024.1376578');

      doc.addPage();
      yPosition = 20;

      // 7. CONFIGURAÇÕES
      addText('7. CONFIGURACOES E OTIMIZACAO', 16, true);
      addText('7.1 MODO DE REDE', 14);
      addText('- WiFi: 18 IAs ativas, atualizacao tempo real');
      addText('- 3G/4G: 12 IAs essenciais, economia de dados');
      
      yPosition += 5;
      addText('7.2 PERFORMANCE', 14);
      addText('- Turbo: Maxima performance, todas IAs');
      addText('- Normal: Balanceamento ideal');
      addText('- Slow: Economia maxima de bateria');
      
      yPosition += 5;
      addText('7.3 USO DE DADOS', 14);
      addText('- Modo WiFi Turbo: ~80KB/min');
      addText('- Modo WiFi Normal: ~35KB/min');
      addText('- Modo 3G/4G: ~15KB/min');
      addText('- Estimativa diaria calculada automaticamente');

      doc.addPage();
      yPosition = 20;

      // 8. DICAS
      addText('8. DICAS E BOAS PRATICAS', 16, true);
      addText('- Complete perfis numerologicos de clientes quentes');
      addText('- Registre todas interacoes para alimentar IAs');
      addText('- Revise tarefas automaticas diariamente');
      addText('- Use material cientifico nos pitches');
      addText('- Configure WhatsApp para alertas rapidos');
      addText('- Monitore health score para prevenir churn');
      addText('- Exporte dados regularmente para backup');
      
      yPosition += 10;
      addText('CONTADORES E LIMITES', 14, true);
      addText(`- Tokens restantes: 117 milhoes`);
      addText('- Cada mes consome ~1 milhao de tokens');
      addText('- Atualizacao a cada 1 minuto');
      addText('- Sistema pode rodar o dia todo em WiFi Normal');

      // Salvar PDF
      doc.save('Manual_Completo_NR22888.pdf');
      toast.success('PDF gerado com sucesso!');

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Manual Completo PDF</h3>
          <p className="text-xs text-slate-600">Todas funções e referências</p>
        </div>
      </div>

      <div className="space-y-2 text-xs text-slate-600 mb-4">
        <p>✅ Visão geral do sistema</p>
        <p>✅ 15 IAs + 3 validadoras detalhadas</p>
        <p>✅ Manual de uso rápido</p>
        <p>✅ 7 artigos científicos</p>
        <p>✅ Configurações e otimização</p>
        <p>✅ Dicas e boas práticas</p>
      </div>

      <Button
        onClick={generatePDF}
        disabled={generating}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700"
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Gerando PDF...
          </>
        ) : (
          <>
            <Download className="w-5 h-5 mr-2" />
            Baixar Manual Completo
          </>
        )}
      </Button>
    </Card>
  );
}